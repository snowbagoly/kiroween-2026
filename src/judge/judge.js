// Kiroween Judge mode [design 13, R13]: a panel of cheats and show-off tools, a welcome card,
// a 30-second demo reel and auto-play. Everything goes through `ctx`, which main.js builds:
//   dispatch(event)  state()  audioReady()  isBusy()  autoSolve('letter' | 'message') -> Promise
//   effect(name)  setScare(0..1)  captionsOn()  showThought()  exit()  speed (getter)
// The panel only sends normal game events plus JUDGE_* events; it never changes the rules itself.

export const EFFECT_BUTTONS = [
  ['thunder', 'Thunder'], ['crow', 'Crow'], ['scream', 'Scream'], ['knock', 'Knocking'],
  ['static', 'Static burst'], ['flicker', 'Flicker'], ['strange', 'Strange message'],
];
export const SPEEDS = [1, 2, 4];
export const DEMO_MS = 30000;

// The demo reel [R13.4d]: times in ms at speed x1. Each step gets `ctx`.
export const DEMO_STEPS = [
  { at: 0, name: 'Day Shift, Day 1, a short message sent by itself', run: (c) => {
    c.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1, mode: 'day' });
    c.dispatch({ type: 'JUDGE_SET_MESSAGE', text: 'YES', role: 'send' });
    return c.autoSolve('message');
  } },
  { at: 8000, name: 'switch to Night Shift, same day', run: (c) => {
    c.dispatch({ type: 'JUDGE_SET_MODE', mode: 'night' });
    c.setScare(0.75);
  } },
  { at: 11000, name: 'thunder', run: (c) => c.effect('thunder') },
  { at: 13500, name: 'a crow', run: (c) => c.effect('crow') },
  { at: 16000, name: 'a strange message and a thought', run: (c) => {
    c.dispatch({ type: 'JUDGE_SET_MESSAGE', text: 'IT IS IN THE WIRES', role: 'send', strange: true });
    c.showThought();
  } },
  { at: 22000, name: 'one mistake: the needle swings, static', run: (c) => {
    c.dispatch({ type: 'LETTER', letter: '?', t: performance.now() });
  } },
  { at: 27000, name: 'the statistics screen with a rank', run: (c) => c.dispatch({ type: 'JUDGE_SHOW_STATS' }) },
];

// Runs the demo steps on their own timer. Stops at the end, on `stop()`, or when a step throws.
export function runDemo(ctx, { speed = 1, steps = DEMO_STEPS, setTimer = setTimeout, clearTimer = clearTimeout, onEnd = () => {} } = {}) {
  const timers = [];
  let running = true;
  const k = 1 / Math.max(1, speed);
  const finish = (why) => {
    if (!running) return;
    running = false;
    for (const t of timers) clearTimer(t);
    ctx.setScare?.(null);
    onEnd(why);
  };
  for (const step of steps) {
    timers.push(setTimer(() => {
      if (!running) return;
      try {
        const r = step.run(ctx);
        if (r && typeof r.catch === 'function') r.catch(() => finish('error'));
      } catch {
        finish('error');
      }
    }, step.at * k));
  }
  timers.push(setTimer(() => finish('done'), DEMO_MS * k));
  return { get running() { return running; }, stop: () => finish('stopped') };
}

// Auto-play [R13.4e]: plays the game by itself, using the same sequencer as the player.
export function createAutoPlay(ctx, { tickMs = 200, setTimer = setTimeout, clearTimer = clearTimeout, now = () => performance.now() } = {}) {
  let on = false;
  let timer = null;
  let waitUntil = 0;
  let solving = false;
  const wait = (ms) => { waitUntil = now() + ms / ctx.speed; };
  function tick() {
    timer = setTimer(tick, tickMs);
    if (!on || solving || now() < waitUntil || ctx.isBusy()) return;
    const s = ctx.state();
    switch (s.screen) {
      case 'start': ctx.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1, mode: 'night' }); break;
      case 'dayIntro': ctx.dispatch({ type: 'CONTINUE' }); wait(800); break;
      case 'playing':
        solving = true;
        ctx.autoSolve('message').finally(() => { solving = false; wait(900); });
        break;
      case 'messageDone': ctx.dispatch({ type: 'NEXT_MESSAGE' }); wait(700); break;
      case 'dayStats': ctx.dispatch({ type: 'NEXT_DAY' }); wait(2500); break;
      case 'gameOver': ctx.dispatch({ type: 'RESTART_DAY' }); wait(1000); break;
      case 'closing': api.stop(); break;
      default: break;
    }
  }
  const api = {
    get on() { return on; },
    start() { if (on) return; on = true; wait(300); tick(); },
    stop() { on = false; clearTimer(timer); timer = null; },
  };
  return api;
}

