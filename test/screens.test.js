import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardHtml, statsRows, hudLabel, DAY_INTROS } from '../src/ui/screens.js';

const stats = { messages: 5, lettersCorrect: 80, mistakes: 4, accuracy: 95.2, wpm: 4.26, livesLeft: 7, longestStreak: 31, rank: 'Operator' };
const buttons = (html) => [...html.matchAll(/data-action="([^"]+)">([^<]+)</g)].map((m) => m[2]);

test('screens: day intros for Day 2 and Day 3 explain receiving and both [R4.6, R9.5]', () => {
  assert.match(DAY_INTROS[2], /type it/);
  assert.match(DAY_INTROS[3], /send.*receive/);
  assert.match(cardHtml('dayIntro', { day: 2 }), /Day 2/);
});

test('screens: message done says sent or received', () => {
  assert.match(cardHtml('messageDone', { role: 'send' }), /Message sent/);
  assert.match(cardHtml('messageDone', { role: 'receive' }), /Message received/);
  assert.deepEqual(buttons(cardHtml('messageDone', {})), ['Next message']);
});

test('screens: stats screen shows every R8.1 number and the rank, with Next day [R8.1, R8.2, R8.3]', () => {
  const html = cardHtml('dayStats', { day: 1, stats });
  for (const label of ['Messages', 'Letters right', 'Mistakes', 'Accuracy', 'Speed', 'Lives left', 'Longest streak']) assert.ok(html.includes(label), label);
  assert.ok(html.includes('95%') && html.includes('4.3 words per minute') && html.includes('Operator'));
  assert.deepEqual(buttons(html), ['Next day']);
  assert.deepEqual(buttons(cardHtml('dayStats', { day: 3, stats })), ['Finish']);
  assert.equal(statsRows(stats).length, 7);
});

test('screens: game over has two buttons, Dead Air only Main menu [R5.5, R16.6]', () => {
  assert.deepEqual(buttons(cardHtml('gameOver', { day: 2, mode: 'night', canRestart: true })), ['Restart this day', 'Main menu']);
  assert.deepEqual(buttons(cardHtml('gameOver', { day: 2, mode: 'deadair', canRestart: false })), ['Main menu']);
  assert.match(cardHtml('gameOver', { mode: 'day' }), /Out of lives/);
});

test('screens: closing shows the run, best stats and the unlock', () => {
  const html = cardHtml('closing', { mode: 'night', totals: stats, best: stats, unlocked: true });
  assert.ok(html.includes('This run') && html.includes('Best Night Shift run') && html.includes('Dead Air is now open'));
  assert.ok(!cardHtml('closing', { mode: 'day', totals: stats, best: null, unlocked: false }).includes('Dead Air is now open'));
});

test('screens: tutorial dialog buttons [R2.1a]', () => {
  assert.deepEqual(buttons(cardHtml('tutorialDialog')), ['Start tutorial', 'Not now', 'Never']);
  assert.deepEqual(buttons(cardHtml('tutorial')), ['Put the sheets away']);
});

test('screens: playing has no card, HUD shows mode and day [R1.2]', () => {
  assert.equal(cardHtml('playing'), '');
  assert.equal(hudLabel('night', 1), 'Night Shift · Day 1');
  assert.equal(hudLabel('deadair', 3), 'Dead Air · Day 3');
});
