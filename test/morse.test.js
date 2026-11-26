import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MORSE, classifyPress, isLetterGap, encode, decode, decodePresses } from '../src/core/morse.js';

const EXPECTED = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
  J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
};

test('morse: table has all 26 letters with the right patterns', () => {
  assert.deepEqual(MORSE, EXPECTED);
});

for (const [letter, pattern] of Object.entries(EXPECTED)) {
  test(`morse: ${letter} ${pattern} encodes and decodes`, () => {
    assert.equal(encode(letter), pattern);
    assert.equal(encode(letter.toLowerCase()), pattern);
    assert.equal(decode(pattern), letter);
  });
}

test('morse: for a new player, 239 ms is a dot and 240 ms is a dash', () => {
  assert.equal(classifyPress(239), '.');
  assert.equal(classifyPress(240), '-');
});

test('morse: for a new player, a 719 ms gap keeps the letter open and 720 ms ends it', () => {
  assert.equal(isLetterGap(719), false);
  assert.equal(isLetterGap(720), true);
  assert.deepEqual(decodePresses([{ ms: 100, gapAfter: 719 }, { ms: 400, gapAfter: 720 }]).map((r) => r.letter), ['A']);
  assert.deepEqual(decodePresses([{ ms: 100, gapAfter: 720 }, { ms: 400, gapAfter: 720 }]).map((r) => r.letter), ['E', 'T']);
});

test('morse: patterns longer than 4 are wrong', () => {
  assert.equal(decode('.....'), null);
  assert.equal(decode('-----'), null);
  const r = decodePresses(Array.from({ length: 5 }, () => ({ ms: 100, gapAfter: 100 })));
  assert.deepEqual(r, [{ pattern: '.....', letter: null }]);
});

test('morse: unknown and junk input gives null', () => {
  for (const p of ['', '..--', '.-.-', 'abc', null, undefined, 42, {}]) assert.equal(decode(p), null);
  assert.equal(encode('1'), null);
  assert.equal(encode(null), null);
  assert.deepEqual(decodePresses([]), []);
  assert.equal(decode('constructor'), null);
});
