// The office's light and what happens to it [design 8, R6.4 to R6.7, R5.5]: the lamp's light
// stuttering, the room dimming around the galvanometer, the dark closing in from the corners, the cold
// of a blue flame, the white flash of the line snapping, and the figure. The layers lie over the office
// as fixed overlays (not inside its scaled box), so they can be placed by screen position.
import { FIGURE_SHAPE } from './drawings.js';

export const GAZE_DEPTH = { from: 0.55, to: 0.9 }; // how dark the rest of the room goes, strong and weak line
export const LAYERS_HTML = `<div class="light-layers" aria-hidden="true">
  <div class="cold"></div><div class="closing"></div><div class="gaze"></div><div class="darkness"></div><div class="flash"></div>
  <svg class="apparition" viewBox="0 0 100 300">${FIGURE_SHAPE}</svg>
</div>`;

// How a stutter of the light goes: the darkness at each step and how long it lasts. Pure.
export function stutterSteps(strength, rng = Math.random) {
  const steps = [];
  const n = 3 + Math.round(strength * 6);
  for (let i = 0; i < n; i++) {
    steps.push({ dark: i % 2 === 0 ? 0.2 + rng() * (0.2 + 0.5 * strength) : rng() * 0.15, ms: 40 + rng() * 110 });
  }
  return steps;
}

export function mountLight(stage, office, { calm = () => false, rng = Math.random } = {}) {
  stage.insertAdjacentHTML('beforeend', LAYERS_HTML);
  const layers = stage.lastElementChild;
  const $ = (s) => layers.querySelector(s);
  const darkness = $('.darkness');
  const gazeEl = $('.gaze');
  const closingEl = $('.closing');
  const flashEl = $('.flash');
  const figure = $('.apparition');
  const galv = office.querySelector('.galvanometer');
  const windowEl = office.querySelector('.room-window');
  let timers = [];
  let gazeTimer = null;
  const later = (ms, f) => timers.push(setTimeout(f, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const restart = (el, cls) => { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); };

  const api = {
    get flickering() { return timers.length > 0; },

    // The light stutters: a few quick dips, more and deeper the stronger; with blackout (or by chance
    // when strong) a moment of near-total dark. Returns how long it lasts, in ms [R6.4, R6.7].
    flicker(strength, { blackout = false, blackoutMs, onBlackout, onLight } = {}) {
      clear();
      let t = 0;
      for (const { dark, ms } of stutterSteps(strength, rng)) {
        later(t, () => { darkness.style.opacity = dark; });
        t += ms;
      }
      if (blackout || (strength > 0.6 && rng() < 0.3)) {
        later(t, () => { darkness.style.opacity = 0.93; onBlackout?.(); });
        t += blackoutMs ?? 600 + rng() * 700;
      }
      later(t, () => { darkness.style.opacity = 0; timers = []; onLight?.(); });
      return t;
    },

    // The rest of the room dims, leaving the galvanometer lit, so the eye goes to its needle [R6.4].
    gaze(severity, holdMs = 700) {
      const box = galv.getBoundingClientRect();
      gazeEl.style.setProperty('--x', `${box.left + box.width / 2}px`);
      gazeEl.style.setProperty('--y', `${box.top + box.height / 2}px`);
      gazeEl.style.setProperty('--r', `${box.width * 0.5}px`);
      gazeEl.style.opacity = GAZE_DEPTH.from + (GAZE_DEPTH.to - GAZE_DEPTH.from) * severity;
      gazeEl.classList.add('on');
      restart(galv, 'struck');
      clearTimeout(gazeTimer);
      gazeTimer = setTimeout(() => { gazeEl.classList.remove('on'); gazeEl.style.opacity = 0; }, holdMs);
    },

    // The dark closing in from the corners, 0 to 1 [R6.4].
    closing(level) { closingEl.style.opacity = Math.min(1, Math.max(0, level)).toFixed(3); },

    // An omen: the lamp's flame sinks low and burns blue, and the room goes cold [R6.4a].
    blueFlame(ms = 5000) {
      office.classList.add('blue-flame');
      layers.classList.add('blue-flame');
      later(ms, () => { office.classList.remove('blue-flame'); layers.classList.remove('blue-flame'); });
    },

    // The last warning's crack in the galvanometer's glass; it stays until the day ends [R6.4b].
    crack(on = true) { galv.classList.toggle('cracked', on); },
    // The figure reflected in the window, behind the operator's chair.
    watched(on) { windowEl?.classList.toggle('watched', on); },

    // The line snapping: a white flash and the room jolting [R5.5]. No flash with "Reduce flashing".
    snap() {
      if (!calm()) restart(flashEl, 'on');
      restart(office, 'jolt');
    },

    // The light dying with the line: a violent stutter, faster and darker, a last flash in which
    // someone stands in the room, then total dark. `onDark` runs then [R5.5].
    lightsOut(onDark) {
      clear();
      let t = 0;
      for (let i = 0; i < 14; i++) {
        const fade = i / 14;
        const dark = i % 2 === 0 ? 0.45 + fade * 0.5 : fade * 0.4;
        later(t, () => { darkness.style.opacity = dark; });
        t += 110 - fade * 70 + rng() * 30;
      }
      later(t, () => { darkness.style.opacity = 0.97; });
      t += 260;
      later(t, () => { darkness.style.opacity = 0.15; figure.classList.add('seen'); });
      t += 150;
      later(t, () => { darkness.style.opacity = 1; figure.classList.remove('seen'); timers = []; onDark?.(); });
      return t;
    },

    // A new day, or the end of one: the room's light back to normal. The crack goes with a new day.
    reset({ newDay = false } = {}) {
      clear();
      clearTimeout(gazeTimer);
      darkness.style.opacity = 0;
      gazeEl.classList.remove('on');
      gazeEl.style.opacity = 0;
      closingEl.style.opacity = 0;
      figure.classList.remove('seen');
      office.classList.remove('blue-flame');
      layers.classList.remove('blue-flame');
      windowEl?.classList.remove('watched');
      if (newDay) galv.classList.remove('cracked');
    },
    unmount() { clear(); layers.remove(); },
  };
  return api;
}
