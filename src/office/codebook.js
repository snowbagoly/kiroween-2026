// The codebook card on the office wall: A to Z with dots and dashes, 2 columns (A to M, N to Z) [design 8, R3.1a].
// Shown in Night Shift and Day Shift, never in Dead Air [R16.5].
import { MORSE } from '../core/morse.js';

export const chartVisible = (mode) => mode === 'night' || mode === 'day';

function symbols(pattern) {
  return [...pattern].map((s) => `<i class="${s === '.' ? 'dot' : 'dash'}"></i>`).join('');
}

export function morseChartHtml() {
  const rows = Object.entries(MORSE)
    .map(([l, p]) => `<li aria-label="${l}: ${p.replace(/\./g, 'dot ').replace(/-/g, 'dash ').trim()}"><b>${l}</b><span>${symbols(p)}</span></li>`)
    .join('');
  return `<aside class="morse-chart" aria-label="Morse chart"><h2>Morse Code</h2><ol>${rows}</ol></aside>`;
}

// Adds the chart for this mode. Returns null and draws nothing in Dead Air.
export function mountMorseChart(parent, mode = 'night') {
  if (!chartVisible(mode)) return null;
  parent.insertAdjacentHTML('afterbegin', morseChartHtml());
  return parent.querySelector('.morse-chart');
}
