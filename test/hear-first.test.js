// Received letters count only after their signal has played [R4.2a], and listening is not idling [R9.7f].
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { defaultData } from '../src/core/settings.js';
import { IDLE_GRACE_MS, IDLE_EVERY_MS } from '../src/core/idle.js';

function receiving({ timed = false } = {}) {
  const data = defaultData();
  data.settings.tutorial = 'never';
  const g = createGame({ data, seed: 5, judge: true, mustHear: true, timed });
  g.dispatch({ type: 'JUDGE_SET_MODE', mode: 'night' });
  g.dispatch({ type: 'JUDGE_SET_MESSAGE', text: 'COME HOME', role: 'receive' });
  return g;
}

test('receive: a letter typed before its signal played is ignored, not a mistake', () => {
  const g = receiving();
  const lives = g.state.lives;
  const out = g.dispatch({ type: 'LETTER', letter: 'C', t: 1 });
  assert.ok(out.some((e) => e.type === 'LETTER_IGNORED'));
  assert.equal(g.state.pos, 0);
  assert.equal(g.state.lives, lives);
  g.dispatch({ type: 'LETTER', letter: 'X', t: 1 }); // a wrong guess costs nothing either
  assert.equal(g.state.lives, lives);
  assert.equal(g.state.dayStats.mistakes, 0);
});

test('receive: once heard, the right letter counts and the next must be heard again', () => {
  const g = receiving();
  g.dispatch({ type: 'HEARD', msgIndex: g.state.msgIndex, index: 0 });
  g.dispatch({ type: 'LETTER', letter: 'C', t: 1 });
  assert.equal(g.state.pos, 1);
  g.dispatch({ type: 'LETTER', letter: 'O', t: 1 });
  assert.equal(g.state.pos, 1, 'O not heard yet');
  g.dispatch({ type: 'HEARD', msgIndex: g.state.msgIndex, index: 0 }); // an old letter's signal does not count
  g.dispatch({ type: 'LETTER', letter: 'O', t: 1 });
  assert.equal(g.state.pos, 1);
  g.dispatch({ type: 'HEARD', msgIndex: g.state.msgIndex, index: 1 });
  g.dispatch({ type: 'LETTER', letter: 'O', t: 1 });
  assert.equal(g.state.pos, 2);
});

test('receive: a wrong letter after hearing still costs a life', () => {
  const g = receiving();
  const lives = g.state.lives;
  g.dispatch({ type: 'HEARD', msgIndex: g.state.msgIndex, index: 0 });
  g.dispatch({ type: 'LETTER', letter: 'X', t: 1 });
  assert.equal(g.state.lives, lives - 1);
});

test('receive: listening is not idling in Night Shift', () => {
  const data = defaultData();
  data.settings.tutorial = 'never';
  // Day 2 is receive only.
  const day2 = createGame({ data, seed: 5, judge: true, mustHear: true, timed: true });
  day2.dispatch({ type: 'JUDGE_JUMP_DAY', day: 2, mode: 'night' });
  day2.dispatch({ type: 'INPUT', t: 0 });
  assert.equal(day2.state.message.role, 'receive');
  let lost = 0;
  for (let t = 0; t < IDLE_GRACE_MS + IDLE_EVERY_MS * 3; t += 200) lost += day2.dispatch({ type: 'TICK', ms: 200 }).filter((e) => e.type === 'IDLE_LIFE_LOST').length;
  assert.equal(lost, 0);
});
