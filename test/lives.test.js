import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLives, maxLivesFor } from '../src/core/lives.js';
import { needleAngle, trembleFor, livesLabel, dialSvg } from '../src/ui/galvanometer.js';

test('lives: 10 in Night and Day Shift, 5 in Dead Air', () => {
  assert.equal(maxLivesFor('night'), 10);
  assert.equal(maxLivesFor('day'), 10);
  assert.equal(maxLivesFor('deadair'), 5);
  assert.equal(createLives().lives, 10);
});

test('lives: loss, game over at 0, never below 0', () => {
  const l = createLives(2);
  assert.deepEqual(l.loseLife(), { lives: 1, dead: false });
  assert.deepEqual(l.loseLife(), { lives: 0, dead: true });
  assert.deepEqual(l.loseLife(), { lives: 0, dead: true });
});

test('lives: 3 clean messages refill one, a mistake resets the streak, caps at max', () => {
  const l = createLives(10);
  l.loseLife(); l.loseLife();
  l.messageDone(true); l.messageDone(true);
  l.messageDone(false);
  assert.equal(l.lives, 8);
  l.messageDone(true); l.messageDone(true);
  assert.deepEqual(l.messageDone(true), { lives: 9, refilled: true });
  for (let i = 0; i < 6; i++) l.messageDone(true);
  assert.equal(l.lives, 10);
  const d = createLives(5);
  for (let i = 0; i < 9; i++) d.messageDone(true);
  assert.equal(d.lives, 5);
});

test('lives: reset gives full lives and clears the streak', () => {
  const l = createLives(5);
  l.loseLife(); l.messageDone(true);
  l.reset();
  assert.equal(l.lives, 5);
  assert.equal(l.cleanStreak, 0);
});

test('galvanometer: needle moves one equal step per life, top at full, red zone at 0', () => {
  for (const max of [10, 5]) {
    assert.equal(needleAngle(max, max), 0);
    const step = needleAngle(max - 1, max);
    for (let l = max; l >= 1; l--) assert.ok(Math.abs(needleAngle(l, max) - (max - l) * step) < 1e-9);
    assert.equal(needleAngle(1, max), 135);
    assert.ok(needleAngle(0, max) > 140);
  }
});

test('galvanometer: trembles more near the red zone, not at all near the top', () => {
  assert.equal(trembleFor(10, 10), 0);
  assert.equal(trembleFor(7, 10), 0);
  let last = 0;
  for (let l = 6; l >= 0; l--) {
    const t = trembleFor(l, 10);
    assert.ok(t >= last, `lives ${l}`);
    last = t;
  }
  assert.ok(trembleFor(1, 10) > 0);
});

test('galvanometer: screen reader label and step marks', () => {
  assert.equal(livesLabel(3, 10), '3 of 10 lives');
  const ticks = (svg) => (svg.match(/class="g-ticks" d="([^"]*)"/)[1].match(/M/g) ?? []).length;
  assert.equal(ticks(dialSvg(10)), 10);
  assert.equal(ticks(dialSvg(5)), 5);
});
