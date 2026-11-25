// Screens [design 4]. The start screen fills the page; the others are cards over the desk.

const MODE_BUTTONS = [
  { mode: 'night', label: 'Night Shift', line: 'scares and strange messages' },
  { mode: 'day', label: 'Day Shift', line: 'calm, no scares' },
];

export const MODE_NAMES = { night: 'Night Shift', day: 'Day Shift', deadair: 'Dead Air' };

export function startScreenHtml({ deadAirUnlocked = false, judge = false } = {}) {
  const open = deadAirUnlocked || judge;
  const modes = MODE_BUTTONS.map((b) => `<button type="button" class="mode-btn" data-pick="${b.mode}">
      <span class="mode-name">${b.label}</span><span class="mode-line">${b.line}</span></button>`).join('');
  const dead = `<button type="button" class="mode-btn" data-pick="deadair"${open ? '' : ' disabled aria-disabled="true"'}>
      <span class="mode-name">Dead Air</span>
      <span class="mode-line">${open ? 'hard: 5 lives, no Morse chart, no second chance' : 'Finish Night Shift to unlock'}</span></button>`;
  return `<section class="screen start-screen" aria-labelledby="start-title">
    <h1 id="start-title">Dead Air</h1>
    <p class="subtitle">A telegraph station, 1873</p>
    <div class="mode-list">${modes}${dead}</div>
    <button type="button" class="judge-btn">Kiroween Judge</button>
  </section>`;
}

// Draws the start screen into `root`. `onPick(mode)` runs on a mode button, `onJudge()` on the Judge button.
export function mountStart(root, { data, judge = false, onPick = () => {}, onJudge = () => {} } = {}) {
  root.innerHTML = startScreenHtml({ deadAirUnlocked: data?.deadAirUnlocked, judge });
  for (const btn of root.querySelectorAll('.mode-btn')) {
    btn.addEventListener('click', () => { if (!btn.disabled) onPick(btn.dataset.pick); });
  }
  root.querySelector('.judge-btn').addEventListener('click', () => onJudge());
  root.querySelector('.mode-btn')?.focus();
}

// Day intro cards [R9.5, R4.6]. Day 2 explains receiving, Day 3 explains both.
export const DAY_INTROS = {
  1: 'The station is yours now. Send each message down the wire, one letter at a time.',
  2: 'Today the other station sends to you. Listen to each letter on the sounder, then type it.',
  3: 'From today you do both. Some messages you send, some you receive, and the row above the desk shows which.',
};

export const hudLabel = (mode, day) => `${MODE_NAMES[mode] ?? ''}${day ? ` · Day ${day}` : ''}`;

const pct = (n) => `${Math.round(n)}%`;
const wpm = (n) => n.toFixed(1);

// The stats from R8.1, as label and value pairs.
export function statsRows(s) {
  return [
    ['Messages', String(s.messages)],
    ['Letters right', String(s.lettersCorrect)],
    ['Mistakes', String(s.mistakes)],
    ['Accuracy', pct(s.accuracy)],
    ['Speed', `${wpm(s.wpm)} words per minute`],
    ['Lives left', String(s.livesLeft)],
    ['Longest streak', `${s.longestStreak} letters`],
  ];
}

const statsTable = (s, caption) => `<table class="stats-table"><caption>${caption}</caption><tbody>${
  statsRows(s).map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;

const btn = (action, label) => `<button type="button" data-action="${action}">${label}</button>`;

// One card for each screen that sits over the desk. Returns '' for screens with no card.
// `info` carries what the card needs: day, mode, role, stats, totals, best, unlocked.
export function cardHtml(screen, info = {}) {
  const { day = 1, mode = 'night' } = info;
  switch (screen) {
    case 'tutorialDialog':
      return `<h2>Start with the tutorial?</h2>
        <div class="card-buttons">${btn('tutorial-start', 'Start tutorial')}${btn('tutorial-notnow', 'Not now')}${btn('tutorial-never', 'Never')}</div>`;
    case 'tutorial':
      // Stand-in until T16 adds the instruction sheets.
      return `<h2>A stack of instruction sheets</h2>
        <p>Someone left notes on the desk. The sheets are not written yet.</p>
        <div class="card-buttons">${btn('tutorial-done', 'Put the sheets away')}</div>`;
    case 'dayIntro':
      return `<h2>Day ${day}</h2><p>${DAY_INTROS[day] ?? ''}</p>
        <div class="card-buttons">${btn('continue', 'Start the day')}</div>`;
    case 'messageDone':
      return `<h2>${info.role === 'receive' ? 'Message received' : 'Message sent'}</h2>
        <div class="card-buttons">${btn('next-message', 'Next message')}</div>`;
    case 'dayStats': {
      const s = info.stats;
      return `<h2>End of Day ${day}</h2>
        <p class="rank">Rank: <strong>${s.rank}</strong></p>
        ${statsTable(s, `Day ${day}`)}
        <div class="card-buttons">${btn('next-day', day < 3 ? 'Next day' : 'Finish')}</div>`;
    }
    case 'gameOver': {
      const title = mode === 'day' ? 'Out of lives' : 'The line went dead';
      const restart = info.canRestart === false ? '' : btn('restart-day', 'Restart this day');
      return `<h2>${title}</h2><p>Day ${day} ended with no lives left.</p>
        <div class="card-buttons">${restart}${btn('main-menu', 'Main menu')}</div>`;
    }
    case 'closing': {
      const t = info.totals;
      const best = info.best ? statsTable(info.best, `Best ${MODE_NAMES[mode]} run`) : '';
      const unlocked = info.unlocked ? '<p class="unlock">Dead Air is now open on the start screen.</p>' : '';
      return `<h2>Your shifts are over</h2>
        <p class="rank">Rank: <strong>${t.rank}</strong></p>
        ${statsTable(t, 'This run')}${best}${unlocked}
        <div class="card-buttons">${btn('main-menu', 'Main menu')}</div>`;
    }
    default:
      return '';
  }
}

// Shows a card in `layer` and wires its buttons to `onAction(action)`. An empty card hides the layer.
export function showCard(layer, screen, info, onAction) {
  const html = cardHtml(screen, info);
  layer.hidden = !html;
  layer.innerHTML = html ? `<div class="card card-${screen}" role="dialog" aria-modal="false" aria-labelledby="card-title">${html.replace('<h2>', '<h2 id="card-title">')}</div>` : '';
  for (const b of layer.querySelectorAll('[data-action]')) b.addEventListener('click', () => onAction(b.dataset.action));
  layer.querySelector('[data-action]')?.focus();
}
