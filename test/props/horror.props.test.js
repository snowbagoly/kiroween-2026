import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createHorrorDirector, minGapFor, MIN_GAP_MS, MIN_GAP_FULL_MS, DAY1_CALM_MS } from '../../src/director/horror.js';
import { RUNS } from './arbitraries.js';

// A fake clock with timers, so ten minutes of play take no time.
function fakeTime() {
  let t = 0;
  let id = 0;
  const timers = new Map();
  return {
    now: () => t,
    setTimer: (fn, ms) => { timers.set(++id, { fn, at: t + ms }); return id; },
    clearTimer: (i) => timers.delete(i),
    // Moves time forward to `to`, running timers in order.
    runTo(to, onStep = () => {}) {
      for (;;) {
        let next = null;
        for (const [k, v] of timers) if (v.at <= to && (!next || v.at < next[1].at)) next = [k, v];
        if (!next) break;
        t = next[1].at;
        onStep(t);
        timers.delete(next[0]);
        next[1].fn();
      }
      t = to;
    },
  };
}

const busyWindows = fc.array(fc.record({ at: fc.integer({ min: 0, max: 600000 }), len: fc.integer({ min: 50, max: 5000 }) }), { maxLength: 80 });
const setup = fc.record({
  day: fc.constantFrom(1, 2, 3),
  lives: fc.integer({ min: 0, max: 10 }),
  seed: fc.integer(),
});

test('R6.5, R6.7: no two effects closer than 8 s (4 s on Day 3), none while a key is down', () => {
  fc.assert(fc.property(setup, busyWindows, ({ day, lives, seed }, windows) => {
    const clock = fakeTime();
    let r = seed;
    const rng = () => { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; };
    const busy = (t) => windows.some((w) => t >= w.at && t < w.at + w.len);
    const fired = [];
    const d = createHorrorDirector({
      rng, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer,
      isBusy: () => busy(clock.now()),
      onEffect: (name) => fired.push({ name, at: clock.now() }),
    });
    d.start({ day, mode: 'night', lives, max: 10 });
    clock.runTo(600000); // ten minutes
    const gap = minGapFor(day);
    assert.equal(gap, day === 3 ? MIN_GAP_FULL_MS : MIN_GAP_MS);
    for (let i = 1; i < fired.length; i++) assert.ok(fired[i].at - fired[i - 1].at >= gap, `${fired[i].at - fired[i - 1].at} ms`);
    for (const f of fired) assert.ok(!busy(f.at), `effect at ${f.at} while a key is down`);
    if (day === 1) assert.ok(fired.every((f) => f.at >= DAY1_CALM_MS), 'Day 1 starts calm');
    if (day < 3) assert.ok(fired.every((f) => f.name !== 'scream'));
    assert.ok(fired.length > 0, 'something happens in ten minutes');
  }), RUNS);
});

test('R7.1: the director never starts in Day Shift', () => {
  fc.assert(fc.property(fc.constantFrom(1, 2, 3), fc.integer({ min: 0, max: 10 }), (day, lives) => {
    const clock = fakeTime();
    let n = 0;
    const d = createHorrorDirector({ now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer, onEffect: () => n++ });
    assert.equal(d.start({ day, mode: 'day', lives, max: 10 }), false);
    assert.equal(d.running, false);
    clock.runTo(600000);
    assert.equal(n, 0);
  }), RUNS);
});
