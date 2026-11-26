// Boots the app and wires everything [design 3].
// The game rules (core/game.js) own the state. This file turns keys into game events and
// game events into pictures and sounds.
import { createBus } from './core/events.js';
import { createGame, CLOCK_SCREENS } from './core/game.js';
import { createSettingsStore, setSetting, setHand } from './core/settings.js';
import { createHand } from './core/hand.js';
import { createAudioEngine } from './audio/engine.js';
import { playLetter, armDownAt } from './audio/sequencer.js';
import { MORSE } from './core/morse.js';
import { createNightSound, KEY_TONE_HZ } from './audio/office-sound.js';
import { createDayMusic } from './audio/music-day.js';
import { HORROR_SOUNDS } from './audio/horror-voices.js';
import { mountCaptions } from './audio/captions.js';
import { createHorrorDirector, intensityFor } from './director/horror.js';
import { createThoughts, SHOW_MS } from './director/thoughts.js';
import { createTutorial, HEARD_LETTER } from './core/tutorial.js';
import { createReplayCounter, replayLabel, NEXT_LETTER_PAUSE_MS, IDLE_REPLAY_MS } from './core/receive.js';
import { playTone, playTick, playTock, playStatic, playBell, playChurchBell } from './audio/voices.js';
import { wallMinutes } from './core/day-clock.js';
import { createPressReader, attachKeyboard } from './input/keyboard.js';
import { mountScene, setKeyDown, setSounderDown } from './ui/scene.js';
import { mountMorseChart } from './ui/morse-chart.js';
import { mountGalvanometer } from './ui/galvanometer.js';
import { mountOffice, usesOffice } from './office/room.js';
import { mountForm, mountTape, wordStarts, formatTime } from './office/forms.js';
import { mountTextRow } from './ui/text-row.js';
import { mountStart, showCard, hudLabel } from './ui/screens.js';
import { mountOptions } from './ui/options.js';
import { mountEffects } from './ui/effects-fx.js';
import { mountJudge } from './judge/judge.js';
import { MESSAGES } from './core/messages.js';

const query = new URLSearchParams(window.location.search);
const judge = query.get('judge') === '1'; // read once at boot [design 13]
const store = createSettingsStore({ saving: !judge }); // Judge mode never writes [R13.5]
let data = store.load();

const bus = createBus();
const audio = createAudioEngine({ music: data.settings.musicVol, sfx: data.settings.sfxVol, muted: data.settings.mute });
audio.attachUnlock(window);

// The game saves what it owns (best stats, the unlock, the tutorial choice); the Options settings and
// the learned hand are kept from main's copy, so neither side overwrites the other's changes.
const saveFromGame = (d) => {
  data = { ...data, best: d.best, deadAirUnlocked: d.deadAirUnlocked, settings: { ...data.settings, tutorial: d.settings.tutorial } };
  store.save(data);
};
const game = createGame({ data, save: saveFromGame, seed: Date.now() >>> 0, bus, judge, timed: true });
// The player's hand: learned from every press, saved after each letter (not in Judge mode) [R3.3, R3.3a].
const hand = createHand(data.hand);
const saveHand = () => { data = setHand(data, hand.saved); store.save(data); };
const handLine = () => `your hand · ${hand.wpm} words a minute`; // [R3.3b]

const app = document.getElementById('app');
// Captions follow the setting, and turn on by themselves when the browser blocks sound [R10.3].
let audioBlocked = false;
const captions = mountCaptions(document.body, { enabled: () => data.settings.captions || audioBlocked });
function checkAudioBlocked() {
  setTimeout(() => { audioBlocked = !audio.ready || audio.ctx.state !== 'running'; }, 800);
}
for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, checkAudioBlocked, { once: true });
app.innerHTML = '<div class="view"></div>';
const view = app.querySelector('.view');
let desk = null; // { mode, stage, gauge, row, hud, layer } while a run is on screen
let office = null; // the office's parts, in Night Shift and Dead Air (office/room.js)
let tapeWords = new Set(); // letter indexes that start a new word, for gaps on the tape
let options = null;
let deadAirBefore = data.deadAirUnlocked;
let card = { role: 'send', stats: null, canRestart: true, totals: null, best: null, unlocked: false };

// "Reduce flashing" in Options, or the computer's own reduce-motion setting.
const reduceFlashing = () => data.settings.reduceFlashing || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function applySettings() {
  const s = data.settings;
  audio.setMusicVolume(s.musicVol);
  audio.setSfxVolume(s.sfxVol);
  audio.setMuted(s.mute);
  night?.setMusic(s.music); // the "Music" switch turns the record off, not the room [R6.8]
  document.documentElement.classList.toggle('reduce-flashing', s.reduceFlashing);
  desk?.fx?.setReduce(reduceFlashing());
  desk?.gauge.showNumber(s.showLivesNumber);
}

// ---- input --------------------------------------------------------------

const now = () => performance.now();
const st = () => game.state;
const role = () => st().message?.role ?? 'send';
const canPlay = () => st().screen === 'playing' && !options?.isOpen;
const inTutorial = () => st().screen === 'tutorial' && !options?.isOpen;
let tone = null;
let lastInputAt = -Infinity; // the last Space press or typed letter
let tutor = null; // the tutorial sheets while the tutorial screen is open
let tutorHint = '';
let tutorReadyAt = 0; // the dial sheet takes a key only after the needle has moved
let meterRaf = 0;

