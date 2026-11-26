// The office galvanometer: the lives needle on the right wall [design 8, R5.1 to R5.3, R5.7, R5.8].
// Same controller as the Day Shift dial (set, setMax, showNumber, state), so main.js drives either.
// Full lives: needle at the top of the scale. One life: the lowest step. Zero: against the stop.
import { drawGalvanometer, GALVANOMETER_SWING, GALVANOMETER_PIVOT } from './drawings.js';
import { trembleFor, livesLabel } from '../ui/galvanometer.js';

const DEAD_STOP = -0.02; // just past 0 on the dial

// Degrees from upright for this many lives: -SWING at 0, +SWING at the maximum.
export function officeNeedleAngle(lives, max) {
  const strength = lives <= 0 || max <= 0 ? DEAD_STOP : Math.min(lives, max) / max;
  return -GALVANOMETER_SWING + strength * GALVANOMETER_SWING * 2;
}

export function mountOfficeGauge(figure, { max = 10, lives = max, showNumber = false } = {}) {
  const svg = figure.querySelector('svg');
  const num = figure.querySelector('.lives-num');
  let cur = { max, lives };

  function draw() {
    const rotate = `rotate(${officeNeedleAngle(cur.lives, cur.max).toFixed(2)}deg)`;
    svg.querySelector('.needle').style.transform = rotate;
    svg.querySelector('.needle-shadow').style.transform = `translate(3px, 4px) ${rotate}`;
    figure.style.setProperty('--t', `${trembleFor(cur.lives, cur.max)}deg`);
    figure.setAttribute('aria-label', livesLabel(cur.lives, cur.max));
    num.textContent = `${cur.lives} / ${cur.max}`;
  }

  const api = {
    set(l) { cur.lives = l; draw(); },
    setMax(m, l = m) {
      cur = { max: m, lives: l };
      const { viewBox, body } = drawGalvanometer({ id: 'office-galv', steps: m, wiresTo: 260 });
      svg.setAttribute('viewBox', viewBox);
      svg.innerHTML = body;
      const origin = `${GALVANOMETER_PIVOT.x}px ${GALVANOMETER_PIVOT.y}px`;
      for (const el of svg.querySelectorAll('.needle, .needle-shadow')) el.style.transformOrigin = origin;
      draw();
    },
    showNumber(on) { figure.classList.toggle('show-num', !!on); },
    get state() { return { ...cur }; },
  };
  api.setMax(max, lives);
  api.showNumber(showNumber);
  return api;
}
