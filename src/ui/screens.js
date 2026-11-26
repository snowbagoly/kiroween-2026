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

// A notice from the company [R8.1, R5.5]: a telegram form with the message pasted on in strips of
// printed tape, the figures written in by hand, and the buttons printed on the form.
export function noticeHtml({ title, strips = [], rank = null, rows = [], extra = '', buttons = '' }) {
  return `<header class="tg-head"><span class="tg-co">Marsh &amp; Western Telegraph Co.</span><span class="tg-title">Telegram</span></header>
    <h2 class="notice-title">${title}</h2>
    <dl class="tg-fields"><dt>To</dt><dd>Operator, Station 7</dd><dt>From</dt><dd>District Superintendent</dd></dl>
    <div class="notice-body">${strips.map((t) => `<span class="tape-strip">${t}</span>`).join('')}</div>
    ${rows.length ? `<dl class="notice-stats">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}${rank ? `<dt>Rank</dt><dd>${rank}</dd>` : ''}</dl>` : ''}
    ${extra}
    <div class="card-buttons notice-buttons">${buttons}</div>`;
}

export const NOTICE_SCREENS = ['dayStats', 'gameOver', 'closing'];

// One card for each screen that sits over the desk. Returns '' for screens with no card.
// `info` carries what the card needs: day, mode, role, stats, totals, best, unlocked.
export function cardHtml(screen, info = {}) {
  const { day = 1, mode = 'night' } = info;
  switch (screen) {
    case 'tutorialDialog':
      return `<h2>Start with the tutorial?</h2>
        <div class="card-buttons">${btn('tutorial-start', 'Start tutorial')}${btn('tutorial-notnow', 'Not now')}${btn('tutorial-never', 'Never')}</div>`;
    case 'tutorial': {
      // One handwritten sheet on the desk [R2.2, R2.3, R2.5].
      const sh = info.sheet;
      if (!sh) return '';
      const meter = sh.kind === 'press'
        ? `<div class="press-meter" aria-hidden="true"><div class="press-bar"></div><span class="press-mark"></span><span class="press-label">press Space</span></div>`
        : '';
      const replay = sh.kind === 'type' ? btn('tutorial-replay', 'Play it again') : '';
      return `<h2>Note ${info.index + 1} of ${info.total}</h2>
        <p class="sheet-text">${sh.text}</p>
        ${meter}
        <p class="sheet-hint" role="status">${info.hint ?? ''}</p>
        <div class="card-buttons">${replay}${btn('tutorial-done', 'Put the sheets away')}</div>`;
    }
    case 'dayIntro':
      return `<h2>Day ${day}</h2><p>${DAY_INTROS[day] ?? ''}</p>
        <div class="card-buttons">${btn('continue', 'Start the day')}</div>`;
    // No button: the next message starts by itself. In the office the stamp on the form says it,
    // so there is no card at all [R3.7, R4.5b].
    case 'messageDone':
      return info.office ? '' : `<h2>${info.role === 'receive' ? 'Message received' : 'Message sent'}</h2>`;
    case 'dayStats': {
      const s = info.stats;
      const last = day >= 3;
      return noticeHtml({
        title: `End of Day ${day}`,
        strips: [`SHIFT ENDED ${info.time ?? '06:00'} STOP`, 'RELIEF OPERATOR ARRIVED', last ? 'REPORT TO HEAD OFFICE' : 'REPORT AGAIN 22:00 TOMORROW'],
        rank: s.rank,
        rows: statsRows(s),
        buttons: btn('next-day', last ? 'Finish' : 'Next day'),
      });
    }
    case 'gameOver': {
      // Out of lives, or out of time: 06:00 came with telegrams left [R5.5, R5.6, R9.7g].
      const restart = info.canRestart === false ? '' : btn('restart-day', 'Restart this day');
      const time = info.time ?? '';
      const strips = info.reason === 'time'
        ? ['RELIEF OPERATOR ARRIVED 06:00', 'TELEGRAMS NOT SENT STOP', 'OPERATOR RELIEVED OF DUTY']
        : mode === 'day'
          ? [`TOO MANY ERRORS ON THE LINE AT ${time}`.trim(), 'OPERATOR RELIEVED OF DUTY']
          : [`LINE FROM STATION 7 DEAD AT ${time}`.trim(), 'OPERATOR RELIEVED OF DUTY'];
      const s = info.stats;
      const rows = s ? [['Telegrams done', `${s.messages} of ${info.total ?? 5}`], ['Letters right', String(s.lettersCorrect)], ['Mistakes on the line', String(s.mistakes)]] : [];
      return noticeHtml({
        title: info.reason === 'time' ? 'Out of time' : mode === 'day' ? 'Out of lives' : 'The line went dead',
        strips,
        rows,
        buttons: `${restart}${btn('main-menu', 'Main menu')}`,
      });
    }
    case 'closing': {
      const t = info.totals;
      // The best run, written on the same form in the same hand.
      const best = info.best
        ? `<p class="notice-sub">Best ${MODE_NAMES[mode]} run</p><dl class="notice-stats best">${statsRows(info.best).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`
        : '';
      const unlocked = info.unlocked ? '<p class="unlock">Dead Air is now open on the start screen.</p>' : '';
      return noticeHtml({
        title: 'Your shifts are over',
        strips: ['THREE NIGHTS AT STATION 7 SERVED', 'COMPANY THANKS OPERATOR STOP'],
        rank: t.rank,
        rows: statsRows(t),
        extra: `${best}${unlocked}`,
        buttons: btn('main-menu', 'Main menu'),
      });
    }
    default:
      return '';
  }
}

// Shows a card in `layer` and wires its buttons to `onAction(action)`. An empty card hides the layer.
export function showCard(layer, screen, info, onAction) {
  const html = cardHtml(screen, info);
  layer.hidden = !html;
  const notice = NOTICE_SCREENS.includes(screen) ? ' notice' : '';
  layer.innerHTML = html ? `<div class="card card-${screen}${notice}" role="dialog" aria-modal="false" aria-labelledby="card-title">${html.replace('<h2', '<h2 id="card-title"')}</div>` : '';
  for (const b of layer.querySelectorAll('[data-action]')) b.addEventListener('click', () => onAction(b.dataset.action));
  // On a tutorial sheet Space is the telegraph key, so no button may hold focus there.
  if (screen !== 'tutorial') layer.querySelector('[data-action]')?.focus();
}
