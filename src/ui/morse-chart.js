// Morse chart: A to Z with dots and dashes, 4 columns, on the left side during play [design 8, R3.1a].
// Not shown in Dead Air [R16.5]; the caller decides whether to mount it.
import { MORSE } from '../core/morse.js';

function symbols(pattern) {
  return [...pattern].map((s) => `<i class="${s === '.' ? 'dot' : 'dash'}"></i>`).join('');
}

export function morseChartHtml() {
  const rows = Object.entries(MORSE)
    .map(([l, p]) => `<li aria-label="${l}: ${p.replace(/\./g, 'dot ').replace(/-/g, 'dash ').trim()}"><b>${l}</b><span>${symbols(p)}</span></li>`)
    .join('');
  return `<aside class="morse-chart" aria-label="Morse chart"><h2>Morse Code</h2><ol>${rows}</ol></aside>`;
}

export function mountMorseChart(parent) {
  parent.insertAdjacentHTML('afterbegin', morseChartHtml());
  return parent.querySelector('.morse-chart');
}
