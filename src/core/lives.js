// Lives, clean streak and refill [design 7, R5.1, R5.4, R5.5].
export const MAX_LIVES = 10;
export const DEAD_AIR_LIVES = 5;
export const REFILL_AFTER = 3; // clean messages in a row

export const maxLivesFor = (mode) => (mode === 'deadair' ? DEAD_AIR_LIVES : MAX_LIVES);

export function createLives(max = MAX_LIVES) {
  let lives = max;
  let cleanStreak = 0;
  return {
    get max() { return max; },
    get lives() { return lives; },
    get cleanStreak() { return cleanStreak; },
    get dead() { return lives === 0; },

    // One mistake. Lives never go below 0.
    loseLife() {
      lives = Math.max(0, lives - 1);
      return { lives, dead: lives === 0 };
    },

    // A message is finished. `clean` means no mistake in it.
    messageDone(clean) {
      let refilled = false;
      if (!clean) cleanStreak = 0;
      else if (++cleanStreak >= REFILL_AFTER) {
        cleanStreak = 0;
        if (lives > 0 && lives < max) { lives += 1; refilled = true; }
      }
      return { lives, refilled };
    },

    // Start of a day: full lives, streak cleared [R9.6].
    reset() { lives = max; cleanStreak = 0; },
    // Judge mode only: set lives directly, kept between 0 and max [R13.3d].
    set(n) { lives = Math.min(max, Math.max(0, Math.round(Number(n) || 0))); return lives; },
  };
}
