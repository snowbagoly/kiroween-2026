// Day Shift music [design 9, R7.3]: a wistful waltz on the piano, in Bb major, about two minutes
// long (A, A higher, B in G minor, A again, a slowing ending), with birdsong made of short FM chirps
// at random times. The left hand plays the bass on one and the chord on two; the tune is played
// legato, each note held into the next, and the notes ring on (Piano.playNote with `held`). It plays
// round and round, with a short breath between plays. All on the music bus.
import { Piano } from './piano.js';

export const DAY_BEAT_S = 0.58; // about 103 beats a minute
export const DAY_LEVEL = 0.45; // about as loud as the story's nocturne
export const DAY_PAUSE_S = 3; // the breath before it starts again
export const DAY_SUSTAIN = 3; // the notes ring three times as long as the story's
export const DAY_RIT_BARS = 5; // the ending slows over its last bars
const LEGATO_S = 0.12; // a note is held this far into the next one

// The left hand's chords: the bass, then the chord played on beat two.
export const DAY_CHORDS = {
  Bbmaj7: { bass: 34, chord: [41, 50, 57] },
  Dm7: { bass: 38, chord: [45, 53, 60] },
  Ebmaj7: { bass: 39, chord: [46, 50, 55] },
  Fsus4: { bass: 41, chord: [46, 48, 53] },
  F: { bass: 41, chord: [45, 48, 53] },
  Gm7: { bass: 31, chord: [46, 50, 53] },
  Cm7: { bass: 36, chord: [46, 51, 55] },
  F7: { bass: 41, chord: [45, 51, 53] },
  D7: { bass: 38, chord: [45, 48, 54] },
};

