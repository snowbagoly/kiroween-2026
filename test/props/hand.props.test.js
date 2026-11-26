// Property tests for the learned hand [T33, design 16, R3.3].
import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createHand, MIN_DASH_RATIO, LETTER_GAP_RANGE } from '../../src/core/hand.js';
import { RUNS } from './arbitraries.js';

const presses = fc.array(fc.integer({ min: 0, max: 5000 }), { maxLength: 60 });

test('R3.3: for any hand, a press below its line is a dot and at or above it a dash', () => {
  fc.assert(fc.property(presses, fc.integer({ min: 0, max: 5000 }), (before, ms) => {
    const h = createHand();
    before.forEach((p) => h.classify(p));
    const line = h.threshold;
    assert.equal(h.classify(ms), ms >= line ? '-' : '.');
  }), RUNS);
});

test('R3.3: a steady hand is learned, its line lies between its dot and its dash', () => {
  fc.assert(fc.property(fc.integer({ min: 60, max: 300 }), fc.double({ min: 2.5, max: 4, noNaN: true }), fc.array(fc.double({ min: -0.1, max: 0.1, noNaN: true }), { minLength: 20, maxLength: 20 }), (d, ratio, jitter) => {
    const h = createHand();
    jitter.forEach((j, i) => h.classify((i % 2 ? d * ratio : d) * (1 + j)));
    assert.ok(h.threshold > d && h.threshold < d * ratio, `${d} ${ratio} -> ${h.threshold}`);
  }), RUNS);
});

test('R3.3: for any presses, the dash stays at least 1.8 times the dot, and nothing is NaN', () => {
  fc.assert(fc.property(presses, (list) => {
    const h = createHand();
    list.forEach((p) => h.classify(p));
    assert.ok(Number.isFinite(h.dot) && Number.isFinite(h.dash));
    assert.ok(h.dash >= h.dot * MIN_DASH_RATIO - 1e-9, `${h.dot} ${h.dash}`);
  }), RUNS);
});

test('Glossary: the letter gap is always from 450 to 1600 ms', () => {
  fc.assert(fc.property(presses, (list) => {
    const h = createHand();
    list.forEach((p) => h.classify(p));
    assert.ok(h.letterGap >= LETTER_GAP_RANGE[0] && h.letterGap <= LETTER_GAP_RANGE[1]);
  }), RUNS);
});
