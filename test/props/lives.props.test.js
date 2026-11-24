import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createLives } from '../../src/core/lives.js';
import { RUNS } from './arbitraries.js';

// A random run: each step is a mistake, or a finished message that is clean or not.
const step = fc.constantFrom('mistake', 'clean', 'dirty');
const run = fc.array(step, { maxLength: 80 });
const max = fc.constantFrom(10, 5);

test('R5.4: lives stay between 0 and the max, refill exactly after each run of 3 clean messages', () => {
  fc.assert(fc.property(max, run, (m, steps) => {
    const l = createLives(m);
    let streak = 0;
    let expected = m;
    for (const s of steps) {
      if (l.dead) break;
      if (s === 'mistake') { l.loseLife(); expected = Math.max(0, expected - 1); continue; }
      const { refilled } = l.messageDone(s === 'clean');
      streak = s === 'clean' ? streak + 1 : 0;
      let should = false;
      if (streak === 3) { streak = 0; should = expected < m; if (should) expected += 1; }
      assert.equal(refilled, should);
      assert.ok(l.lives >= 0 && l.lives <= m);
      assert.equal(l.lives, expected);
    }
  }), RUNS);
});

test('R5.5: dead is true exactly when lives reach 0', () => {
  fc.assert(fc.property(max, run, (m, steps) => {
    const l = createLives(m);
    for (const s of steps) {
      if (s === 'mistake') {
        const r = l.loseLife();
        assert.equal(r.dead, r.lives === 0);
      } else l.messageDone(s === 'clean');
      assert.equal(l.dead, l.lives === 0);
    }
  }), RUNS);
});
