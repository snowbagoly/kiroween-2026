import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { bpmFor, beatSeconds, heartbeatTimes, hooGap, creakGap, createNightMusic, MIN_BPM, MAX_BPM } from '../src/audio/music-night.js';
import { createAudioEngine } from '../src/audio/engine.js';

test('night: heartbeat runs from 38 to 160 beats per minute with tension [R6.2]', () => {
  assert.equal(bpmFor(0), MIN_BPM);
  assert.equal(bpmFor(1), MAX_BPM);
  assert.equal(MIN_BPM, 38);
  assert.equal(MAX_BPM, 160);
  assert.equal(bpmFor(-3), 38);
  assert.equal(bpmFor(9), 160);
});

test('night (property): more tension never slows the heartbeat or spaces out hoos and creaks', () => {
  fc.assert(fc.property(fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), (a, b, r) => {
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    assert.ok(beatSeconds(hi) <= beatSeconds(lo));
    assert.ok(hooGap(hi, r) <= hooGap(lo, r));
    assert.ok(creakGap(hi, r) <= creakGap(lo, r));
    assert.ok(hooGap(hi, r) > 0 && creakGap(hi, r) > 0);
  }), { numRuns: 200 });
});

test('night: heartbeat comes in lub-dub pairs, one pair per beat', () => {
  const { beats, next } = heartbeatTimes(0, 3, 0); // 38 bpm: a beat every ~1.58 s
  assert.equal(beats.length, 4);
  assert.ok(beats[0].strong && !beats[1].strong);
  assert.ok(Math.abs(beats[2].at - 60 / 38) < 1e-9);
  assert.ok(Math.abs(next - 2 * (60 / 38)) < 1e-9);
});

// Fake Web Audio that records connections and stops.
function fakeCtx() {
  const made = [];
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime(v) { this.value = v; } });
  const node = (k) => {
    const n = { k, out: [], dis: 0, connect(x) { n.out.push(x); return x; }, disconnect() { n.dis++; } };
    made.push(n);
    return n;
  };
  const src = (k) => { const n = node(k); n.start = () => { n.started = true; }; n.stop = () => { n.stopped = true; }; return n; };
  return {
    made, state: 'running', currentTime: 0, sampleRate: 4000, destination: node('dest'),
    createGain() { const n = node('gain'); n.gain = param(); return n; },
    createDynamicsCompressor() { return node('comp'); },
    createOscillator() { const n = src('osc'); n.frequency = param(); n.detune = param(); return n; },
    createBiquadFilter() { const n = node('bq'); n.frequency = param(); n.Q = param(); return n; },
    createBuffer(ch, len) { const d = new Float32Array(len); return { getChannelData: () => d }; },
    createBufferSource() { return src('src'); },
  };
}

test('night: starts only after the first click, plays on both buses, stops and frees nodes', async () => {
  let ctx;
  const engine = createAudioEngine({ createContext: () => (ctx = fakeCtx()) });
  const night = createNightMusic(engine, { rng: () => 0.5, tickMs: 5 });
  assert.equal(night.start(), false); // no context yet
  engine.unlock();
  assert.equal(night.start(), true);
  assert.equal(night.running, true);
  assert.equal(night.start(), false); // already running
  const reaches = (n, target, seen = new Set()) => n === target || (!seen.has(n) && (seen.add(n), n.out.some((x) => reaches(x, target, seen))));
  const rain = ctx.made.find((n) => n.k === 'src');
  assert.ok(rain.started && reaches(rain, engine.sfxBus), 'rain plays on the effects bus');
  const drone = ctx.made.find((n) => n.k === 'osc');
  assert.ok(drone.started && reaches(drone, engine.musicBus), 'drone plays on the music bus');
  night.setTension(1);
  assert.equal(night.tension, 1);
  night.stop(0.01);
  assert.equal(night.running, false);
  await new Promise((r) => setTimeout(r, 120));
  assert.ok(rain.stopped && rain.dis > 0 && drone.dis > 0);
});
