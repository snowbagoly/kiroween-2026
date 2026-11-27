import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, SCREENS } from '../src/core/game.js';
import { defaultData } from '../src/core/settings.js';

function sendMessage(g, t = 0) {
  const m = g.state.message;
  g.dispatch({ type: 'INPUT', t });
  m.letters.split('').forEach((l, i) => g.dispatch({ type: 'LETTER', letter: l, t: t + (i + 1) * 1000 }));
}

function playDay(g) {
  g.dispatch({ type: 'CONTINUE' });
  for (let i = 0; i < 5; i++) {
    sendMessage(g, i * 100000);
    g.dispatch({ type: 'NEXT_MESSAGE' });
  }
}

const never = () => { const d = defaultData(); d.settings.tutorial = 'never'; return d; };

test('game: starts on the start screen', () => {
  const g = createGame();
  assert.equal(g.state.screen, 'start');
  assert.ok(SCREENS.includes(g.state.screen));
});

test('game: tutorial dialog choices [R2.1a-c]', () => {
  const saves = [];
  const g = createGame({ save: (d) => saves.push(d) });
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  assert.equal(g.state.screen, 'tutorialDialog');
  g.dispatch({ type: 'TUTORIAL_CHOICE', choice: 'notnow' });
  assert.equal(g.state.screen, 'dayIntro');
  assert.equal(g.state.day, 1);
  assert.equal(saves.length, 0);

  const g2 = createGame({ save: (d) => saves.push(d) });
  g2.dispatch({ type: 'PICK_MODE', mode: 'day' });
  g2.dispatch({ type: 'TUTORIAL_CHOICE', choice: 'never' });
  assert.equal(g2.saved.settings.tutorial, 'never');
  assert.equal(saves.length, 1);

  const g3 = createGame();
  g3.dispatch({ type: 'PICK_MODE', mode: 'day' });
  g3.dispatch({ type: 'TUTORIAL_CHOICE', choice: 'start' });
  assert.equal(g3.state.screen, 'tutorial');
  g3.dispatch({ type: 'TUTORIAL_DONE' });
  assert.equal(g3.state.screen, 'dayIntro');
  assert.equal(g3.saved.settings.tutorial, 'never');
});

test('game: setting "never" skips the dialog [R2.1c]', () => {
  const g = createGame({ data: never() });
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  assert.equal(g.state.screen, 'dayIntro');
});

test('game: only Night Shift and Day Shift can be picked', () => {
  const g = createGame({ judge: true });
  g.dispatch({ type: 'PICK_MODE', mode: 'hard' });
  assert.equal(g.state.screen, 'start');
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  assert.equal(g.state.maxLives, 10);
});

test('game: a full Night Shift run ends on closing and saves best stats [R8.4]', () => {
  const saves = [];
  const g = createGame({ data: never(), save: (d) => saves.push(d), seed: 7 });
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  for (let day = 1; day <= 3; day++) {
    assert.equal(g.state.day, day);
    playDay(g);
    assert.equal(g.state.screen, 'dayStats');
    g.dispatch({ type: 'NEXT_DAY' });
  }
  assert.equal(g.state.screen, 'closing');
  assert.equal(g.saved.best.night.messages, 15);
  assert.equal(g.saved.best.night.accuracy, 100);
  assert.equal(saves.length, 1);
  g.dispatch({ type: 'CONTINUE' });
  assert.equal(g.state.screen, 'start');
});

test('game: a full Day Shift run saves its own best stats [R1.5]', () => {
  const g = createGame({ data: never() });
  g.dispatch({ type: 'PICK_MODE', mode: 'day' });
  for (let day = 1; day <= 3; day++) { playDay(g); g.dispatch({ type: 'NEXT_DAY' }); }
  assert.equal(g.state.screen, 'closing');
  assert.ok(g.saved.best.day);
  assert.equal(g.saved.best.night, null);
});

test('game: 0 lives is game over; restart gives full lives, zero stats, same messages, earlier days kept [R5.5, R5.6a]', () => {
  const g = createGame({ data: never(), seed: 3 });
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  playDay(g);
  g.dispatch({ type: 'NEXT_DAY' });
  const day1 = g.state.days;
  const day2Messages = g.state.messages.map((m) => m.id);
  g.dispatch({ type: 'CONTINUE' });
  sendMessage(g);
  g.dispatch({ type: 'NEXT_MESSAGE' });
  for (let i = 0; i < 10; i++) g.dispatch({ type: 'LETTER', letter: '?', t: i });
  assert.equal(g.state.screen, 'gameOver');
  assert.equal(g.state.lives, 0);
  g.dispatch({ type: 'RESTART_DAY' });
  assert.equal(g.state.screen, 'dayIntro');
  assert.equal(g.state.day, 2);
  assert.equal(g.state.lives, 10);
  assert.equal(g.state.msgIndex, 0);
  assert.equal(g.state.dayStats.lettersCorrect, 0);
  assert.equal(g.state.dayStats.mistakes, 0);
  assert.deepEqual(g.state.days, day1);
  assert.deepEqual(g.state.messages.map((m) => m.id), day2Messages);
});

test('game: End game drops the run and goes to start; not on start itself [R1.4]', () => {
  const g = createGame({ data: never() });
  assert.deepEqual(g.dispatch({ type: 'END_GAME' }), []);
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  g.dispatch({ type: 'CONTINUE' });
  const ev = g.dispatch({ type: 'END_GAME' });
  assert.ok(ev.some((e) => e.type === 'STOP_SOUND'));
  assert.equal(g.state.screen, 'start');
  assert.equal(g.state.day, 0);
});

test('game: mode can only be picked on the start screen [R1.6]', () => {
  const g = createGame({ data: never() });
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  g.dispatch({ type: 'CONTINUE' });
  g.dispatch({ type: 'PICK_MODE', mode: 'day' });
  assert.equal(g.state.mode, 'night');
});

test('game: three clean messages refill a life', () => {
  const g = createGame({ data: never() });
  g.dispatch({ type: 'PICK_MODE', mode: 'day' });
  g.dispatch({ type: 'CONTINUE' });
  g.dispatch({ type: 'LETTER', letter: '?' });
  g.dispatch({ type: 'LETTER', letter: g.state.message.letters[0] });
  const rest = () => g.state.message.letters.slice(g.state.pos).split('').forEach((l) => g.dispatch({ type: 'LETTER', letter: l }));
  rest(); g.dispatch({ type: 'NEXT_MESSAGE' });
  assert.equal(g.state.lives, 9);
  sendMessage(g); g.dispatch({ type: 'NEXT_MESSAGE' });
  sendMessage(g); g.dispatch({ type: 'NEXT_MESSAGE' });
  const ev = [];
  const m = g.state.message;
  for (const l of m.letters) ev.push(...g.dispatch({ type: 'LETTER', letter: l }));
  assert.ok(ev.some((e) => e.type === 'LIFE_REFILLED'));
  assert.equal(g.state.lives, 10);
});

test('game: a reload drops the run, only settings and best stats are kept [R5.6b]', () => {
  let stored = null;
  const g = createGame({ data: never(), save: (d) => { stored = JSON.parse(JSON.stringify(d)); } });
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  playDay(g);
  assert.equal(stored, null); // nothing about the run was written
  const again = createGame({ data: never() });
  assert.equal(again.state.screen, 'start');
  assert.equal(again.state.day, 0);
});
