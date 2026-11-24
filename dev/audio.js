// Manual check page for T3. Built to dist/dev-audio.html.
import { createAudioEngine } from '../src/audio/engine.js';
import { playTone } from '../src/audio/voices.js';

const audio = createAudioEngine();
audio.attachUnlock(window);
const $ = (id) => document.getElementById(id);
let hum = null;

function status() {
  $('status').textContent = audio.ready
    ? `Audio: ${audio.ctx.state}, voices playing: ${audio.activeVoices} of 8`
    : 'Audio: not started';
}

function startHum() {
  if (hum || !audio.ready) return;
  const ctx = audio.ctx;
  hum = ctx.createOscillator();
  const g = ctx.createGain();
  hum.frequency.value = 110;
  g.gain.value = 0.15;
  hum.connect(g);
  g.connect(audio.musicBus);
  hum.start();
}

$('tone').addEventListener('click', () => { audio.unlock(); startHum(); playTone(audio, { duration: 0.4 }); });
let held = null;
$('hold').addEventListener('pointerdown', () => { audio.unlock(); startHum(); held = playTone(audio); });
for (const ev of ['pointerup', 'pointerleave']) $('hold').addEventListener(ev, () => { held?.stop(); held = null; });
$('burst').addEventListener('click', () => {
  audio.unlock(); startHum();
  for (let i = 0; i < 12; i++) playTone(audio, { freq: 400 + i * 50, duration: 1, level: 0.08 });
});
$('mute').addEventListener('change', (e) => audio.setMuted(e.target.checked));
$('sfx').addEventListener('input', (e) => audio.setSfxVolume(e.target.value));
$('music').addEventListener('input', (e) => audio.setMusicVolume(e.target.value));
setInterval(status, 200);