// Three beats to a bar: [chord, [[note, beats], ...]]; a rest is null.
export const DAY_WALTZ = [
  ['Bbmaj7', [[62, 1], [62, 1], [62, 0.5], [58, 0.5]]], ['Bbmaj7', [[60, 3]]],
  ['Dm7', [[65, 1], [69, 1], [67, 0.5], [65, 0.5]]], ['Dm7', [[62, 3]]],
  ['Ebmaj7', [[67, 1], [69, 1], [67, 1]]], ['Ebmaj7', [[65, 3]]],
  ['Fsus4', [[60, 1], [58, 1], [60, 0.5], [58, 0.5]]], ['F', [[57, 3]]],
  ['Gm7', [[62, 1], [62, 1], [62, 0.5], [60, 0.5]]], ['Gm7', [[58, 3]]],
  ['Ebmaj7', [[67, 1], [63, 0.5], [65, 0.5], [63, 0.5], [62, 0.5]]], ['Ebmaj7', [[60, 3]]],
  ['Cm7', [[63, 1], [60, 1], [58, 1]]], ['F7', [[57, 3]]],
  ['Bbmaj7', [[58, 1], [62, 1], [60, 0.5], [57, 0.5]]], ['Bbmaj7', [[58, 3]]],
  ['Bbmaj7', [[62, 1], [65, 1], [63, 0.5], [62, 0.5]]], ['Bbmaj7', [[60, 3]]],
  ['Dm7', [[65, 1], [65, 1], [65, 1]]], ['Dm7', [[69, 3]]],
  ['Ebmaj7', [[70, 0.5], [69, 0.5], [67, 0.5], [69, 0.5], [70, 0.5], [72, 0.5]]], ['Ebmaj7', [[74, 3]]],
  ['Cm7', [[72, 1], [70, 1], [69, 0.5], [67, 0.5]]], ['F7', [[65, 3]]],
  ['Gm7', [[62, 1], [62, 0.5], [62, 0.5], [65, 0.5], [63, 0.5]]], ['Gm7', [[62, 3]]],
  ['Ebmaj7', [[63, 1], [62, 0.5], [60, 0.5], [58, 0.5], [57, 0.5]]], ['Ebmaj7', [[55, 3]]],
  ['Cm7', [[58, 0.5], [57, 0.5], [58, 0.5], [60, 0.5], [62, 0.5], [63, 0.5]]], ['F7', [[65, 3]]],
  ['Bbmaj7', [[62, 1], [60, 1], [58, 0.5], [57, 0.5]]], ['Bbmaj7', [[58, 3]]],
  ['Gm7', [[67, 1], [67, 1], [67, 1]]], ['Gm7', [[70, 3]]],
  ['Ebmaj7', [[67, 1], [69, 1], [67, 1]]], ['Ebmaj7', [[65, 3]]],
  ['Cm7', [[63, 1], [65, 1], [67, 0.5], [65, 0.5]]], ['D7', [[66, 3]]],
  ['Gm7', [[67, 1], [62, 1], [65, 0.5], [63, 0.5]]], ['D7', [[62, 3]]],
  ['Ebmaj7', [[67, 0.5], [63, 0.5], [65, 0.5], [67, 0.5], [65, 0.5], [67, 0.5]]], ['Bbmaj7', [[65, 3]]],
  ['Cm7', [[63, 1], [62, 0.5], [60, 0.5], [62, 0.5], [63, 0.5]]], ['Dm7', [[65, 3]]],
  ['Ebmaj7', [[62, 1], [62, 1], [62, 1]]], ['Fsus4', [[65, 3]]],
  ['F7', [[63, 1], [60, 1], [57, 0.5], [60, 0.5]]], ['F7', [[57, 3]]],
  ['Bbmaj7', [[62, 1], [62, 1], [62, 0.5], [58, 0.5]]], ['Bbmaj7', [[60, 3]]],
  ['Dm7', [[65, 1], [62, 1], [63, 1]]], ['Dm7', [[62, 3]]],
  ['Ebmaj7', [[67, 1], [70, 1], [69, 0.5], [67, 0.5]]], ['Ebmaj7', [[65, 3]]],
  ['Fsus4', [[60, 1], [60, 0.5], [60, 0.5], [57, 0.5], [58, 0.5]]], ['F', [[57, 3]]],
  ['Gm7', [[62, 1], [65, 1], [63, 0.5], [62, 0.5]]], ['Gm7', [[58, 3]]],
  ['Ebmaj7', [[67, 0.5], [69, 0.5], [67, 0.5], [65, 0.5], [63, 0.5], [62, 0.5]]], ['Ebmaj7', [[60, 3]]],
  ['Cm7', [[63, 1], [60, 1], [58, 1]]], ['F7', [[57, 3]]],
  ['Bbmaj7', [[58, 1], [62, 1], [60, 0.5], [57, 0.5]]], ['Bbmaj7', [[58, 3]]],
  ['Ebmaj7', [[62, 1], [62, 1], [62, 1]]], ['Ebmaj7', [[60, 3]]],
  ['Fsus4', [[58, 1], [57, 0.5], [55, 0.5], [57, 0.5], [58, 0.5]]], ['F7', [[60, 3]]],
  ['Bbmaj7', [[62, 3]]], ['Gm7', [[58, 3]]],
  ['F7', [[60, 2], [57, 1]]], ['Bbmaj7', [[58, 3]]],
  ['Bbmaj7', [[null, 3]]],
];

// How long a beat is in bar i: a little breath at each phrase end, and slowing at the very end.
export function barBeat(i) {
  const n = i % DAY_WALTZ.length;
  const left = DAY_WALTZ.length - n;
  return DAY_BEAT_S * (n % 8 === 7 ? 1.08 : 1) * (left <= DAY_RIT_BARS ? 1 + 0.06 * (DAY_RIT_BARS - left + 1) : 1);
}

// Every note of bar i, starting at `start`: { note, at, velocity, until }. `wobble()` gives a number
// from -0.5 to 0.5 for the hands' small looseness.
export function barNotes(i, start, { wobble = () => 0 } = {}) {
  const n = i % DAY_WALTZ.length;
  const [name, melody] = DAY_WALTZ[n];
  const { bass, chord } = DAY_CHORDS[name];
  const beat = barBeat(i);
  const loose = (t) => t + wobble() * 0.02;
  const notes = [{ note: bass, at: loose(start), velocity: 0.34, until: start + 3 * beat + LEGATO_S }];
  for (const c of chord) notes.push({ note: c, at: loose(start + beat), velocity: 0.16, until: start + 3 * beat + LEGATO_S });
  const next = DAY_WALTZ[(n + 1) % DAY_WALTZ.length][1];
  let t = start;
  melody.forEach(([note, beats], k) => {
    const following = k + 1 < melody.length ? melody[k + 1][0] : next[0][0];
    // Long notes a little stronger, quick ones lighter; the two bars of a phrase swell and fall.
    const weight = beats >= 2 ? 0.75 : beats >= 1 ? 0.68 : 0.5;
    const shape = 0.85 + 0.15 * Math.sin((Math.PI * ((n % 2) * 3 + (t - start) / beat)) / 6);
    const until = following !== null ? t + beats * beat + LEGATO_S : t + beats * beat * 0.95;
    if (note !== null) notes.push({ note, at: loose(t), velocity: weight * shape, until });
    t += beats * beat;
  });
  return notes;
}

