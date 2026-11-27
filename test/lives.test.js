import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLives, maxLivesFor } from '../src/core/lives.js';
import { livesLabel } from '../src/office/galvanometer.js';

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

test('galvanometer: screen reader label', () => {
  assert.equal(livesLabel(3, 10), '3 of 10 lives');
});