const b = (act, label, extra = '') => `<button type="button" data-judge="${act}"${extra}>${label}</button>`;

export function panelHtml() {
  return `<aside class="judge-panel" aria-label="Judge panel">
  <div class="jp-head"><strong>Kiroween Judge</strong>
    <button type="button" class="jp-fold" aria-expanded="true" aria-controls="jp-body">Fold</button></div>
  <p class="jp-sound" role="status">Click anywhere to enable sound</p>
  <div id="jp-body" class="jp-body">
    <fieldset><legend>Jump to</legend>${b('day-1', 'Day 1')}${b('day-2', 'Day 2')}${b('day-3', 'Day 3')}${b('closing', 'Closing')}</fieldset>
    <fieldset><legend>Cheats</legend>${b('solve-letter', 'Type the letter')}${b('solve-message', 'Type the message')}${b('skip', 'Skip message')}
      ${b('life-plus', '+1 life')}${b('life-full', 'Full galvanometer')}${b('life-minus', '−1 life')}
      <label><input type="checkbox" data-judge="infinite"> Infinite lives</label>
      ${b('gameover', 'Force game over')}${b('stats', 'Show stats')}</fieldset>
    <fieldset><legend>Show off</legend>${b('mode-night', 'Night Shift')}${b('mode-day', 'Day Shift')}
      <label class="jp-wide">Scare <input type="range" data-judge="scare" min="0" max="100" value="0"> <span class="jp-scare">auto</span></label>
      ${EFFECT_BUTTONS.map(([id, label]) => b(`fx-${id}`, label)).join('')}
      ${b('captions', 'Captions on')}${b('thought', 'Show a thought')}</fieldset>
    <fieldset><legend>Watch</legend>${b('demo', 'Play demo')}
      <label><input type="checkbox" data-judge="autoplay"> Auto-play</label>
      <span class="jp-speed">Speed ${SPEEDS.map((v) => b(`speed-${v}`, `x${v}`, v === 1 ? ' aria-pressed="true"' : ' aria-pressed="false"')).join('')}</span></fieldset>
    ${b('exit', 'Exit Kiroween Judge', ' class="jp-exit"')}
  </div></aside>`;
}

// One screen on `?judge=1` [R13.6]: what this is, and every day one click away.
export function welcomeHtml() {
  return `<div class="judge-welcome" role="dialog" aria-modal="true" aria-labelledby="jw-title">
  <div class="card">
    <h2 id="jw-title">Welcome, Kiroween judge</h2>
    <p>Dead Air is a telegraph station in 1873. You send and receive Morse code while the night goes wrong.</p>
    <p>The Judge panel on the left can jump to any day, solve messages, change lives and fire every scare. Nothing you do here is saved.</p>
    <p>Sound starts with your first click. Hold Space to send; type the letter you hear to receive.</p>
    <div class="card-buttons">${b('w-demo', 'Start demo')}${b('w-explore', 'Explore')}</div>
    <div class="card-buttons">${b('w-day-1', 'Day 1')}${b('w-day-2', 'Day 2')}${b('w-day-3', 'Day 3')}</div>
  </div></div>`;
}