export function createDayMusic(engine, { rng = Math.random, lookahead = 0.6, tickMs = 100 } = {}) {
  let ctx = null;
  let out = null;
  let piano = null;
  let timer = null;
  let shots = new Set();
  let nextBar = 0;
  let bar = 0;
  let nextBird = 0;
  let noteCount = 0;
  let chirpCount = 0;

  function oneShot(src, extra, stopAt) {
    const all = [src, ...extra];
    shots.add(all);
    src.onended = () => { shots.delete(all); for (const n of all) n.disconnect(); };
    src.stop(stopAt);
  }

  // Birdsong: a few quick chirps, a sine carrier swept up with a fast FM wobble.
  function bird(at) {
    const chirps = 2 + Math.floor(rng() * 4);
    let t = at;
    for (let i = 0; i < chirps; i++) {
      const base = 2400 + rng() * 1600;
      const len = 0.06 + rng() * 0.07;
      const car = ctx.createOscillator();
      car.frequency.setValueAtTime(base, t);
      car.frequency.exponentialRampToValueAtTime(base * (1.25 + rng() * 0.4), t + len);
      const mod = ctx.createOscillator();
      mod.frequency.value = 40 + rng() * 60;
      const modAmt = ctx.createGain();
      modAmt.gain.value = base * 0.06;
      mod.connect(modAmt); modAmt.connect(car.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.01);
      g.gain.linearRampToValueAtTime(0, t + len);
      car.connect(g); g.connect(out);
      car.start(t); mod.start(t); mod.stop(t + len + 0.02);
      oneShot(car, [mod, modAmt, g], t + len + 0.02);
      chirpCount += 1;
      t += len + 0.05 + rng() * 0.12;
    }
  }

  function tick() {
    const now = ctx.currentTime;
    nextBar = Math.max(nextBar, now); // a throttled tab skips ahead rather than catching up
    const until = now + lookahead;
    while (nextBar < until) {
      for (const n of barNotes(bar, nextBar, { wobble: () => rng() - 0.5 })) {
        piano.playNote(n.note, n.at, n.velocity, n.until, { held: DAY_SUSTAIN });
        noteCount += 1;
      }
      nextBar += barBeat(bar) * 3;
      bar += 1;
      if (bar % DAY_WALTZ.length === 0) nextBar += DAY_PAUSE_S;
    }
    if (nextBird < until) { bird(Math.max(nextBird, now)); nextBird += 5 + rng() * 10; }
  }

  return {
    get running() { return timer !== null; },
    get notes() { return noteCount; },
    get chirps() { return chirpCount; },
    start() {
      if (timer !== null || !engine.ready) return false;
      ctx = engine.ctx;
      out = ctx.createGain();
      out.gain.value = 1;
      out.connect(engine.musicBus);
      piano = new Piano(ctx, out, { on: true });
      piano.out.gain.value = DAY_LEVEL;
      nextBar = ctx.currentTime + 0.8;
      bar = 0;
      nextBird = ctx.currentTime + 3 + rng() * 4;
      tick();
      timer = setInterval(tick, tickMs);
      return true;
    },
    stop(fade = 0.6) {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
      out.gain.setTargetAtTime(0, ctx.currentTime, fade / 4);
      const old = out;
      const oldPiano = piano;
      const oldShots = [...shots];
      shots = new Set();
      piano = null;
      setTimeout(() => {
        oldPiano.out.disconnect();
        old.disconnect();
        for (const s of oldShots) for (const n of s) n.disconnect();
      }, fade * 1000 + 50);
    },
  };
}
