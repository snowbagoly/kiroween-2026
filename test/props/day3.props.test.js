import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createGame } from '../../src/core/game.js';
import { defaultData } from '../../src/core/settings.js';
import { RUNS, seed } from './arbitraries.js';

const never = () => { const d = defaultData(); d.settings.tutorial = 'never'; return d; };

function playDayRight(g) {
  g.dispatch({ type: 'CONTINUE' });
  for (let m = 0; m < 5; m++) {
    for (const l of g.state.message.letters) g.dispatch({ type: 'LETTER', letter: l });
    g.dispatch({ type: 'NEXT_MESSAGE' });
  }
}

test('R9.1, R9.2: Day 3 mixes send and receive, and a run with random mistakes never gets stuck', () => {
  fc.assert(fc.property(seed, fc.constantFrom('night', 'day', 'deadair'), fc.array(fc.boolean(), { maxLength: 400 }), (s, mode, picks) => {
    const g = createGame({ data: never(), seed: s, judge: true });
    g.dispatch({ type: 'PICK_MODE', mode });
    playDayRight(g); g.dispatch({ type: 'NEXT_DAY' });
    playDayRight(g); g.dispatch({ type: 'NEXT_DAY' });
    assert.equal(g.state.day, 3);
    const roles = g.state.messages.map((m) => m.role);
    assert.ok(roles.filter((r) => r === 'send').length >= 2 && roles.filter((r) => r === 'receive').length >= 2);
    g.dispatch({ type: 'CONTINUE' });
    let i = 0;
    // Every step changes the state: either a letter is checked or the screen moves on.
    while (g.state.screen === 'playing' || g.state.screen === 'messageDone') {
      if (g.state.screen === 'messageDone') { g.dispatch({ type: 'NEXT_MESSAGE' }); continue; }
      const st = g.state;
      assert.equal(st.message.role, roles[st.msgIndex]);
      const right = picks[i++] ?? true;
      const l = st.message.letters[st.pos];
      const ev = g.dispatch({ type: 'LETTER', letter: right ? l : (l === 'Q' ? 'Z' : 'Q') });
      assert.ok(ev.length > 0, 'a letter always gets an answer');
      assert.ok(i < 2000, 'the day ends');
    }
    assert.ok(['dayStats', 'gameOver'].includes(g.state.screen), g.state.screen);
  }), RUNS);
});
