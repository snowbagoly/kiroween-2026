// Boots the app and wires everything [design 3].
// The game rules (core/game.js) own the state. This file turns keys into game events and
// game events into pictures and sounds.
import { createBus } from './core/events.js';
import { createGame } from './core/game.js';
import { createSettingsStore, setSetting } from './core/settings.js';
import { createAudioEngine } from './audio/engine.js';
import { playLetter, armDownAt } from './audio/sequencer.js';
import { createNightMusic } from './audio/music-night.js';
import { HORROR_SOUNDS } from './audio/horror-voices.js';
import { mountCaptions } from './audio/captions.js';
import { createHorrorDirector, intensityFor } from './director/horror.js';
import { createThoughts, SHOW_MS } from './director/thoughts.js';
import { createTutorial, HEARD_LETTER } from './core/tutorial.js';
import { createReplayCounter, replayLabel, NEXT_LETTER_PAUSE_MS, IDLE_REPLAY_MS } from './core/receive.js';
import { playTone, playTick, playStatic } from './audio/voices.js';
import { createPressReader, attachKeyboard } from './input/keyboard.js';
import { mountScene, setKeyDown, setSounderDown } from './ui/scene.js';
import { mountMorseChart } from './ui/morse-chart.js';
import { mountGalvanometer } from './ui/galvanometer.js';
import { mountTextRow } from './ui/text-row.js';
import { mountStart, showCard, hudLabel } from './ui/screens.js';
import { mountOptions } from './ui/options.js';
import { mountEffects } from './ui/effects-fx.js';

const query = new URLSearchParams(window.location.search);
const judge = query.get('judge') === '1'; // read once at boot [design 13]
const store = createSettingsStore({ saving: !judge }); // Judge mode never writes [R13.5]
let data = store.load();

const bus = createBus();
const audio = createAudioEngine({ music: data.settings.musicVol, sfx: data.settings.sfxVol, muted: data.settings.mute });
audio.attachUnlock(window);

const game = createGame({ data, save: (d) => { data = d; store.save(d); }, seed: Date.now() >>> 0, bus, judge });

