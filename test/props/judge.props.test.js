import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createGame, SCREENS } from '../../src/core/game.js';
import { createSettingsStore, defaultData, setSetting } from '../../src/core/settings.js';
import { RUNS, seed } from './arbitraries.js';

function memoryStorage() {
  const m = new Map();
  return { writes: 0, getItem: (k) => m.get(k) ?? null, setItem(k, v) { this.writes++; m.set(k, v); } };
}

const TYPES = ['PICK_MODE', 'TUTORIAL_CHOICE', 'TUTORIAL_DONE', 'CONTINUE', 'INPUT', 'LETTER', 'NEXT_MESSAGE', 'NEXT_DAY',
  'RESTART_DAY', 'MAIN_MENU', 'END_GAME', 'JUDGE_JUMP_DAY', 'JUDGE_SET_MODE', 'JUDGE_SET_MESSAGE', 'JUDGE_SKIP', 'JUDGE_LIVES',
  'JUDGE_INFINITE', 'JUDGE_FORCE_GAMEOVER', 'JUDGE_SHOW_STATS', 'SETTING'];
const event = fc.record({
  type: fc.constantFrom(...TYPES),
  mode: fc.constantFrom('night', 'day', 'deadair'),
  choice: fc.constantFrom('start', 'notnow', 'never'),
  day: fc.constantFrom(1, 2, 3, 'closing'),
  op: fc.constantFrom('+1', '-1', 'full'),
  on: fc.boolean(),
  text: fc.constantFrom('YES', 'IT IS IN THE WIRES', 'HELLO WORLD'),
  letter: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ?'),
  key: fc.constantFrom('musicVol', 'mute', 'captions', 'tutorial'),
  value: fc.oneof(fc.boolean(), fc.double({ min: 0, max: 1, noNaN: true }), fc.constantFrom('ask', 'never')),
});

test('R13.5: Judge mode writes nothing to storage, whatever happens', () => {
  fc.assert(fc.property(seed, fc.array(fc.tuple(event, fc.boolean()), { maxLength: 250 }), (s, list) => {
    const storage = memoryStorage();
    const store = createSettingsStore({ storage, saving: false }); // what main.js makes for ?judge=1
    let data = store.load();
    const g = createGame({ data, save: (d) => { data = d; store.save(d); }, seed: s, judge: true });
    for (const [e, right] of list) {
      if (e.type === 'SETTING') { data = setSetting(data, e.key, e.value); store.save(data); continue; } // the Options menu
      const ev = e.type === 'LETTER' && right && g.state.message ? { ...e, letter: g.state.message.letters[g.state.pos] ?? e.letter } : e;
      g.dispatch(ev);
      assert.ok(SCREENS.includes(g.state.screen));
    }
    assert.equal(storage.writes, 0);
  }), RUNS);
});

test('R13.5: a full Night Shift run in Judge mode would unlock Dead Air, but still saves nothing', () => {
  const storage = memoryStorage();
  const store = createSettingsStore({ storage, saving: false });
  const d = defaultData();
  const g = createGame({ data: d, save: (x) => store.save(x), seed: 3, judge: true });
  g.dispatch({ type: 'JUDGE_JUMP_DAY', day: 3 });
  for (let m = 0; m < 5; m++) {
    while (g.state.screen === 'playing') g.dispatch({ type: 'LETTER', letter: g.state.message.letters[g.state.pos] });
    g.dispatch({ type: 'NEXT_MESSAGE' });
  }
  g.dispatch({ type: 'NEXT_DAY' });
  assert.equal(g.state.screen, 'closing');
  assert.equal(storage.writes, 0);
});
