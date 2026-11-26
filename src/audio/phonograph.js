// The phonograph in the next room [design 9, R6.2]. It plays the waltz from scores.js on an old upright
// piano and reed organ, heard as if through its horn: a narrow band of frequencies, a slow pitch wobble
// ("wow") from an uneven turntable, surface crackle, and the reverb of the room it is playing in.
// It goes to the music bus, so the music slider, mute and the "Music" switch rule it.
import { WALTZ_BEAT_SECONDS, PAUSE_BETWEEN_PLAYS, midiToHz, HARMONY, SECTIONS, FORM } from './scores.js';

export const RECORD_LEVEL = 0.6;
export const WOW_DEPTH = 0.0012; // the normal pitch wobble of the turntable; dread makes it worse
export const DRAG_DELAY = 0.38; // seconds the record falls behind when it drags; that is the pitch drop
export const REVOLUTION = 60 / 78; // one turn of a 78 rpm record: what repeats when the needle sticks
const LOOKAHEAD_S = 2;
const SCHEDULE_MS = 500;

// The whole form as one list of bars: { chord, melody, organ }.
export const WALTZ = FORM.flatMap(({ section, organ }) => SECTIONS[section].map(([chord, melody]) => ({ chord, melody, organ })));

// Beat length for bar i: the player holds back the tempo over the last two bars.
export function beatFor(i, bars = WALTZ.length) {
  const fromEnd = bars - 1 - i;
  return WALTZ_BEAT_SECONDS * (fromEnd === 0 ? 1.35 : fromEnd === 1 ? 1.15 : 1);
}

