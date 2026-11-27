// Lives lost without a mistake, in Night Shift [design 7, R9.7f, R9.7h]. Pure.
// Idling: a message waits and nothing is keyed or typed for 6 s: one life, then one every 17 s.
// Late drain: past 04:00 with work left: one life every 20 s, every 10 s from 05:00.

export const IDLE_GRACE_MS = 6000;
export const IDLE_EVERY_MS = 17000;
export const LATE_FROM = 360; // 04:00, in minutes after 22:00
export const LATER_FROM = 420; // 05:00
export const LATE_EVERY_MS = 20000;
export const LATER_EVERY_MS = 10000;
const DRAIN_MAX_TICK_MS = 1000;

export const drainsLives = (mode) => mode === 'night';

export function createLifeDrain() {
  let idleMs = 0;
  let idleNext = IDLE_GRACE_MS;
  let lateMs = 0;

  return {
    // A press or a typed letter.
    input() { idleMs = 0; idleNext = IDLE_GRACE_MS; },
    reset() { idleMs = 0; idleNext = IDLE_GRACE_MS; lateMs = 0; },

    // `on`: the drain applies (mode, the clock started, not held). `waiting`: a message waits to be worked
    // on. `minutes`: the game clock. `allDone`: the day's work is finished. Returns the lives lost now.
    tick(realMs, { on = false, waiting = false, minutes = 0, allDone = false } = {}) {
      const ms = Math.max(0, Math.min(DRAIN_MAX_TICK_MS, Number(realMs) || 0));
      const lost = [];
      if (!on) return lost;
      if (waiting) {
        idleMs += ms;
        while (idleMs >= idleNext) { lost.push('idle'); idleNext += IDLE_EVERY_MS; }
      } else {
        idleMs = 0;
        idleNext = IDLE_GRACE_MS;
      }
      if (!allDone && minutes >= LATE_FROM) {
        lateMs += ms;
        const every = minutes >= LATER_FROM ? LATER_EVERY_MS : LATE_EVERY_MS;
        while (lateMs >= every) { lost.push('late'); lateMs -= every; }
      } else {
        lateMs = 0;
      }
      return lost;
    },
  };
}
