import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { encode, decode, classifyPress, decodePresses, MAX_SYMBOLS } from '../../src/core/morse.js';
import { RUNS, letter, pressMs, pressList, junk } from './arbitraries.js';

test('R3.4: encode then decode gives the same letter', () => {
  fc.assert(fc.property(letter, (l) => decode(encode(l)) === l), RUNS);
});

test('R3: random presses never throw, and patterns over 4 symbols are always wrong', () => {
  fc.assert(fc.property(pressList, (list) => {
    const out = decodePresses(list);
    for (const r of out) {
      assert.ok(r.pattern.length >= 1 && r.pattern.length <= MAX_SYMBOLS + 1);
      if (r.pattern.length > MAX_SYMBOLS) assert.equal(r.letter, null);
      if (r.letter !== null) assert.equal(encode(r.letter), r.pattern);
    }
    assert.equal(out.reduce((n, r) => n + r.pattern.length, 0), list.length);
  }), RUNS);
  fc.assert(fc.property(junk, (x) => { decode(x); decodePresses(Array.isArray(x) ? x : []); }), RUNS);
});

test('R3.3: under 300 ms is a dot, 300 ms or more is a dash, whatever came before', () => {
  fc.assert(fc.property(pressList, pressMs, (before, ms) => {
    const all = decodePresses([...before.map((p) => ({ ...p, gapAfter: 1000 })), { ms, gapAfter: 1000 }]);
    const last = all.at(-1).pattern;
    assert.equal(last, ms < 300 ? '.' : '-');
    assert.equal(classifyPress(ms), last);
  }), RUNS);
});
