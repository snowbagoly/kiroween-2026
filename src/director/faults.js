// What a lost life does to the office, Night Shift and Dead Air [design 10, R6.4 to R6.4c]. Pure: it
// returns what should happen; main.js makes it seen and heard. It grows worse as lives fall, and eases
// as clean messages bring them back. Nothing here touches the key, the tape, the codebook or the form.

// Lives below which each later reaction joins in, out of 10 and out of 5 (Dead Air).
export const FAULT_MARKS = {
  10: { strain: 7, echo: 5, near: 3, omens: [7, 5, 3] },
  5: { strain: 4, echo: 3, near: 2, omens: [4, 3, 2] },
};
export const OMENS = ['blueFlame', 'heavyAir', 'recordSticks'];
export const OMEN_DELAY_MS = [2500, 5000];
export const OMEN_GAP_MS = 4000; // at least this long between two omens
export const CLOSING_DARK = 0.85; // how far the dark closes in on a line about to die

const marksFor = (max) => FAULT_MARKS[max] ?? FAULT_MARKS[10];

// How strained the line is, 0 (fine) to 1 (about to die): it starts at the strain mark.
export function strainLevel(lives, max) {
  const mark = marksFor(max).strain;
  return Math.min(1, Math.max(0, (mark - lives) / mark));
}

export function createFaults({ max = 10, rng = Math.random } = {}) {
  let passed = new Set();
  let warned = false;
  let unseen = [];
  let lastOmenAt = -Infinity;

  const api = {
    // A new day: no omens yet, whole glass [R6.4a, R6.4b].
    reset() {
      passed = new Set();
      warned = false;
      unseen = [...OMENS].sort(() => rng() - 0.5);
      lastOmenAt = -Infinity;
    },
    get warned() { return warned; },
    get unseen() { return [...unseen]; },

    // A life was lost. `kind`: 'letter' (a wrong letter), 'idle' or 'late'. `now`: ms clock.
    // Returns the actions, in order.
    lifeLost(lives, { kind = 'letter', now = 0 } = {}) {
      const m = marksFor(max);
      const severity = 1 - lives / max;
      const out = [];
      if (lives <= 0) return out; // the line snapping is its own scene
      const warning = lives <= 1 && !warned;
      out.push({ type: 'spit', severity });
      // On the last warning the room holds dim a moment longer, so the crack is seen forming.
      out.push({ type: 'gaze', severity, holdMs: warning ? 1300 : 700 });
      if (!warning) out.push({ type: 'stutter', strength: 0.15 + severity * 0.7, blackout: lives < m.near, knock: lives < m.near });
      if (kind === 'letter' && lives < m.echo) out.push({ type: 'echo', delayMs: 900 });
      out.push(...api.update(lives, { now }));
      return out;
    },

    // Follows the lives as the day runs: the strain, the dark from the corners, and the omens and
    // the last warning as marks are passed.
    update(lives, { now = 0 } = {}) {
      const m = marksFor(max);
      const level = strainLevel(lives, max);
      const out = [{ type: 'strain', level }, { type: 'closing', level: level * CLOSING_DARK }];
      for (const mark of m.omens) {
        if (lives <= mark && !passed.has(mark)) {
          passed.add(mark);
          const delay = OMEN_DELAY_MS[0] + rng() * (OMEN_DELAY_MS[1] - OMEN_DELAY_MS[0]);
          lastOmenAt = Math.max(now + delay, lastOmenAt + OMEN_GAP_MS);
          out.push({ type: 'omen', delayMs: lastOmenAt - now });
        }
      }
      if (lives === 1 && !warned) {
        warned = true;
        out.push({ type: 'lastWarning' });
      }
      return out;
    },

    // The next omen not yet seen today. A stuck record needs the music on to be heard.
    nextOmen({ music = true } = {}) {
      const i = unseen.findIndex((name) => name !== 'recordSticks' || music);
      return i === -1 ? null : unseen.splice(i, 1)[0];
    },
  };
  api.reset();
  return api;
}
