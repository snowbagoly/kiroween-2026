// The learned hand [T33, design 5, R3.3, R3.3a, R3.3b].
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHand, validHand, FIRST_HAND, LETTER_GAP_RANGE } from '../src/core/hand.js';
import { cleanData, setHand, defaultData } from '../src/core/settings.js';
import { createPressReader } from '../src/input/keyboard.js';

const keyed = (hand, list) => list.forEach((ms) => hand.classify(ms));

test("hand: a new player's line is 240 ms and the letter gap 720 ms", () => {
  const h = createHand();
  assert.equal(h.threshold, 240);
  assert.equal(h.letterGap, 720);
  assert.equal(h.wpm, 10); // one unit is 120 ms
  assert.equal(h.classify(239), '.');
  assert.equal(createHand().classify(240), '-');
});

test('hand: after 20 presses of 100 and 300 ms the line moves to 200 ms', () => {
  const h = createHand();
  keyed(h, Array.from({ length: 20 }, (_, i) => (i % 2 ? 300 : 100)));
  assert.equal(Math.round(h.dot), 100);
  assert.equal(Math.round(h.dash), 300);
  assert.equal(Math.round(h.threshold), 200);
  assert.equal(h.classify(190), '.');
});

test('hand: a slow hand gets a longer letter gap, never past 1600 ms', () => {
  const h = createHand();
  keyed(h, Array.from({ length: 20 }, (_, i) => (i % 2 ? 900 : 300)));
  assert.ok(h.letterGap > 720);
  const v = createHand();
  keyed(v, Array.from({ length: 20 }, (_, i) => (i % 2 ? 2000 : 1000)));
  assert.equal(v.letterGap, LETTER_GAP_RANGE[1]);
  const f = createHand();
  keyed(f, Array.from({ length: 20 }, (_, i) => (i % 2 ? 90 : 30)));
  assert.equal(f.letterGap, LETTER_GAP_RANGE[0]);
});

test('hand: one stray 2 s press does not throw it off', () => {
  const h = createHand();
  keyed(h, [...Array.from({ length: 19 }, (_, i) => (i % 2 ? 300 : 100)), 5000]);
  assert.ok(h.threshold < 260, String(h.threshold));
});

test('hand: only dots for a while still keeps dots and dashes apart', () => {
  const h = createHand();
  keyed(h, Array(20).fill(80));
  assert.ok(h.dash >= h.dot * 2);
  assert.equal(h.classify(80), '.');
});

test('hand: forget goes back to a new player', () => {
  const h = createHand({ dot: 200, dash: 600 });
  assert.equal(h.threshold, 400);
  h.forget();
  assert.equal(h.threshold, 240);
});

test('hand: a saved hand is used only when it makes sense', () => {
  assert.deepEqual(validHand({ dot: 100, dash: 300 }), { dot: 100, dash: 300 });
  for (const bad of [null, {}, { dot: NaN, dash: 300 }, { dot: 100, dash: 120 }, { dot: 5, dash: 300 }, { dot: 100, dash: 9000 }, { dot: '100', dash: 300 }]) {
    assert.equal(validHand(bad), null, JSON.stringify(bad));
  }
  assert.equal(createHand({ dot: 'x' }).threshold, (FIRST_HAND.dot + FIRST_HAND.dash) / 2);
});

test('settings: the hand is saved, and a broken one is dropped', () => {
  assert.equal(defaultData().hand, null);
  const d = setHand(defaultData(), { dot: 110, dash: 330 });
  assert.deepEqual(cleanData(JSON.parse(JSON.stringify(d))).hand, { dot: 110, dash: 330 });
  assert.equal(cleanData({ ...d, hand: { dot: -1, dash: 3 } }).hand, null);
  assert.equal(setHand(d, null).hand, null);
});

test("reader: the letter ends after the hand's own letter gap", () => {
  let now = 0;
  const timers = [];
  const letters = [];
  const hand = createHand({ dot: 200, dash: 600 }); // a slow hand: gap 800 ms
  const r = createPressReader({
    hand, clock: { now: () => now },
    setTimer: (fn, ms) => { timers.push({ fn, at: now + ms }); return timers.length; },
    clearTimer: (i) => { timers[i - 1] = null; },
    onLetter: (x) => letters.push(x.letter),
  });
  r.pressStart(); now += 300; r.pressEnd(); // under 400: a dot for this hand
  assert.equal(timers.at(-1).at - now, hand.letterGap);
  now = timers.at(-1).at;
  timers.at(-1).fn();
  assert.deepEqual(letters, ['E']);
});
