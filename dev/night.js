// Manual check page for T17. Built to dist/dev-night.html.
import { createAudioEngine } from '../src/audio/engine.js';
import { createNightMusic, bpmFor } from '../src/audio/music-night.js';

const audio = createAudioEngine();
audio.attachUnlock(window);
const night = createNightMusic(audio);
const $ = (id) => document.getElementById(id);

function status() {
  $('status').textContent = night.running
    ? `Playing. Heartbeat ${Math.round(bpmFor(night.tension))} beats per minute.`
    : 'Not playing';
}

$('start').addEventListener('click', () => { audio.unlock(); night.start(); status(); });
$('stop').addEventListener('click', () => { night.stop(); status(); });
$('tension').addEventListener('input', (e) => {
  night.setTension(Number(e.target.value));
  $('tval').textContent = Number(e.target.value).toFixed(2);
  status();
});
$('music').addEventListener('input', (e) => audio.setMusicVolume(e.target.value));
$('sfx').addEventListener('input', (e) => audio.setSfxVolume(e.target.value));
$('mute').addEventListener('change', (e) => audio.setMuted(e.target.checked));
if (new URLSearchParams(window.location.search).get('test') === '1') window.__night = { audio, night };
