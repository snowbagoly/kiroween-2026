// The office galvanometer: the lives needle on the right wall [design 8, R5.1 to R5.3, R5.7, R5.8].
// Same controller as the Day Shift dial (set, setMax, showNumber, state), so main.js drives either.
// Full lives: needle at the top of the scale. One life: the lowest step. Zero: flung against the stop.
// The needle is a damped spring: it swings past its mark and settles, like a real movement.
import { drawGalvanometer, GALVANOMETER_SWING, GALVANOMETER_PIVOT } from './drawings.js';
import { livesLabel } from '../ui/galvanometer.js';

export const STOP_LOW = -0.02; // the stops at either end of the dial, just past 0 and the top
export const STOP_HIGH = 1.02;
export const SPRING = 60; // how hard the needle is pulled to its mark
export const DAMPING = 9; // how fast its swing dies away
export const LOSS_JOLT = -1.2; // a lost life jolts it, so it overshoots before settling
export const DEAD_SLAM = -9; // at zero it is flung against the stop
const BOUNCE = 0.35; // what is left of its speed after hitting a stop
const MAX_STEP_S = 0.05; // one frame never moves it further than this, even after a pause

// The needle's mark for this many lives, 0 (or the stop) to 1.
export function needleMark(lives, max) {
  return lives <= 0 || max <= 0 ? STOP_LOW : Math.min(lives, max) / max;
}

export function officeNeedleAngle(lives, max) {
  return markAngle(needleMark(lives, max));
}

const markAngle = (mark) => -GALVANOMETER_SWING + mark * GALVANOMETER_SWING * 2;

// One spring step of dt seconds. Pure, so tests can run it without frames.
export function stepNeedle({ shown, velocity }, target, dt) {
  const t = Math.min(dt, MAX_STEP_S);
  velocity += (SPRING * (target - shown) - DAMPING * velocity) * t;
  shown += velocity * t;
  if (shown < STOP_LOW) { shown = STOP_LOW; velocity = Math.abs(velocity) * BOUNCE; }
  else if (shown > STOP_HIGH) { shown = STOP_HIGH; velocity = -Math.abs(velocity) * BOUNCE; }
  return { shown, velocity };
}

// How much the needle shakes: none in the upper part, more and more near the red zone.
export function trembleAmount(lives, max) {
  if (max <= 1) return 0;
  const near = 1 - (Math.max(1, Math.min(lives, max)) - 1) / (max - 1);
  return 0.004 + 0.02 * near;
}

export function mountOfficeGauge(figure, {
  max = 10, lives = max, showNumber = false,
  raf = (fn) => requestAnimationFrame(fn), cancel = (id) => cancelAnimationFrame(id),
  now = () => performance.now(), still = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
} = {}) {
  const svg = figure.querySelector('svg');
  const num = figure.querySelector('.lives-num');
  let cur = { max, lives };
  let needle = { shown: needleMark(lives, max), velocity: 0 };
  let last = now();
  let frameId = null;
  let needleEl = null;
  let shadowEl = null;

  function drawNeedle() {
    const shake = still() ? 0 : (Math.random() - 0.5) * trembleAmount(cur.lives, cur.max);
    const angle = markAngle(Math.min(STOP_HIGH, Math.max(STOP_LOW, needle.shown + shake)));
    const rotate = `rotate(${angle.toFixed(2)} ${GALVANOMETER_PIVOT.x} ${GALVANOMETER_PIVOT.y})`;
    needleEl.setAttribute('transform', rotate);
    shadowEl.setAttribute('transform', `translate(3 4) ${rotate}`);
  }

  function frame(t) {
    const dt = (t - last) / 1000;
    last = t;
    needle = stepNeedle(needle, needleMark(cur.lives, cur.max), dt);
    if (figure.isConnected) drawNeedle();
    frameId = figure.isConnected ? raf(frame) : null;
  }

  function label() {
    figure.setAttribute('aria-label', livesLabel(cur.lives, cur.max));
    num.textContent = `${cur.lives} / ${cur.max}`;
  }

  const api = {
    set(l) {
      if (l < cur.lives) needle.velocity += l <= 0 ? DEAD_SLAM : LOSS_JOLT;
      cur.lives = l;
      label();
    },
    setMax(m, l = m) {
      cur = { max: m, lives: l };
      needle = { shown: needleMark(l, m), velocity: 0 };
      const { viewBox, body } = drawGalvanometer({ id: 'office-galv', steps: m, wiresTo: 260 });
      svg.setAttribute('viewBox', viewBox);
      svg.innerHTML = body;
      needleEl = svg.querySelector('.needle');
      shadowEl = svg.querySelector('.needle-shadow');
      label();
      drawNeedle();
    },
    showNumber(on) { figure.classList.toggle('show-num', !!on); },
    stop() { if (frameId !== null) cancel(frameId); frameId = null; },
    get needle() { return { ...needle }; },
    get state() { return { ...cur }; },
  };
  api.setMax(max, lives);
  api.showNumber(showNumber);
  frameId = raf(frame);
  return api;
}