const app = document.getElementById('app');
const captions = mountCaptions(document.body, { enabled: () => data.settings.captions });
app.innerHTML = '<div class="view"></div>';
const view = app.querySelector('.view');
let desk = null; // { mode, stage, gauge, row, hud, layer } while a run is on screen
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
  onPressStart: () => {
    lastInputAt = now();
    audio.unlock();
    tone = playTone(audio);
    if (desk) setKeyDown(desk.stage, true);
    if (inTutorial()) startMeter();
    game.dispatch({ type: 'INPUT', t: now() });
  },
  onPressEnd: () => {
    tone?.stop();
    tone = null;
    if (desk) setKeyDown(desk.stage, false);
    stopMeter();
  },
  onSymbol: ({ symbol }) => { if (inTutorial() && tutor) tutorResult(tutor.symbol(symbol)); },
  // A pattern that is no letter counts as a wrong letter.
  onLetter: (r) => {
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
function playReceived(letter) {
  audio.unlock();
  const h = playLetter(audio, letter);
  if (h) {
    recv.busyUntil = h.end;
    animateArm(h.schedule, h.end);
  }
  return h;
}

// ---- tutorial -------------------------------------------------------------

const PRESS_SCALE_MS = 600; // the meter is full at 600 ms; the mark at 300 ms splits dot and dash

function startMeter() {
  const t0 = now();
  cancelAnimationFrame(meterRaf);
  const step = () => {
    const bar = desk?.layer.querySelector('.press-bar');
    const label = desk?.layer.querySelector('.press-label');
    if (!bar || !reader.pressing) return;
    const ms = now() - t0;
    bar.style.width = `${Math.min(1, ms / PRESS_SCALE_MS) * 100}%`;
    bar.classList.toggle('dash', ms >= 300);
    label.textContent = ms < 300 ? 'dot' : 'dash';
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
    if (!receiving()) return;
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

function renderStart() {
  recv.stop();
  clearTimeout(thoughtTimer);
  desk = null;
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
  view.innerHTML = '<div class="play"><div class="stage"></div></div><div class="card-layer" hidden></div>';
  const stage = view.querySelector('.stage');
  mountScene(stage, s.mode === 'day' ? '?mode=day' : ''); // replaces the stage's content
  mountMorseChart(view.querySelector('.play'), s.mode);
  const row = mountTextRow(stage);
  const hud = document.createElement('p');
  hud.className = 'hud-label';
  stage.prepend(hud);
  const gauge = mountGalvanometer(stage, { max: s.maxLives, lives: s.lives ?? s.maxLives });
  stage.querySelector('.text-row-box').insertAdjacentHTML('afterend', '<p class="replay-row" hidden><button type="button" class="replay-btn">Replay</button></p>');
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
}

function renderRun(s) {
  if (!desk || desk.mode !== s.mode) buildDesk(s);
  desk.hud.textContent = hudLabel(s.mode, s.day);
  if (s.screen === 'tutorial') {
    tutor ??= createTutorial();
    reader.reset();
    drawSheet();
    updateReplay();
    return;
  }
  tutor = null;
  desk.stage.querySelector('#galvanometer-slot')?.classList.remove('pulse');
  showCard(desk.layer, s.screen, { ...card, day: s.day, mode: s.mode }, onAction);
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

const night = createNightMusic(audio);
const NIGHT_SCREENS = ['dayIntro', 'playing', 'messageDone', 'dayStats', 'gameOver'];
const director = createHorrorDirector({
  // Never while Space is down or a received letter is sounding [R6.5].
  isBusy: () => reader.pressing || playingNow(),
  onEffect: (name, info) => bus.emit('HORROR_EFFECT', { name, ...info }), // sounds and pictures come in T22
});
const directorState = (s) => ({ day: s.day || 1, mode: s.mode, lives: s.lives ?? s.maxLives ?? 10, max: s.maxLives ?? 10 });
// Music tension and the vignette follow the director's intensity [design 10].
function nightTension(s) {
  return intensityFor(directorState(s));
}
function updateNight() {
  const s = st();
  const nightMode = s.mode === 'night' || s.mode === 'deadair';
  const want = nightMode && NIGHT_SCREENS.includes(s.screen);
  if (want && !night.running) { audio.unlock(); night.start(); }
  if (!want && night.running) night.stop();
  // Random effects only while a message is being worked on, never in Day Shift [R7.1].
  if (nightMode && s.screen === 'playing') {
    if (!director.running) director.start(directorState(s));
    else director.update(directorState(s));
    if (options?.isOpen) director.pause(); else director.resume();
  } else if (nightMode && (s.screen === 'messageDone')) {
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
  thoughts.shown(th);
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
  desk?.row.show(message.text, message.role);
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
  if (role() !== 'receive') return;
  recv.idleUsed = false;
  if (next < (st().message?.letters.length ?? 0)) playCurrent(NEXT_LETTER_PAUSE_MS); // R4.3
});
bus.on('LETTER_WRONG', () => {
  desk?.row.wrong();
  // A mistake in Night Shift: static and flicker, or a slow fade with "Reduce flashing" [R6.4, R6.6].
  if (desk?.fx && desk.fx.mistake()) { playStatic(audio); captions.show('static'); }
  if (role() === 'receive') playCurrent(NEXT_LETTER_PAUSE_MS); // same letter again, free [R4.4]
});
bus.on('LIFE_LOST', ({ lives }) => { desk?.gauge.set(lives); playTick(audio); updateNight(); });
bus.on('LIFE_REFILLED', ({ lives }) => { desk?.gauge.set(lives); updateNight(); });
bus.on('DAY_ENDED', ({ stats }) => { card.stats = stats; });
bus.on('GAME_OVER', ({ canRestart }) => { card.canRestart = canRestart; });
bus.on('RUN_FINISHED', ({ totals, best, deadAirUnlocked }) => {
  card.totals = totals;
  card.best = best;
  card.unlocked = deadAirUnlocked && !deadAirBefore;
});
bus.on('STOP_SOUND', () => { tone?.stop(); tone = null; night.stop(); director.stop(); });
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

options = mountOptions(document.body, {
  getData: () => data,
  setValue: (key, value) => {
    data = setSetting(data, key, value);
    store.save(data);
    applySettings();
  },
  inRun: () => st().screen !== 'start',
  onEndGame: () => game.dispatch({ type: 'END_GAME' }),
  onOpenChange: (open) => {
    updateNight(); // the director holds its clock while Options is open
    if (open) { reader.cancel(); reader.reset(); recv.stop(); } else if (inTutorial() && tutor?.sheet?.id === 'receive') playTutorLetter(400); else if (receiving()) playCurrent(NEXT_LETTER_PAUSE_MS);
    bus.emit(open ? 'PAUSE' : 'RESUME'); // game time pauses while open [design 11]
  },
});

applySettings();
render();
if (query.get('test') === '1') window.__deadAir = { game, bus, audio, night, director, playHorror, captions }; // hook for the browser check only
export { bus, game, options };
