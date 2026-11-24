// Morse letter table, press and gap rules, decoder [design 5, R3.3, R3.4].

export const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
  J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
};

export const DASH_MIN_MS = 300; // a press this long or longer is a dash
export const LETTER_GAP_MS = 700; // a pause this long or longer ends the letter
export const MAX_SYMBOLS = 4; // no letter has more than 4 symbols

const LETTER_OF = Object.fromEntries(Object.entries(MORSE).map(([l, p]) => [p, l]));

export function classifyPress(ms) {
  return ms < DASH_MIN_MS ? '.' : '-';
}

export function isLetterGap(ms) {
  return ms >= LETTER_GAP_MS;
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
export function decodePresses(presses) {
  const out = [];
  let pattern = '';
  const finish = () => {
    if (pattern) out.push({ pattern, letter: decode(pattern) });
    pattern = '';
  };
  for (const p of presses ?? []) {
    pattern += classifyPress(p?.ms);
    if (pattern.length > MAX_SYMBOLS) finish();
    else if (isLetterGap(p?.gapAfter)) finish();
  }
  finish();
  return out;
}
