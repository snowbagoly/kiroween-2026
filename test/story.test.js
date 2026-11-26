// The story [T40, R17].
import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_SLIDES, storyMs, slideMs } from '../src/story/intro.js';
import { createGame } from '../src/core/game.js';
import { defaultData } from '../src/core/settings.js';

test('story: six slides in order, each with at least one line of the letter', () => {
  assert.deepEqual(STORY_SLIDES.map((s) => s.scene), ['hall', 'room', 'advert', 'train', 'station', 'office']);
  for (const s of STORY_SLIDES) assert.ok(s.lines.length >= 1, s.scene);
  assert.equal(STORY_SLIDES[0].lines[0], 'Dearest Ada,');
});

test('story: the nocturne plays to the station, the record starts on the office slide', () => {
  assert.ok(STORY_SLIDES.slice(0, 5).every((s) => s.music));
  assert.ok(!STORY_SLIDES[5].music);
  assert.equal(STORY_SLIDES[5].lines[STORY_SLIDES[5].needleAt], 'I know this waltz. I wrote it.');
});

test('story: the whole show takes about 60 to 90 seconds [R17.5]', () => {
  const s = storyMs() / 1000;
  assert.ok(s >= 60 && s <= 95, String(s));
  assert.ok(slideMs(STORY_SLIDES[0]) > 4400);
});

const game = (opts = {}) => {
  const data = defaultData();
  data.settings.tutorial = opts.tutorial ?? 'ask';
  return createGame({ data, story: true, judge: !!opts.judge, skipStory: () => !!opts.skip });
};

test('story: offered after a mode is picked, and leads into the tutorial question', () => {
  const g = game();
  g.dispatch({ type: 'PICK_MODE', mode: 'night' });
  assert.equal(g.state.screen, 'storyOffer');
  g.dispatch({ type: 'STORY_CHOICE', choice: 'read' });
  assert.equal(g.state.screen, 'story');
  g.dispatch({ type: 'STORY_DONE' });
  assert.equal(g.state.screen, 'tutorialDialog');
});

test('story: "Go straight to the desk", Day Shift too, and the tutorial set to Never goes to Day 1', () => {
  const g = game({ tutorial: 'never' });
  g.dispatch({ type: 'PICK_MODE', mode: 'day' });
  assert.equal(g.state.screen, 'storyOffer');
  g.dispatch({ type: 'STORY_CHOICE', choice: 'skip' });
  assert.equal(g.state.screen, 'dayIntro');
});

test('story: never offered in Dead Air, in Judge mode, or when always skipped [R16.8, R13.5]', () => {
  const always = game({ skip: true });
  always.dispatch({ type: 'PICK_MODE', mode: 'night' });
  assert.equal(always.state.screen, 'tutorialDialog');
  const j = game({ judge: true });
  j.dispatch({ type: 'PICK_MODE', mode: 'night' });
  assert.notEqual(j.state.screen, 'storyOffer');
  const d = createGame({ data: { ...defaultData(), deadAirUnlocked: true }, story: true });
  d.dispatch({ type: 'PICK_MODE', mode: 'deadair' });
  assert.notEqual(d.state.screen, 'storyOffer');
});
