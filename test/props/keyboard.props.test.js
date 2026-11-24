import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createPressReader, attachKeyboard } from '../../src/input/keyboard.js';
import { RUNS } from './arbitraries.js';

test('R3.8: any number of repeat keydowns between keydown and keyup gives exactly one symbol', () => {
  fc.assert(fc.property(fc.integer({ min: 0, max: 200 }), fc.array(fc.integer({ min: 1, max: 50 }), { maxLength: 200 }), (repeats, steps) => {
    let now = 0;
    const symbols = [];
    const reader = createPressReader({
      clock: { now: () => now }, setTimer: () => 1, clearTimer: () => {},
      onSymbol: ({ symbol }) => symbols.push(symbol),
    });
    const l = {};
    attachKeyboard({ addEventListener: (n, f) => { l[n] = f; } }, reader);
    const ev = (repeat) => ({ code: 'Space', key: ' ', repeat });
    l.keydown(ev(false));
    for (let i = 0; i < repeats; i++) { now += steps[i % (steps.length || 1)] ?? 30; l.keydown(ev(true)); }
    l.keyup(ev(false));
    assert.equal(symbols.length, 1);
    assert.equal(symbols[0], now < 300 ? '.' : '-');
  }), RUNS);
});
