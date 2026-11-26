// Property tests for the game clock and the drains [T35, design 16, R9.7e, R9.7f, R9.7g, R9.7h].
import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createDayClock, arrivalTimes, NIGHT_MINUTES, LAST_ARRIVAL } from '../../src/core/day-clock.js';
import { createLifeDrain, IDLE_GRACE_MS, IDLE_EVERY_MS } from '../../src/core/idle.js';
import { createRng } from '../../src/core/rng.js';
import { RUNS, seed } from './arbitraries.js';

test('R9.7: the clock never goes back or past 06:00, arrivals come in order, the day ends once', () => {
  fc.assert(fc.property(seed, fc.array(fc.record({ ms: fc.integer({ min: 0, max: 5000 }), work: fc.boolean() }), { maxLength: 400 }), (sd, steps) => {
    const arrivals = arrivalTimes(5, createRng(sd));
    const c = createDayClock({ day: 1, arrivals });
    c.start();
    let done = 0;
    let last = 0;
    const seen = [];
    const ends = [];
    for (const { ms, work } of steps) {
      if (work && done < c.arrived) done += 1;
      for (const e of c.tick(ms, { inHand: done < c.arrived, done })) (e.type === 'ARRIVED' ? seen : ends).push(e);
      assert.ok(c.minutes >= last && c.minutes <= NIGHT_MINUTES);
      last = c.minutes;
    }
    assert.deepEqual(seen.map((e) => e.index), seen.map((_, i) => i + 1));
    assert.ok(ends.length <= 1);
    if (ends.length) assert.equal(ends[0].type, done >= 5 ? 'DAWN' : 'TIME_UP');
  }), RUNS);
});

test('R9.7b: arrivals are from 22:00 to 04:00 and in order, for any seed', () => {
  fc.assert(fc.property(seed, fc.integer({ min: 1, max: 8 }), (sd, n) => {
    const a = arrivalTimes(n, createRng(sd));
    assert.equal(a.length, n);
    assert.equal(a[0], 0);
    for (let i = 1; i < n; i++) assert.ok(a[i] > a[i - 1] && a[i] <= LAST_ARRIVAL);
  }), RUNS);
});

test('R9.7f: idling for t ms costs 0 lives before 6 s, then 1 + floor((t - 6 s) / 17 s)', () => {
  fc.assert(fc.property(fc.integer({ min: 0, max: 120000 }), (t) => {
    const d = createLifeDrain();
    let n = 0;
    for (let at = 0; at < t; at += 100) n += d.tick(Math.min(100, t - at), { on: true, waiting: true }).length;
    const want = t < IDLE_GRACE_MS ? 0 : 1 + Math.floor((t - IDLE_GRACE_MS) / IDLE_EVERY_MS);
    assert.equal(n, want);
  }), RUNS);
});

test('R9.7h: no late life before 04:00 or once all is done', () => {
  fc.assert(fc.property(fc.integer({ min: 0, max: 359 }), fc.integer({ min: 0, max: 480 }), fc.integer({ min: 0, max: 200000 }), (early, any, ms) => {
    const d = createLifeDrain();
    let n = 0;
    for (let at = 0; at < ms; at += 1000) {
      n += d.tick(1000, { on: true, waiting: false, minutes: early }).length;
      n += d.tick(1000, { on: true, waiting: false, minutes: any, allDone: true }).length;
    }
    assert.equal(n, 0);
  }), RUNS);
});
