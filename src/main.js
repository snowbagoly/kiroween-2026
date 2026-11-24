// Boots the app and wires everything [design 3].
// T11: start screen, Options menu and saved settings. Day screens come in T13.
import { createBus } from './core/events.js';
import { createGame } from './core/game.js';
import { createSettingsStore, setSetting } from './core/settings.js';
import { createAudioEngine } from './audio/engine.js';
import { mountScene } from './ui/scene.js';
import { mountMorseChart } from './ui/morse-chart.js';
import { mountGalvanometer } from './ui/galvanometer.js';
import { mountStart } from './ui/screens.js';
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
let gauge = null;

function applySettings() {
  const s = data.settings;
  audio.setMusicVolume(s.musicVol);
  audio.setSfxVolume(s.sfxVol);
  audio.setMuted(s.mute);
  document.documentElement.classList.toggle('reduce-flashing', s.reduceFlashing);
  gauge?.showNumber(s.showLivesNumber);
}

function renderStart() {
  gauge = null;
  document.documentElement.dataset.mode = 'night';
  view.innerHTML = '';
  mountStart(view, {
    data,
    judge,
    onPick: (mode) => { audio.unlock(); game.dispatch({ type: 'PICK_MODE', mode }); },
    onJudge: () => { window.location.search = '?judge=1'; },
  });
}

// Placeholder until T13 builds the day screens.
function renderRun(st) {
  document.documentElement.dataset.mode = st.mode === 'day' ? 'day' : 'night';
  view.innerHTML = '<div class="play"><div class="stage"></div></div>';
  const stage = view.querySelector('.stage');
  mountScene(stage, st.mode === 'day' ? '?mode=day' : '');
  mountMorseChart(view.querySelector('.play'), st.mode);
  gauge = st.maxLives ? mountGalvanometer(stage, { max: st.maxLives, lives: st.lives ?? st.maxLives }) : null;
  stage.insertAdjacentHTML('beforeend', `<p class="placeholder" role="status">${st.day ? `Day ${st.day}` : 'Tutorial'}: the day screens come in T13. Use Options, then End game, to go back.</p>`);
  applySettings();
}

function render() {
  const st = game.state;
  if (st.screen === 'start') renderStart();
  else renderRun(st);
}

const options = mountOptions(document.body, {
  getData: () => data,
  setValue: (key, value) => {
    data = setSetting(data, key, value);
    store.save(data);
    applySettings();
  },
  inRun: () => game.state.screen !== 'start',
  onEndGame: () => game.dispatch({ type: 'END_GAME' }),
  onOpenChange: (open) => bus.emit(open ? 'PAUSE' : 'RESUME'), // game time pauses while open [design 11]
});

bus.on('SCREEN', render);
applySettings();
render();
export { bus, game, options };
