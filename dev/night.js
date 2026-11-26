// Manual check page for T17, T22 and T23. Built to dist/dev-night.html.
import { createAudioEngine } from '../src/audio/engine.js';
import { createNightSound } from '../src/audio/office-sound.js';
import { HORROR_SOUNDS } from '../src/audio/horror-voices.js';
import { createDayMusic } from '../src/audio/music-day.js';
import { playStatic } from '../src/audio/voices.js';
import { mountCaptions } from '../src/audio/captions.js';

const audio = createAudioEngine();
audio.attachUnlock(window);
const night = createNightSound(audio);
const day = createDayMusic(audio);
const $ = (id) => document.getElementById(id);

function status() {
  $('status').textContent = night.running
    ? `Playing the office at night: rain, wind, wires, room tone and the waltz (${night.record.barsPlayed} bars so far).`
    : day.running ? 'Playing Day Shift music.' : 'Not playing';
}

$('start').addEventListener('click', () => { audio.unlock(); day.stop(); night.start(); status(); });
$('stop').addEventListener('click', () => { night.stop(); status(); });
$('tension').addEventListener('input', (e) => {
  night.setTension(Number(e.target.value));
  $('tval').textContent = Number(e.target.value).toFixed(2);
  status();
});
$('music').addEventListener('input', (e) => audio.setMusicVolume(e.target.value));
$('sfx').addEventListener('input', (e) => audio.setSfxVolume(e.target.value));
$('mute').addEventListener('change', (e) => audio.setMuted(e.target.checked));
$('day-start').addEventListener('click', () => { audio.unlock(); night.stop(); day.start(); status(); });
$('day-stop').addEventListener('click', () => { day.stop(); status(); });
const caps = mountCaptions(document.body, { enabled: () => $('captions').checked });
const sounds = { ...HORROR_SOUNDS, static: playStatic };
for (const b of document.querySelectorAll('[data-sound]')) {
  b.addEventListener('click', () => { audio.unlock(); if (sounds[b.dataset.sound](audio)) caps.show(b.dataset.sound); });
}
// From the browser console: deadAirSound('thunder'), 'crow', 'scream', 'knock' or 'static'.
window.deadAirSound = (name) => { audio.unlock(); const ok = !!sounds[name]?.(audio); if (ok) caps.show(name); return ok; };
if (new URLSearchParams(window.location.search).get('test') === '1') window.__night = { audio, night, day, caps };
