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

test('start screen: the two mode buttons with their lines, and the Judge button [R1.1, R1.1a]', () => {
  const html = startScreenHtml();
  assert.ok(html.includes('Night Shift') && html.includes('scares and strange messages'));
  assert.ok(html.includes('Day Shift') && html.includes('calm, no scares'));
  assert.deepEqual([...html.matchAll(/data-pick="(\w+)"/g)].map((m) => m[1]), ['night', 'day']);
  assert.doesNotMatch(html, /disabled/);
  assert.ok(html.includes('Kiroween Judge'));
  assert.ok(html.includes('Marsh &amp; Western Telegraph Co.') && html.includes('Station 7') && html.includes('Night duty roster'));
  assert.match(html, /<h1 id="start-title">Night Shift<\/h1>/);
});
