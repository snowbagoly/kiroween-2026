import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { runDemo, DEMO_STEPS, DEMO_MS, panelHtml, welcomeHtml, EFFECT_BUTTONS } from '../src/judge/judge.js';
import { EFFECTS } from '../src/director/horror.js';

const J = () => createGame({ judge: true, seed: 5 });

test('judge: every day is one event away, straight to the first message [R13.3a, R13.6]', () => {
  for (const day of [1, 2, 3]) {
    const g = J();
    g.dispatch({ type: 'JUDGE_JUMP_DAY', day });
    assert.equal(g.state.screen, 'playing');
    assert.equal(g.state.day, day);
    assert.ok(g.state.message);
  }
  const g = J();
  g.dispatch({ type: 'JUDGE_JUMP_DAY', day: 'closing' });
  assert.equal(g.state.screen, 'closing');
});

test('judge: normal play ignores every judge event [R13.8]', () => {
  const g = createGame({ seed: 5 });
  for (const type of ['JUDGE_JUMP_DAY', 'JUDGE_SET_MODE', 'JUDGE_SET_MESSAGE', 'JUDGE_SKIP', 'JUDGE_LIVES', 'JUDGE_INFINITE', 'JUDGE_FORCE_GAMEOVER', 'JUDGE_SHOW_STATS']) {
    assert.deepEqual(g.dispatch({ type, day: 3, mode: 'day', text: 'HELLO', op: '-1', on: true }), []);
  }
  assert.equal(g.state.screen, 'start');
});

test('judge: lives cheats, and infinite lives never show game over [R13.3d]', () => {
  const g = J();
  g.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1 });
  g.dispatch({ type: 'JUDGE_LIVES', op: '-1' });
  assert.equal(g.state.lives, 9);
  g.dispatch({ type: 'JUDGE_LIVES', op: '+1' });
  g.dispatch({ type: 'JUDGE_LIVES', op: '+1' });
  assert.equal(g.state.lives, 10);
  g.dispatch({ type: 'JUDGE_INFINITE', on: true });
  for (let i = 0; i < 30; i++) g.dispatch({ type: 'LETTER', letter: '?' });
  assert.equal(g.state.screen, 'playing');
  assert.equal(g.state.lives, 1);
  g.dispatch({ type: 'JUDGE_LIVES', op: 'full' });
  assert.equal(g.state.lives, 10);
  g.dispatch({ type: 'JUDGE_INFINITE', on: false });
  for (let i = 0; i < 10; i++) g.dispatch({ type: 'LETTER', letter: '?' });
  assert.equal(g.state.screen, 'gameOver');
});

test('judge: skip, force game over, sample stats [R13.3c, e, f]', () => {
  const g = J();
  g.dispatch({ type: 'JUDGE_JUMP_DAY', day: 2 });
  g.dispatch({ type: 'JUDGE_SKIP' });
  assert.equal(g.state.msgIndex, 1);
  g.dispatch({ type: 'JUDGE_FORCE_GAMEOVER' });
  assert.equal(g.state.screen, 'gameOver');
  g.dispatch({ type: 'JUDGE_SHOW_STATS' });
  assert.equal(g.state.screen, 'dayStats');
  assert.ok(['Apprentice', 'Operator', 'Master'].includes(g.state.days.at(-1).rank));
});

test('judge: switch Night and Day Shift keeps the day; Day Shift never keeps a strange message [R13.4a]', () => {
  const g = J();
  g.dispatch({ type: 'JUDGE_JUMP_DAY', day: 3, mode: 'night' });
  g.dispatch({ type: 'JUDGE_SET_MODE', mode: 'day' });
  assert.equal(g.state.mode, 'day');
  assert.equal(g.state.day, 3);
  assert.ok(g.state.messages.every((m) => !m.strange));
  g.dispatch({ type: 'JUDGE_SET_MESSAGE', text: 'IT IS IN THE WIRES', strange: true });
  assert.equal(g.state.message.strange, false); // not in Day Shift
  g.dispatch({ type: 'JUDGE_SET_MODE', mode: 'night' });
  g.dispatch({ type: 'JUDGE_SET_MESSAGE', text: 'IT IS IN THE WIRES', strange: true });
  assert.equal(g.state.message.strange, true);
  assert.equal(g.state.message.letters, 'ITISINTHEWIRES');
});

test('judge: the panel has every control from R13.3 and R13.4, an effect button per horror sound, and an exit', () => {
  const html = panelHtml();
  for (const label of ['Day 1', 'Day 2', 'Day 3', 'Closing', 'Type the letter', 'Type the message', 'Skip message', '+1 life',
    'Full galvanometer', '−1 life', 'Infinite lives', 'Force game over', 'Show stats', 'Night Shift', 'Day Shift', 'Scare',
    'Captions on', 'Show a thought', 'Play demo', 'Auto-play', 'x1', 'x2', 'x4', 'Exit Kiroween Judge', 'Click anywhere to enable sound']) {
    assert.ok(html.includes(label), label);
  }
  const ids = EFFECT_BUTTONS.map(([id]) => id);
  for (const e of [...EFFECTS, 'static', 'flicker', 'strange']) assert.ok(ids.includes(e), e);
  const w = welcomeHtml();
  for (const label of ['Start demo', 'Explore', 'Day 1', 'Day 2', 'Day 3']) assert.ok(w.includes(label), label);
});

test('demo reel: 30 s, the steps from the design in order, ends on the stats screen [R13.4d]', () => {
  assert.deepEqual(DEMO_STEPS.map((s) => s.at), [...DEMO_STEPS.map((s) => s.at)].sort((a, b) => a - b));
  assert.equal(DEMO_MS, 30000);
  const g = J();
  const timers = [];
  const ctx = {
    dispatch: (e) => g.dispatch(e), autoSolve: () => Promise.resolve(), effect: () => {}, setScare: () => {}, showThought: () => {},
  };
  let ended = null;
  const demo = runDemo(ctx, { setTimer: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimer: () => {}, onEnd: (w) => { ended = w; } });
  for (const t of [...timers].sort((a, b) => a.ms - b.ms)) t.fn();
  assert.equal(ended, 'done');
  assert.equal(demo.running, false);
  assert.equal(g.state.screen, 'dayStats');
  assert.equal(Math.max(...timers.map((t) => t.ms)), 30000);
});

test('demo reel: stop() ends it, and a failing step stops it', () => {
  const timers = [];
  let why = null;
  const demo = runDemo({ setScare: () => {} }, { steps: [{ at: 0, run: () => { throw new Error('x'); } }], setTimer: (fn) => { timers.push(fn); return 1; }, clearTimer: () => {}, onEnd: (w) => { why = w; } });
  timers[0]();
  assert.equal(why, 'error');
  assert.equal(demo.running, false);
  const d2 = runDemo({ setScare: () => {} }, { steps: [], setTimer: () => 1, clearTimer: () => {}, onEnd: (w) => { why = w; } });
  d2.stop();
  assert.equal(why, 'stopped');
});
