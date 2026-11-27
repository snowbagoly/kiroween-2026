import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { buildDay, checkDay } from '../../src/core/messages.js';
import { createRng } from '../../src/core/rng.js';
import { seed, day, mode } from './arbitraries.js';

const SEEDS = { numRuns: 1000 };
const lens = (list) => list.map((m) => m.letters.length);

test('R9.2, R6.3, R6.7, R16.1: every built day obeys every rule, for 1000 seeds', () => {
  fc.assert(fc.property(seed, day, mode, (s, d, m) => {
    const list = buildDay(d, m, createRng(s));
    assert.deepEqual(checkDay(list, d, m), []);
    const n = lens(list);
    assert.ok(list.some((x) => x.letters.length <= 10) && list.some((x) => x.letters.length >= 20));
    assert.notDeepEqual(n, [...n].sort((a, b) => a - b));
    assert.notDeepEqual(n, [...n].sort((a, b) => b - a));
    assert.equal(new Set(list.map((x) => x.id)).size, 5);
    const strange = list.filter((x) => x.strange).length;
    if (m === 'day') assert.equal(strange, 0);
    else if (d === 3) assert.ok(strange >= 3);
    else if (d === 2) assert.ok(strange >= 2);
    else { assert.equal(strange, 1); assert.equal(list[4].strange, true); }
    if (d === 3) {
      const send = list.filter((x) => x.role === 'send').length;
      assert.ok(send >= 2 && 5 - send >= 2);
    }
  }), SEEDS);
});

test('R7.2: Day Shift days never contain a strange message', () => {
  fc.assert(fc.property(seed, day, (s, d) => buildDay(d, 'day', createRng(s)).every((x) => !x.strange)), SEEDS);
});

test('buildDay with the same seed gives the same result', () => {
  fc.assert(fc.property(seed, day, mode, (s, d, m) => {
    assert.deepEqual(buildDay(d, m, createRng(s)), buildDay(d, m, createRng(s)));
  }), SEEDS);
});
