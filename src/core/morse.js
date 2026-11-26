// Morse letter table, press and gap rules, decoder [design 5, R3.3, R3.4].
// The dot/dash line and the letter gap come from the player's hand (hand.js); without one, a new player's.
import { createHand } from './hand.js';

export const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
  J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
};

const NEW_HAND = createHand();
export const DASH_MIN_MS = NEW_HAND.threshold; // a new player's dot/dash line: 240 ms
export const LETTER_GAP_MS = NEW_HAND.letterGap; // a new player's letter gap: 720 ms
export const MAX_SYMBOLS = 4; // no letter has more than 4 symbols

const LETTER_OF = Object.fromEntries(Object.entries(MORSE).map(([l, p]) => [p, l]));

export function classifyPress(ms, threshold = DASH_MIN_MS) {
  return ms < threshold ? '.' : '-';
}

export function isLetterGap(ms, gap = LETTER_GAP_MS) {
  return ms >= gap;
}

export function encode(letter) {
  return typeof letter === 'string' ? MORSE[letter.toUpperCase()] ?? null : null;
}

// Returns the letter, or null when the pattern is wrong (unknown, empty, or too long).
export function decode(pattern) {
  if (typeof pattern !== 'string' || pattern.length === 0 || pattern.length > MAX_SYMBOLS) return null;
  return Object.hasOwn(LETTER_OF, pattern) ? LETTER_OF[pattern] : null;
}

// Turns a list of presses `{ ms, gapAfter }` into letters, the way the game reads them.
// A letter ends on a long gap or after the last press. A pattern longer than 4 symbols
// is wrong at once. Each result is `{ pattern, letter }`, with `letter: null` when wrong.
// With a hand, each press is read and learned the way the game does it.
export function decodePresses(presses, hand = null) {
  const out = [];
  let pattern = '';
  const finish = () => {
    if (pattern) out.push({ pattern, letter: decode(pattern) });
    pattern = '';
  };
  for (const p of presses ?? []) {
    pattern += hand ? hand.classify(p?.ms) : classifyPress(p?.ms);
    if (pattern.length > MAX_SYMBOLS) finish();
    else if (isLetterGap(p?.gapAfter, hand ? hand.letterGap : LETTER_GAP_MS)) finish();
  }
  finish();
  return out;
}
