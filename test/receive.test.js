import { test } from 'node:test';
import assert from 'node:assert/strict';
import { letterSchedule, armDownAt, playLetter, DOT_S, DASH_S, SYMBOL_GAP_S } from '../src/audio/sequencer.js';
import { createReplayCounter, replayLabel } from '../src/core/receive.js';
import { createAudioEngine } from '../src/audio/engine.js';

const close = (a, b) => Math.abs(a - b) < 1e-9;

test('sequencer: dot 120 ms, dash 360 ms, 120 ms between symbols [R4.1]', () => {
  const s = letterSchedule('.-', 10);
  assert.ok(close(s[0].start, 10) && close(s[0].end, 10 + DOT_S));
  assert.ok(close(s[1].start, 10 + DOT_S + SYMBOL_GAP_S));
  assert.ok(close(s[1].end - s[1].start, DASH_S));
  assert.equal(DOT_S, 0.12);
  assert.equal(DASH_S, 0.36);
  assert.equal(SYMBOL_GAP_S, 0.12);
});

test('sequencer: the arm is down only while a tone sounds', () => {
  const s = letterSchedule('..', 0);
  assert.equal(armDownAt(s, 0.05), true);
  assert.equal(armDownAt(s, 0.18), false);
  assert.equal(armDownAt(s, 0.3), true);
  assert.equal(armDownAt(s, 0.5), false);
});

// Small fake Web Audio, enough to schedule one letter.
function fakeCtx() {
  const param = () => ({ value: 0, events: [], setValueAtTime(v, t) { this.events.push(['set', v, t]); }, linearRampToValueAtTime(v, t) { this.events.push(['ramp', v, t]); }, setTargetAtTime() {} });
  const node = (k) => ({ k, connect(n) { return n; }, disconnect() {} });
  return {
    state: 'running', currentTime: 1, sampleRate: 8000, destination: node('dest'),
    createGain() { const n = node('gain'); n.gain = param(); return n; },
    createDynamicsCompressor() { return node('comp'); },
    createOscillator() { const n = node('osc'); n.frequency = param(); n.start = () => {}; n.stop = (t) => { n.stoppedAt = t; }; return n; },
    createBiquadFilter() { const n = node('bq'); n.frequency = param(); n.Q = param(); return n; },
    createBuffer(ch, len) { const d = new Float32Array(len); return { getChannelData: () => d, length: len }; },
    createBufferSource() { const n = node('src'); n.start = () => {}; return n; },
  };
}

test('sequencer: one letter is one voice, tones gate on and off at the schedule', () => {
  const engine = createAudioEngine({ createContext: fakeCtx });
  assert.equal(playLetter(engine, 'K'), null); // no sound before the first click
  engine.unlock();
  const h = playLetter(engine, 'K');
  assert.equal(h.schedule.length, 3);
  assert.equal(engine.activeVoices, 1);
  assert.ok(close(h.end, h.schedule[2].end));
  assert.equal(playLetter(engine, '?'), null);
});

test('replays: 3 per message in Night Shift, unlimited in Day Shift [R4.5]', () => {
  const n = createReplayCounter('night');
  assert.equal(replayLabel(n), 'Replay (3 left)');
  assert.ok(n.use() && n.use() && n.use());
  assert.equal(n.use(), false);
  assert.equal(n.canUse(), false);
  n.reset();
  assert.equal(n.left, 3);
  const d = createReplayCounter('day');
  for (let i = 0; i < 50; i++) assert.ok(d.use());
  assert.equal(replayLabel(d), 'Replay');
});
