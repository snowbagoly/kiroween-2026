// Horror director [design 10, R6.5, R6.7, R16.1]. One number, intensity 0..1, from the day and the
// lives left, and a scheduler that fires random effects with a minimum gap, never while a key is down.
// No browser calls: the clock and timers are passed in. Day Shift never starts it [R7.1].

export const DAY_BASE = { 1: 0.15, 2: 0.45, 3: 0.8 };
export const DEAD_AIR_BASE = 0.8;
export const MIN_GAP_MS = 8000;
export const MIN_GAP_FULL_MS = 4000; // Day 3 in Night Shift, and every day in Dead Air
export const MAX_GAP_MS = 20000;
export const DAY1_CALM_MS = 25000; // Day 1 starts calm: nothing in the first 25 s
export const BUSY_RETRY_MS = 500;
export const STRANGE_BOOST = 0.15;

// Effect types per stage. Day 3 and Dead Air use the full set [R6.7].
export const EFFECTS = ['thunder', 'crow', 'knock', 'scream'];
const STAGE_EFFECTS = { 1: ['thunder', 'crow'], 2: ['thunder', 'crow', 'knock'], 3: EFFECTS };

const clampUnit = (v) => Math.min(1, Math.max(0, Number(v) || 0));
const fullSet = (day, mode) => mode === 'deadair' || day >= 3;

export function intensityFor({ day = 1, mode = 'night', lives = 10, max = 10, override = null } = {}) {
  if (override !== null && override !== undefined) return clampUnit(override);
  const base = mode === 'deadair' ? DEAD_AIR_BASE : DAY_BASE[day] ?? DAY_BASE[1];
  const pressure = max > 0 ? 1 - Math.min(lives, max) / max : 0;
  return clampUnit(base + pressure * 0.3);
}

export const minGapFor = (day, mode) => (fullSet(day, mode) ? MIN_GAP_FULL_MS : MIN_GAP_MS);

// gap = lerp(20 s, minimum gap, intensity), plus up to 30 % random spread on top.
export function gapFor(intensity, day, mode, r = 0) {
  const low = minGapFor(day, mode);
  const base = MAX_GAP_MS + (low - MAX_GAP_MS) * clampUnit(intensity);
  return Math.max(low, base * (1 + 0.3 * clampUnit(r)));
}

export function effectsFor(day, mode) {
  return fullSet(day, mode) ? EFFECTS : STAGE_EFFECTS[day] ?? STAGE_EFFECTS[1];
}

// Picks an effect. Screams and knocks get a larger share as intensity rises.
export function pickEffect(intensity, day, mode, r) {
  const list = effectsFor(day, mode);
  const weights = list.map((e) => (e === 'scream' || e === 'knock' ? 0.3 + 1.7 * clampUnit(intensity) : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let x = clampUnit(r) * total;
  for (let i = 0; i < list.length; i++) {
    x -= weights[i];
    if (x < 0) return list[i];
  }
  return list[list.length - 1];
}

export function createHorrorDirector({
  rng = Math.random,
  now = () => performance.now(),
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
  isBusy = () => false, // true while Space is down or a letter is being played
  onEffect = () => {},
} = {}) {
  let st = { day: 1, mode: 'night', lives: 10, max: 10 };
  let override = null;
  let strangeBoost = 0; // a strange message on screen makes things worse for that message
  let running = false;
  let paused = false;
  let timer = null;
  let last = null; // time of the last effect
  let dueAt = null; // when the next effect is wanted
  let pausedLeft = null;

  const intensity = () => (override !== null ? intensityFor({ ...st, override }) : clampUnit(intensityFor(st) + strangeBoost));

  function arm(at) {
    if (timer !== null) clearTimer(timer);
    dueAt = at;
    timer = setTimer(fire, Math.max(0, at - now()));
  }

  function fire() {
    timer = null;
    if (!running || paused) return;
    const t = now();
    const earliest = last === null ? t : last + minGapFor(st.day, st.mode);
    if (t < earliest) { arm(earliest); return; }
    if (isBusy()) { arm(t + BUSY_RETRY_MS); return; } // try again in 500 ms [design 10]
    last = t;
    const i = intensity();
    onEffect(pickEffect(i, st.day, st.mode, rng()), { intensity: i, at: t });
    arm(t + gapFor(i, st.day, st.mode, rng()));
  }

  return {
    get running() { return running; },
    get paused() { return paused; },
    get intensity() { return intensity(); },
    get lastAt() { return last; },
    get dueAt() { return dueAt; },
    // `state` is { day, mode, lives, max }. Returns false in Day Shift: it never starts there.
    start(state) {
      if (state?.mode === 'day') return false;
      st = { ...st, ...state };
      running = true;
      paused = false;
      const t = now();
      const calm = st.day === 1 && st.mode !== 'deadair' ? DAY1_CALM_MS : 0;
      arm(t + Math.max(calm, gapFor(intensity(), st.day, st.mode, rng())));
      return true;
    },
    update(state) { st = { ...st, ...state }; },
    // A new message starts. Strange ones raise intensity by 0.15 until the next message [R6.3].
    message(msg) { strangeBoost = msg?.strange ? STRANGE_BOOST : 0; },
    setOverride(v) { override = v === null || v === undefined ? null : clampUnit(v); },
    // Options open: hold the clock. Resume keeps the time that was left.
    pause() {
      if (!running || paused) return;
      paused = true;
      if (timer !== null) clearTimer(timer);
      timer = null;
      pausedLeft = dueAt === null ? null : Math.max(0, dueAt - now());
    },
    resume() {
      if (!running || !paused) return;
      paused = false;
      arm(now() + (pausedLeft ?? 0));
    },
    stop() {
      running = false;
      paused = false;
      if (timer !== null) clearTimer(timer);
      timer = null;
      dueAt = null;
    },
  };
}
