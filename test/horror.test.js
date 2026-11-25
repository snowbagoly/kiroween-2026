import { test } from 'node:test';
import assert from 'node:assert/strict';
import { intensityFor, gapFor, effectsFor, pickEffect, createHorrorDirector, EFFECTS } from '../src/director/horror.js';

test('director: intensity from the day and the lives left [design 10]', () => {
  assert.equal(intensityFor({ day: 1, mode: 'night', lives: 10, max: 10 }), 0.15);
  assert.equal(intensityFor({ day: 2, mode: 'night', lives: 10, max: 10 }), 0.45);
  assert.ok(Math.abs(intensityFor({ day: 1, mode: 'night', lives: 0, max: 10 }) - 0.45) < 1e-9);
  assert.equal(intensityFor({ day: 1, mode: 'deadair', lives: 5, max: 5 }), 0.8); // Dead Air: full from Day 1 [R16.1]
  assert.equal(intensityFor({ day: 3, mode: 'night', lives: 0, max: 10 }), 1);
  assert.equal(intensityFor({ day: 1, mode: 'night', override: 0.9 }), 0.9);
});

test('director: gaps shrink with intensity and never go under the minimum', () => {
  assert.ok(gapFor(0, 1, 'night') > gapFor(1, 1, 'night'));
  assert.equal(gapFor(1, 1, 'night'), 8000);
  assert.equal(gapFor(1, 3, 'night'), 4000);
  assert.equal(gapFor(1, 1, 'deadair'), 4000);
  assert.equal(gapFor(0, 1, 'night'), 20000);
});

test('director: Day 3 and Dead Air use every effect type [R6.7]', () => {
  assert.deepEqual(effectsFor(3, 'night'), EFFECTS);
  assert.deepEqual(effectsFor(1, 'deadair'), EFFECTS);
  assert.ok(effectsFor(1, 'night').length < EFFECTS.length);
});

test('director: screams and knocks get more likely as intensity rises', () => {
  const share = (i) => {
    let n = 0;
    for (let k = 0; k < 1000; k++) { const e = pickEffect(i, 3, 'night', k / 1000); if (e === 'scream' || e === 'knock') n++; }
    return n;
  };
  assert.ok(share(1) > share(0));
});

test('director: pause holds the time left, resume continues it', () => {
  let t = 0;
  const timers = [];
  const d = createHorrorDirector({ rng: () => 0, now: () => t, setTimer: (fn, ms) => { timers.push({ fn, at: t + ms }); return timers.length; }, clearTimer: (i) => { timers[i - 1].dead = true; } });
  d.start({ day: 2, mode: 'night', lives: 10, max: 10 });
  const due = d.dueAt;
  t = 1000; d.pause();
  t = 60000; d.resume();
  assert.equal(d.dueAt, 60000 + (due - 1000));
  d.stop();
  assert.equal(d.running, false);
});
