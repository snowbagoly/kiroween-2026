// The game clock, arrivals, idling and the late drain [T35, design 7, R9.7 to R9.7h].
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDayClock, arrivalTimes, clockTime, wallMinutes, NIGHT_MINUTES, LAST_ARRIVAL, DAY_REAL_MINUTES,
} from '../src/core/day-clock.js';
import { createLifeDrain, IDLE_GRACE_MS, IDLE_EVERY_MS, LATE_EVERY_MS, LATER_EVERY_MS } from '../src/core/idle.js';
import { createGame } from '../src/core/game.js';
import { createRng } from '../src/core/rng.js';

const runFor = (c, ms, opts) => {
  const events = [];
  for (let t = 0; t < ms; t += 200) events.push(...c.tick(200, opts));
  return events;
};

test('clock: nothing moves before the first input; the first telegram is on the desk at 22:00', () => {
  const c = createDayClock({ day: 1, arrivals: [0, 90, 180, 270, 360] });
  assert.deepEqual(c.tick(1000, { inHand: true }), []);
  assert.equal(c.minutes, 0);
  assert.equal(c.arrived, 1);
  c.start();
  c.tick(1000, { inHand: true });
  assert.ok(c.minutes > 0);
});

test('clock: 1x with a telegram in hand, 4x with an empty desk', () => {
  const real = DAY_REAL_MINUTES[1] * 60000;
  const a = createDayClock({ day: 1, arrivals: [0, 470] });
  a.start();
  runFor(a, 60000, { inHand: true });
  assert.ok(Math.abs(a.minutes - NIGHT_MINUTES * 60000 / real) < 0.5, String(a.minutes));
  const b = createDayClock({ day: 1, arrivals: [0, 470] });
  b.start();
  runFor(b, 60000, { inHand: false, done: 1 });
  assert.ok(Math.abs(b.minutes - 4 * a.minutes) < 1, String(b.minutes));
});

test('clock: telegrams arrive in order, and wait while the desk is busy', () => {
  const c = createDayClock({ day: 1, arrivals: [0, 10, 20] });
  c.start();
  const events = runFor(c, 60000, { inHand: true, done: 0 });
  assert.deepEqual(events.filter((e) => e.type === 'ARRIVED').map((e) => e.index), [1, 2]);
  assert.equal(c.arrived, 3);
});

test('clock: all done runs on to 06:00 within 15 s and ends with the dawn', () => {
  const c = createDayClock({ day: 1, arrivals: [0] });
  c.start();
  const events = runFor(c, 15200, { inHand: false, done: 1 });
  assert.equal(events.at(-1).type, 'DAWN');
  assert.equal(c.minutes, NIGHT_MINUTES);
});

test('clock: 06:00 with work left is time up, never later', () => {
  const c = createDayClock({ day: 1, arrivals: [0, 10] });
  c.start();
  const events = runFor(c, 30 * 60000, { inHand: true, done: 0 });
  assert.equal(events.filter((e) => e.type === 'TIME_UP').length, 1);
  assert.equal(c.minutes, NIGHT_MINUTES);
  assert.deepEqual(c.tick(1000, { inHand: true }), []);
});

test('clock: Judge infinite lives holds it at 05:59 until the work is done', () => {
  const c = createDayClock({ day: 1, arrivals: [0] });
  c.start();
  runFor(c, 30 * 60000, { inHand: true, done: 0, hold: true });
  assert.equal(c.minutes, NIGHT_MINUTES - 1);
  assert.equal(c.over, false);
});

test('clock: a long tick (a laptop asleep) moves at most one second', () => {
  const c = createDayClock({ day: 1, arrivals: [0, 400] });
  c.start();
  c.tick(3600000, { inHand: true });
  assert.ok(c.minutes < 2);
});

test('arrivals: from 22:00 to 04:00, in order', () => {
  const rng = createRng(7);
  for (let i = 0; i < 200; i++) {
    const a = arrivalTimes(5, rng);
    assert.equal(a[0], 0);
    assert.ok(a.at(-1) <= LAST_ARRIVAL);
    for (let k = 1; k < a.length; k++) assert.ok(a[k] > a[k - 1]);
  }
});

test('clock face: 22:00 to 06:00', () => {
  assert.equal(clockTime(0), '22:00');
  assert.equal(clockTime(125), '00:05');
  assert.equal(clockTime(480), '06:00');
  assert.equal(wallMinutes(0), 22 * 60);
  assert.equal(wallMinutes(480), 6 * 60);
});

