import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  accuracyOf, wpmOf, accuracyRank, speedRank, finalRank, createStats, compareStats, updateBest,
} from '../src/core/stats.js';
import { defaultData } from '../src/core/settings.js';

test('stats: accuracy rank boundaries', () => {
  assert.equal(accuracyRank(69.9), 'Apprentice');
  assert.equal(accuracyRank(70), 'Operator');
  assert.equal(accuracyRank(94.9), 'Operator');
  assert.equal(accuracyRank(95), 'Master');
});

test('stats: speed rank boundaries', () => {
  assert.equal(speedRank(2.9), 'Apprentice');
  assert.equal(speedRank(3), 'Operator');
  assert.equal(speedRank(5.9), 'Operator');
  assert.equal(speedRank(6), 'Master');
});

test('stats: final rank is the lower of the two', () => {
  assert.equal(finalRank(100, 2), 'Apprentice');
  assert.equal(finalRank(50, 10), 'Apprentice');
  assert.equal(finalRank(96, 4), 'Operator');
  assert.equal(finalRank(96, 7), 'Master');
});

test('stats: words per minute and accuracy', () => {
  assert.equal(wpmOf(25, 60000), 5);
  assert.equal(wpmOf(10, 0), 0);
  assert.equal(accuracyOf(9, 1), 90);
  assert.equal(accuracyOf(0, 0), 0);
});

test('stats: a day of play, pauses between messages do not count', () => {
  const s = createStats();
  s.input(1000); s.letterOk(2000); s.mistake(3000); s.letterOk(4000); s.letterOk(7000);
  s.messageDone();
  // 50 s break, not counted
  s.input(57000); s.letterOk(60000);
  s.messageDone();
  const r = s.summary(8);
  assert.equal(r.messages, 2);
  assert.equal(r.lettersCorrect, 4);
  assert.equal(r.mistakes, 1);
  assert.equal(r.longestStreak, 3);
  assert.equal(r.activeMs, 6000 + 3000);
  assert.equal(r.livesLeft, 8);
  assert.equal(r.accuracy, 80);
  assert.ok(Math.abs(r.wpm - (4 / 5) / (9000 / 60000)) < 1e-9);
});

test('stats: best compares rank, then accuracy, then speed', () => {
  const a = { rank: 'Operator', accuracy: 80, wpm: 5 };
  assert.ok(compareStats({ ...a, rank: 'Master', accuracy: 10 }, a) > 0);
  assert.ok(compareStats({ ...a, accuracy: 81, wpm: 1 }, a) > 0);
  assert.ok(compareStats({ ...a, wpm: 6 }, a) > 0);
  assert.equal(compareStats(a, { ...a }), 0);
});

test('stats: updateBest keeps the better one per mode', () => {
  let d = defaultData();
  const good = { rank: 'Operator', accuracy: 90, wpm: 4 };
  d = updateBest(d, 'night', good);
  assert.deepEqual(d.best.night, good);
  const worse = updateBest(d, 'night', { ...good, accuracy: 80 });
  assert.equal(worse, d);
  d = updateBest(d, 'night', { ...good, rank: 'Master' });
  assert.equal(d.best.night.rank, 'Master');
  assert.equal(d.best.day, null);
});
