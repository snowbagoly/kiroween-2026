// The office, at night for Night Shift and Dead Air and by day for Day Shift [design 3, 8, R7.2, R11.4]: a left wall
// (window, codebook, lamp), a centre (the work, the calendar, the key and the sounder on the desk) and a
// right wall (wall clock, galvanometer). Laid out at a 900 px design height and scaled as a whole;
// below NARROW_SCREEN it is one scrolling column without the window, clock, calendar and lamp.
import { PAINTS, mountDrawings, drawCalendar } from './drawings.js';
import { growScenery } from './scenery.js';
import { mountOfficeGauge } from './galvanometer.js';

export const OFFICE_HEIGHT = 900;
export const OFFICE_WIDTH = { min: 1400, max: 1700 };
export const NARROW_SCREEN = 1050;
const DAY_ONE_DATE = 4; // Day 1 is Wednesday, 4 November 1903 [R9.8]

// The key's lever and the sounder's arm, down or up.
export function setKeyDown(root, down) {
  root.querySelector('#key .lever')?.classList.toggle('down', !!down);
}
export function setSounderDown(root, down) {
  root.querySelector('#sounder .arm')?.classList.toggle('down', !!down);
}

// The calendar is crossed off up to the day before today [R9.8].
export const crossedTo = (day) => DAY_ONE_DATE + Math.max(1, day || 1) - 2;

// How to scale the office for a screen: null on a narrow screen (one column, no scaling).
// A screen taller than the office's shape gets more wall above and more desk below.
export function fitOffice(screenW, screenH) {
  if (screenW <= NARROW_SCREEN) return null;
  let zoom = screenH / OFFICE_HEIGHT;
  let width = screenW / zoom;
  if (width < OFFICE_WIDTH.min) {
    zoom = screenW / OFFICE_WIDTH.min;
    width = OFFICE_WIDTH.min;
  }
  return {
    zoom,
    width: Math.min(width, OFFICE_WIDTH.max),
    marginTop: Math.max(0, screenH / zoom - OFFICE_HEIGHT) / 2,
  };
}

// By day the sun falls through the window onto the desk [R7.2a]: a patch below and to the right of
// the window, and the beam between them. Rects are { left, top, right, bottom } in office pixels.
export const SUN_SLOPE = 0.5; // the beam moves this far right for each pixel down
export const SUN_SKEW = 32; // degrees the patch leans (office.css, .sun-patch)
export function sunPatch(win, deskTop) {
  const width = (win.right - win.left) * 1.25;
  const height = 64;
  const top = deskTop + 10;
  const cx = (win.left + win.right) / 2 + (top + height / 2 - (win.top + win.bottom) / 2) * SUN_SLOPE;
  return { left: cx - width / 2, top, right: cx + width / 2, bottom: top + height };
}

// The beam: the smallest shape holding the window's glass and the (leaning) patch on the desk.
export function beamOutline(win, patch) {
  const lean = ((patch.bottom - patch.top) / 2) * Math.tan((SUN_SKEW * Math.PI) / 180);
  const pts = [
    [win.left, win.top], [win.right, win.top], [win.right, win.bottom], [win.left, win.bottom],
    [patch.left + lean, patch.top], [patch.right + lean, patch.top], [patch.right - lean, patch.bottom], [patch.left - lean, patch.bottom],
  ].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const out = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(pts), ...half([...pts].reverse())];
}

// Lays the sunlight onto the room as it is drawn now (after a resize too).
function placeSunlight(office) {
  const light = office.querySelector('.sunlight');
  const glass = office.querySelector('.room-window');
  const desk = office.querySelector('.station');
  if (!light || !glass || !desk || getComputedStyle(light).display === 'none') return;
  const o = office.getBoundingClientRect();
  const k = o.width / office.offsetWidth || 1; // the office's zoom
  const at = (r) => ({ left: (r.left - o.left) / k, top: (r.top - o.top) / k, right: (r.right - o.left) / k, bottom: (r.bottom - o.top) / k });
  const g = at(glass.getBoundingClientRect());
  const pane = (g.right - g.left) * 0.07; // the glass inside the frame
  const win = { left: g.left + pane, top: g.top + pane, right: g.right - pane, bottom: g.bottom - pane };
  const deskTop = at(desk.getBoundingClientRect()).top + desk.offsetHeight * 0.62;
  const patch = sunPatch(win, deskTop);
  const el = light.querySelector('.sun-patch');
  Object.assign(el.style, { left: `${patch.left}px`, top: `${patch.top}px`, width: `${patch.right - patch.left}px`, height: `${patch.bottom - patch.top}px` });
  // Dust hangs in the beam, spread from the window down to the desk.
  const motes = [...light.querySelectorAll('.sun-beam i')];
  const wx = (win.left + win.right) / 2;
  const wy = (win.top + win.bottom) / 2;
  const px = (patch.left + patch.right) / 2;
  motes.forEach((m, i) => {
    const t = 0.32 + (0.62 * ((i * 7) % motes.length)) / motes.length; // below the window, above the desk
    const side = (((i * 5) % 7) / 6 - 0.5) * (win.right - win.left) * 0.8;
    m.style.left = `${wx + (px - wx) * t + side}px`;
    m.style.top = `${wy + (patch.top - wy) * t}px`;
  });
  light.querySelector('.sun-beam').style.clipPath = `polygon(${beamOutline(win, patch).map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`;
}

