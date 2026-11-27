// The office [T32, design 8, R11.2, R11.4, R7.2a, R9.8].
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fitOffice, crossedTo, clockAngles, officeHtml, OFFICE_WIDTH } from '../src/office/room.js';
import { drawCalendar, drawGalvanometer, galvanometerScale, DRAWINGS } from '../src/office/drawings.js';
import { officeNeedleAngle } from '../src/office/galvanometer.js';
import { buildPage, findExternalLinks } from '../build.mjs';

test('office: by day for Day Shift, with the sunlight, the clouds and the bird; none of it at night [R7.2]', () => {
  const day = officeHtml({ daylight: true });
  assert.match(day, /class="office daylight"/);
  assert.match(day, /class="day-only sunlight"/);
  assert.equal((day.match(/<i><\/i>/g) ?? []).length, 14); // dust in the beam
  assert.doesNotMatch(officeHtml(), /class="office daylight"/);
  const w = DRAWINGS.window({ id: 'w' }).body;
  assert.match(w, /class="day-only window-clouds"/);
  assert.match(w, /class="day-only window-bird"/);
  const css = readFileSync(new URL('../src/css/office.css', import.meta.url), 'utf8');
  assert.match(css, /\.office:not\(\.daylight\) \.day-only \{ display: none; \}/);
  assert.match(css, /\.office\.daylight :is\(\.lamp-glow, \.desk-lamp \.lamp-flame/); // the lamp is not lit by day
});

test('office: scaled to the 900 px design height, one column on narrow screens', () => {
  assert.equal(fitOffice(1050, 800), null);
  assert.equal(fitOffice(360, 740), null);
  const f = fitOffice(1920, 1080);
  assert.equal(f.zoom, 1.2);
  assert.equal(f.width, 1600);
  assert.equal(f.marginTop, 0);
  // A squarer screen: the minimum width decides the scale, with more wall above and desk below.
  const sq = fitOffice(1400, 1400);
  assert.equal(sq.zoom, 1);
  assert.equal(sq.width, OFFICE_WIDTH.min);
  assert.equal(sq.marginTop, 250);
  // A very wide screen gets at most the widest office.
  assert.equal(fitOffice(4000, 900).width, OFFICE_WIDTH.max);
});

test('office: the calendar is crossed off up to the day before (Day 1 is 4 November 1903)', () => {
  assert.equal(crossedTo(1), 3);
  assert.equal(crossedTo(2), 4);
  assert.equal(crossedTo(3), 5);
  const cal = drawCalendar({ crossedTo: 3 }).body;
  assert.match(cal, /November 1903/);
  assert.match(cal, />30</);
  assert.doesNotMatch(cal, />31</);
});

test('office: the wall clock hands for 22:00 and 05:30', () => {
  assert.deepEqual(clockAngles(22 * 60), { hour: 300, minute: 0 });
  assert.deepEqual(clockAngles(5 * 60 + 30), { hour: 165, minute: 180 });
});

test('office: the galvanometer dial has one tick per step, 10 or 5', () => {
  const ticks = (s) => (s.match(/<line /g) ?? []).length;
  assert.equal(ticks(galvanometerScale(10)), 11);
  assert.equal(ticks(galvanometerScale(5)), 6);
  assert.match(drawGalvanometer({ steps: 5 }).body, />5</);
});

test('office: the needle is at the top for full lives and against the stop at zero', () => {
  assert.equal(officeNeedleAngle(10, 10), 50);
  assert.equal(officeNeedleAngle(5, 5), 50);
  assert.equal(officeNeedleAngle(1, 10), -40);
  assert.ok(officeNeedleAngle(0, 10) < -50);
  assert.ok(officeNeedleAngle(9, 10) < officeNeedleAngle(10, 10));
});

test('office: every part of the room is in the markup', () => {
  const html = officeHtml({ max: 10 });
  for (const part of ['room-window', 'codebook-spot', 'desk-lamp', 'room-calendar', 'id="key"', 'id="sounder"', 'room-clock', 'galvanometer-slot']) {
    assert.ok(html.includes(part), part);
  }
  for (const name of ['calendar', 'clock', 'window', 'lamp', 'galvanometer', 'key', 'sounder']) {
    assert.ok(html.includes(`data-draw="${name}"`) || name === 'galvanometer', name);
    assert.equal(typeof DRAWINGS[name], 'function', name);
  }
});

test('build: the fonts are inlined and nothing comes from another site', () => {
  const html = buildPage('index.html', 'src/main.js', 'index.html');
  assert.equal((html.match(/data:font\/woff2;base64,/g) ?? []).length, 3);
  assert.doesNotMatch(html, /<link rel="stylesheet"/);
  assert.deepEqual(findExternalLinks(html), []);
  assert.match(html, /\.office \.galvanometer/);
});

test('fonts: each font has its licence beside it', () => {
  for (const f of ['caveat-OFL.txt', 'im-fell-english-sc-OFL.txt', 'special-elite-LICENSE.txt']) {
    assert.ok(readFileSync(new URL(`../fonts/${f}`, import.meta.url), 'utf8').length > 1000, f);
  }
});
