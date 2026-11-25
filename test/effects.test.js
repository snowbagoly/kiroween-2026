import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { mistakePlan, changesPerSecond, canFire, MAX_CHANGES_PER_S, FADE_MS } from '../src/ui/effects-fx.js';

test('effects: a mistake shows static and flicker [R6.4]', () => {
  const kinds = mistakePlan(false).map((s) => s.kind);
  assert.deepEqual(kinds, ['static', 'flicker']);
  assert.equal(mistakePlan(false)[0].durationMs, 300);
});

test('effects: "Reduce flashing" swaps them for one 600 ms fade with no sudden change [R6.6]', () => {
  const plan = mistakePlan(true);
  assert.deepEqual(plan.map((s) => s.kind), ['fade']);
  assert.equal(plan[0].durationMs, FADE_MS);
  assert.ok(changesPerSecond(plan) <= MAX_CHANGES_PER_S);
});

test('effects (property): with "Reduce flashing", any burst of mistakes never fades more than 3 times a second', () => {
  fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 400 }), { maxLength: 60 }), (gaps) => {
    let t = 0;
    let last = null;
    const starts = [];
    for (const gap of gaps) {
      t += gap;
      if (canFire(t, last, true)) { last = t; starts.push(t); }
    }
    for (let i = 0; i < starts.length; i++) {
      const inSecond = starts.filter((s) => s >= starts[i] && s < starts[i] + 1000).length;
      assert.ok(inSecond <= MAX_CHANGES_PER_S, `${inSecond} fades in one second`);
    }
  }), { numRuns: 200 });
});

test('effects: without "Reduce flashing" every mistake shows', () => {
  assert.equal(canFire(10, 5, false), true);
  assert.equal(canFire(10, 5, true), false);
  assert.equal(canFire(700, 50, true), true);
});
