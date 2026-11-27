// Day Shift music [design 9, R7.3]: a happy little waltz on the piano, in C major, with birdsong
// made of short FM chirps at random times. The left hand plays oom-pah-pah (the bass on one, the
// chord on two and three); the right hand plays the tune. It goes round and round, with a short
// breath between plays. All on the music bus. Kept in its own file so it can be cut on its own.
import { Piano } from './piano.js';

export const DAY_BEAT_S = 0.42; // about 143 beats a minute: a lively waltz
export const DAY_LEVEL = 0.6; // as loud as the story's nocturne: it plays under the work
export const DAY_PAUSE_S = 3; // the breath before it starts again

// The left hand's chords: the bass, then the chord played on beats two and three.
export const DAY_CHORDS = {
  C:  { bass: 48, chord: [52, 55, 60] },
  F:  { bass: 41, chord: [53, 57, 60] },
  G:  { bass: 43, chord: [55, 59, 62] },
  G7: { bass: 43, chord: [53, 59, 62] },
  Dm: { bass: 38, chord: [53, 57, 62] },
  Am: { bass: 45, chord: [52, 57, 60] },
};

// Three beats to a bar: [chord, [[note, beats], ...]]; a rest is null.
const DAY_A1 = [
  ['C',  [[67, 1], [72, 1], [76, 1]]],
  ['C',  [[79, 2], [76, 1]]],
  ['G7', [[77, 1], [74, 1], [71, 1]]],
  ['G7', [[74, 2], [67, 1]]],
  ['G7', [[65, 1], [71, 1], [74, 1]]],
  ['G7', [[77, 2], [74, 1]]],
  ['C',  [[76, 1], [79, 1], [72, 1]]],
  ['C',  [[72, 2], [null, 1]]],
];
const DAY_A2 = [
  ['C',  [[67, 1], [72, 1], [76, 1]]],
  ['F',  [[81, 2], [77, 1]]],
  ['F',  [[81, 1], [84, 1], [81, 1]]],
  ['C',  [[79, 2], [76, 1]]],
  ['Dm', [[77, 1], [74, 1], [77, 1]]],
  ['G7', [[79, 1], [77, 1], [74, 1]]],
  ['C',  [[72, 1], [76, 1], [74, 1]]],
  ['C',  [[72, 2], [null, 1]]],
];
// The middle: a skip in the minor, then up and back down to the dominant.
const DAY_B = [
  ['Am', [[76, 0.5], [77, 0.5], [76, 1], [72, 1]]],
  ['Am', [[69, 2], [72, 1]]],
  ['F',  [[77, 0.5], [79, 0.5], [77, 1], [72, 1]]],
  ['F',  [[69, 2], [77, 1]]],
  ['G',  [[79, 1], [83, 1], [86, 1]]],
  ['G',  [[86, 1], [83, 1], [81, 1]]],
  ['G7', [[79, 1], [77, 1], [74, 1]]],
  ['G7', [[71, 2], [67, 1]]],
];
export const DAY_WALTZ = [...DAY_A1, ...DAY_A2, ...DAY_B, ...DAY_A2];

// Every note of one bar, starting at `start`: { note, at, velocity, until }. `wobble()` gives a
// number from -0.5 to 0.5 for a hand's small looseness. When a chord comes twice in a row, the
// second bar's bass goes up to the fifth, so the bass walks.
export function barNotes(i, start, { beat = DAY_BEAT_S, wobble = () => 0 } = {}) {
  const [name, melody] = DAY_WALTZ[i % DAY_WALTZ.length];
  const { bass, chord } = DAY_CHORDS[name];
  const repeat = i > 0 && DAY_WALTZ[(i - 1) % DAY_WALTZ.length][0] === name;
  const loose = (t) => t + wobble() * 0.02;
  const barEnd = start + beat * 3;
  const notes = [{ note: repeat ? bass + 7 : bass, at: loose(start), velocity: 0.5, until: barEnd }];
  for (const b of [1, 2]) for (const n of chord) notes.push({ note: n, at: loose(start + b * beat), velocity: 0.28, until: start + b * beat + beat * 0.55 });
  let t = start;
  for (const [note, beats] of melody) {
    if (note !== null) notes.push({ note, at: loose(t), velocity: t === start ? 0.6 : 0.5, until: t + beats * beat * 0.9 });
    t += beats * beat;
  }
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
        piano.playNote(n.note, n.at, n.velocity, n.until);
        noteCount += 1;
      }
      nextBar += DAY_BEAT_S * 3;
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
