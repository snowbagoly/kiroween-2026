// Sending input: Space down and up become dots and dashes, then letters [design 5, R3.2, R3.3, R3.4, R3.8].
// No browser calls in the press reader: the clock and timers are passed in, so tests can drive it.
import { classifyPress, decode, LETTER_GAP_MS, MAX_SYMBOLS } from '../core/morse.js';

// Shared by keyboard and touch: both call pressStart() and pressEnd().
export function createPressReader({
  clock = { now: () => performance.now() },
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
  onPressStart = () => {},
  onPressEnd = () => {},
  onSymbol = () => {},
  onLetter = () => {},
} = {}) {
  let t0 = null;
  let pattern = '';
  let timer = null;

  function stopTimer() {
    if (timer !== null) clearTimer(timer);
    timer = null;
  }

  function finishLetter() {
    stopTimer();
    if (!pattern) return;
    const p = pattern;
    pattern = '';
    onLetter({ pattern: p, letter: decode(p) });
  }

  return {
    get pressing() { return t0 !== null; },
    get pattern() { return pattern; },

    pressStart() {
      if (t0 !== null) return false; // already down: a repeat, ignore it
      stopTimer();
      t0 = clock.now();
      onPressStart();
      return true;
    },

    pressEnd() {
      if (t0 === null) return null;
      const ms = clock.now() - t0;
      t0 = null;
      const symbol = classifyPress(ms);
      pattern += symbol;
      onPressEnd({ ms, symbol });
      onSymbol({ symbol, pattern });
      if (pattern.length > MAX_SYMBOLS) finishLetter(); // no letter is this long: wrong at once
      else timer = setTimer(finishLetter, LETTER_GAP_MS);
      return symbol;
    },

    // Window lost focus: drop the running press so the key never sticks.
    cancel() {
      if (t0 === null) return;
      t0 = null;
      onPressEnd({ ms: 0, symbol: null, cancelled: true });
      if (pattern) timer = setTimer(finishLetter, LETTER_GAP_MS);
    },

    // Clears everything, for a new message or screen.
    reset() {
      stopTimer();
      t0 = null;
      pattern = '';
    },
  };
}

// Wires Space on a window-like target to a press reader. Returns a function that removes the listeners.
export function attachKeyboard(target, reader, { enabled = () => true } = {}) {
  const isSpace = (e) => e.code === 'Space' || e.key === ' ';
  const down = (e) => {
    if (!isSpace(e)) return;
    if (!enabled() && !reader.pressing) return; // let Space work on buttons when not sending
    e.preventDefault?.(); // no page scroll
    if (e.repeat || !enabled()) return; // a held key sends many keydowns [R3.8]
    reader.pressStart();
  };
  const up = (e) => {
    if (!isSpace(e)) return;
    if (!reader.pressing) return;
    e.preventDefault?.();
    reader.pressEnd();
  };
  const blur = () => reader.cancel();
  target.addEventListener('keydown', down);
  target.addEventListener('keyup', up);
  target.addEventListener('blur', blur);
  return () => {
    target.removeEventListener('keydown', down);
    target.removeEventListener('keyup', up);
    target.removeEventListener('blur', blur);
  };
}