const reader = createPressReader({
  hand,
  onPressStart: () => {
    lastInputAt = now();
    audio.unlock();
    tone = playTone(audio, office ? { freq: KEY_TONE_HZ } : {}); // in the office, tuned to the waltz's Eb
    if (desk) setKeyDown(desk.stage, true);
    startMeter();
    game.dispatch({ type: 'INPUT', t: now() });
  },
  onPressEnd: () => {
    tone?.stop();
    tone = null;
    if (desk) setKeyDown(desk.stage, false);
    stopMeter();
  },
  onSymbol: ({ symbol }) => {
    office?.tape.symbol(symbol);
    if (inTutorial() && tutor) tutorResult(tutor.symbol(symbol));
  },
  // A pattern that is no letter counts as a wrong letter.
  onLetter: (r) => {
    office?.tape.letter(r.letter);
    saveHand();
    showHand();
    if (inTutorial() && tutor) { tutorResult(tutor.letter(r.letter)); return; }
    if (canPlay() && role() === 'send') game.dispatch({ type: 'LETTER', letter: r.letter ?? '?', t: now() });
  },
});
attachKeyboard(window, reader, { enabled: () => (canPlay() && role() === 'send') || (inTutorial() && tutor?.sheet?.kind === 'press') });

// Tutorial keys: any key on the dial sheet, a typed letter on the listening sheet.
window.addEventListener('keydown', (e) => {
  if (!inTutorial() || !tutor || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const kind = tutor.sheet?.kind;
  if (kind === 'key') {
    if (['Tab', 'Escape', 'Shift'].includes(e.key) || now() < tutorReadyAt) return;
    e.preventDefault();
    tutorResult(tutor.key());
  } else if (kind === 'type' && /^[a-z]$/i.test(e.key)) {
    e.preventDefault();
    tutorResult(tutor.typed(e.key));
  } else if (kind === 'type' && e.key === ' ') {
    e.preventDefault();
  }
});

// The codebook card: a click holds it up close, a click or Esc puts it back [R3.1a]. No letter key,
// since the letters are needed for typing received messages.
let codebookZoom = null;
function toggleCodebook(open = !codebookZoom) {
  codebookZoom?.remove();
  codebookZoom = null;
  const card = office?.codebookSpot.querySelector('.morse-chart');
  if (!open || !card) return;
  codebookZoom = document.createElement('div');
  codebookZoom.className = 'codebook-zoom';
  codebookZoom.setAttribute('aria-hidden', 'true'); // the card on the wall stays the readable copy
  codebookZoom.append(card.cloneNode(true));
  codebookZoom.addEventListener('click', () => toggleCodebook(false));
  document.body.append(codebookZoom);
}
// Esc puts the card back before it reaches the Options menu.
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !codebookZoom) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  toggleCodebook(false);
}, true);

// Backspace tears off the paper tape, and drops a half-keyed letter with it [R3.4a].
// Ignored while a received letter is awaited.
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Backspace' || !office || options?.isOpen || role() === 'receive') return;
  if (!canPlay() && !inTutorial()) return;
  e.preventDefault();
  reader.reset();
  office.tape.tear();
});

// Keyboard safety net for cards: if nothing has focus while a card is up (focus can drop to the
// page when the card is redrawn), Enter presses the card's first button [R10.1].
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.repeat || options?.isOpen) return;
  const a = document.activeElement;
  if (a && a !== document.body && a !== document.documentElement) return;
  const first = desk?.layer && !desk.layer.hidden ? desk.layer.querySelector('[data-action]') : null;
  if (!first || st().screen === 'playing' || st().screen === 'tutorial') return;
  e.preventDefault();
  first.click();
});

