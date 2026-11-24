// Manual check page for T6 and T8: send letters with Space, watch the lives dial. Built to dist/dev-send.html.
// The real text row comes in T12; this one is only for testing.
import { createBus } from '../src/core/events.js';
import { createSendFlow } from '../src/core/send.js';
import { mountScene, setKeyDown } from '../src/ui/scene.js';
import { mountMorseChart } from '../src/ui/morse-chart.js';
import { createAudioEngine } from '../src/audio/engine.js';
import { playTone, playTick } from '../src/audio/voices.js';
import { createLives, maxLivesFor } from '../src/core/lives.js';
import { mountGalvanometer } from '../src/ui/galvanometer.js';
import { createPressReader, attachKeyboard } from '../src/input/keyboard.js';

const WORDS = ['E', 'SOS', 'TRAIN LATE', 'DEAD AIR'];
const root = document.getElementById('app');
root.innerHTML = '<div class="play"><div class="stage"></div></div>';
const app = root.querySelector('.stage');
mountScene(app, window.location.search);
mountMorseChart(root.querySelector('.play'));
const mode = new URLSearchParams(window.location.search).get('mode');
const lives = createLives(maxLivesFor(mode));
const gauge = mountGalvanometer(app, { max: lives.max });
// Test helpers: ?lives=3 starts with 3 lives, ?num=1 shows the number.
const q = new URLSearchParams(window.location.search);
while (q.has('lives') && lives.lives > Math.max(0, Number(q.get('lives')))) lives.loseLife();
gauge.set(lives.lives);

const panel = document.createElement('div');
panel.style.cssText = 'padding:1rem;font-size:1.4rem;text-align:center';
panel.innerHTML = '<div id="word" style="letter-spacing:.4em;font-size:2rem"></div>'
  + '<div id="pattern" style="min-height:1.6em;font-family:monospace"></div>'
  + '<div id="msg" style="min-height:1.6em"></div>'
  + '<div style="opacity:.7;font-size:1rem">Hold Space to send. Under 0.3 s is a dot, longer is a dash. Wait 0.7 s to finish a letter. Enter: next message. Minus key: lose a life (test).</div>'
  + '<label style="font-size:1rem"><input id="num" type="checkbox"> Show lives as a number</label>';
app.append(panel);
const $ = (id) => document.getElementById(id);

const audio = createAudioEngine();
audio.attachUnlock(window);
const bus = createBus();
let wordNo = 0;
let flow;
let tone = null;

function draw() {
  $('word').innerHTML = flow.letters
    .map((l, i) => `<span style="${i < flow.index ? 'opacity:.4' : i === flow.index ? 'text-decoration:underline;font-weight:bold' : ''}">${l}</span>`)
    .join('');
}

function start() {
  flow = createSendFlow(WORDS[wordNo % WORDS.length], bus);
  reader.reset();
  $('pattern').textContent = '';
  $('msg').textContent = '';
  draw();
}

const reader = createPressReader({
  onPressStart: () => { audio.unlock(); tone = playTone(audio); setKeyDown(app, true); },
  onPressEnd: () => { tone?.stop(); tone = null; setKeyDown(app, false); },
  onSymbol: ({ pattern }) => { $('pattern').textContent = pattern; },
  onLetter: (r) => { if (!flow.done) flow.letter(r); },
});

bus.on('LETTER_OK', ({ letter }) => { $('msg').textContent = `Right: ${letter}`; $('pattern').textContent = ''; draw(); });
function loseOne() {
  const { lives: n, dead } = lives.loseLife();
  gauge.set(n);
  playTick(audio);
  if (dead) $('msg').textContent = 'Game over: 0 lives. Press Enter to start again with full lives.';
  return dead;
}
bus.on('LETTER_WRONG', ({ expected, got, pattern }) => {
  $('pattern').textContent = '';
  if (loseOne()) return;
  $('msg').textContent = `Wrong: you sent ${pattern} (${got ?? 'no letter'}), try ${expected} again`;
});
bus.on('MESSAGE_SENT', ({ mistakes }) => {
  const { lives: n, refilled } = lives.messageDone(mistakes === 0);
  gauge.set(n);
  $('msg').textContent = `Message sent. Mistakes: ${mistakes}.${refilled ? ' 3 clean messages: one life back!' : ''} Press Enter for the next one.`;
});
$('num').addEventListener('change', (e) => gauge.showNumber(e.target.checked));
if (q.get('num') === '1') { $('num').checked = true; gauge.showNumber(true); }

attachKeyboard(window, reader, { enabled: () => !flow.done && !lives.dead });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (lives.dead) { lives.reset(); gauge.set(lives.lives); } else wordNo++;
    start();
  }
  if (e.key === '-' && !lives.dead) { audio.unlock(); loseOne(); }
});
start();
