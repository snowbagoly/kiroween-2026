import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createGame } from '../../src/core/game.js';
import { defaultData } from '../../src/core/settings.js';
import { createHorrorDirector, intensityFor, STRANGE_BOOST } from '../../src/director/horror.js';
import { RUNS, seed } from './arbitraries.js';

const never = () => { const d = defaultData(); d.settings.tutorial = 'never'; return d; };

// Plays a whole run through the game rules and returns each day's messages as the player sees them.
function playRun(s, mode) {
  const g = createGame({ data: never(), seed: s, judge: true });
  g.dispatch({ type: 'PICK_MODE', mode });
  const days = [];
  for (let d = 1; d <= 3; d++) {
    g.dispatch({ type: 'CONTINUE' });
    const seen = [];
    for (let m = 0; m < 5; m++) {
      seen.push(g.state.message);
      for (const l of g.state.message.letters) g.dispatch({ type: 'LETTER', letter: l });
      g.dispatch({ type: 'NEXT_MESSAGE' });
    }
    days.push(seen);
    g.dispatch({ type: 'NEXT_DAY' });
  }
  return days;
}

test('R6.3, R6.7: Night Shift Day 1 is strange only on the 5th message, Day 2 has 2 or more, Day 3 has 3 or more', () => {
  fc.assert(fc.property(seed, (s) => {
    const [d1, d2, d3] = playRun(s, 'night');
    assert.deepEqual(d1.map((m) => m.strange), [false, false, false, false, true]);
    assert.ok(d2.filter((m) => m.strange).length >= 2);
    assert.ok(d3.filter((m) => m.strange).length >= 3);
  }), RUNS);
});

test('R7.1: Day Shift never shows a strange message, on any day', () => {
  fc.assert(fc.property(seed, (s) => {
    for (const day of playRun(s, 'day')) assert.ok(day.every((m) => !m.strange));
  }), RUNS);
});

test('R16.1: Dead Air has 3 or more strange messages every day', () => {
  fc.assert(fc.property(seed, (s) => {
    for (const day of playRun(s, 'deadair')) assert.ok(day.filter((m) => m.strange).length >= 3);
  }), RUNS);
});

test('director: a strange message raises intensity until the next message', () => {
  const d = createHorrorDirector({ setTimer: () => 1, clearTimer: () => {}, now: () => 0 });
  const state = { day: 2, mode: 'night', lives: 10, max: 10 };
  d.start(state);
  const base = intensityFor(state);
  d.message({ strange: true });
  assert.ok(Math.abs(d.intensity - (base + STRANGE_BOOST)) < 1e-9);
  d.message({ strange: false });
  assert.equal(d.intensity, base);
});
