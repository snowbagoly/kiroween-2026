// Day statistics, words per minute and rank [design 7, R8.1, R8.2, R8.4].
// Times are passed in (milliseconds), so tests can drive the clock.

export const RANKS = ['Apprentice', 'Operator', 'Master'];
export const LETTERS_PER_WORD = 5;

const finite = (n) => (Number.isFinite(n) ? n : 0);

// Accuracy in percent, 0 to 100. Nothing tried yet counts as 0.
export function accuracyOf(lettersCorrect, mistakes) {
  const tries = finite(lettersCorrect) + finite(mistakes);
  if (tries <= 0) return 0;
  return Math.min(100, Math.max(0, (finite(lettersCorrect) / tries) * 100));
}

// Words per minute = (letters / 5) / active minutes. No active time counts as 0.
export function wpmOf(lettersCorrect, activeMs) {
  const minutes = finite(activeMs) / 60000;
  if (minutes <= 0) return 0;
  return Math.max(0, finite(lettersCorrect) / LETTERS_PER_WORD / minutes);
}

// Below 70 Apprentice, 70 up to (not including) 95 Operator, 95 or more Master.
export function accuracyRank(pct) {
  return pct >= 95 ? 'Master' : pct >= 70 ? 'Operator' : 'Apprentice';
}

// Below 3 Apprentice, 3 up to (not including) 6 Operator, 6 or more Master.
export function speedRank(wpm) {
  return wpm >= 6 ? 'Master' : wpm >= 3 ? 'Operator' : 'Apprentice';
}

export const rankLevel = (rank) => RANKS.indexOf(rank);

// The final rank is the lower of the two.
export function finalRank(pct, wpm) {
  return RANKS[Math.min(rankLevel(accuracyRank(pct)), rankLevel(speedRank(wpm)))];
}

export function createStats() {
  let messages = 0;
  let lettersCorrect = 0;
  let mistakes = 0;
  let streak = 0;
  let longestStreak = 0;
  let activeMs = 0;
  let msgStart = null; // first input of the current message
  let lastLetterAt = null; // last letter of the current message

  const touch = (t) => { if (msgStart === null) msgStart = t; };

  return {
    // Any key press or tap. Starts the active timer for this message.
    input(t) { touch(t); },

    letterOk(t) {
      touch(t);
      lettersCorrect += 1;
      lastLetterAt = t;
      streak += 1;
      longestStreak = Math.max(longestStreak, streak);
    },

    mistake(t) {
      touch(t);
      mistakes += 1;
      streak = 0;
    },

    // The last letter is done. Pauses between messages are not counted.
    messageDone() {
      if (msgStart !== null && lastLetterAt !== null) activeMs += Math.max(0, lastLetterAt - msgStart);
      messages += 1;
      msgStart = null;
      lastLetterAt = null;
    },

    // The numbers for the stats screen.
    summary(livesLeft = 0) {
      const accuracy = accuracyOf(lettersCorrect, mistakes);
      const wpm = wpmOf(lettersCorrect, activeMs);
      return {
        messages, lettersCorrect, mistakes, longestStreak, activeMs, livesLeft,
        accuracy, wpm, rank: finalRank(accuracy, wpm),
      };
    },
  };
}

// Best stats compare by rank first, then accuracy, then speed. Positive means `a` is better.
export function compareStats(a, b) {
  return (rankLevel(a.rank) - rankLevel(b.rank)) || (a.accuracy - b.accuracy) || (a.wpm - b.wpm);
}

// Returns new saved data with the best stats for `mode` updated when `stats` beats it.
export function updateBest(data, mode, stats) {
  const old = data.best?.[mode] ?? null;
  if (old && compareStats(stats, old) <= 0) return data;
  return { ...data, best: { ...data.best, [mode]: { ...stats } } };
}
