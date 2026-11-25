// Tutorial: five handwritten sheets left by the operator before you [design 12, R2.2 to R2.4].
// Each sheet has one check. A failed check keeps the sheet and shows a hint. Nothing costs a life.

export const TUTORIAL_LETTER = 'A'; // sheet 3: send this
export const HEARD_LETTER = 'S'; // sheet 5: listen and type this

export const SHEETS = [
  {
    id: 'dot',
    kind: 'press',
    text: 'Welcome to the station. First things first: give the key a quick tap with Space. A short tap is a dot.',
    hint: 'That one was long. Try a quicker tap.',
  },
  {
    id: 'dash',
    kind: 'press',
    text: 'Good. Now hold Space down a little longer before you let go. That is a dash.',
    hint: 'That was a short one. Hold it a bit longer.',
  },
  {
    id: 'letter',
    kind: 'press',
    text: `Letters are dots and dashes put together. Send ${TUTORIAL_LETTER}, which is a dot and then a dash, and then stop for a moment. The pause tells the other end that the letter is done.`,
    hint: `That was not ${TUTORIAL_LETTER}. A dot, a dash, then wait.`,
  },
  {
    id: 'dial',
    kind: 'key',
    text: 'See the dial on the wall? The needle shows how many mistakes you can still afford. Every mistake knocks it down a step, and three clean messages in a row bring one back. Press any key when you have had a look.',
    hint: '',
  },
  {
    id: 'receive',
    kind: 'type',
    text: 'Messages come in too. The sounder will click out a letter, and you type the letter you hear. Look at the chart if you need to.',
    hint: 'Not quite. Listen again.',
  },
];

// The tutorial state for one run. Every method returns 'pass', 'fail' or null (not for this sheet).
export function createTutorial() {
  let index = 0;
  const step = (ok) => {
    if (index >= SHEETS.length) return null;
    if (!ok) return 'fail';
    index += 1;
    return 'pass';
  };
  const is = (id) => SHEETS[index]?.id === id;
  return {
    get index() { return index; },
    get sheet() { return SHEETS[index] ?? null; },
    get done() { return index >= SHEETS.length; },
    // A finished press, '.' or '-'.
    symbol(sym) {
      if (is('dot')) return step(sym === '.');
      if (is('dash')) return step(sym === '-');
      return null;
    },
    // A finished letter from the press reader (null when the pattern is no letter).
    letter(letter) {
      if (!is('letter')) return null;
      return step(letter === TUTORIAL_LETTER);
    },
    // Any key on the dial sheet.
    key() {
      if (!is('dial')) return null;
      return step(true);
    },
    // A typed letter on the receive sheet. Not case-sensitive.
    typed(letter) {
      if (!is('receive')) return null;
      return step(String(letter).toUpperCase() === HEARD_LETTER);
    },
  };
}
