import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HORROR_SOUNDS } from '../src/audio/horror-voices.js';
import { playStatic } from '../src/audio/voices.js';
import { CAPTIONS, captionFor, mountCaptions } from '../src/audio/captions.js';
import { createAudioEngine } from '../src/audio/engine.js';
import { EFFECTS } from '../src/director/horror.js';

function fakeCtx() {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = (k) => ({ k, out: [], dis: 0, connect(x) { this.out.push(x); return x; }, disconnect() { this.dis++; } });
  const src = (k) => { const n = node(k); n.start = () => { n.started = true; }; n.stop = (at) => { n.stopAt = at; }; return n; };
  return {
    state: 'running', currentTime: 0, sampleRate: 2000, destination: node('dest'),
    createGain() { const n = node('gain'); n.gain = param(); return n; },
    createDynamicsCompressor() { return node('comp'); },
    createOscillator() { const n = src('osc'); n.frequency = param(); return n; },
    createBiquadFilter() { const n = node('bq'); n.frequency = param(); n.Q = param(); return n; },
    createDelay() { const n = node('delay'); n.delayTime = param(); return n; },
    createBuffer(ch, len) { const d = new Float32Array(len); return { getChannelData: () => d, length: len }; },
    createBufferSource() { return src('src'); },
  };
}

test('horror sounds: one for every effect the director can fire [R6.1]', () => {
  for (const e of EFFECTS) assert.equal(typeof HORROR_SOUNDS[e], 'function', e);
});

test('horror sounds: each plays as one voice, starts, reaches the effects bus and frees its nodes', () => {
  const engine = createAudioEngine({ createContext: fakeCtx });
  for (const [name, play] of Object.entries({ ...HORROR_SOUNDS, static: playStatic })) {
    assert.equal(play(engine), null, `${name} before the first click`);
  }
  engine.unlock();
  const reaches = (n, target, seen = new Set()) => n === target || (!seen.has(n) && (seen.add(n), n.out.some((x) => reaches(x, target, seen))));
  for (const [name, play] of Object.entries({ ...HORROR_SOUNDS, static: playStatic })) {
    const before = engine.activeVoices;
    const v = play(engine);
    assert.ok(v && v.source.started, name);
    assert.equal(engine.activeVoices, before + 1, `${name} uses one voice`);
    assert.ok(reaches(v.source, engine.sfxBus), `${name} goes to the effects bus`);
    v.source.onended();
    assert.equal(engine.activeVoices, before, `${name} frees its voice`);
    assert.ok(v.nodes.every((n) => n.dis > 0), `${name} disconnects its nodes`);
  }
});

test('captions: text for every sound, shown only when Captions is on [R10.3]', () => {
  for (const e of [...EFFECTS, 'static']) assert.match(captionFor(e), /^\[.+\]$/, e);
  assert.equal(CAPTIONS.thunder, '[thunder]');
  let on = false;
  const el = { className: '', textContent: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, classList: { set: new Set(), add(c) { this.set.add(c); }, remove(c) { this.set.delete(c); } } };
  const parent = { ownerDocument: { createElement: () => el }, append() {} };
  const c = mountCaptions(parent, { enabled: () => on });
  assert.equal(c.show('thunder'), false);
  assert.equal(el.textContent, '');
  on = true;
  assert.equal(c.show('thunder'), true);
  assert.equal(el.textContent, '[thunder]');
  assert.equal(el.attrs.role, 'status');
  c.clear();
});
