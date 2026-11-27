// Faults, omens, the last warning and the dread [T37, design 10, R6.4 to R6.7].
import test from 'node:test';
import assert from 'node:assert/strict';
import { createFaults, strainLevel, FAULT_MARKS } from '../src/director/faults.js';
import { createDread, dreadLevels, DREAD_FROM } from '../src/director/dread.js';
import { stutterSteps } from '../src/office/light.js';

const types = (actions) => actions.map((a) => a.type);
const fall = (f, from, to) => { const out = []; for (let l = from; l >= to; l--) out.push({ lives: l, actions: f.lifeLost(l, { now: 0 }) }); return out; };

test('faults: every lost life spits, dims the room around the needle and stutters the light', () => {
  const f = createFaults({ max: 10, rng: () => 0.5 });
  const a = f.lifeLost(9);
  assert.deepEqual(types(a).slice(0, 3), ['spit', 'gaze', 'stutter']);
  assert.ok(a[0].severity > 0 && a[0].severity < 0.2);
});

test('faults: strain and the dark from the corners start below 7 of 10', () => {
  assert.equal(strainLevel(7, 10), 0);
  assert.ok(strainLevel(6, 10) > 0);
  assert.equal(strainLevel(0, 10), 1);
});

test('faults: the echo below 5, only on letters; the light goes out with knocks below 3', () => {
  const f = createFaults({ max: 10 });
  assert.ok(!types(f.lifeLost(5)).includes('echo'));
  assert.ok(types(f.lifeLost(4)).includes('echo'));
  assert.ok(!types(f.lifeLost(4, { kind: 'idle' })).includes('echo'));
  const near = f.lifeLost(2).find((a) => a.type === 'stutter');
  assert.equal(near.blackout, true);
  assert.equal(near.knock, true);
  assert.equal(f.lifeLost(4).find((a) => a.type === 'stutter').blackout, false);
});

test('faults: one omen at each of 7, 5 and 3, each a different one, at most once a day', () => {
  {
    const max = 10;
    const f = createFaults({ max, rng: () => 0.3 });
    const steps = fall(f, max - 1, 1);
    const at = steps.filter((s) => types(s.actions).includes('omen')).map((s) => s.lives);
    assert.deepEqual(at, FAULT_MARKS[max].omens);
    const seen = [f.nextOmen(), f.nextOmen(), f.nextOmen()];
    assert.equal(new Set(seen).size, 3);
    assert.equal(f.nextOmen(), null);
    // Going up and down again brings no second omen.
    f.update(max);
    assert.ok(!fall(f, max - 1, 2).some((s) => types(s.actions).includes('omen')));
  }
});

test('faults: omens wait 2.5 to 5 s, and keep 4 s apart', () => {
  const f = createFaults({ max: 10, rng: () => 0.5 });
  const delays = fall(f, 9, 3).flatMap((s) => s.actions.filter((a) => a.type === 'omen').map((a) => a.delayMs));
  assert.ok(delays[0] >= 2500 && delays[0] <= 5000);
});

test('faults: a stuck record needs the music on', () => {
  const f = createFaults({ max: 10, rng: () => 0.9 });
  const names = [f.nextOmen({ music: false }), f.nextOmen({ music: false }), f.nextOmen({ music: false })];
  assert.ok(!names.includes('recordSticks'));
});

test('faults: the last warning comes once, at one life, without its own stutter', () => {
  const f = createFaults({ max: 10 });
  const steps = fall(f, 9, 1);
  const warn = steps.filter((s) => types(s.actions).includes('lastWarning'));
  assert.deepEqual(warn.map((s) => s.lives), [1]);
  assert.ok(!types(warn[0].actions).includes('stutter'));
  assert.equal(f.lifeLost(0).length, 0); // the line snapping is its own scene
  f.reset();
  assert.equal(f.warned, false);
});

test('dread: Day 1 starts each effect at its point, Day 2 at 70% of it, Day 3 in full', () => {
  const d1 = dreadLevels(DREAD_FROM.wind, { day: 1 });
  assert.equal(d1.wind, 0);
  assert.ok(dreadLevels(DREAD_FROM.wind, { day: 2 }).wind > 0);
  assert.equal(dreadLevels(0, { day: 3 }).knock, 1);
  assert.equal(dreadLevels(1, { day: 1 }).knock, 1);
});

test('dread: nothing happens early on Day 1, and clicks and knocks only in quiet moments', () => {
  const d = createDread({ day: 1, rng: () => 0 });
  assert.deepEqual(d.tick(1, 0.1), []);
  const late = createDread({ day: 3, rng: () => 0 });
  const e = late.tick(1, 0.5, { quiet: false });
  assert.ok(e.every((x) => x.type === 'flicker'));
});

test('dread: events keep 8 s apart', () => {
  const d = createDread({ day: 3, rng: () => 0 });
  let n = 0;
  for (let i = 0; i < 40; i++) n += d.tick(0.5, 0.9).length; // 20 s
  assert.ok(n >= 2 && n <= 3, String(n));
});

test('light: a stronger stutter has more dips', () => {
  assert.ok(stutterSteps(1, () => 0.5).length > stutterSteps(0, () => 0.5).length);
});
