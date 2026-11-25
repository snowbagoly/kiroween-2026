// Receiving rules that are not about letters: replays and waiting [design 5 Receiving, R4.3 to R4.5a].
// The letters themselves are checked by core/game.js.

export const NIGHT_REPLAYS = 3; // per message, Night Shift and Dead Air
export const NEXT_LETTER_PAUSE_MS = 400; // after a right letter
export const IDLE_REPLAY_MS = 15000; // no input for this long: play the letter again once

export const replayLimit = (mode) => (mode === 'day' ? Infinity : NIGHT_REPLAYS);

// Counts the player's Replay presses for one message. Free replays (after a mistake, after
// 15 s) do not use it.
export function createReplayCounter(mode) {
  let left = replayLimit(mode);
  return {
    get left() { return left; },
    get unlimited() { return left === Infinity; },
    canUse() { return left > 0; },
    use() {
      if (left <= 0) return false;
      left -= 1;
      return true;
    },
    reset() { left = replayLimit(mode); },
  };
}

export function replayLabel(counter) {
  if (counter.unlimited) return 'Replay';
  return `Replay (${counter.left} left)`;
}
