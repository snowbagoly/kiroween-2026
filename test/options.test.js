import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSetting, defaultData } from '../src/core/settings.js';
import { optionsHtml, END_GAME_QUESTION } from '../src/ui/options.js';
import { startScreenHtml } from '../src/ui/screens.js';

test('options: setSetting changes one setting and keeps the rest', () => {
  const d = defaultData();
  const n = setSetting(d, 'musicVol', 0.25);
  assert.equal(n.settings.musicVol, 0.25);
  assert.equal(n.settings.sfxVol, d.settings.sfxVol);
  assert.equal(d.settings.musicVol, 0.8); // old data untouched
  assert.equal(setSetting(d, 'tutorial', 'never').settings.tutorial, 'never');
  assert.equal(setSetting(d, 'showLivesNumber', true).settings.showLivesNumber, true);
});

test('options: bad keys and values are ignored', () => {
  const d = defaultData();
  assert.equal(setSetting(d, 'hacker', 1), d);
  assert.equal(setSetting(d, 'tutorial', 'always').settings.tutorial, 'ask');
  assert.equal(setSetting(d, 'mute', 'yes').settings.mute, false);
  assert.equal(setSetting(d, 'musicVol', 7).settings.musicVol, 0.8);
});

test('options: the menu has every control from R10.1a', () => {
  const html = optionsHtml();
  for (const name of ['musicVol', 'sfxVol', 'mute', 'reduceFlashing', 'captions', 'showLivesNumber', 'tutorial']) {
    assert.ok(html.includes(`name="${name}"`), name);
  }
  for (const text of ['Mute', 'Reduce flashing', 'Captions', 'Show lives as a number', 'Start with tutorial', 'Ask on start', 'Never', 'End game']) {
    assert.ok(html.includes(text), text);
  }
  assert.ok(html.includes('role="dialog"') && html.includes('aria-modal="true"'));
  assert.equal(END_GAME_QUESTION, 'End your game? Your current run will be lost.');
});

test('start screen: mode buttons with their lines, Dead Air locked until unlocked [R1.1, R16.2]', () => {
  const locked = startScreenHtml({ deadAirUnlocked: false });
  assert.ok(locked.includes('Night Shift') && locked.includes('scares and strange messages'));
  assert.ok(locked.includes('Day Shift') && locked.includes('calm, no scares'));
  assert.ok(locked.includes('Finish Night Shift to unlock'));
  assert.match(locked, /data-pick="deadair" disabled/);
  assert.ok(locked.includes('Kiroween Judge'));
  const open = startScreenHtml({ deadAirUnlocked: true });
  assert.ok(open.includes('hard: 5 lives, no Morse chart, no second chance'));
  assert.doesNotMatch(open, /data-pick="deadair" disabled/);
});
