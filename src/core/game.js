// Game rules: one state object and one function, dispatch(event) [design 3, design 4].
// Input events change the state; output events go to the bus for UI, audio and the director.
// No browser calls here. The run lives in memory only, so a page reload drops it [R5.6b].
import { buildDay, MESSAGES_PER_DAY, lettersOf, lengthClass } from './messages.js';
import { createLives, maxLivesFor } from './lives.js';
import { createStats, accuracyOf, wpmOf, finalRank, updateBest } from './stats.js';
import { createRng } from './rng.js';
import { defaultData } from './settings.js';
import { createDayClock, arrivalTimes, clockTime } from './day-clock.js';
import { createLifeDrain, drainsLives } from './idle.js';

// `waiting`: the desk is empty, the next telegram has not been handed in yet, or the day's work is done
// and the clock runs on to 06:00 [R9.7].
export const SCREENS = ['start', 'storyOffer', 'story', 'tutorialDialog', 'tutorial', 'dayIntro', 'playing', 'messageDone', 'waiting', 'dayStats', 'gameOver', 'closing'];
export const MODES = ['night', 'day', 'deadair'];
export const LAST_DAY = 3;
const RUN_SCREENS = ['storyOffer', 'story', 'tutorialDialog', 'tutorial', 'dayIntro', 'playing', 'messageDone', 'waiting', 'dayStats', 'gameOver'];
export const CLOCK_SCREENS = ['playing', 'messageDone', 'waiting'];

