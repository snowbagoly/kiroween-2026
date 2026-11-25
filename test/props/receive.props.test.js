import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createGame } from '../../src/core/game.js';
import { defaultData } from '../../src/core/settings.js';
import { RUNS, seed } from './arbitraries.js';

const never = () => { const d = defaultData(); d.settings.tutorial = 'never'; return d; };

// Plays Day 1 right, so the run is on Day 2 (receiving only).
function toDay2(g) {
  g.dispatch({ type: 'PICK_MODE', mode: 'day' });
  g.dispatch({ type: 'CONTINUE' });
  for (let m = 0; m < 5; m++) {
    for (const l of g.state.message.letters) g.dispatch({ type: 'LETTER', letter: l });
    g.dispatch({ type: 'NEXT_MESSAGE' });
  }
  g.dispatch({ type: 'NEXT_DAY' });
  g.dispatch({ type: 'CONTINUE' });
}

const wrongFor = (l) => (l === 'Q' ? 'Z' : 'Q');

test('R4.3, R4.4: a right letter advances by one, a wrong letter removes exactly one life', () => {
  fc.assert(fc.property(seed, fc.array(fc.boolean(), { maxLength: 120 }), fc.boolean(), (s, picks, lower) => {
    const g = createGame({ data: never(), seed: s });
    toDay2(g);
    assert.equal(g.state.day, 2);
    for (const right of picks) {
      if (g.state.screen === 'messageDone') g.dispatch({ type: 'NEXT_MESSAGE' });
      if (g.state.screen !== 'playing') break;
      const before = g.state;
      assert.equal(before.message.role, 'receive');
      const expected = before.message.letters[before.pos];
      const typed = right ? expected : wrongFor(expected);
      const ev = g.dispatch({ type: 'LETTER', letter: lower ? typed.toLowerCase() : typed });
      const after = g.state;
      if (right) {
        const finished = before.pos + 1 === before.message.letters.length;
        if (finished) assert.equal(after.screen, 'messageDone');
        else assert.equal(after.pos, before.pos + 1);
        assert.equal(after.lives, ev.some((e) => e.type === 'LIFE_REFILLED') ? before.lives + 1 : before.lives);
      } else {
        assert.equal(after.pos, before.pos);
        assert.equal(after.lives, before.lives - 1);
        assert.equal(ev.filter((e) => e.type === 'LIFE_LOST').length, 1);
      }
    }
  }), RUNS);
});
