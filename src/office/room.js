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
    unmount() { window.removeEventListener('resize', fit); gauge.stop(); },
  };
  api.setDay(day);
  api.setTime(minutes);
  return api;
}
