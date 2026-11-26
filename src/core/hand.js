// The player's hand: how long their own dots and dashes are [design 5, R3.3, R3.3a, R3.3b].
// The line between a dot and a dash, and the pause that ends a letter, follow the player.
// Pure: no clock, no storage. main.js loads and saves { dot, dash }.

export const HAND_MEMORY = 20; // recent presses the hand is learned from
export const MIN_DASH_RATIO = 1.8; // two groups closer than this are one kind of press, not dots and dashes
export const FIRST_HAND = Object.freeze({ dot: 120, dash: 360 }); // a new player's hand, in ms
export const LETTER_GAP_UNITS = 6; // officially 3 units, but real hands pause longer
export const LETTER_GAP_RANGE = Object.freeze([450, 1600]); // ms
const PRESS_RANGE = [30, 2000]; // ms; one stray press is kept inside this
const LEARN_FROM = 4; // presses before the hand starts to learn

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const median = (sorted) => sorted[Math.floor(sorted.length / 2)];
const okMs = (v) => typeof v === 'number' && Number.isFinite(v) && v >= PRESS_RANGE[0] && v <= PRESS_RANGE[1];

// A saved hand is used only when it makes sense; anything else is a new player's hand.
export function validHand(saved) {
  if (!saved || !okMs(saved.dot) || !okMs(saved.dash)) return null;
  if (saved.dash < saved.dot * MIN_DASH_RATIO) return null;
  return { dot: saved.dot, dash: saved.dash };
}

export function createHand(saved) {
  const start = validHand(saved) ?? FIRST_HAND;
  let dot = start.dot;
  let dash = start.dash;
  let recent = [];

  const hand = {
    get dot() { return dot; },
    get dash() { return dash; },
    // Halfway between a typical dot and a typical dash.
    get threshold() { return (dot + dash) / 2; },
    // One Morse unit: a dot is one unit long, a dash three.
    get unit() { return (dot + dash / 3) / 2; },
    get letterGap() { return clamp(hand.unit * LETTER_GAP_UNITS, ...LETTER_GAP_RANGE); },
    // Standard "PARIS" timing: at n words per minute a dot lasts 1200 / n ms.
    get wpm() { return Math.round(1200 / hand.unit); },
    get saved() { return { dot: Math.round(dot), dash: Math.round(dash) }; },

    // Classifies the press with the hand as it was, then learns from it. Returns '.' or '-'.
    classify(ms) {
      const symbol = ms >= hand.threshold ? '-' : '.';
      recent.push(clamp(Number(ms) || 0, ...PRESS_RANGE));
      if (recent.length > HAND_MEMORY) recent.shift();
      if (recent.length >= LEARN_FROM) learn();
      return symbol;
    },

    // Back to a new player's hand.
    forget() {
      dot = FIRST_HAND.dot;
      dash = FIRST_HAND.dash;
      recent = [];
    },
  };

  // Splits the recent presses into a short and a long group where they separate best (on a log scale,
  // since dashes are a multiple of dots), and takes each group's median, so one stray press, like a
  // key held for seconds, does not throw the hand off.
  function learn() {
    const logs = recent.map(Math.log).sort((a, b) => a - b);
    const total = logs.reduce((s, v) => s + v, 0);
    let best = { score: -1, at: 1 };
    let below = 0;
    for (let i = 1; i < logs.length; i++) {
      below += logs[i - 1];
      const n1 = i;
      const n2 = logs.length - i;
      const diff = below / n1 - (total - below) / n2;
      const score = n1 * n2 * diff * diff;
      if (score > best.score) best = { score, at: i };
    }
    const short = Math.exp(median(logs.slice(0, best.at)));
    const long = Math.exp(median(logs.slice(best.at)));
    if (long / short >= MIN_DASH_RATIO) {
      dot = short;
      dash = long;
      return;
    }
    // Only one kind of press lately: move the symbol it resembles, keep the other well apart.
    const typical = Math.exp(median(logs));
    if (typical < hand.threshold) {
      dot = typical;
      dash = Math.max(dash, typical * 2);
    } else {
      dash = typical;
      dot = Math.min(dot, typical / 2);
    }
  }

  return hand;
}
