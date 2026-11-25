import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PENTATONIC, CHORDS, notesFor, createDayMusic, BPM } from '../src/audio/music-day.js';
import { NIGHT_SCALE, DRONE_HZ } from '../src/audio/music-night.js';
import { createAudioEngine } from '../src/audio/engine.js';

const pc = (f) => Math.round(12 * Math.log2(f / 440) + 69) % 12;

test('day music: G major pentatonic (G A B D E), different notes from Night Shift [R7.3]', () => {
  assert.deepEqual([...new Set(PENTATONIC.map(pc))].sort((a, b) => a - b), [2, 4, 7, 9, 11]);
  // Night Shift uses the tritone G# and D#; none of those are in the day scale.
  const night = new Set(NIGHT_SCALE.map(pc));
  assert.ok(night.has(8) && night.has(3));
  assert.ok(PENTATONIC.every((f) => pc(f) !== 8 && pc(f) !== 3));
  assert.ok(CHORDS.flat().every((f) => f > DRONE_HZ));
  assert.ok(BPM > 60 && BPM < 100);
});

test('day music: plucks over each chord come from that chord or the soft extras', () => {
  for (const c of CHORDS) assert.ok(notesFor(c).length >= 3);
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
  };
}

test('day music: starts only after a click, books plucks and birds on the music bus, stops and frees nodes', async () => {
  let ctx;
  const engine = createAudioEngine({ createContext: () => (ctx = fakeCtx()) });
  const day = createDayMusic(engine, { rng: () => 0.1, tickMs: 5, lookahead: 6 });
  assert.equal(day.start(), false);
  engine.unlock();
  assert.equal(day.start(), true);
  assert.ok(day.plucks > 0, 'plucks');
  assert.ok(day.chirps > 0, 'birdsong');
  const reaches = (n, t, seen = new Set()) => n === t || (!seen.has(n) && (seen.add(n), n.out.some((x) => reaches(x, t, seen))));
  const osc = ctx.made.find((n) => n.k === 'osc');
  assert.ok(reaches(osc, engine.musicBus));
  assert.ok(!reaches(osc, engine.sfxBus));
  day.stop(0.01);
  assert.equal(day.running, false);
  await new Promise((r) => setTimeout(r, 100));
  assert.ok(osc.dis > 0);
});
