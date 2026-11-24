// Screens. T11: the start screen [design 4, R1.1, R16.2, R13.1]. Later tasks add the others.

const MODE_BUTTONS = [
  { mode: 'night', label: 'Night Shift', line: 'scares and strange messages' },
  { mode: 'day', label: 'Day Shift', line: 'calm, no scares' },
];

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
