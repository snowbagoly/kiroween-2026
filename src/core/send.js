// Send flow for one message: compare each decoded letter with the expected one [R3.4, R3.5, R3.6, R3.7].
// Emits LETTER_OK, LETTER_WRONG and MESSAGE_SENT on the bus. Lives are handled by core/lives.js later.

export function createSendFlow(text, bus) {
  const letters = String(text).toUpperCase().replace(/[^A-Z]/g, '').split('');
  let index = 0;
  let mistakes = 0;

  return {
    get index() { return index; },
    get expected() { return letters[index] ?? null; },
    get done() { return index >= letters.length; },
    get mistakes() { return mistakes; },
    letters,

    // `result` is { pattern, letter } from the press reader.
    letter(result) {
      if (index >= letters.length) return null;
      const expected = letters[index];
      if (result.letter === expected) {
        bus.emit('LETTER_OK', { index, letter: expected, pattern: result.pattern });
        index += 1;
        if (index >= letters.length) bus.emit('MESSAGE_SENT', { text: letters.join(''), mistakes });
        return true;
      }
      mistakes += 1;
      bus.emit('LETTER_WRONG', { index, expected, got: result.letter, pattern: result.pattern });
      return false; // same letter again
    },
  };
}