// Draws the panel (and the welcome card when `welcome` is true) and wires every control to `ctx`.
export function mountJudge(root, ctx, { welcome = true } = {}) {
  root.insertAdjacentHTML('beforeend', panelHtml());
  const panel = root.querySelector('.judge-panel');
  const body = panel.querySelector('.jp-body');
  const fold = panel.querySelector('.jp-fold');
  const sound = panel.querySelector('.jp-sound');
  const scareLabel = panel.querySelector('.jp-scare');
  const auto = createAutoPlay(ctx);
  let demo = null;
  let speed = 1;

  const setSpeed = (v) => {
    speed = v;
    for (const x of panel.querySelectorAll('[data-judge^="speed-"]')) x.setAttribute('aria-pressed', String(x.dataset.judge === `speed-${v}`));
  };
  const stopDemo = () => { demo?.stop(); demo = null; };
  const startDemo = () => {
    stopDemo();
    auto.stop();
    panel.querySelector('[data-judge=autoplay]').checked = false;
    demo = runDemo(ctx, { speed, onEnd: () => { demo = null; panel.querySelector('[data-judge=demo]').textContent = 'Play demo'; } });
    panel.querySelector('[data-judge=demo]').textContent = 'Stop demo';
  };

  const actions = {
    'day-1': () => ctx.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1 }),
    'day-2': () => ctx.dispatch({ type: 'JUDGE_JUMP_DAY', day: 2 }),
    'day-3': () => ctx.dispatch({ type: 'JUDGE_JUMP_DAY', day: 3 }),
    closing: () => ctx.dispatch({ type: 'JUDGE_JUMP_DAY', day: 'closing' }),
    'solve-letter': () => ctx.autoSolve('letter'),
    'solve-message': () => ctx.autoSolve('message'),
    skip: () => ctx.dispatch({ type: 'JUDGE_SKIP' }),
    'life-plus': () => ctx.dispatch({ type: 'JUDGE_LIVES', op: '+1' }),
    'life-full': () => ctx.dispatch({ type: 'JUDGE_LIVES', op: 'full' }),
    'life-minus': () => ctx.dispatch({ type: 'JUDGE_LIVES', op: '-1' }),
    gameover: () => ctx.dispatch({ type: 'JUDGE_FORCE_GAMEOVER' }),
    stats: () => ctx.dispatch({ type: 'JUDGE_SHOW_STATS' }),
    'mode-night': () => ctx.dispatch({ type: 'JUDGE_SET_MODE', mode: 'night' }),
    'mode-day': () => ctx.dispatch({ type: 'JUDGE_SET_MODE', mode: 'day' }),
    captions: () => ctx.captionsOn(),
    thought: () => ctx.showThought(),
    demo: () => (demo ? stopDemo() : startDemo()),
    exit: () => { stopDemo(); auto.stop(); ctx.exit(); },
  };
  for (const [id] of EFFECT_BUTTONS) actions[`fx-${id}`] = () => ctx.effect(id);
  for (const v of SPEEDS) actions[`speed-${v}`] = () => setSpeed(v);

  panel.addEventListener('click', (e) => {
    const el = e.target.closest('button[data-judge]');
    if (!el) return;
    actions[el.dataset.judge]?.();
    el.blur(); // so Space goes back to the telegraph key
  });
  panel.querySelector('[data-judge=infinite]').addEventListener('change', (e) => ctx.dispatch({ type: 'JUDGE_INFINITE', on: e.target.checked }));
  panel.querySelector('[data-judge=autoplay]').addEventListener('change', (e) => { if (e.target.checked) { stopDemo(); auto.start(); } else auto.stop(); });
  panel.querySelector('[data-judge=scare]').addEventListener('input', (e) => {
    const v = Number(e.target.value) / 100;
    ctx.setScare(v);
    scareLabel.textContent = `${e.target.value}%`;
  });
  fold.addEventListener('click', () => {
    const open = body.hidden;
    body.hidden = !open;
    fold.setAttribute('aria-expanded', String(open));
    fold.textContent = open ? 'Fold' : 'Open';
  });

  // Esc stops the demo before anything else sees the key [R13.4d].
  root.ownerDocument.defaultView.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && demo) { e.preventDefault(); e.stopImmediatePropagation(); stopDemo(); }
  }, true);

  // "Click anywhere to enable sound" until the first click [R13.7].
  const soundCheck = setInterval(() => { if (ctx.audioReady()) { sound.hidden = true; clearInterval(soundCheck); } }, 300);

  let card = null;
  if (welcome) {
    root.insertAdjacentHTML('beforeend', welcomeHtml());
    card = root.querySelector('.judge-welcome');
    const close = () => { card?.remove(); card = null; };
    card.addEventListener('click', (e) => {
      const el = e.target.closest('button[data-judge]');
      if (!el) return;
      const a = el.dataset.judge;
      close();
      if (a === 'w-demo') startDemo();
      else if (a.startsWith('w-day-')) actions[a.slice(2)]();
    });
    card.querySelector('[data-judge=w-explore]').focus();
  }

  return {
    panel,
    get speed() { return speed; },
    get demoRunning() { return !!demo; },
    get autoPlaying() { return auto.on; },
    startDemo,
    stopDemo,
  };
}
