import { NOCTURNE, NOCTURNE_CHORDS, NOCTURNE_BEAT_SECONDS, midiToHz } from './scores.js';

const PIANO_LEVEL = 1.6;
const PIANO_INHARMONICITY = .0003; // a real string's overtones run a little sharp, more so the higher they go
const PIANO_ROOM_SECONDS = 2.8;    // the room it is played in
const LEFT_HAND = [[0, 0, .55], [.5, 1, .34], [1, 2, .3], [2, 3, .3], [3, 2, .24]]; // [beat, chord note, velocity]

// The piano the story's nocturne is played on [R17.4]: a good instrument, softly played and heard plainly, in
// a quiet room (not through the phonograph's horn, so the record's waltz stays apart when it comes).
// It plays a score from scores.js once through, scheduling a little ahead as it goes.
export class Piano {
  constructor(ctx, destination, { on }) {
    this.ctx = ctx;
    this.on = on;          // the player's music setting
    this.playing = false;

    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(destination);
    this.input = ctx.createGain();
    const dry = ctx.createGain();
    dry.gain.value = .8;
    const room = ctx.createConvolver();
    room.buffer = this.impulse(PIANO_ROOM_SECONDS);
    const wet = ctx.createGain();
    wet.gain.value = .35;
    this.input.connect(dry).connect(this.out);
    this.input.connect(room).connect(wet).connect(this.out);
  }

  setOn(on) {
    this.on = on;
    this.out.gain.setTargetAtTime(this.on && this.playing ? PIANO_LEVEL : 0, this.ctx.currentTime, .5);
  }

  // Plays a score from the top: bars of [chord, melody] with chords from a table of voicings.
  play(score = NOCTURNE, chords = NOCTURNE_CHORDS, beat = NOCTURNE_BEAT_SECONDS) {
    clearTimeout(this.timer);
    this.score = score;
    this.chords = chords;
    this.beat = beat;
    this.bar = 0;
    this.nextBarAt = this.ctx.currentTime + .3;
    this.playing = true;
    this.out.gain.cancelScheduledValues(this.ctx.currentTime);
    this.out.gain.setValueAtTime(this.on ? PIANO_LEVEL : 0, this.ctx.currentTime);
    this.schedule();
  }

  // Fades away over roughly the given seconds, and plays no further.
  stop(seconds = 1) {
    clearTimeout(this.timer);
    if (!this.playing) return;
    this.playing = false;
    this.out.gain.setTargetAtTime(0, this.ctx.currentTime, seconds / 3);
  }

  // Schedules the next couple of seconds, and comes back every half second for more.
  schedule() {
    if (!this.playing) return;
    const now = this.ctx.currentTime;
    this.nextBarAt = Math.max(this.nextBarAt, now); // a throttled tab skips ahead rather than catching up
    while (this.bar < this.score.length && this.nextBarAt < now + 2) {
      // Breathing: the end of each phrase is held back, the last two bars most of all.
      const fromEnd = this.score.length - 1 - this.bar;
      const phraseEnd = this.bar % 8 === 7;
      const beat = this.beat * (fromEnd === 0 ? 1.4 : fromEnd === 1 ? 1.2 : phraseEnd ? 1.12 : 1);
      this.playBar(this.score[this.bar], this.nextBarAt, beat, fromEnd === 0);
      this.nextBarAt += beat * 4;
      this.bar++;
    }
    if (this.bar < this.score.length) this.timer = setTimeout(() => this.schedule(), 500);
  }

  playBar([chord, melody], start, beat, last) {
    const notes = this.chords[chord];
    const loose = (t) => t + (Math.random() - .5) * .025;
    const pedalUp = start + beat * 4 + .15; // the pedal is changed with the chord
    if (last) {
      // The last chord rolled up slowly from the bottom and left to ring.
      notes.forEach((note, i) => this.playNote(note, start + i * .16, .5 - i * .05, start + beat * 8));
    } else {
      for (const [at, i, velocity] of LEFT_HAND) this.playNote(notes[i], loose(start + at * beat), velocity, pedalUp);
    }
    let t = start;
    for (const [note, beats] of melody) {
      if (note !== null) this.playNote(note, loose(t), .5 + Math.random() * .08, last ? start + beat * 8 : Math.max(t + beats * beat + .25, pedalUp));
      t += beats * beat;
    }
  }

  // One note: three strings a shade apart (two in the bass), overtones stretched a little sharp and
  // dying faster the higher they are, softer notes darker, a touch of the hammer, and the damper
  // coming down at until. Low notes sit a little to the left, high ones to the right.
  // With `held` (Day Shift's waltz) the strings ring that many times longer and the key is pressed
  // more softly, with no hammer knock, so a tune played legato flows from note to note.
  playNote(note, start, velocity, until, { held = 0 } = {}) {
    const { ctx } = this;
    const freq = midiToHz(note);
    const ring = (held || 1) * 7 * 2 ** (-(note - 40) / 24); // seconds: long in the bass, short at the top
    const end = Math.min(until + .8, start + ring);

    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.max(-.6, Math.min(.6, (note - 60) / 40));
    pan.connect(this.input);
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(held ? 800 + velocity * 3200 : 900 + velocity * 4000, start);
    tone.frequency.setTargetAtTime(held ? 650 + velocity * 1300 : 700 + velocity * 1500, start, held ? .8 : .6);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(.06 * velocity, start + (held ? .012 : .004));
    env.gain.setTargetAtTime(0, until, held ? .15 : .12);
    tone.connect(env).connect(pan);

    const strings = note < 40 ? [-1, 1] : [-1.2, 0, 1.3];
    for (const cents of strings) {
      for (let n = 1; n <= 6; n++) {
        const osc = ctx.createOscillator();
        osc.frequency.value = freq * n * Math.sqrt(1 + PIANO_INHARMONICITY * n * n);
        osc.detune.value = cents;
        const g = ctx.createGain();
        g.gain.setValueAtTime(1 / n ** 1.2 / strings.length, start);
        g.gain.exponentialRampToValueAtTime(.0001, start + ring / (1 + .6 * (n - 1)));
        osc.connect(g).connect(tone);
        osc.start(start);
        osc.stop(end);
      }
    }

    if (held) return;
    // The hammer: a soft, short thud of felt on wire.
    const hammer = ctx.createBufferSource();
    hammer.buffer = this.noise ??= this.noiseBuffer();
    const felt = ctx.createBiquadFilter();
    felt.type = 'lowpass';
    felt.frequency.value = 1200;
    const thud = ctx.createGain();
    thud.gain.setValueAtTime(.012 * velocity, start);
    thud.gain.exponentialRampToValueAtTime(.0001, start + .03);
    hammer.connect(felt).connect(thud).connect(pan);
    hammer.start(start, Math.random() * .5, .05);
  }

  noiseBuffer() {
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // A quiet room: stereo noise dying away, darker as it dies.
  impulse(seconds) {
    const { ctx } = this;
    const length = Math.ceil(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let side = 0; side < 2; side++) {
      const data = buffer.getChannelData(side);
      let low = 0;
      for (let i = 0; i < length; i++) {
        const x = i / length;
        low += (1 - (.2 + .7 * x)) * (Math.random() * 2 - 1 - low);
        data[i] = low * (1 - x) ** 3;
      }
    }
    return buffer;
  }
}