// Numbers for the Judge "Show stats" button: a good, believable day [R13.3f].
export const SAMPLE_STATS = Object.freeze({
  messages: 5, lettersCorrect: 96, mistakes: 3, longestStreak: 41, activeMs: 4 * 60000, livesLeft: 8,
  accuracy: (96 / 99) * 100, wpm: 96 / 5 / 4, rank: 'Operator',
});

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
// `timed`: the game clock runs (TICK events), telegrams arrive at set times and the day ends at 06:00
// [R9.7]. The game always plays timed; without it the messages simply follow each other.
// `mustHear`: a received letter counts only once its signal has played (a HEARD event), so the player
// cannot type ahead by guessing the word.
// `story`: offer the story before a run [R17.6]; `skipStory()` says whether the player always skips it.
export function createGame({ data = defaultData(), save = () => {}, seed = 1, bus = null, judge = false, timed = false, mustHear = false, story = false, skipStory = () => false, tutorialSetting = null } = {}) {
  const rng = createRng(seed);
  let saved = data;
  const s = {
    screen: 'start', mode: null, day: 0, messages: [], msgIndex: 0, pos: 0, msgMistakes: 0,
    lives: null, stats: null, days: [], checkpoint: null, judge, clock: null, drain: null, done: 0, arrivals: [],
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
    s.arrivals = arrivalTimes(s.messages.length, rng);
    s.checkpoint = { day, days: s.days.map((d) => ({ ...d })), messages: s.messages, arrivals: s.arrivals };
    beginDay();
  }

  function beginDay() {
    s.msgIndex = 0;
    s.pos = 0;
    s.msgMistakes = 0;
    s.lives.reset();
    s.stats = createStats();
    s.done = 0;
    s.clock = timed ? createDayClock({ day: s.day, arrivals: s.arrivals }) : null;
    s.drain = timed ? createLifeDrain() : null;
    emit('DAY_STARTED', { day: s.day, lives: s.lives.lives, max: s.lives.max });
    go('dayIntro');
  }

  function startRun(mode) {
    clearRun();
    s.mode = mode;
    s.lives = createLives(maxLivesFor(mode));
    emit('RUN_STARTED', { mode });
    // The story first, unless it is always skipped; never in Dead Air or Judge mode [R17.6, R16.8, R13.5].
    if (story && mode !== 'deadair' && !judge && !skipStory()) go('storyOffer');
    else afterStory();
  }

  function afterStory() {
    // The Options menu can change the setting during the session, so read it fresh [R2.1, R2.1d].
    const setting = tutorialSetting ? tutorialSetting() : saved.settings.tutorial;
    const ask = setting === 'ask' && s.mode !== 'deadair' && !judge;
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
    // Not heard yet: the letter is ignored, and costs nothing.
    if (mustHear && m.role === 'receive' && s.heard !== s.pos) { emit('LETTER_IGNORED', { index: s.pos }); return; }
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
    if (dead && s.infinite) {
      // Judge "Infinite lives": the needle stops at the last step, never game over [R13.3d].
      emit('LIVES_SET', { lives: s.lives.set(1), max: s.lives.max });
      return;
    }
    if (dead) {
      emit('GAME_OVER', { day: s.day, canRestart: s.mode !== 'deadair' });
      go('gameOver');
    }
  }

  function finishMessage() {
    s.done += 1;
    s.stats.messageDone();
    const { lives, refilled } = s.lives.messageDone(s.msgMistakes === 0);
    emit('MESSAGE_DONE', { index: s.msgIndex, mistakes: s.msgMistakes });
    if (refilled) emit('LIFE_REFILLED', { lives, max: s.lives.max });
    go('messageDone');
  }

  function nextMessage() {
    s.msgIndex += 1;
    s.heard = -1;
    s.pos = 0;
    s.msgMistakes = 0;
    if (s.clock) {
      // The next telegram is on the spike, or not handed in yet, or the work is done [R9.7c].
      if (s.msgIndex < s.clock.arrived) { emit('MESSAGE_STARTED', { index: s.msgIndex, message: message() }); go('playing'); }
      else { emit('DESK_EMPTY', { allDone: s.done >= s.messages.length }); go('waiting'); }
      return;
    }
    if (s.msgIndex < s.messages.length) {
      emit('MESSAGE_STARTED', { index: s.msgIndex, message: message() });
      go('playing');
      return;
    }
    endDay();
  }

  function endDay() {
    const summary = s.stats.summary(s.lives.lives);
    s.days.push({ day: s.day, ...summary });
    emit('DAY_ENDED', { day: s.day, stats: summary });
    go('dayStats');
  }

  // Lives lost with no mistake: idling, or the late drain [R9.7f, R9.7h]. They break the clean streak,
  // but are not counted as mistakes in the statistics.
  function drainLife(kind) {
    if (s.screen === 'playing') s.msgMistakes += 1;
    const { lives, dead } = s.lives.loseLife();
    emit(kind === 'idle' ? 'IDLE_LIFE_LOST' : 'LATE_LIFE_LOST', { lives, max: s.lives.max });
    emit('LIFE_LOST', { lives, max: s.lives.max, kind });
    if (dead && s.infinite) { emit('LIVES_SET', { lives: s.lives.set(1), max: s.lives.max }); return false; }
    if (dead) { emit('GAME_OVER', { day: s.day, canRestart: s.mode !== 'deadair', reason: 'lives' }); go('gameOver'); return true; }
    return false;
  }

  function arrived(e) {
    emit('ARRIVED', { index: e.index, at: clockTime(e.at), waiting: Math.max(0, s.clock.arrived - s.done - (s.screen === 'waiting' ? 0 : 1)) });
    if (s.screen === 'waiting' && s.msgIndex === e.index) startMessage();
  }

  // One step of real time while a day runs.
  function tick(e) {
    const c = s.clock;
    if (!c) return;
    const inHand = s.screen === 'playing' || s.screen === 'messageDone';
    for (const ev of c.tick(e.ms, { inHand, done: s.done, hold: !!s.infinite })) {
      if (ev.type === 'ARRIVED') arrived(ev);
      else if (ev.type === 'DAWN') { emit('DAWN', { at: clockTime(c.minutes) }); endDay(); return; }
      else if (ev.type === 'TIME_UP') {
        emit('GAME_OVER', { day: s.day, canRestart: s.mode !== 'deadair', reason: 'time' });
        go('gameOver');
        return;
      }
    }
    const waiting = Math.max(0, c.arrived - s.done - (inHand ? 1 : 0));
    emit('CLOCK', { minutes: c.minutes, time: clockTime(c.minutes), progress: c.progress, waiting });
    const lost = s.drain.tick(e.ms, {
      on: drainsLives(s.mode) && c.started,
      // Listening takes the time it takes: idling only counts on messages to send [R9.7f].
      waiting: s.screen === 'playing' && message()?.role !== 'receive',
      minutes: c.minutes,
      allDone: s.done >= s.messages.length,
    });
    for (const kind of lost) if (drainLife(kind)) return;
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

  // ---- Kiroween Judge mode [design 13, R13.3, R13.4a] ----------------------------
  // Cheats are extra events. They work on any screen, but only when the game was made with
  // `judge: true`; normal play ignores them [R13.8]. Nothing here saves [R13.5].

  // Judge cheats may need a run that does not exist yet (from the start screen or the welcome card).
  function ensureRun(mode = 'night') {
    if (s.mode) return;
    s.mode = MODES.includes(mode) ? mode : 'night';
    s.lives = createLives(maxLivesFor(s.mode));
    s.stats = createStats();
    emit('RUN_STARTED', { mode: s.mode, judge: true });
  }

  function startMessage() {
    s.heard = -1;
    s.pos = 0;
    s.msgMistakes = 0;
    emit('MESSAGE_STARTED', { index: s.msgIndex, message: message() });
    go('playing');
  }

  const inRun = () => s.mode !== null && RUN_SCREENS.concat('closing').includes(s.screen);

  const judgeHandlers = {
    // Day 1, 2, 3 or 'closing', in one click. Lands on the first message, not the intro card.
    JUDGE_JUMP_DAY(e) {
      ensureRun(e.mode ?? s.mode ?? 'night');
      if ((e.mode === 'night' || e.mode === 'day') && s.mode !== e.mode) {
        s.mode = e.mode; // the demo starts in Day Shift even if a Night Shift run is open
        s.lives = createLives(maxLivesFor(s.mode));
        emit('MODE_CHANGED', { mode: s.mode, day: s.day });
      }
      if (e.day === 'closing') {
        if (!s.days.length) s.days = [1, 2, 3].map((day) => ({ day, ...SAMPLE_STATS }));
        const totals = runTotals(s.days, s.lives.lives);
        emit('RUN_FINISHED', { mode: s.mode, totals, best: totals, deadAirUnlocked: saved.deadAirUnlocked });
        go('closing');
        return;
      }
      const day = Math.min(LAST_DAY, Math.max(1, Math.round(Number(e.day) || 1)));
      s.days = s.days.filter((d) => d.day < day);
      startDay(day);
      startMessage();
    },
    // Night Shift and Day Shift switch, keeping the day [R13.4a]. The day's messages are rebuilt,
    // so Day Shift never keeps a strange one. Dead Air is not part of the switch.
    JUDGE_SET_MODE(e) {
      if (e.mode !== 'night' && e.mode !== 'day') return;
      if (!s.mode) { ensureRun(e.mode); startDay(1); startMessage(); return; }
      if (s.mode === e.mode) return;
      const lives = s.lives.lives;
      s.mode = e.mode;
      s.lives = createLives(maxLivesFor(s.mode));
      s.lives.set(lives);
      const keep = s.msgIndex;
      s.messages = buildDay(s.day || 1, s.mode, rng);
      s.msgIndex = Math.min(keep, s.messages.length - 1);
      emit('MODE_CHANGED', { mode: s.mode, day: s.day });
      emit('LIVES_SET', { lives: s.lives.lives, max: s.lives.max });
      if (s.screen === 'playing' || s.screen === 'messageDone') startMessage();
      else go(s.screen);
    },
    // Puts a chosen message on the desk now (demo reel, "strange message" button).
    JUDGE_SET_MESSAGE(e) {
      ensureRun(s.mode ?? 'night');
      if (!s.day) { startDay(1); }
      const text = String(e.text ?? '').toUpperCase().replace(/[^A-Z ]/g, '').trim();
      if (!lettersOf(text)) return;
      const strange = !!e.strange && s.mode !== 'day';
      const m = {
        id: `judge-${s.msgIndex}`, day: s.day, kind: 'either', text, strange, abbreviations: false,
        role: e.role === 'receive' || e.role === 'send' ? e.role : message()?.role ?? 'send',
        letters: lettersOf(text), length: lengthClass(text),
      };
      s.messages = s.messages.map((x, i) => (i === s.msgIndex ? m : x));
      startMessage();
    },
    JUDGE_SKIP() {
      if (s.screen === 'playing' || s.screen === 'messageDone') nextMessage();
      else if (s.screen === 'waiting' && s.clock && s.msgIndex < s.messages.length) for (const ev of s.clock.bring(s.msgIndex)) arrived(ev);
    },
    JUDGE_LIVES(e) {
      if (!s.lives) return;
      if (e.op === '-1') {
        const { lives, dead } = s.lives.loseLife();
        emit('LIFE_LOST', { lives, max: s.lives.max });
        if (dead && s.infinite) emit('LIVES_SET', { lives: s.lives.set(1), max: s.lives.max });
        else if (dead && inRun()) { emit('GAME_OVER', { day: s.day, canRestart: s.mode !== 'deadair' }); go('gameOver'); }
        return;
      }
      const n = e.op === 'full' ? s.lives.max : s.lives.lives + 1;
      emit('LIVES_SET', { lives: s.lives.set(n), max: s.lives.max });
    },
    JUDGE_INFINITE(e) { s.infinite = !!e.on; },
    JUDGE_FORCE_GAMEOVER() {
      ensureRun(s.mode ?? 'night');
      if (!s.day) startDay(1);
      emit('GAME_OVER', { day: s.day, canRestart: s.mode !== 'deadair' });
      go('gameOver');
    },
    // The statistics screen with sample numbers [R13.3f].
    JUDGE_SHOW_STATS() {
      ensureRun(s.mode ?? 'night');
      if (!s.day) startDay(1);
      const stats = { ...SAMPLE_STATS, livesLeft: s.lives.lives };
      s.days = s.days.filter((d) => d.day !== s.day).concat({ day: s.day, ...stats });
      emit('DAY_ENDED', { day: s.day, stats, sample: true });
      go('dayStats');
    },
  };

  const handlers = {
    start: {
      PICK_MODE(e) {
        if (!MODES.includes(e.mode)) return;
        if (e.mode === 'deadair' && !deadAirOpen()) return;
        startRun(e.mode);
      },
    },
    storyOffer: {
      STORY_CHOICE(e) { if (e.choice === 'read') go('story'); else afterStory(); },
    },
    story: { STORY_DONE: afterStory },
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
      INPUT(e) {
        s.stats.input(Number(e.t) || 0);
        s.clock?.start(); // the first press or typed letter starts the clock [R9.7a]
        s.drain?.input();
      },
      LETTER: letter,
      TICK: tick,
      // The current received letter has been played once [R4.2].
      HEARD(e) { if (e.msgIndex === s.msgIndex && e.index === s.pos) s.heard = s.pos; },
    },
    messageDone: { NEXT_MESSAGE: nextMessage, TICK: tick },
    waiting: { TICK: tick },
    dayStats: { NEXT_DAY: nextDay },
    gameOver: {
      RESTART_DAY() {
        if (s.mode === 'deadair' || !s.checkpoint) return; // Dead Air has no second chance [R16.6]
        s.days = s.checkpoint.days.map((d) => ({ ...d }));
        s.messages = s.checkpoint.messages;
        s.arrivals = s.checkpoint.arrivals ?? s.arrivals;
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
      if (event.type.startsWith('JUDGE_')) {
        if (judge) judgeHandlers[event.type]?.(event);
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
        days: s.days.map((d) => ({ ...d })), judge, infinite: !!s.infinite,
        clock: s.clock ? { minutes: s.clock.minutes, time: clockTime(s.clock.minutes), progress: s.clock.progress, started: s.clock.started,
          arrived: s.clock.arrived, waiting: Math.max(0, s.clock.arrived - s.done - (['playing', 'messageDone'].includes(s.screen) ? 1 : 0)) } : null,
        done: s.done,
      };
    },
    get saved() { return saved; },
  };
}
