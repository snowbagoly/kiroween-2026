// The new operator's thoughts [design 6 Thoughts, R12.1 to R12.4a].
// At most 2 a day, at most 20 words each. A reaction shows only when the message fits it.
// Which thought, and when, is decided here; showing and fading is the page's job.
import { FACTS, wordCount, MAX_THOUGHT_WORDS } from './thoughts-data.js';

export const MAX_PER_DAY = 2;
export const SHOW_MS = 8000; // fades out by itself after 8 s [R12.3]
export const FACT_CHANCE = 0.35; // a message with no fitting reaction gets a fact this often

// Reactions to the message in front of him [R12.4a]. `fits(message)` says when one may show.
export const REACTIONS = [
  { id: 'rich-guy', trigger: 'long-message', text: 'Phew, that must be a rich guy!' },
  { id: 'savings', trigger: 'cryptic-message', text: 'I understand that you want to spare some money, but this message makes no sense anymore.' },
  { id: 'so-many-words', trigger: 'long-message', text: 'That is a lot of words. Somebody really had to say all of that.' },
  { id: 'need-a-list', trigger: 'cryptic-message', text: 'RECD, YRS, INST... I am going to need a list of these.' },
];

const TRIGGER_FITS = {
  'long-message': (m) => m?.length === 'long',
  'cryptic-message': (m) => m?.abbreviations === true,
};
export const fits = (reaction, message) => !!TRIGGER_FITS[reaction.trigger]?.(message);

export function createThoughts({ rng = Math.random } = {}) {
  let shownToday = 0;
  const usedReactions = new Set();
  const usedFacts = new Set();

  function nextFact() {
    if (usedFacts.size >= FACTS.length) usedFacts.clear(); // all told: start over
    const left = FACTS.filter((f) => !usedFacts.has(f.id));
    const f = left[Math.floor(rng() * left.length)];
    usedFacts.add(f.id);
    return f;
  }

  return {
    get shownToday() { return shownToday; },
    newDay() { shownToday = 0; },
    // Called when a message appears. Returns { id, kind, text } or null.
    // The caller must call `shown(thought)` when it really showed it (it may drop one if the player was busy).
    pick(message) {
      if (shownToday >= MAX_PER_DAY) return null;
      const fitting = REACTIONS.filter((r) => fits(r, message));
      const fresh = fitting.find((r) => !usedReactions.has(r.id));
      if (fresh) return { id: fresh.id, kind: 'reaction', text: fresh.text };
      if (rng() >= FACT_CHANCE) return null;
      const f = nextFact();
      return { id: f.id, kind: 'fact', text: f.text };
    },
    shown(thought) {
      if (!thought) return;
      shownToday += 1;
      if (thought.kind === 'reaction') usedReactions.add(thought.id);
    },
  };
}

export { wordCount, MAX_THOUGHT_WORDS };
