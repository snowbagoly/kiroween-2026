// Boots the app and wires everything [design 3].
// The game rules (core/game.js) own the state. This file turns keys into game events and
// game events into pictures and sounds.
import { createBus } from './core/events.js';
import { createGame } from './core/game.js';
import { createSettingsStore, setSetting } from './core/settings.js';
import { createAudioEngine } from './audio/engine.js';
import { playTone, playTick } from './audio/voices.js';
import { createPressReader, attachKeyboard } from './input/keyboard.js';
import { mountScene, setKeyDown } from './ui/scene.js';
import { mountMorseChart } from './ui/morse-chart.js';
import { mountGalvanometer } from './ui/galvanometer.js';
import { mountTextRow } from './ui/text-row.js';
import { mountStart, showCard, hudLabel } from './ui/screens.js';
import { mountOptions } from './ui/options.js';

const query = new URLSearchParams(window.location.search);
const judge = query.get('judge') === '1'; // read once at boot [design 13]
const store = createSettingsStore({ saving: !judge }); // Judge mode never writes [R13.5]
let data = store.load();

const bus = createBus();
const audio = createAudioEngine({ music: data.settings.musicVol, sfx: data.settings.sfxVol, muted: data.settings.mute });
audio.attachUnlock(window);

const game = createGame({ data, save: (d) => { data = d; store.save(d); }, seed: Date.now() >>> 0, bus, judge });

const app = document.getElementById('app');
app.innerHTML = '<div class="view"></div>';
const view = app.querySelector('.view');
let desk = null; // { mode, stage, gauge, row, hud, layer } while a run is on screen
let options = null;
let deadAirBefore = data.deadAirUnlocked;
let card = { role: 'send', stats: null, canRestart: true, totals: null, best: null, unlocked: false };

function applySettings() {
  const s = data.settings;
  audio.setMusicVolume(s.musicVol);
  audio.setSfxVolume(s.sfxVol);
  audio.setMuted(s.mute);
  document.documentElement.classList.toggle('reduce-flashing', s.reduceFlashing);
  desk?.gauge.showNumber(s.showLivesNumber);
}

// ---- input --------------------------------------------------------------

const now = () => performance.now();
const st = () => game.state;
const role = () => st().message?.role ?? 'send';
const canPlay = () => st().screen === 'playing' && !options?.isOpen;
let tone = null;

const reader = createPressReader({
  onPressStart: () => {
    audio.unlock();
    tone = playTone(audio);
    if (desk) setKeyDown(desk.stage, true);
    game.dispatch({ type: 'INPUT', t: now() });
  },
  onPressEnd: () => {
    tone?.stop();
    tone = null;
    if (desk) setKeyDown(desk.stage, false);
  },
  // A pattern that is no letter counts as a wrong letter.
  onLetter: (r) => { if (canPlay() && role() === 'send') game.dispatch({ type: 'LETTER', letter: r.letter ?? '?', t: now() }); },
});
attachKeyboard(window, reader, { enabled: () => canPlay() && role() === 'send' });

// Receiving: type the letter you heard. No Enter needed, not case-sensitive [R4.3].
window.addEventListener('keydown', (e) => {
  if (!canPlay() || role() !== 'receive' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (!/^[a-z]$/i.test(e.key)) return;
  e.preventDefault();
  game.dispatch({ type: 'INPUT', t: now() });
  game.dispatch({ type: 'LETTER', letter: e.key.toUpperCase(), t: now() });
});

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
  const s = st().screen;
  // The closing screen leaves with CONTINUE; the game-over screen with MAIN_MENU.
  if (action === 'main-menu' && s === 'closing') game.dispatch({ type: 'CONTINUE' });
  else if (ACTIONS[action]) game.dispatch(ACTIONS[action]);
}

function renderStart() {
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
  desk = { mode: s.mode, stage, gauge, row, hud, layer: view.querySelector('.card-layer') };
  applySettings();
}

function renderRun(s) {
  if (!desk || desk.mode !== s.mode) buildDesk(s);
  desk.hud.textContent = hudLabel(s.mode, s.day);
  showCard(desk.layer, s.screen, { ...card, day: s.day, mode: s.mode }, onAction);
  if (s.screen === 'playing') {
    // No button keeps focus, so Space and letters go to the game.
    document.activeElement?.blur?.();
  } else {
    reader.reset();
  }
}

function render() {
  const s = st();
  if (s.screen === 'start') renderStart();
  else renderRun(s);
}

// ---- game events to pictures and sounds ----------------------------------

bus.on('RUN_STARTED', () => { deadAirBefore = data.deadAirUnlocked; });
bus.on('DAY_STARTED', ({ lives, max }) => {
  if (!desk) return;
  desk.gauge.setMax(max, lives);
  applySettings();
  desk.row.clear();
});
bus.on('MESSAGE_STARTED', ({ message }) => {
  card.role = message.role;
  desk?.row.show(message.text, message.role);
});
bus.on('LETTER_OK', ({ next }) => desk?.row.setPos(next));
bus.on('LETTER_WRONG', () => desk?.row.wrong());
bus.on('LIFE_LOST', ({ lives }) => { desk?.gauge.set(lives); playTick(audio); });
bus.on('LIFE_REFILLED', ({ lives }) => desk?.gauge.set(lives));
bus.on('DAY_ENDED', ({ stats }) => { card.stats = stats; });
bus.on('GAME_OVER', ({ canRestart }) => { card.canRestart = canRestart; });
bus.on('RUN_FINISHED', ({ totals, best, deadAirUnlocked }) => {
  card.totals = totals;
  card.best = best;
  card.unlocked = deadAirUnlocked && !deadAirBefore;
});
bus.on('STOP_SOUND', () => { tone?.stop(); tone = null; });
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
    if (open) { reader.cancel(); reader.reset(); }
    bus.emit(open ? 'PAUSE' : 'RESUME'); // game time pauses while open [design 11]
  },
});

applySettings();
render();
export { bus, game, options };