export function createPhonograph(engine, { on = true, rng = Math.random, setTimer = (f, ms) => setTimeout(f, ms), clearTimer = clearTimeout } = {}) {
  let ctx = null;
  let out = null;
  let input = null;
  let wow = null;
  let wowDepth = null;
  let nodes = [];
  let timer = null;
  let musicOn = on;
  let barIndex = 0;
  let nextBarAt = 0;
  let stuck = 0;
  let tick = null;
  let barsPlayed = 0;

  const keep = (n) => { nodes.push(n); return n; };
  const level = () => (musicOn ? RECORD_LEVEL : 0);

  // Faint hiss with occasional pops, each pop dying away over a few samples.
  function crackleBuffer(seconds) {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let pop = 0;
    for (let i = 0; i < data.length; i++) {
      if (rng() < 0.0003) pop = (rng() < 0.5 ? -1 : 1) * (0.1 + rng() * 0.25);
      data[i] = (rng() * 2 - 1) * 0.006 + pop;
      pop *= 0.6;
    }
    return buffer;
  }

  // Decaying stereo noise works as a room's reverb.
  function impulse(seconds) {
    const length = Math.ceil(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) data[i] = (rng() * 2 - 1) * (1 - i / length) ** 3;
    }
    return buffer;
  }

  function build() {
    ctx = engine.ctx;
    out = keep(ctx.createGain());
    out.gain.value = 0;
    out.gain.setTargetAtTime(level(), ctx.currentTime, 4);
    out.connect(engine.musicBus);
    input = keep(ctx.createGain());
    const highpass = keep(ctx.createBiquadFilter());
    highpass.type = 'highpass';
    highpass.frequency.value = 150;
    const lowpass = keep(ctx.createBiquadFilter());
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3000;
    wow = keep(ctx.createDelay(1));
    wow.delayTime.value = 0.01;
    const wowLfo = keep(ctx.createOscillator());
    wowLfo.frequency.value = 0.45;
    wowDepth = keep(ctx.createGain());
    wowDepth.gain.value = WOW_DEPTH;
    wowLfo.connect(wowDepth);
    wowDepth.connect(wow.delayTime);
    wowLfo.start();
    input.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(wow);
    // Out partly dry and partly through a long reverb.
    const dry = keep(ctx.createGain());
    dry.gain.value = 0.5;
    const reverb = keep(ctx.createConvolver());
    reverb.buffer = impulse(5);
    const wet = keep(ctx.createGain());
    wet.gain.value = 0.8;
    wow.connect(dry);
    dry.connect(out);
    wow.connect(reverb);
    reverb.connect(wet);
    wet.connect(out);
    const crackle = keep(ctx.createBufferSource());
    crackle.buffer = crackleBuffer(9);
    crackle.loop = true;
    crackle.connect(out);
    crackle.start();
    // The tick of the needle jumping back when it sticks.
    tick = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.02), ctx.sampleRate);
    const t = tick.getChannelData(0);
    for (let i = 0; i < t.length; i++) t[i] = (rng() * 2 - 1) * (1 - i / t.length) ** 4;
  }

  // Upright piano: a quick strike, higher overtones dying first, and two strings per note slightly out
  // of tune with each other, like an instrument nobody has tuned in years.
  function pianoNote(note, start, velocity) {
    const decay = 3.5;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(0.05 * velocity, start + 0.005);
    env.connect(input);
    let last = null;
    for (const detune of [-7, 5]) {
      for (const [ratio, lvl] of [[1, 1], [2, 0.35], [3, 0.12], [4, 0.06]]) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.value = midiToHz(note) * ratio;
        osc.detune.value = detune;
        g.gain.setValueAtTime(lvl, start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + decay / ratio);
        osc.connect(g);
        g.connect(env);
        osc.start(start);
        osc.stop(start + decay + 0.1);
        osc.onended = () => { osc.disconnect(); g.disconnect(); };
        last = osc;
      }
    }
    last.addEventListener?.('ended', () => env.disconnect());
  }

  // Reed organ: buzzy sawtooth reeds behind a soft filter, swelling like a pumped bellows.
  function organChord(notes, start, length) {
    const end = start + length + 1;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(600, start);
    filter.frequency.linearRampToValueAtTime(1000, start + length * 0.5);
    filter.frequency.linearRampToValueAtTime(700, end);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(0.02, start + 0.4);
    env.gain.setValueAtTime(0.02, start + length);
    env.gain.linearRampToValueAtTime(0, end);
    filter.connect(env);
    env.connect(input);
    let last = null;
    for (const note of notes) {
      for (const detune of [-4, 4]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = midiToHz(note);
        osc.detune.value = detune;
        osc.connect(filter);
        osc.start(start);
        osc.stop(end);
        osc.onended = () => osc.disconnect();
        last = osc;
      }
    }
    last.addEventListener?.('ended', () => { filter.disconnect(); env.disconnect(); });
  }

  // Plays a bar from start; with cut, only what begins in its first cut seconds (a stuck needle).
  function playBar({ chord, melody, organ }, start, beat, cut = Infinity) {
    const { bass, chord: tones } = HARMONY[chord];
    const loose = (t) => t + (rng() - 0.5) * 0.03; // a little human looseness in timing
    pianoNote(bass, loose(start), 0.6);
    for (const b of [1, 2]) {
      if (b * beat >= cut) break;
      for (const note of tones) pianoNote(note, loose(start + b * beat), 0.22);
    }
    let t = start;
    for (const [note, beats] of melody) {
      if (t - start >= cut) break;
      pianoNote(note, loose(t), 0.85 + rng() * 0.15);
      t += beats * beat;
    }
    if (organ && cut === Infinity) organChord([bass + 12, ...tones], start, beat * 3);
    barsPlayed += 1;
  }

  function jump(at) {
    const src = ctx.createBufferSource();
    src.buffer = tick;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(g);
    g.connect(out);
    src.start(at);
    src.onended = () => { src.disconnect(); g.disconnect(); };
  }

  // Books the next couple of seconds of music, and comes back every half second for more.
  function schedule() {
    timer = setTimer(schedule, SCHEDULE_MS);
    const now = ctx.currentTime;
    nextBarAt = Math.max(nextBarAt, now); // a throttled tab skips ahead rather than playing a backlog
    while (nextBarAt < now + LOOKAHEAD_S) {
      if (stuck > 0) {
        playBar(WALTZ[barIndex], nextBarAt, WALTZ_BEAT_SECONDS, REVOLUTION);
        jump(nextBarAt);
        nextBarAt += REVOLUTION;
        stuck -= 1;
        if (stuck === 0) barIndex = (barIndex + 1) % WALTZ.length;
        continue;
      }
      const beat = beatFor(barIndex);
      playBar(WALTZ[barIndex], nextBarAt, beat);
      nextBarAt += beat * 3;
      barIndex += 1;
      if (barIndex === WALTZ.length) {
        barIndex = 0;
        nextBarAt += PAUSE_BETWEEN_PLAYS;
      }
    }
  }

  const api = {
    get running() { return timer !== null; },
    get barsPlayed() { return barsPlayed; },
    get on() { return musicOn; },
    // The needle goes down: the record starts from the top after a moment.
    start() {
      if (timer !== null || !engine.ready) return false;
      build();
      barIndex = 0;
      stuck = 0;
      nextBarAt = ctx.currentTime + 1.5;
      schedule();
      return true;
    },
    // The record fades out, then every node is freed.
    stop(fade = 0.6) {
      if (timer === null) return;
      clearTimer(timer);
      timer = null;
      out.gain.setTargetAtTime(0, ctx.currentTime, fade / 4);
      const old = nodes;
      nodes = [];
      setTimer(() => {
        for (const n of old) { try { n.stop?.(); } catch { /* already stopped */ } n.disconnect(); }
      }, fade * 1000 + 50);
    },
    // The player's "Music" switch [R6.8].
    setOn(v) {
      musicOn = !!v;
      if (out) out.gain.setTargetAtTime(level(), ctx.currentTime, 0.4);
    },
    // How warped the record sounds, 0 (normal) to 1 (badly) [R6.7].
    setWarp(w) {
      if (wowDepth) wowDepth.gain.setTargetAtTime(WOW_DEPTH + Math.min(1, Math.max(0, w)) * 0.005, ctx.currentTime, 2);
    },
    // The turntable dragging: the music sinks flat over down seconds, stays behind for hold, then
    // catches up over back seconds, running a little sharp [R6.4a].
    drag(down, hold, back) {
      if (!wow) return;
      const d = wow.delayTime;
      const t = ctx.currentTime;
      d.cancelScheduledValues(t);
      d.setValueAtTime(0.01, t);
      d.linearRampToValueAtTime(0.01 + DRAG_DELAY, t + down);
      d.setValueAtTime(0.01 + DRAG_DELAY, t + down + hold);
      d.linearRampToValueAtTime(0.01, t + down + hold + back);
    },
    // The needle catching in a scratch: one turn of the record, times times over, with a tick each time
    // [R6.4a]. It starts with the next bar not yet booked.
    stick(times) { stuck = Math.max(0, Math.round(times)); },
  };
  return api;
}
