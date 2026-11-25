import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTutorial, SHEETS, TUTORIAL_LETTER, HEARD_LETTER } from '../src/core/tutorial.js';
import { createGame } from '../src/core/game.js';
import { defaultData } from '../src/core/settings.js';
import { cardHtml } from '../src/ui/screens.js';

test('tutorial: five sheets in the order of R2.2', () => {
  assert.deepEqual(SHEETS.map((s) => s.id), ['dot', 'dash', 'letter', 'dial', 'receive']);
});

test('tutorial: each check passes on the right input and keeps the sheet on the wrong one [R2.4]', () => {
  const t = createTutorial();
  assert.equal(t.symbol('-'), 'fail');
  assert.equal(t.index, 0);
  assert.equal(t.letter('E'), null); // letters do not count on the dot sheet
  assert.equal(t.symbol('.'), 'pass');
  assert.equal(t.symbol('.'), 'fail');
  assert.equal(t.symbol('-'), 'pass');
  assert.equal(t.symbol('.'), null); // single presses do not count on the letter sheet
  assert.equal(t.letter('N'), 'fail');
  assert.equal(t.letter(null), 'fail');
  assert.equal(t.letter(TUTORIAL_LETTER), 'pass');
  assert.equal(t.typed('x'), null);
  assert.equal(t.key(), 'pass');
  assert.equal(t.typed('e'), 'fail');
  assert.equal(t.typed(HEARD_LETTER.toLowerCase()), 'pass');
  assert.equal(t.done, true);
  assert.equal(t.sheet, null);
  assert.equal(t.key(), null);
});

test('tutorial: the sheet card shows the text, a press meter on press sheets, and the skip button [R2.3, R2.5]', () => {
  const press = cardHtml('tutorial', { sheet: SHEETS[0], index: 0, total: 5 });
  assert.ok(press.includes('Note 1 of 5') && press.includes(SHEETS[0].text) && press.includes('press-meter'));
  assert.ok(press.includes('Put the sheets away'));
  const recv = cardHtml('tutorial', { sheet: SHEETS[4], index: 4, total: 5 });
  assert.ok(!recv.includes('press-meter') && recv.includes('Play it again'));
});

const ask = () => defaultData();

test('tutorial setting: first start asks; Not now keeps asking next time [R2.1a, R2.1b]', () => {
  let saved = ask();
  const g = createGame({ data: saved, save: (d) => { saved = d; } });
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  assert.equal(g.state.screen, 'tutorialDialog');
  g.dispatch({ type: 'TUTORIAL_CHOICE', choice: 'notnow' });
  assert.equal(saved.settings.tutorial, 'ask');
  const next = createGame({ data: saved });
  next.dispatch({ type: 'PICK_MODE', mode: 'day' });
  assert.equal(next.state.screen, 'tutorialDialog');
});

test('tutorial setting: finishing or skipping sets Never, and Never skips the dialog [R2.1c, R2.1d]', () => {
  let saved = ask();
  const g = createGame({ data: saved, save: (d) => { saved = d; } });
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  g.dispatch({ type: 'TUTORIAL_CHOICE', choice: 'start' });
  assert.equal(g.state.screen, 'tutorial');
  assert.equal(g.state.lives, 10);
  g.dispatch({ type: 'TUTORIAL_DONE' });
  assert.equal(saved.settings.tutorial, 'never');
  assert.equal(g.state.screen, 'dayIntro');
  assert.equal(g.state.day, 1);
  const next = createGame({ data: saved });
  next.dispatch({ type: 'PICK_MODE', mode: 'night' });
  assert.equal(next.state.screen, 'dayIntro');
});

test('tutorial: letters on the tutorial screen never cost a life', () => {
  const g = createGame();
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  g.dispatch({ type: 'TUTORIAL_CHOICE', choice: 'start' });
  for (let i = 0; i < 20; i++) g.dispatch({ type: 'LETTER', letter: 'Q' });
  assert.equal(g.state.lives, 10);
  assert.equal(g.state.screen, 'tutorial');
});
