// The start card, Line Held and the new options [T39, R1.1, R1.3, R10.1a, R10.1b].
import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioEngine } from '../src/audio/engine.js';
import { startScreenHtml, ROSTER } from '../src/ui/screens.js';
import { optionsHtml } from '../src/ui/options.js';
import { defaultData, setSetting, cleanData } from '../src/core/settings.js';

function fakeCtx() {
  const node = () => ({ connect() {}, disconnect() {} });
  const c = {
    state: 'running', currentTime: 0, destination: node(), resumes: 0, suspends: 0,
    createGain() { return { ...node(), gain: { value: 0, setTargetAtTime() {} } }; },
    createDynamicsCompressor() { return node(); },
    suspend() { c.state = 'suspended'; c.suspends += 1; return Promise.resolve(); },
    resume() { c.state = 'running'; c.resumes += 1; return Promise.resolve(); },
  };
  return c;
}

test('hold: Line Held suspends the sound, and a click does not wake it until the hold ends', () => {
  let ctx;
  const engine = createAudioEngine({ createContext: () => (ctx = fakeCtx()) });
  engine.unlock();
  engine.hold(true);
  assert.equal(ctx.state, 'suspended');
  engine.unlock(); // a click inside the card
  assert.equal(ctx.state, 'suspended');
  engine.hold(false);
  assert.equal(ctx.state, 'running');
});

test('start card: the company, the name, Station 7 and three nights on the roster, tonight in pencil', () => {
  const html = startScreenHtml();
  assert.equal(ROSTER.length, 3);
  assert.match(html, /Wed\. 4 Nov\./);
  assert.equal((html.match(/class="tonight"/g) ?? []).length, 1);
  assert.match(html, /class="pencil">tonight</);
  assert.match(html, /class="start-office"/);
});

test('options: Music, Always skip the story, Full screen and Forget my hand', () => {
  const html = optionsHtml();
  for (const t of ['Music', 'Always skip the story', 'Full screen', 'Forget my hand']) assert.ok(html.includes(t), t);
  assert.equal(defaultData().settings.skipStory, false);
  assert.equal(cleanData(JSON.parse(JSON.stringify(setSetting(defaultData(), 'skipStory', true)))).settings.skipStory, true);
});