// The wall clock's hands for a time in minutes after midnight.
export function clockAngles(minutes) {
  const m = ((minutes % 1440) + 1440) % 1440;
  return { hour: ((m / 60) % 12) * 30, minute: (m % 60) * 6 };
}

export function officeHtml({ max = 10, daylight = false } = {}) {
  return `<div class="office${daylight ? ' daylight' : ''}">
  ${PAINTS}
  <div class="lamp-glow" aria-hidden="true"></div>
  <!-- By day: sunlight through the panes, a patch on the desk with dust in the beam. -->
  <div class="day-only sunlight" aria-hidden="true"><div class="sun-beam">${'<i></i>'.repeat(14)}</div><div class="sun-patch"></div></div>
  <div class="wall-left">
    <div class="window-wrap"><svg class="room-window" data-draw="window" data-options='{"dropsLayer": true}' aria-hidden="true"></svg></div>
    <div class="codebook-spot"></div>
    <svg class="desk-lamp" data-draw="lamp" aria-hidden="true"></svg>
  </div>
  <div class="centre">
    <div class="office-hud"></div>
    <div class="office-work"></div>
    <svg class="room-calendar" data-draw="calendar" aria-hidden="true"></svg>
    <div class="station">
      <svg id="key" class="office-key" data-draw="key" overflow="visible" aria-hidden="true"></svg>
      <svg id="sounder" class="office-sounder" data-draw="sounder" overflow="visible" aria-hidden="true"></svg>
    </div>
  </div>
  <div class="wall-right">
    <svg class="room-clock clock" data-draw="clock" aria-hidden="true"></svg>
    <figure class="galvanometer" id="galvanometer-slot" role="img" data-max="${max}">
      <svg overflow="visible" aria-hidden="true"></svg>
      <span class="lives-num" aria-hidden="true"></span>
    </figure>
    <div class="on-desk"></div>
  </div>
</div>`;
}

// Builds the office into the stage. Returns its parts and controls.
export function mountOffice(stage, { max = 10, lives = max, day = 1, minutes = 22 * 60, daylight = false } = {}) {
  stage.innerHTML = officeHtml({ max, daylight });
  stage.classList.add('office-stage');
  const office = stage.querySelector('.office');
  mountDrawings(office);
  growScenery(office);
  const gauge = mountOfficeGauge(office.querySelector('.galvanometer'), { max, lives });
  const calendar = office.querySelector('.room-calendar');
  const clock = office.querySelector('.room-clock');

  const fit = () => {
    const f = fitOffice(window.innerWidth, window.innerHeight);
    office.style.zoom = f ? f.zoom : '';
    office.style.width = f ? `${f.width}px` : '';
    office.style.height = f ? `${OFFICE_HEIGHT}px` : '';
    office.style.marginTop = f ? `${f.marginTop}px` : '';
  };
  fit();
  window.addEventListener('resize', fit);
  // The sunlight follows the window wherever the layout puts it.
  const sun = () => placeSunlight(office);
  if (daylight) { requestAnimationFrame(sun); document.fonts?.ready.then(sun); window.addEventListener('resize', sun); }

  const api = {
    office,
    gauge,
    hud: office.querySelector('.office-hud'),
    work: office.querySelector('.office-work'),
    formSpot: office.querySelector('.on-desk'),
    minutes,
    codebookSpot: office.querySelector('.codebook-spot'),
    setDay(d) {
      const { viewBox, body } = drawCalendar({ crossedTo: crossedTo(d) });
      calendar.setAttribute('viewBox', viewBox);
      calendar.innerHTML = body;
    },
    setTime(mins) {
      api.minutes = mins;
      const { hour, minute } = clockAngles(mins);
      clock.style.setProperty('--hour', `${hour}deg`);
      clock.style.setProperty('--minute', `${minute}deg`);
    },
    unmount() { window.removeEventListener('resize', fit); window.removeEventListener('resize', sun); gauge.stop(); },
  };
  api.setDay(day);
  api.setTime(minutes);
  return api;
}
