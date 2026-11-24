// Game rules: one state object and one function, dispatch(event) [design 3, design 4].
// Input events change the state; output events go to the bus for UI, audio and the director.
// No browser calls here. The run lives in memory only, so a page reload drops it [R5.6b].
import { buildDay, MESSAGES_PER_DAY } from './messages.js';
import { createLives, maxLivesFor } from './lives.js';
import { createStats, accuracyOf, wpmOf, finalRank, updateBest } from './stats.js';
import { createRng } from './rng.js';
import { defaultData } from './settings.js';

export const SCREENS = ['start', 'tutorialDialog', 'tutorial', 'dayIntro', 'playing', 'messageDone', 'dayStats', 'gameOver', 'closing'];
export const MODES = ['night', 'day', 'deadair'];
export const LAST_DAY = 3;
const RUN_SCREENS = ['tutorialDialog', 'tutorial', 'dayIntro', 'playing', 'messageDone', 'dayStats', 'gameOver'];

// Adds up the day summaries of a run for the closing screen and best stats.
export function runTotals(days, livesLeft = 0) {
  const sum = (k) => days.reduce((n, d) => n + d[k], 0);
  const lettersCorrect = sum('lettersCorrect');
  const mistakes = sum('mistakes');
  const activeMs = sum('activeMs');
  const accuracy = accuracyOf(lettersCorrect, mistakes);
  const wpm = wpmOf(lettersCorrect, activeMs);
  return {
    messages: sum('messages'), lettersCorrect, mistakes, activeMs, livesLeft,
    longestStreak: days.reduce((n, d) => Math.max(n, d.longestStreak), 0),
    accuracy, wpm, rank: finalRank(accuracy, wpm),
  };
}

