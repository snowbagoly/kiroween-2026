// Manual check page for T6: send letters with Space. Built to dist/dev-send.html.
// The real text row comes in T12; this one is only for testing.
import { createBus } from '../src/core/events.js';
import { createSendFlow } from '../src/core/send.js';
import { mountScene, setKeyDown } from '../src/ui/scene.js';
import { createAudioEngine } from '../src/audio/engine.js';
import { playTone } from '../src/audio/voices.js';
import { createPressReader, attachKeyboard } from '../src/input/keyboard.js';

const WORDS = ['E', 'SOS', 'TRAIN LATE', 'DEAD AIR'];
const app = document.getElementById('app');
mountScene(app, window.location.search);

const panel = document.createElement('div');
panel.style.cssText = 'padding:1rem;font-size:1.4rem;text-align:center';
panel.innerHTML = '<div id="word" style="letter-spacing:.4em;font-size:2rem"></div>'
  + '<div id="pattern" style="min-height:1.6em;font-family:monospace"></div>'
  + '<div id="msg" style="min-height:1.6em"></div>'
  + '<div style="opacity:.7;font-size:1rem">Hold Space to send. Under 0.3 s is a dot, longer is a dash. Wait 0.7 s to finish a letter. Enter: next message.</div>';
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
bus.on('LETTER_WRONG', ({ expected, got, pattern }) => {
  $('msg').textContent = `Wrong: you sent ${pattern} (${got ?? 'no letter'}), try ${expected} again`;
  $('pattern').textContent = '';
});
bus.on('MESSAGE_SENT', ({ mistakes }) => { $('msg').textContent = `Message sent. Mistakes: ${mistakes}. Press Enter for the next one.`; });

attachKeyboard(window, reader, { enabled: () => !flow.done });
window.addEventListener('keydown', (e) => { if (e.key === 'Enter') { wordNo++; start(); } });
start();
