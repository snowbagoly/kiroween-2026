import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAY_WALTZ, DAY_CHORDS, DAY_BEAT_S, barNotes, createDayMusic } from '../src/audio/music-day.js';
import { HARMONY } from '../src/audio/scores.js';
import { createAudioEngine } from '../src/audio/engine.js';

const pcs = (notes) => new Set(notes.map((n) => n % 12));

test('day music: a lively waltz in C major, three beats to every bar, apart from the night waltz [R7.3]', () => {
  assert.ok(DAY_WALTZ.length === 32);
  for (const [chord, melody] of DAY_WALTZ) {
    assert.ok(DAY_CHORDS[chord], chord);
    assert.equal(melody.reduce((n, [, beats]) => n + beats, 0), 3);
  }
  const all = DAY_WALTZ.flatMap(([c, m]) => [DAY_CHORDS[c].bass, ...DAY_CHORDS[c].chord, ...m.map(([n]) => n).filter((n) => n !== null)]);
  const cMajor = [0, 2, 4, 5, 7, 9, 11];
  assert.ok([...pcs(all)].every((p) => cMajor.includes(p)));
  // The night waltz is in Eb minor: its Eb, Gb and Bb are in none of the day's notes.
  const night = pcs(Object.values(HARMONY).flatMap((h) => [h.bass, ...h.chord]));
  assert.ok(night.has(3) && night.has(6) && night.has(10));
  assert.ok(![3, 6, 10].some((p) => pcs(all).has(p)));
  const bpm = 60 / DAY_BEAT_S;
  assert.ok(bpm >= 120 && bpm <= 170, 'a fun waltz, not a slow one');
});

test('day music: oom-pah-pah, and the tune lands on the chord on each downbeat', () => {
  for (let i = 0; i < DAY_WALTZ.length; i++) {
    const [name, melody] = DAY_WALTZ[i];
    const notes = barNotes(i, 10);
    const { chord } = DAY_CHORDS[name];
    assert.equal(notes[0].at, 10); // the bass on one
    assert.equal(notes.filter((n) => chord.includes(n.note)).length >= 6, true); // the chord on two and three
    for (const b of [1, 2]) assert.ok(notes.some((n) => Math.abs(n.at - (10 + b * DAY_BEAT_S)) < 1e-9 && chord.includes(n.note)));
    if (melody[0][0] !== null) assert.ok(pcs(chord).has(melody[0][0] % 12) || pcs([DAY_CHORDS[name].bass]).has(melody[0][0] % 12), `bar ${i + 1}`);
    for (const n of notes) assert.ok(n.until > n.at && n.at < 10 + DAY_BEAT_S * 3);
  }
});

function fakeCtx() {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const made = [];
  const node = (k) => { const n = { k, out: [], dis: 0, connect(x) { n.out.push(x); return x; }, disconnect() { n.dis++; } }; made.push(n); return n; };
  const src = (k) => { const n = node(k); n.start = () => { n.started = true; }; n.stop = () => { n.stopped = true; }; return n; };
  return {
    made, state: 'running', currentTime: 0, sampleRate: 4000, destination: node('dest'),
    createGain() { const n = node('gain'); n.gain = param(); return n; },
    createDynamicsCompressor() { return node('comp'); },
    createOscillator() { const n = src('osc'); n.frequency = param(); n.detune = param(); return n; },
    createBiquadFilter() { const n = node('bq'); n.frequency = param(); n.Q = param(); return n; },
    createConvolver() { return node('conv'); },
    createStereoPanner() { const n = node('pan'); n.pan = param(); return n; },
    createBuffer(ch, len) { const d = new Float32Array(len); return { getChannelData: () => d }; },
    createBufferSource() { return src('buf'); },
  };
}

test('day music: starts only after a click, books piano notes and birds on the music bus, stops and frees nodes', async () => {
  let ctx;
  const engine = createAudioEngine({ createContext: () => (ctx = fakeCtx()) });
  const day = createDayMusic(engine, { rng: () => 0.1, tickMs: 5, lookahead: 6 });
  assert.equal(day.start(), false);
  engine.unlock();
  assert.equal(day.start(), true);
  assert.ok(day.notes > 0, 'piano notes');
  assert.ok(day.chirps > 0, 'birdsong');
  const reaches = (n, t, seen = new Set()) => n === t || (!seen.has(n) && (seen.add(n), n.out.some((x) => reaches(x, t, seen))));
  const osc = ctx.made.find((n) => n.k === 'osc');
  assert.ok(reaches(osc, engine.musicBus));
  assert.ok(!reaches(osc, engine.sfxBus));
  day.stop(0.01);
  assert.equal(day.running, false);
  await new Promise((r) => setTimeout(r, 100));
  const feed = ctx.made.find((n) => n.k === 'gain' && n.out.includes(engine.musicBus));
  assert.ok(feed.dis > 0); // the whole day music is let go from the bus
});