// `data` is the saved data from settings.js. `save(data)` writes it (it does nothing in Judge mode).
// `seed` makes the messages repeatable. `bus` gets every output event.
export function createGame({ data = defaultData(), save = () => {}, seed = 1, bus = null, judge = false } = {}) {
  const rng = createRng(seed);
  let saved = data;
  const s = {
    screen: 'start', mode: null, day: 0, messages: [], msgIndex: 0, pos: 0, msgMistakes: 0,
    lives: null, stats: null, days: [], checkpoint: null, judge,
  };

  const out = [];
  const emit = (type, payload = {}) => { const e = { type, ...payload }; out.push(e); bus?.emit(type, e); };
  const go = (screen) => { s.screen = screen; emit('SCREEN', { screen }); };
  const setSaved = (next) => { if (next !== saved) { saved = next; save(saved); } };
  const setTutorial = (value) => setSaved({ ...saved, settings: { ...saved.settings, tutorial: value } });

  const deadAirOpen = () => judge || saved.deadAirUnlocked;
  const message = () => s.messages[s.msgIndex] ?? null;

  function clearRun() {
    Object.assign(s, { mode: null, day: 0, messages: [], msgIndex: 0, pos: 0, msgMistakes: 0, lives: null, stats: null, days: [], checkpoint: null });
  }

  // Day start is the checkpoint [R5.6a]: earlier days are copied; this day starts fresh.
  function startDay(day) {
    s.day = day;
    s.messages = buildDay(day, s.mode, rng);
    s.checkpoint = { day, days: s.days.map((d) => ({ ...d })), messages: s.messages };
    beginDay();
  }

  function beginDay() {
    s.msgIndex = 0;
    s.pos = 0;
    s.msgMistakes = 0;
    s.lives.reset();
    s.stats = createStats();
    emit('DAY_STARTED', { day: s.day, lives: s.lives.lives, max: s.lives.max });
    go('dayIntro');
  }

  function startRun(mode) {
    clearRun();
    s.mode = mode;
    s.lives = createLives(maxLivesFor(mode));
    emit('RUN_STARTED', { mode });
    const ask = saved.settings.tutorial === 'ask' && mode !== 'deadair' && !judge;
    if (ask) go('tutorialDialog');
    else startDay(1);
  }

  function endRunToStart() {
    clearRun();
    emit('STOP_SOUND');
    go('start');
  }

  function letter(e) {
    const m = message();
    if (!m || typeof e.letter !== 'string') return;
    const t = Number(e.t) || 0;
    const expected = m.letters[s.pos];
    if (e.letter.toUpperCase() === expected) {
      s.stats.letterOk(t);
      s.pos += 1; // move on first, so listeners see the new position
      emit('LETTER_OK', { index: s.pos - 1, next: s.pos, letter: expected });
      if (s.pos >= m.letters.length) finishMessage();
      return;
    }
    s.stats.mistake(t);
    s.msgMistakes += 1;
    const { lives, dead } = s.lives.loseLife();
    emit('LETTER_WRONG', { index: s.pos, expected, got: e.letter });
    emit('LIFE_LOST', { lives, max: s.lives.max });
    if (dead) {
      emit('GAME_OVER', { day: s.day, canRestart: s.mode !== 'deadair' });
      go('gameOver');
    }
  }

  function finishMessage() {
    s.stats.messageDone();
    const { lives, refilled } = s.lives.messageDone(s.msgMistakes === 0);
    emit('MESSAGE_DONE', { index: s.msgIndex, mistakes: s.msgMistakes });
    if (refilled) emit('LIFE_REFILLED', { lives, max: s.lives.max });
    go('messageDone');
  }

  function nextMessage() {
    s.msgIndex += 1;
    s.pos = 0;
    s.msgMistakes = 0;
    if (s.msgIndex < s.messages.length) {
      emit('MESSAGE_STARTED', { index: s.msgIndex, message: message() });
      go('playing');
      return;
    }
    const summary = s.stats.summary(s.lives.lives);
    s.days.push({ day: s.day, ...summary });
    emit('DAY_ENDED', { day: s.day, stats: summary });
    go('dayStats');
  }

  function nextDay() {
    if (s.day < LAST_DAY) { startDay(s.day + 1); return; }
    const totals = runTotals(s.days, s.lives.lives);
    let next = updateBest(saved, s.mode, totals);
    if (s.mode === 'night' && !next.deadAirUnlocked) next = { ...next, deadAirUnlocked: true };
    setSaved(next);
    emit('RUN_FINISHED', { mode: s.mode, totals, best: saved.best[s.mode], deadAirUnlocked: saved.deadAirUnlocked });
    go('closing');
  }

  const handlers = {
    start: {
      PICK_MODE(e) {
        if (!MODES.includes(e.mode)) return;
        if (e.mode === 'deadair' && !deadAirOpen()) return;
        startRun(e.mode);
      },
    },
    tutorialDialog: {
      TUTORIAL_CHOICE(e) {
        if (e.choice === 'start') go('tutorial');
        else if (e.choice === 'notnow') startDay(1);
        else if (e.choice === 'never') { setTutorial('never'); startDay(1); }
      },
    },
    tutorial: {
      // Finished or "Put the sheets away" [R2.1d].
      TUTORIAL_DONE() { setTutorial('never'); startDay(1); },
    },
    dayIntro: {
      CONTINUE() {
        emit('MESSAGE_STARTED', { index: s.msgIndex, message: message() });
        go('playing');
      },
    },
    playing: {
      INPUT(e) { s.stats.input(Number(e.t) || 0); },
      LETTER: letter,
    },
    messageDone: { NEXT_MESSAGE: nextMessage },
    dayStats: { NEXT_DAY: nextDay },
    gameOver: {
      RESTART_DAY() {
        if (s.mode === 'deadair' || !s.checkpoint) return; // Dead Air has no second chance [R16.6]
        s.days = s.checkpoint.days.map((d) => ({ ...d }));
        s.messages = s.checkpoint.messages;
        emit('DAY_RESTARTED', { day: s.day });
        beginDay();
      },
      MAIN_MENU: endRunToStart,
    },
    closing: { CONTINUE: endRunToStart },
  };

  return {
    // Returns the output events of this one call.
    dispatch(event) {
      out.length = 0;
      if (!event || typeof event.type !== 'string') return [];
      if (event.type === 'END_GAME') {
        // Already confirmed by the Options dialog [R1.4]. Only during a run.
        if (RUN_SCREENS.includes(s.screen)) endRunToStart();
        return [...out];
      }
      const h = handlers[s.screen]?.[event.type];
      if (h) h(event);
      return [...out];
    },
    get state() {
      return {
        screen: s.screen, mode: s.mode, day: s.day, msgIndex: s.msgIndex, pos: s.pos,
        message: message(), messages: s.messages, messageCount: MESSAGES_PER_DAY,
        lives: s.lives?.lives ?? null, maxLives: s.lives?.max ?? null,
        dayStats: s.stats?.summary(s.lives?.lives ?? 0) ?? null,
        days: s.days.map((d) => ({ ...d })), judge,
      };
    },
    get saved() { return saved; },
  };
}
