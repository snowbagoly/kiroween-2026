// The office's sound and the phonograph [T36, design 9, R6.1, R6.2, R6.8].
import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioEngine } from '../src/audio/engine.js';
import { createNightSound, KEY_TONE_HZ } from '../src/audio/office-sound.js';
import { createPhonograph, WALTZ, beatFor, RECORD_LEVEL } from '../src/audio/phonograph.js';
import { HARMONY, WALTZ_BEAT_SECONDS, midiToHz } from '../src/audio/scores.js';
import { cleanData, defaultData, setSetting } from '../src/core/settings.js';

function fakeCtx() {
  const param = () => { const p = { value: 0, last: null }; for (const m of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues']) p[m] = (v) => { p.last = v; }; return p; };
  const made = [];
  const node = (k) => { const n = { k, out: [], dis: 0, connect(x) { n.out.push(x); return x; }, disconnect() { n.dis++; } }; made.push(n); return n; };
  const src = (k) => { const n = node(k); n.start = () => { n.started = true; }; n.stop = () => { n.stopped = true; }; return n; };
  const buffer = (ch, len) => ({ getChannelData: () => new Float32Array(len) });
  return {
    made, state: 'running', currentTime: 0, sampleRate: 2000, destination: node('dest'),
    createGain() { const n = node('gain'); n.gain = param(); return n; },
    createDynamicsCompressor() { return node('comp'); },
    createOscillator() { const n = src('osc'); n.frequency = param(); n.detune = param(); return n; },
    createBiquadFilter() { const n = node('bq'); n.frequency = param(); n.Q = param(); return n; },
    createBufferSource() { return src('buf'); },
    createBuffer: buffer,
    createDelay() { const n = node('delay'); n.delayTime = param(); return n; },
    createConvolver() { return node('conv'); },
  };
}
const reaches = (n, t, seen = new Set()) => n === t || (!seen.has(n) && (seen.add(n), n.out.some((x) => reaches(x, t, seen))));

test('scores: the waltz is in Eb minor, three beats a bar, 32 bars, slowing over the last two', () => {
  assert.equal(WALTZ.length, 32);
  for (const bar of WALTZ) assert.ok(Math.abs(bar.melody.reduce((n, [, b]) => n + b, 0) - 3) < 1e-9, bar.chord);
  assert.equal(HARMONY.Ebm.bass % 12, 3);
  assert.equal(beatFor(0), WALTZ_BEAT_SECONDS);
  assert.ok(beatFor(31) > beatFor(30) && beatFor(30) > beatFor(29));
});

test('key tone: Eb5, inside the waltz', () => {
  assert.ok(Math.abs(KEY_TONE_HZ - midiToHz(75)) < 1);
});

test('office sound: room on the effects bus, record on the music bus; it books bars; stop frees nodes', async () => {
  let ctx;
  const engine = createAudioEngine({ createContext: () => (ctx = fakeCtx()) });
  const night = createNightSound(engine, { rng: () => 0.3 });
  assert.equal(night.start(), false); // no sound before a click [R1.3]
  engine.unlock();
  assert.equal(night.start(), true);
  assert.ok(night.record.running);
  ctx.currentTime = 1;
  await new Promise((r) => setTimeout(r, 600));
  assert.ok(night.record.barsPlayed > 0, 'the waltz plays');
  const conv = ctx.made.find((n) => n.k === 'conv');
  assert.ok(reaches(conv, engine.musicBus) && !reaches(conv, engine.sfxBus), 'record on the music bus');
  const hum = ctx.made.find((n) => n.k === 'osc' && n.frequency.value === 50);
  assert.ok(reaches(hum, engine.sfxBus) && !reaches(hum, engine.musicBus), 'room tone on the effects bus');
  night.stop(0.01);
  assert.equal(night.running, false);
  assert.equal(night.record.running, false);
  await new Promise((r) => setTimeout(r, 100));
  assert.ok(hum.dis > 0 && conv.dis > 0);
});

test('phonograph: the Music switch silences only the record', () => {
  let ctx;
  const engine = createAudioEngine({ createContext: () => (ctx = fakeCtx()) });
  engine.unlock();
  const rec = createPhonograph(engine, { on: false, rng: () => 0.5, setTimer: () => 1, clearTimer: () => {} });
  rec.start();
  const out = ctx.made.find((n) => n.k === 'gain' && n.out.includes(engine.musicBus));
  assert.equal(out.gain.last, 0);
  rec.setOn(true);
  assert.equal(out.gain.last, RECORD_LEVEL);
});

test('phonograph: a stuck needle repeats one turn of the record, then moves on', () => {
  let ctx;
  const engine = createAudioEngine({ createContext: () => (ctx = fakeCtx()) });
  engine.unlock();
  const jobs = [];
  const rec = createPhonograph(engine, { rng: () => 0.5, setTimer: (f) => { jobs.push(f); return jobs.length; }, clearTimer: () => {} });
  rec.start();
  const before = rec.barsPlayed;
  rec.stick(4);
  ctx.currentTime = 30;
  jobs.at(-1)(); // two seconds ahead: three turns of 0.77 s
  assert.equal(rec.barsPlayed - before, 3);
  ctx.currentTime = 31;
  jobs.at(-1)();
  assert.equal(rec.barsPlayed - before, 4, 'the fourth turn');
  ctx.currentTime = 40;
  jobs.at(-1)();
  const after = rec.barsPlayed - before;
  assert.ok(after === 5, `then whole bars again, 2.4 s each: ${after}`);
});

test('settings: Music is on by default and saved', () => {
  assert.equal(defaultData().settings.music, true);
  const d = setSetting(defaultData(), 'music', false);
  assert.equal(cleanData(JSON.parse(JSON.stringify(d))).settings.music, false);
});
