// The unease that builds through a night in Night Shift [design 10, R6.7]. Pure.
// Steady sounds swell with the hours (wind, a second hum, the record's wobble), and occasional events
// come more and more often (the light stutters, the sounder clicks by itself, a knock far off).
// Progress is the game clock: 0 at 22:00, 1 at 06:00.

// Where each effect begins on Day 1. From there it grows, and is at full strength by dawn.
export const DREAD_FROM = { flicker: 0.15, wind: 0.3, hum: 0.5, warp: 0.55, phantom: 0.6, knock: 0.75 };
// How often the occasional events happen at full strength, per minute.
export const DREAD_RATE = { flicker: 2.5, phantom: 1.5, knock: 1.5 };
export const DAY2_SCALE = 0.7; // Day 2 starts each effect at 70% of Day 1's point
export const DREAD_GAP_S = 8; // the occasional events keep at least this far apart

// Day 3 is at full strength from 22:00.
export const fullFromStart = (day) => day >= 3;

export function dreadLevels(progress, { day = 1 } = {}) {
  const out = {};
  for (const [k, from] of Object.entries(DREAD_FROM)) {
    if (fullFromStart(day)) { out[k] = 1; continue; }
    const start = day === 2 ? from * DAY2_SCALE : from;
    out[k] = Math.min(1, Math.max(0, (progress - start) / (1 - start)));
  }
  return out;
}

export function createDread({ day = 1, rng = Math.random } = {}) {
  let sinceLast = Infinity;
  return {
    levels: (progress) => dreadLevels(progress, { day }),
    // `seconds` of real time passed at `progress`. `quiet`: the player is between letters, so a click or
    // a knock will not be taken for their own keying. Returns the events that happen now.
    tick(seconds, progress, { quiet = true } = {}) {
      const lv = dreadLevels(progress, { day });
      const s = Math.max(0, Math.min(1, Number(seconds) || 0));
      sinceLast += s;
      const out = [];
      if (sinceLast < DREAD_GAP_S) return out;
      const happens = (k) => rng() < DREAD_RATE[k] * lv[k] * s / 60;
      if (happens('flicker')) out.push({ type: 'flicker', strength: lv.flicker });
      else if (quiet && happens('phantom')) out.push({ type: 'phantom' });
      else if (quiet && happens('knock')) out.push({ type: 'knock' });
      if (out.length) sinceLast = 0;
      return out;
    },
  };
}
