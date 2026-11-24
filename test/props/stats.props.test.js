import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { accuracyOf, wpmOf, accuracyRank, speedRank, finalRank, rankLevel, createStats } from '../../src/core/stats.js';
import { RUNS } from './arbitraries.js';

const count = fc.integer({ min: 0, max: 10000 });
const ms = fc.integer({ min: 0, max: 60 * 60 * 1000 });
const pct = fc.double({ min: 0, max: 100, noNaN: true });
const wpm = fc.double({ min: 0, max: 60, noNaN: true });

test('R8.1: accuracy is always 0 to 100 and nothing is ever NaN', () => {
  fc.assert(fc.property(count, count, ms, (ok, bad, t) => {
    const a = accuracyOf(ok, bad);
    const w = wpmOf(ok, t);
    assert.ok(a >= 0 && a <= 100);
    assert.ok(Number.isFinite(a) && Number.isFinite(w) && w >= 0);
  }), RUNS);
});

test('R8.1: a random day of play gives a clean summary', () => {
  const ev = fc.array(fc.record({ kind: fc.constantFrom('input', 'ok', 'bad', 'done'), gap: fc.integer({ min: 0, max: 5000 }) }), { maxLength: 100 });
  fc.assert(fc.property(ev, (list) => {
    const s = createStats();
    let t = 0;
    for (const e of list) {
      t += e.gap;
      if (e.kind === 'input') s.input(t);
      else if (e.kind === 'ok') s.letterOk(t);
      else if (e.kind === 'bad') s.mistake(t);
      else s.messageDone();
    }
    const r = s.summary(3);
    for (const v of Object.values(r)) if (typeof v === 'number') assert.ok(Number.isFinite(v));
    assert.ok(r.accuracy >= 0 && r.accuracy <= 100);
    assert.ok(r.longestStreak <= r.lettersCorrect);
    assert.ok(r.activeMs <= t);
  }), RUNS);
});

test('R8.2: the final rank is never above either part', () => {
  fc.assert(fc.property(pct, wpm, (p, w) => {
    const r = rankLevel(finalRank(p, w));
    assert.ok(r <= rankLevel(accuracyRank(p)));
    assert.ok(r <= rankLevel(speedRank(w)));
  }), RUNS);
});

test('R8.2: the rank never drops when accuracy or speed rises', () => {
  fc.assert(fc.property(pct, pct, wpm, wpm, (p1, p2, w1, w2) => {
    const [lowP, highP] = p1 <= p2 ? [p1, p2] : [p2, p1];
    const [lowW, highW] = w1 <= w2 ? [w1, w2] : [w2, w1];
    assert.ok(rankLevel(finalRank(highP, highW)) >= rankLevel(finalRank(lowP, lowW)));
    assert.ok(rankLevel(finalRank(highP, lowW)) >= rankLevel(finalRank(lowP, lowW)));
    assert.ok(rankLevel(finalRank(lowP, highW)) >= rankLevel(finalRank(lowP, lowW)));
  }), RUNS);
});