test('idling: a life after 6 s, then one every 17 s; input resets it', () => {
  const d = createLifeDrain();
  const run = (ms) => { let n = 0; for (let t = 0; t < ms; t += 100) n += d.tick(100, { on: true, waiting: true }).length; return n; };
  assert.equal(run(IDLE_GRACE_MS - 100), 0);
  assert.equal(run(100), 1);
  assert.equal(run(IDLE_EVERY_MS), 1);
  d.input();
  assert.equal(run(IDLE_GRACE_MS - 100), 0);
});

test('idling: off in Day Shift (not on), with nothing waiting, and for a long tick', () => {
  const d = createLifeDrain();
  assert.equal(d.tick(1000, { on: false, waiting: true }).length, 0);
  for (let i = 0; i < 100; i++) assert.equal(d.tick(1000, { on: true, waiting: false }).length, 0);
  assert.equal(d.tick(3600000, { on: true, waiting: true }).length, 0); // capped to 1 s
});

test('late drain: every 20 s past 04:00, every 10 s past 05:00, never once done', () => {
  const d = createLifeDrain();
  const late = (ms, minutes, allDone = false) => {
    let n = 0;
    for (let t = 0; t < ms; t += 500) n += d.tick(500, { on: true, waiting: false, minutes, allDone }).filter((k) => k === 'late').length;
    return n;
  };
  assert.equal(late(60000, 359), 0);
  assert.equal(late(LATE_EVERY_MS * 3, 370), 3);
  assert.equal(late(LATER_EVERY_MS * 3, 430), 3);
  assert.equal(late(60000, 430, true), 0);
});

// The game with its clock on.
function timedGame(mode = 'night') {
  const g = createGame({ seed: 3, timed: true, data: { ...createGame().saved, settings: { ...createGame().saved.settings, tutorial: 'never' } } });
  g.dispatch({ type: 'PICK_MODE', mode });
  g.dispatch({ type: 'CONTINUE' });
  return g;
}
const finish = (g) => { for (const l of g.state.message.letters.slice(g.state.pos)) g.dispatch({ type: 'LETTER', letter: l, t: 1 }); };
const ticks = (g, ms) => { const out = []; for (let t = 0; t < ms; t += 200) out.push(...g.dispatch({ type: 'TICK', ms: 200 })); return out; };

test('game: a done message leaves an empty desk until the next one is handed in', () => {
  const g = timedGame();
  g.dispatch({ type: 'INPUT', t: 0 });
  finish(g);
  g.dispatch({ type: 'NEXT_MESSAGE' });
  assert.equal(g.state.screen, 'waiting');
  const events = ticks(g, 60000);
  assert.ok(events.some((e) => e.type === 'ARRIVED'));
  assert.equal(g.state.screen, 'playing');
  assert.equal(g.state.msgIndex, 1);
});

test('game: a fast day ends with the dawn at 06:00', () => {
  const g = timedGame();
  g.dispatch({ type: 'INPUT', t: 0 });
  for (let step = 0; step < 2000 && g.state.screen !== 'dayStats'; step++) {
    if (g.state.screen === 'playing') finish(g);
    else if (g.state.screen === 'messageDone') g.dispatch({ type: 'NEXT_MESSAGE' });
    else ticks(g, 1000);
  }
  assert.equal(g.state.screen, 'dayStats');
  assert.equal(g.state.clock.time, '06:00');
});

test('game: a slow day is lost at 06:00 with telegrams not sent', () => {
  const g = timedGame('day'); // Day Shift: no idling, so only the clock ends it
  g.dispatch({ type: 'INPUT', t: 0 });
  const events = ticks(g, 30 * 60000);
  const over = events.find((e) => e.type === 'GAME_OVER');
  assert.equal(over.reason, 'time');
  assert.equal(g.state.screen, 'gameOver');
});

test('game: idling in Night Shift costs lives, and they are no mistakes in the stats', () => {
  const g = timedGame();
  g.dispatch({ type: 'INPUT', t: 0 });
  const events = ticks(g, IDLE_GRACE_MS + IDLE_EVERY_MS + 200);
  assert.equal(events.filter((e) => e.type === 'IDLE_LIFE_LOST').length, 2);
  assert.equal(g.state.lives, 8);
  assert.equal(g.state.dayStats.mistakes, 0);
});

test('game: idling to zero lives is a game over', () => {
  const g = timedGame();
  g.dispatch({ type: 'INPUT', t: 0 });
  ticks(g, IDLE_GRACE_MS + IDLE_EVERY_MS * 10);
  assert.equal(g.state.screen, 'gameOver');
});

test('game: restart this day starts the clock again at 22:00', () => {
  const g = timedGame('day');
  g.dispatch({ type: 'INPUT', t: 0 });
  ticks(g, 30 * 60000);
  g.dispatch({ type: 'RESTART_DAY' });
  g.dispatch({ type: 'CONTINUE' });
  assert.equal(g.state.clock.time, '22:00');
  assert.equal(g.state.clock.started, false);
});
