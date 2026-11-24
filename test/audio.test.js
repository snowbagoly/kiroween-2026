import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioEngine, MAX_VOICES } from '../src/audio/engine.js';
import { playTone } from '../src/audio/voices.js';

// Minimal fake Web Audio, enough to check wiring and the voice budget.
function fakeContext() {
  const param = (v = 1) => ({
    value: v, target: v,
    setTargetAtTime(x) { this.target = x; },
    setValueAtTime() {}, linearRampToValueAtTime() {},
  });
  const node = (kind) => ({
    kind, out: [], disconnected: false,
    connect(n) { this.out.push(n); return n; },
    disconnect() { this.disconnected = true; },
  });
  const ctx = {
    state: 'suspended', currentTime: 0, made: 0, resumed: 0,
    destination: node('destination'),
    resume() { this.resumed++; this.state = 'running'; },
    createGain() { const n = node('gain'); n.gain = param(1); return n; },
    createDynamicsCompressor() { return node('comp'); },
    createOscillator() {
      const n = node('osc'); n.frequency = param(440); n.started = false;
      n.start = () => { n.started = true; }; n.stop = () => {};
      return n;
    },
  };
  return ctx;
}

function setup(opts = {}) {
  let made = 0; let ctx;
  const engine = createAudioEngine({ createContext: () => { made++; ctx = fakeContext(); return ctx; }, ...opts });
  return { engine, ctxCount: () => made, ctx: () => ctx };
}

test('audio: no context and no sound before the first user event', () => {
  const { engine, ctxCount } = setup();
  assert.equal(engine.ready, false);
  assert.equal(playTone(engine, { duration: 0.1 }), null);
  assert.equal(ctxCount(), 0);
});

test('audio: unlock makes one context, resumes it, and wires buses to the speakers', () => {
  const { engine, ctxCount, ctx } = setup();
  engine.unlock(); engine.unlock();
  assert.equal(ctxCount(), 1);
  assert.equal(ctx().state, 'running');
  const comp = engine.sfxBus.out[0];
  assert.equal(comp.kind, 'comp');
  assert.equal(engine.musicBus.out[0], comp);
  assert.equal(comp.out[0].out[0], ctx().destination);
});

test('audio: attachUnlock unlocks on a user event', () => {
  const { engine } = setup();
  const listeners = {};
  engine.attachUnlock({ addEventListener: (n, f) => { listeners[n] = f; }, removeEventListener() {} });
  assert.equal(engine.ready, false);
  listeners.pointerdown();
  assert.equal(engine.ready, true);
});

test('audio: 600 Hz tone goes through the effects bus', () => {
  const { engine } = setup();
  engine.unlock();
  const v = playTone(engine, { duration: 0.2 });
  assert.equal(v.source.frequency.value, 600);
  assert.equal(v.source.out[0].out[0], engine.sfxBus);
  assert.equal(v.source.started, true);
});

test('audio: mute and both volumes, set before and after unlock', () => {
  const { engine } = setup({ music: 0.5, sfx: 0.3 });
  engine.setMuted(true);
  engine.unlock();
  assert.equal(engine.musicBus.gain.value, 0.5);
  assert.equal(engine.sfxBus.gain.value, 0.3);
  const master = engine.sfxBus.out[0].out[0];
  assert.equal(master.gain.value, 0);
  engine.setMuted(false); assert.equal(master.gain.target, 1);
  engine.setSfxVolume(0.9); assert.equal(engine.sfxBus.gain.target, 0.9);
  engine.setMusicVolume(2); assert.equal(engine.musicBus.gain.target, 1);
  engine.setMusicVolume(-1); assert.equal(engine.musicBus.gain.target, 0);
});

test('audio: voice budget of 8, nodes freed when a voice ends', () => {
  const { engine } = setup();
  engine.unlock();
  const voices = [];
  for (let i = 0; i < 12; i++) voices.push(playTone(engine, { duration: 1 }));
  assert.equal(voices.filter(Boolean).length, MAX_VOICES);
  assert.equal(engine.activeVoices, 8);
  voices[0].source.onended();
  assert.equal(engine.activeVoices, 7);
  assert.equal(voices[0].nodes[0].disconnected, true);
  assert.equal(voices[0].source.disconnected, true);
  assert.notEqual(playTone(engine, { duration: 1 }), null);
});

test('audio: held tone stops on stop()', () => {
  const { engine } = setup();
  engine.unlock();
  const v = playTone(engine);
  let stoppedAt = null;
  v.source.stop = (t) => { stoppedAt = t; };
  v.stop(); v.stop();
  assert.ok(stoppedAt > 0);
});