// Receiving: type the letter you heard. No Enter needed, not case-sensitive [R4.3].
window.addEventListener('keydown', (e) => {
  // Space never scrolls the page during play, also on receive messages where it sends nothing.
  if (canPlay() && (e.code === 'Space' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) e.preventDefault();
  if (!canPlay() || role() !== 'receive' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (!/^[a-z]$/i.test(e.key)) return;
  if (e.defaultPrevented) return;
  e.preventDefault();
  lastInputAt = now();
  recv.clearIdle();
  game.dispatch({ type: 'INPUT', t: now() });
  game.dispatch({ type: 'LETTER', letter: e.key.toUpperCase(), t: now() });
});

// ---- receiving: play one letter, wait for the typed letter -----------------

const recv = {
  counter: createReplayCounter('night'),
  idleUsed: false, // the 15 s replay happens once per letter
  busyUntil: 0, // audio-clock time when the current letter stops sounding
  timer: null,
  idle: null,
  raf: 0,
  clearIdle() { clearTimeout(recv.idle); recv.idle = null; },
  stop() {
    clearTimeout(recv.timer);
    recv.timer = null;
    recv.clearIdle();
    cancelAnimationFrame(recv.raf);
    if (desk) setSounderDown(desk.stage, false);
    recv.busyUntil = 0;
  },
};
const receiving = () => canPlay() && role() === 'receive';
const playingNow = () => audio.ready && audio.ctx.currentTime < recv.busyUntil;

function animateArm(schedule, end) {
  cancelAnimationFrame(recv.raf);
  const step = () => {
    if (!desk || !audio.ready) return;
    const t = audio.ctx.currentTime; // the arm reads the audio clock, so it moves with the tones
    setSounderDown(desk.stage, armDownAt(schedule, t));
    if (t < end + 0.05) recv.raf = requestAnimationFrame(step);
    else setSounderDown(desk.stage, false);
  };
  recv.raf = requestAnimationFrame(step);
}

// Plays one received letter with the sounder arm. Returns the schedule, or null with no sound.
function playReceived(letter, speed = 1) {
  audio.unlock();
  const h = playLetter(audio, letter, office ? { speed, freq: KEY_TONE_HZ } : { speed });
  if (h) {
    recv.busyUntil = h.end;
    animateArm(h.schedule, h.end);
  }
  return h;
}

// ---- tutorial -------------------------------------------------------------

// The hold meter: full at twice the player's threshold, so the mark (where a dot becomes a dash, from
// the learned hand) sits in the middle [R2.3].
const meterScale = () => hand.threshold * 2;
const meterBars = () => [...document.querySelectorAll('.press-meter')];
function placeMeterMarks() {
  for (const m of meterBars()) m.querySelector('.press-mark').style.left = `${(hand.threshold / meterScale()) * 100}%`;
}
function showHand() {
  for (const el of document.querySelectorAll('.hand-line')) el.textContent = handLine();
  placeMeterMarks();
}

function startMeter() {
  const t0 = now();
  cancelAnimationFrame(meterRaf);
  const step = () => {
    if (!reader.pressing) return;
    const ms = now() - t0;
    const dash = ms >= hand.threshold;
    for (const m of meterBars()) {
      const bar = m.querySelector('.press-bar');
      bar.style.width = `${Math.min(1, ms / meterScale()) * 100}%`;
      bar.classList.toggle('dash', dash);
      const label = m.querySelector('.press-label');
      if (label) label.textContent = dash ? 'dash' : 'dot';
    }
    meterRaf = requestAnimationFrame(step);
  };
  meterRaf = requestAnimationFrame(step);
}

function stopMeter() {
  cancelAnimationFrame(meterRaf);
  // The bar keeps its last length for a moment so the player can see what the press was.
}

function drawSheet() {
  if (!desk || !tutor?.sheet) return;
  showCard(desk.layer, 'tutorial', { sheet: tutor.sheet, index: tutor.index, total: 5, hint: tutorHint }, onAction);
  placeMeterMarks();
  document.activeElement?.blur?.();
  const slot = desk.stage.querySelector('#galvanometer-slot');
  const dial = tutor.sheet.id === 'dial';
  slot.classList.toggle('pulse', dial);
  if (dial) {
    // Show the needle swing down one step and back, the way a mistake and a refill look.
    tutorReadyAt = now() + 1500;
    const max = st().maxLives;
    setTimeout(() => desk?.gauge.set(max - 1), 300);
    setTimeout(() => desk?.gauge.set(max), 1200);
  }
  if (tutor.sheet.id === 'receive') playTutorLetter(800);
}

function playTutorLetter(delayMs) {
  clearTimeout(recv.timer);
  recv.timer = setTimeout(() => {
    if (inTutorial() && tutor?.sheet?.id === 'receive' && !playingNow()) playReceived(HEARD_LETTER);
  }, delayMs);
}

// A sheet check finished. Pass: next sheet, or the tutorial ends. Fail: same sheet with a hint, no life lost.
function tutorResult(r) {
  if (!r || !tutor) return;
  if (r === 'fail') {
    tutorHint = tutor.sheet.hint;
    const hint = desk?.layer.querySelector('.sheet-hint');
    if (hint) hint.textContent = tutorHint;
    if (tutor.sheet.id === 'receive') playTutorLetter(500);
    return;
  }
  tutorHint = '';
  reader.reset();
  if (tutor.done) { game.dispatch({ type: 'TUTORIAL_DONE' }); return; }
  // Leave the finished sheet up a moment before the next one.
  setTimeout(() => { if (inTutorial()) drawSheet(); }, 450);
}

// Plays the letter the player has to type, after `delayMs` (and after any letter still sounding).
function playCurrent(delayMs = 0) {
  clearTimeout(recv.timer);
  recv.clearIdle();
  const left = playingNow() ? (recv.busyUntil - audio.ctx.currentTime) * 1000 + 150 : 0;
  recv.timer = setTimeout(() => {
    recv.timer = null;
    if (!receiving() || solving) return;
    const s = st();
    const letter = s.message.letters[s.pos];
    if (!letter) return;
    const h = playReceived(letter);
    const soundMs = h ? (h.end - audio.ctx.currentTime) * 1000 : 0;
    // No input for 15 s: play it once more, free [R4.5a].
    recv.idle = setTimeout(() => {
      if (!receiving() || recv.idleUsed) return;
      recv.idleUsed = true;
      playCurrent(0);
    }, soundMs + IDLE_REPLAY_MS);
    updateReplay();
  }, Math.max(delayMs, left));
}

function updateReplay() {
  const b = desk?.replay;
  if (!b) return;
  const show = st().screen === 'playing' && role() === 'receive';
  b.parentElement.hidden = !show;
  b.textContent = replayLabel(recv.counter);
  b.disabled = !recv.counter.canUse();
}

function onReplay() {
  if (!receiving() || playingNow()) return;
  if (!recv.counter.use()) return; // 3 per message in Night Shift, unlimited in Day Shift [R4.5]
  playCurrent(0);
  updateReplay();
}

// ---- screens ------------------------------------------------------------

const ACTIONS = {
  'tutorial-start': { type: 'TUTORIAL_CHOICE', choice: 'start' },
  'tutorial-notnow': { type: 'TUTORIAL_CHOICE', choice: 'notnow' },
  'tutorial-never': { type: 'TUTORIAL_CHOICE', choice: 'never' },
  'tutorial-done': { type: 'TUTORIAL_DONE' },
  continue: { type: 'CONTINUE' },
  'next-message': { type: 'NEXT_MESSAGE' },
  'next-day': { type: 'NEXT_DAY' },
  'restart-day': { type: 'RESTART_DAY' },
  'main-menu': { type: 'MAIN_MENU' },
};

function onAction(action) {
  audio.unlock();
  if (action === 'tutorial-replay') { playTutorLetter(0); return; }
  const s = st().screen;
  // The closing screen leaves with CONTINUE; the game-over screen with MAIN_MENU.
  if (action === 'main-menu' && s === 'closing') game.dispatch({ type: 'CONTINUE' });
  else if (ACTIONS[action]) game.dispatch(ACTIONS[action]);
}

// ---- the endings [R5.5, R9.9] ------------------------------------------------
// The line dies (Night Shift and Dead Air): darkness and silence, then the sounder taps out
// "THE LINE IS DEAD" by itself in the player's own hand, each letter surfacing as it ends, and then
// the dismissal notice. A key or a click skips to the notice.
const DEAD_MESSAGE = 'THE LINE IS DEAD';
const DARKNESS_MS = 2600;
const NOTICE_DELAY_MS = 2500;
let deadTimers = [];
function deadLine() {
  const layer = desk.layer;
  deadTimers.forEach(clearTimeout);
  deadTimers = [];
  tone?.stop(); tone = null;
  night.stop(); director.stop(); recv.stop(); reader.reset();
  layer.classList.add('dead-line');
  layer.insertAdjacentHTML('afterbegin', '<p class="dead-words" aria-live="assertive"></p>');
  const words = layer.querySelector('.dead-words');
  const notice = () => {
    deadTimers.forEach(clearTimeout);
    deadTimers = [];
    window.removeEventListener('keydown', skip, { capture: true });
    if (layer.classList.contains('noticed')) return;
    // Skipped: the whole message stands there at once.
    words.innerHTML = [...DEAD_MESSAGE].map((c) => (c === ' ' ? '<span class="space"></span>' : `<span style="animation: none">${c}</span>`)).join('');
    layer.classList.add('noticed');
    layer.querySelector('[data-action]')?.focus();
  };
  const skip = (e) => {
    if (!layer.classList.contains('dead-line') || layer.classList.contains('noticed')) return;
    if (e.type === 'keydown' && ['Tab', 'Shift', 'Escape'].includes(e.key)) return;
    e.preventDefault?.();
    notice();
  };
  window.addEventListener('keydown', skip, { capture: true });
  layer.addEventListener('pointerdown', skip);
  const handS = { dot: hand.dot / 1000, dash: hand.dash / 1000, gap: hand.unit / 1000 };
  let at = DARKNESS_MS;
  for (const c of DEAD_MESSAGE) {
    if (c === ' ') { at += hand.letterGap * 1.4; deadTimers.push(setTimeout(() => words.insertAdjacentHTML('beforeend', '<span class="space"></span>'), at)); continue; }
    const pattern = MORSE[c];
    const len = [...pattern].reduce((n, s) => n + (s === '.' ? hand.dot : hand.dash) + hand.unit, 0);
    deadTimers.push(setTimeout(() => playLetter(audio, c, { hand: handS, lead: 0.01 }), at));
    at += len;
    deadTimers.push(setTimeout(() => {
      const span = document.createElement('span');
      span.textContent = c;
      span.style.setProperty('--tilt', `${(Math.random() * 8 - 4).toFixed(1)}deg`);
      span.style.setProperty('--drop', `${(Math.random() * 10 - 5).toFixed(1)}px`);
      words.append(span);
    }, at));
    at += hand.letterGap;
  }
  deadTimers.push(setTimeout(notice, at + NOTICE_DELAY_MS));
}

// The dawn (Night Shift and Dead Air): the window's sky goes pale, the lamp gutters out, the light
// comes in through the window, and a church bell strikes six; then the notice [R9.9].
const DAWN_NOTICE_MS = 6000;
let dawnUntil = 0;
let dawnTimer = null;
bus.on('DAWN', () => {
  if (!office) return;
  dawnUntil = now() + DAWN_NOTICE_MS;
  office.office.classList.add('at-dawn');
  director.stop();
  for (let i = 0; i < 6; i++) setTimeout(() => playChurchBell(audio), 1200 + i * 1400);
  captions.show('church');
});
bus.on('DAY_STARTED', () => { office?.office.classList.remove('at-dawn'); deadTimers.forEach(clearTimeout); });

// A finished message: after a moment to see the stamp (or the card), the next one starts by itself.
// It waits while the Options menu is open.
const NEXT_MESSAGE_MS = 1600;
let nextTimer = null;
function scheduleNextMessage(screen) {
  clearTimeout(nextTimer);
  nextTimer = null;
  if (screen !== 'messageDone') return;
  const fire = () => {
    if (st().screen !== 'messageDone') return;
    if (options?.isOpen) { nextTimer = setTimeout(fire, 500); return; }
    game.dispatch({ type: 'NEXT_MESSAGE' });
  };
  nextTimer = setTimeout(fire, NEXT_MESSAGE_MS);
}

function renderStart() {
  scheduleNextMessage(null);
  toggleCodebook(false);
  recv.stop();
  clearTimeout(thoughtTimer);
  desk = null;
  office?.unmount();
  office = null;
  reader.reset();
  document.documentElement.dataset.mode = 'night';
  mountStart(view, {
    data,
    judge,
    onPick: (mode) => { audio.unlock(); game.dispatch({ type: 'PICK_MODE', mode }); },
    onJudge: () => { window.location.search = '?judge=1'; },
  });
}

function buildDesk(s) {
  document.documentElement.dataset.mode = s.mode === 'day' ? 'day' : 'night';
  toggleCodebook(false);
  office?.unmount();
  office = null;
  view.innerHTML = '<div class="play"><div class="stage"></div></div><div class="card-layer" hidden></div>';
  const stage = view.querySelector('.stage');
  const lives = s.lives ?? s.maxLives;
  let row, gauge;
  const hud = document.createElement('p');
  hud.className = 'hud-label';
  if (usesOffice(s.mode)) {
    // Night Shift and Dead Air are played in the office [R11.4]; Day Shift keeps its desk [R7.2a].
    office = mountOffice(stage, { max: s.maxLives, lives, day: s.day });
    const chart = mountMorseChart(office.codebookSpot, s.mode);
    if (chart) chart.addEventListener('click', () => toggleCodebook());
    else office.codebookSpot.innerHTML = '<div class="bare-wall" aria-hidden="true"><i></i><i></i></div>'; // Dead Air [R16.5]
    // The message is a telegram form on the desk, and each press goes onto the paper tape [R3.1, R3.4a].
    office.tape = mountTape(office.work);
    row = mountForm(office.formSpot);
    office.hud.append(hud);
    gauge = office.gauge;
  } else {
    mountScene(stage, '?mode=day'); // replaces the stage's content
    mountMorseChart(view.querySelector('.play'), s.mode);
    row = mountTextRow(stage);
    stage.prepend(hud);
    gauge = mountGalvanometer(stage, { max: s.maxLives, lives });
  }
  (office ? office.work : stage.querySelector('.text-row-box')).insertAdjacentHTML('afterend', '<p class="replay-row" hidden><button type="button" class="replay-btn">Replay</button></p>');
  // The hold meter with the learned dot/dash mark, and the player's speed, under the message [R2.3, R3.3b].
  (office ? office.work : stage.querySelector('.text-row-box')).insertAdjacentHTML('beforeend',
    '<div class="press-meter play-meter" aria-hidden="true"><div class="press-bar"></div><span class="press-mark"></span></div><p class="hand-line"></p>');
  const replay = stage.querySelector('.replay-btn');
  replay.addEventListener('click', () => { onReplay(); replay.blur(); });
  recv.counter = createReplayCounter(s.mode);
  // Screen effects exist only in Night Shift and Dead Air; Day Shift never loads them [R7.1].
  const fx = s.mode === 'day' ? null : mountEffects(stage, { reduce: reduceFlashing() });
  fx?.setIntensity(nightTension(s));
  // Thoughts: a line at the bottom of the desk. A status region, so it never takes focus [R12.3].
  stage.insertAdjacentHTML('beforeend', '<p class="thought-line" role="status" aria-live="polite"></p>');
  const thought = stage.querySelector('.thought-line');
  desk = { mode: s.mode, stage, gauge, row, hud, replay, fx, thought, layer: view.querySelector('.card-layer') };
  applySettings();
  showHand();
}

function renderRun(s) {
  if (!desk || desk.mode !== s.mode) buildDesk(s);
  office?.setDay(s.day);
  desk.hud.textContent = hudLabel(s.mode, s.day) + (s.clock ? ` · ${s.clock.time}` : '');
  if (judge) desk.hud.insertAdjacentHTML('afterbegin', '<span class="judge-badge">JUDGE</span> '); // [R13.2]
  if (s.screen === 'tutorial') {
    tutor ??= createTutorial();
    reader.reset();
    drawSheet();
    updateReplay();
    return;
  }
  tutor = null;
  desk.stage.querySelector('#galvanometer-slot')?.classList.remove('pulse');
  const notice = { time: s.clock?.time, total: s.messageCount, stats: s.screen === 'gameOver' ? s.dayStats : card.stats };
  if (s.screen === 'dayStats' && office && now() < dawnUntil) {
    // The dawn plays first; the notice comes up while the bell is still striking [R9.9].
    desk.layer.hidden = true;
    clearTimeout(dawnTimer);
    dawnTimer = setTimeout(() => { if (st().screen === 'dayStats') renderRun(st()); }, dawnUntil - now());
    return;
  }
  showCard(desk.layer, s.screen, { ...card, ...notice, day: s.day, mode: s.mode, office: !!office }, onAction);
  desk.layer.classList.remove('dead-line', 'noticed');
  if (s.screen === 'gameOver' && office) deadLine();
  scheduleNextMessage(s.screen);
  if (s.screen === 'playing') {
    // No button keeps focus, so Space and letters go to the game.
    document.activeElement?.blur?.();
  } else {
    reader.reset();
    recv.stop();
  }
  updateReplay();
}

// ---- Night Shift sound bed and the horror director ---------------------------

const night = createNightSound(audio, { music: data.settings.music }); // the office's sound and the record [R6.1, R6.2]
const dayMusic = createDayMusic(audio);
const NIGHT_SCREENS = ['dayIntro', 'playing', 'messageDone', 'waiting', 'dayStats', 'gameOver'];
const director = createHorrorDirector({
  // Never while Space is down or a received letter is sounding [R6.5].
  isBusy: () => reader.pressing || playingNow(),
  onEffect: (name, info) => bus.emit('HORROR_EFFECT', { name, ...info }), // sounds and pictures come in T22
});
const directorState = (s) => ({ day: s.day || 1, mode: s.mode, lives: s.lives ?? s.maxLives ?? 10, max: s.maxLives ?? 10 });
// Music tension and the vignette follow the director's intensity [design 10].
function nightTension(s) {
  if (judgeScare !== null) return judgeScare; // the Judge scare dial wins [R13.4b]
  return intensityFor(directorState(s)) + (st().message?.strange ? 0.15 : 0);
}
function updateNight() {
  const s = st();
  const nightMode = s.mode === 'night' || s.mode === 'deadair';
  // The dead line is silent: no night sound under it [R5.5].
  const want = nightMode && NIGHT_SCREENS.includes(s.screen) && s.screen !== 'gameOver';
  if (want && !night.running) { audio.unlock(); night.start(); }
  if (!want && night.running) night.stop();
  // Day Shift has its own calm music on the same screens [R7.3].
  const wantDay = s.mode === 'day' && NIGHT_SCREENS.includes(s.screen);
  if (wantDay && !dayMusic.running) { audio.unlock(); dayMusic.start(); }
  if (!wantDay && dayMusic.running) dayMusic.stop();
  // Random effects only while a message is being worked on, never in Day Shift [R7.1].
  if (nightMode && s.screen === 'playing') {
    if (!director.running) director.start(directorState(s));
    else director.update(directorState(s));
    if (options?.isOpen) director.pause(); else director.resume();
  } else if (nightMode && (s.screen === 'messageDone' || s.screen === 'waiting')) {
    director.pause();
  } else if (director.running) {
    director.stop();
  }
  if (night.running) night.setTension(nightTension(s));
  desk?.fx?.setIntensity(nightTension(s));
}

function render() {
  const s = st();
  updateNight();
  if (s.screen === 'start') renderStart();
  else renderRun(s);
}

// ---- game events to pictures and sounds ----------------------------------

// ---- thoughts -----------------------------------------------------------------

let thoughts = createThoughts();
let thoughtTimer = null;
const THOUGHT_DELAY_MS = 700; // shortly after the message appears
const THOUGHT_GIVE_UP_MS = 6000; // still busy after this: drop it, it was never shown
// Never while Space is down or the player is typing [R12.2].
const thoughtBlocked = () => reader.pressing || now() - lastInputAt < 1200 || !!options?.isOpen;

function showThought(th) {
  if (!desk?.thought) return;
  if (!th.judge) thoughts.shown(th); // Judge thoughts do not use up the day's two
  const el = desk.thought;
  el.textContent = th.text;
  el.classList.remove('on');
  void el.offsetWidth;
  el.classList.add('on'); // CSS fades it out over 8 s
  clearTimeout(el.__clear);
  el.__clear = setTimeout(() => { el.classList.remove('on'); el.textContent = ''; }, SHOW_MS);
}

function queueThought(th) {
  clearTimeout(thoughtTimer);
  const until = now() + THOUGHT_GIVE_UP_MS;
  const attempt = () => {
    const sc = st().screen;
    if (sc !== 'playing' && sc !== 'messageDone') return;
    if (!thoughtBlocked()) { showThought(th); return; }
    if (now() < until) thoughtTimer = setTimeout(attempt, 300);
  };
  thoughtTimer = setTimeout(attempt, THOUGHT_DELAY_MS);
}

bus.on('RUN_STARTED', () => { deadAirBefore = data.deadAirUnlocked; thoughts = createThoughts(); });
bus.on('DAY_STARTED', ({ lives, max }) => {
  thoughts.newDay(); // at most 2 thoughts a day [R12.2]
  if (!desk) return;
  desk.gauge.setMax(max, lives);
  applySettings();
  desk.row.clear();
});
bus.on('MESSAGE_STARTED', ({ message }) => {
  card.role = message.role;
  const th = thoughts.pick(message);
  if (th) queueThought(th);
  desk?.row.show(message.text, message.role, message);
  tapeWords = wordStarts(message.text);
  office?.tape.gap();
  // A strange message looks wrong on the row and makes the night worse while it lasts [R6.3].
  desk?.row.setStrange(!!message.strange && st().mode !== 'day');
  director.message(message);
  if (message.strange && st().mode !== 'day') bus.emit('HORROR_EFFECT', { name: 'strange', intensity: director.intensity });
  updateNight();
  recv.stop();
  recv.counter.reset();
  recv.idleUsed = false;
  if (message.role === 'receive') playCurrent(700);
});
bus.on('LETTER_OK', ({ next }) => {
  desk?.row.setPos(next);
  if (role() === 'send' && office && tapeWords.has(next)) office.tape.gap();
  if (role() !== 'receive') return;
  recv.idleUsed = false;
  if (next < (st().message?.letters.length ?? 0)) playCurrent(NEXT_LETTER_PAUSE_MS); // R4.3
});
bus.on('LETTER_WRONG', () => {
  desk?.row.wrong();
  if (role() === 'send') office?.tape.wrong();
  // A mistake in Night Shift: static and flicker, or a slow fade with "Reduce flashing" [R6.4, R6.6].
  if (desk?.fx && desk.fx.mistake()) { playStatic(audio); captions.show('static'); }
  if (role() === 'receive') playCurrent(NEXT_LETTER_PAUSE_MS); // same letter again, free [R4.4]
});
// In the office the needle jolts with a dull tock; the Day Shift dial ticks [R5.2].
bus.on('LIFE_LOST', ({ lives }) => { desk?.gauge.set(lives); (office ? playTock : playTick)(audio); updateNight(); });
bus.on('LIFE_REFILLED', ({ lives }) => { desk?.gauge.set(lives); updateNight(); });
bus.on('LIVES_SET', ({ lives, max }) => { if (desk && desk.gauge.state.max !== max) desk.gauge.setMax(max, lives); else desk?.gauge.set(lives); updateNight(); });
// A finished form is stamped SENT or RECEIVED with the office's time [R3.7, R4.5b].
bus.on('MESSAGE_DONE', () => { if (office) desk?.row.stamp?.(formatTime(office.minutes)); });
// ---- the game clock [R9.7] ---------------------------------------------------
// Real time goes to the game in small steps while a day runs. It stops while the game is held:
// Options open, or the tab hidden [R10.1b]. Judge speed runs it faster.
const TICK_MS = 200;
let lastTick = now();
setInterval(() => {
  const t = now();
  const ms = t - lastTick;
  lastTick = t;
  if (options?.isOpen || document.hidden || !CLOCK_SCREENS.includes(st().screen)) return;
  game.dispatch({ type: 'TICK', ms: ms * (judgeUi?.speed ?? 1) });
}, TICK_MS);
document.addEventListener('visibilitychange', () => { lastTick = now(); });

// The wall clock, the window's sky toward dawn (from 60% of the night), the HUD time [R9.7, R9.9].
const DAWN_FROM = 0.6;
bus.on('CLOCK', ({ minutes, time, progress, waiting }) => {
  office?.setTime(wallMinutes(minutes));
  office?.office.querySelector('.room-window')?.style.setProperty('--dawn', Math.max(0, (progress - DAWN_FROM) / (1 - DAWN_FROM)).toFixed(3));
  if (desk) desk.hud.textContent = hudLabel(st().mode, st().day) + ` · ${time}`;
  desk?.row.setWaiting?.(waiting);
});
// A telegram is handed in: the counter bell; it waits on the spike if the desk is busy [R9.7b, R9.7c].
bus.on('ARRIVED', ({ waiting }) => {
  playBell(audio);
  captions.show('bell');
  desk?.row.setWaiting?.(waiting);
});
bus.on('DESK_EMPTY', () => { desk?.row.clear(); updateReplay(); });

bus.on('DAY_ENDED', ({ stats }) => { card.stats = stats; });
bus.on('GAME_OVER', ({ canRestart, reason }) => { card.canRestart = canRestart; card.reason = reason; });
bus.on('RUN_FINISHED', ({ totals, best, deadAirUnlocked }) => {
  card.totals = totals;
  card.best = best;
  card.unlocked = deadAirUnlocked && !deadAirBefore;
});
bus.on('STOP_SOUND', () => { tone?.stop(); tone = null; night.stop(); dayMusic.stop(); director.stop(); });
// Horror effects from the director: the sound and its caption [R6.1, R10.3]. Never in Day Shift.
function playHorror(name) {
  if (st().mode === 'day') return false;
  const play = HORROR_SOUNDS[name];
  if (!play) return false;
  audio.unlock();
  const v = play(audio);
  if (v) captions.show(name);
  return !!v;
}
bus.on('HORROR_EFFECT', ({ name }) => playHorror(name));
bus.on('SCREEN', render);

// ---- Kiroween Judge mode [R13] ------------------------------------------------

let solving = false; // the Judge is typing a letter or a message right now
let judgeScare = null; // 0..1 from the scare dial, or null for the director's own value
let judgeUi = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let keyRaf = 0;

// A sent letter played by the Judge: the telegraph tone with the key lever, no sounder clicks.
function playSent(letter, speed) {
  audio.unlock();
  const h = playLetter(audio, letter, { speed, clicks: false });
  if (!h || !desk) return h;
  cancelAnimationFrame(keyRaf);
  const step = () => {
    if (!desk || !audio.ready) return;
    const t = audio.ctx.currentTime;
    setKeyDown(desk.stage, armDownAt(h.schedule, t));
    if (t < h.end + 0.05) keyRaf = requestAnimationFrame(step);
    else setKeyDown(desk.stage, false);
  };
  keyRaf = requestAnimationFrame(step);
  return h;
}

// "Type it correctly" [R13.3b]: plays each letter with the same sequencer as the game, then counts it.
async function autoSolve(scope = 'message') {
  if (solving || st().screen !== 'playing') return;
  solving = true;
  recv.stop();
  reader.reset();
  try {
    do {
      const s = st();
      if (s.screen !== 'playing') break;
      const l = s.message?.letters[s.pos];
      if (!l) break;
      const speed = judgeUi?.speed ?? 1;
      const h = s.message.role === 'receive' ? playReceived(l, speed) : playSent(l, speed);
      const soundMs = h ? Math.max(0, (h.end - audio.ctx.currentTime) * 1000) : 200;
      await sleep(soundMs + (s.message.role === 'receive' ? 380 : 260) / speed);
      const after = st();
      if (after.screen !== 'playing' || after.pos !== s.pos || after.msgIndex !== s.msgIndex) break;
      lastInputAt = now();
      game.dispatch({ type: 'INPUT', t: now() });
      game.dispatch({ type: 'LETTER', letter: l, t: now() });
    } while (scope === 'message');
  } finally {
    solving = false;
    if (receiving()) playCurrent(NEXT_LETTER_PAUSE_MS);
  }
}

const STRANGE_TEXTS = MESSAGES.filter((m) => m.strange).map((m) => m.text);

// One Judge effect button [R13.4c]. Fires now, no time limit. Scares need Night Shift, so it switches.
function judgeEffect(name) {
  audio.unlock();
  if (!st().mode || st().mode === 'day') game.dispatch({ type: 'JUDGE_SET_MODE', mode: 'night' });
  if (name === 'strange') {
    const text = STRANGE_TEXTS[Math.floor(Math.random() * STRANGE_TEXTS.length)];
    game.dispatch({ type: 'JUDGE_SET_MESSAGE', text, strange: true });
    return;
  }
  if (name === 'static') { desk?.fx?.staticBurst(); playStatic(audio); captions.show('static'); return; }
  if (name === 'flicker') { desk?.fx?.flicker(); return; }
  playHorror(name);
}

if (judge) {
  judgeUi = mountJudge(document.body, {
    dispatch: (e) => { audio.unlock(); return game.dispatch(e); },
    state: () => st(),
    audioReady: () => audio.ready,
    isBusy: () => solving || reader.pressing || playingNow(),
    autoSolve,
    effect: judgeEffect,
    setScare: (v) => { judgeScare = v === null ? null : Math.min(1, Math.max(0, v)); director.setOverride(judgeScare); updateNight(); },
    captionsOn: () => { data = setSetting(data, 'captions', true); store.save(data); options?.refresh(); },
    showThought: () => { if (desk) showThought(thoughts.pickAny()); },
    exit: () => { window.location.href = window.location.pathname; }, // back to the start screen, no Judge
    get speed() { return judgeUi?.speed ?? 1; },
  }, { welcome: true });
}

options = mountOptions(document.body, {
  getData: () => data,
  setValue: (key, value) => {
    data = setSetting(data, key, value);
    store.save(data);
    applySettings();
  },
  inRun: () => st().screen !== 'start',
  handLine,
  onForgetHand: () => { hand.forget(); data = setHand(data, null); store.save(data); showHand(); return handLine(); },
  onEndGame: () => game.dispatch({ type: 'END_GAME' }),
  onOpenChange: (open) => {
    updateNight(); // the director holds its clock while Options is open
    if (open) { reader.cancel(); reader.reset(); recv.stop(); } else if (inTutorial() && tutor?.sheet?.id === 'receive') playTutorLetter(400); else if (receiving()) playCurrent(NEXT_LETTER_PAUSE_MS);
    bus.emit(open ? 'PAUSE' : 'RESUME'); // game time pauses while open [design 11]
  },
});

applySettings();
render();
if (query.get('test') === '1') window.__deadAir = { game, bus, audio, night, dayMusic, director, playHorror, captions, judgeUi: () => judgeUi, store, audioBlocked: () => audioBlocked }; // hook for the browser check only
export { bus, game, options };
