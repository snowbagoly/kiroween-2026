import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createGame, SCREENS } from '../../src/core/game.js';
import { defaultData } from '../../src/core/settings.js';
import { RUNS, seed } from './arbitraries.js';

const TYPES = ['PICK_MODE', 'TUTORIAL_CHOICE', 'TUTORIAL_DONE', 'CONTINUE', 'INPUT', 'LETTER', 'NEXT_MESSAGE',
  'NEXT_DAY', 'RESTART_DAY', 'MAIN_MENU', 'END_GAME', 'BOGUS'];

const event = fc.record({
  type: fc.constantFrom(...TYPES),
  mode: fc.constantFrom('night', 'day', 'nope'),
  choice: fc.constantFrom('start', 'notnow', 'never', 'x'),
  letter: fc.oneof(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), fc.string()),
  t: fc.integer({ min: 0, max: 1e7 }),
});

// The right letter most of the time, so random runs get deep into the game.
function smart(g, e, useRight) {
  if (e.type === 'LETTER' && useRight && g.state.message) {
    return { ...e, letter: g.state.message.letters[g.state.pos] ?? e.letter };
  }
  return e;
}

test('R1, R9: random events never reach an undefined screen or throw', () => {
  fc.assert(fc.property(seed, fc.boolean(), fc.array(fc.tuple(event, fc.boolean()), { maxLength: 300 }), (s, judge, list) => {
    const g = createGame({ seed: s, judge });
    for (const [e, right] of list) {
      g.dispatch(smart(g, e, right));
      const st = g.state;
      assert.ok(SCREENS.includes(st.screen), st.screen);
      if (st.lives !== null) assert.ok(st.lives >= 0 && st.lives <= st.maxLives);
      if (st.screen === 'playing') assert.ok(st.message);
    }
  }), RUNS);
});

test('R5.6a: restore gives full lives, zero stats for that day, earlier days unchanged', () => {
  const d = defaultData(); d.settings.tutorial = 'never';
  fc.assert(fc.property(seed, fc.constantFrom('night', 'day'), fc.integer({ min: 0, max: 2 }), fc.array(fc.boolean(), { maxLength: 40 }), (s, mode, extraDays, picks) => {
    const g = createGame({ data: d, seed: s });
    g.dispatch({ type: 'PICK_MODE', mode });
    // Finish some days cleanly.
    for (let i = 0; i < extraDays; i++) {
      g.dispatch({ type: 'CONTINUE' });
      for (let m = 0; m < 5; m++) {
        for (const l of g.state.message.letters) g.dispatch({ type: 'LETTER', letter: l });
        g.dispatch({ type: 'NEXT_MESSAGE' });
      }
      g.dispatch({ type: 'NEXT_DAY' });
    }
    const before = g.state.days;
    const day = g.state.day;
    g.dispatch({ type: 'CONTINUE' });
    // Random right and wrong letters, then lose all lives.
    for (const ok of picks) {
      if (g.state.screen !== 'playing') break;
      g.dispatch({ type: 'LETTER', letter: ok ? g.state.message.letters[g.state.pos] : '?' });
    }
    if (g.state.screen === 'messageDone') g.dispatch({ type: 'NEXT_MESSAGE' });
    while (g.state.screen === 'playing') g.dispatch({ type: 'LETTER', letter: '?' });
    if (g.state.screen !== 'gameOver') return; // the day ended first, nothing to restore
    g.dispatch({ type: 'RESTART_DAY' });
    const st = g.state;
    assert.equal(st.day, day);
    assert.equal(st.lives, st.maxLives);
    assert.equal(st.msgIndex, 0);
    assert.equal(st.dayStats.lettersCorrect, 0);
    assert.equal(st.dayStats.mistakes, 0);
    assert.equal(st.dayStats.messages, 0);
    assert.deepEqual(st.days, before);
  }), RUNS);
});
