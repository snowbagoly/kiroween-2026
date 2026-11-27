// Screenshots for checks [design 16]: headless Chrome, always muted, a fresh profile each run.
// Every animation is paused at a set moment before each shot, so two runs give the same pictures.
//
//   npm run shots                       (writes shots/)
//   node tools/shots.mjs [out-dir]      after `npm run build`; ONLY=dawn shoots just the names with "dawn"
//
// Set CHROME to the Chrome binary if it is not in the usual place.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = resolve(import.meta.dirname, '..');
const PAGE = join(ROOT, 'dist', 'index.html');
const OUT = resolve(process.argv[2] ?? join(ROOT, 'shots'));
const PORT = 9300 + Math.floor(Math.random() * 500);
const CHROME = process.env.CHROME ?? (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : 'google-chrome');

// The Judge panel and its welcome card are hidden; `test=1` gives the page hook.
const HIDE_JUDGE = '.judge-panel, .judge-welcome { display: none !important; }';
const g = 'window.__nightShift.game';

// name, page size, extra query, setup (runs in the page), wait before the shot (ms), freeze time (ms).
// A setup may `return` a CSS selector: the shot is taken as soon as it shows, or after `wait`.
const SHOTS = [
  { name: '01-start', wait: 1500, judge: false },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ name: `02-story-slide-${n}`, query: `&story=${n}`, wait: 4500 })),
  { name: '03-office-day1', setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1, mode: 'night' })`, wait: 2000 },
  { name: '04-office-late', query: '&dread=0.9', setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 3, mode: 'night' })`, wait: 3000 },
  {
    name: '05-last-warning',
    setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 2, mode: 'night' });
      setTimeout(() => window.__nightShift.judgeUi().panel.querySelector('[data-judge="fx-lastWarning"]').click(), 600); return '.room-window.watched';`,
    wait: 8000,
  },
  { name: '06-game-over', setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1, mode: 'night' }); setTimeout(() => ${g}.dispatch({ type: 'JUDGE_FORCE_GAMEOVER' }), 600)`, wait: 2500, key: '.dead-line' },
  { name: '07-dawn', query: '&dawn', wait: 3500 },
  { name: '08-dawn-notice', query: '&dawn', wait: 8000 },
  { name: '09-one-column-360', width: 360, height: 800, setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1, mode: 'night' })`, wait: 2000 },
  { name: '10-day-shift-desk', setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1, mode: 'day' })`, wait: 2000 },
  { name: '11-day-shift-bird', setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 2, mode: 'day' }); setTimeout(() => window.__nightShift.office().bird.fly(), 800)`, wait: 2100, pause: true },
  { name: '13-day-shift-1920', width: 1920, height: 1080, setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1, mode: 'day' })`, wait: 2000 },
  { name: '14-day-shift-1100', width: 1100, height: 900, setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1, mode: 'day' })`, wait: 2000 },
  { name: '15-day-shift-rest', setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 2, mode: 'day' }); setTimeout(() => ${g}.dispatch({ type: 'JUDGE_FORCE_GAMEOVER' }), 600)`, wait: 2500 },
  { name: '12-day-shift-360', width: 360, height: 800, setup: `${g}.dispatch({ type: 'JUDGE_JUMP_DAY', day: 1, mode: 'day' })`, wait: 2000 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!existsSync(PAGE)) throw new Error('dist/index.html is missing: run `npm run build` first');
  mkdirSync(OUT, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), 'nightshift-shots-'));
  const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--mute-audio', `--user-data-dir=${profile}`,
    `--remote-debugging-port=${PORT}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  try {
    const cdp = await connect();
    const only = process.env.ONLY;
    for (const shot of SHOTS.filter((x) => !only || x.name.includes(only))) {
      await take(cdp, shot);
      console.log(`wrote ${shot.name}.png`);
    }
    cdp.close();
  } finally {
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
}

async function connect() {
  let url;
  for (let i = 0; i < 75 && !url; i++) {
    try { url = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* not up yet */ }
    if (!url) await sleep(200);
  }
  if (!url) throw new Error('Chrome did not start');
  const ws = new WebSocket(url);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); pending.delete(m.id); });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async (expression) => {
    const r = (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result;
    if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'page error');
    return r?.result?.value;
  };
  return { send, evalJs, close: () => ws.close() };
}

async function take({ send, evalJs }, shot) {
  const { width = 1440, height = 900, query = '', setup = '', wait = 2000, freeze = 60000, judge = true, key = '', pause = false } = shot;
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  const search = judge ? `?judge=1&test=1${query}` : '?test=1';
  await send('Page.navigate', { url: `file://${PAGE}${search}` });
  await sleep(1200);
  await evalJs(`document.head.insertAdjacentHTML('beforeend', '<style>${HIDE_JUDGE}</style>'); document.fonts.ready.then(() => true)`);
  const waitFor = setup ? await evalJs(`(() => { const r = (() => { ${setup} })(); return typeof r === 'string' ? r : null; })()`) : null;
  if (key) {
    // A key once the line is dead: straight to the notice.
    const end = Date.now() + 10000;
    while (Date.now() < end && !(await evalJs(`!!document.querySelector(${JSON.stringify(key)})`))) await sleep(100);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter' });
  }
  if (waitFor) {
    const end = Date.now() + wait;
    while (Date.now() < end && !(await evalJs(`!!document.querySelector(${JSON.stringify(waitFor)})`))) await sleep(100);
  } else {
    await sleep(wait);
  }
  if (process.env.DEBUG) console.log(await evalJs(`JSON.stringify({ screen: ${g}.state.screen, layer: document.querySelector('.card-layer')?.className, anims: document.getAnimations().map((a) => a.animationName ?? a.transitionProperty).slice(0, 12) })`));
  // Freeze: a looping animation stops at the same moment every run; one that ends (a fade, a line
  // being written) jumps to its end, unless the shot wants it caught mid-way (`pause`).
  await evalJs(`document.getAnimations().forEach((a) => { try {
    if (a.effect?.getComputedTiming().iterations === Infinity) { a.pause(); a.currentTime = ${freeze}; } else if (${pause}) a.pause(); else a.finish();
  } catch {} }); true`);
  await sleep(100);
  const { data } = (await send('Page.captureScreenshot', { format: 'png' })).result;
  writeFileSync(join(OUT, `${shot.name}.png`), Buffer.from(data, 'base64'));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
