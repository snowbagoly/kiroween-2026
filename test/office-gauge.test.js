// The office galvanometer's springy needle [T34, design 8, R5.1, R5.2].
import test from 'node:test';
import assert from 'node:assert/strict';
import { stepNeedle, needleMark, trembleAmount, STOP_LOW, STOP_HIGH } from '../src/office/galvanometer.js';
import { playTock } from '../src/audio/voices.js';

const run = (state, target, seconds, dt = 1 / 60) => {
  let s = state;
  const seen = [];
  for (let t = 0; t < seconds; t += dt) { s = stepNeedle(s, target, dt); seen.push(s.shown); }
  return { s, seen };
};

test('needle: settles on its mark after a lost life, swinging past it first', () => {
  const { s, seen } = run({ shown: 1, velocity: -1.2 }, 0.9, 3);
  assert.ok(Math.abs(s.shown - 0.9) < 0.002, String(s.shown));
  assert.ok(Math.min(...seen) < 0.9, 'it overshoots');
});

test('needle: never passes the stops, and bounces off the low one at zero lives', () => {
  const { s, seen } = run({ shown: 0.1, velocity: -9 }, needleMark(0, 10), 2);
  assert.ok(Math.min(...seen) >= STOP_LOW && Math.max(...seen) <= STOP_HIGH);
  assert.ok(seen.some((v, i) => i > 0 && v > seen[i - 1]), 'it bounces back up');
  assert.ok(Math.abs(s.shown - STOP_LOW) < 0.005);
});

test('needle: a long pause between frames does not throw it off the dial', () => {
  const s = stepNeedle({ shown: 1, velocity: 0 }, 0, 10);
  assert.ok(s.shown >= STOP_LOW && s.shown <= STOP_HIGH && Number.isFinite(s.velocity));
});

test('needle: its mark is lives over the maximum, and the stop at zero', () => {
  assert.equal(needleMark(10, 10), 1);
  assert.equal(needleMark(3, 5), 0.6);
  assert.equal(needleMark(0, 5), STOP_LOW);
});

test('needle: it trembles more the fewer lives are left', () => {
  assert.ok(trembleAmount(1, 10) > trembleAmount(5, 10));
  assert.ok(trembleAmount(5, 10) > trembleAmount(10, 10));
});

test('tock: plays through the engine as one voice', () => {
  let made = 0;
  const engine = { voice: (fn) => { made += 1; return fn; } };
  playTock(engine);
  assert.equal(made, 1);
});

test('stamp and rustle: each plays as one voice of the engine', async () => {
  const { playStamp, playRustle } = await import('../src/audio/voices.js');
  let made = 0;
  const engine = { voice: () => { made += 1; return null; } };
  playStamp(engine);
  playRustle(engine);
  assert.equal(made, 2);
});
