import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Contrast of every text colour pair on screen [design 14, R10.4]: 4.5:1 or better.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');

function palette(selector) {
  const block = html.match(new RegExp(`${selector.replace(/[[\]"]/g, '\\$&')}[^{]*\\{([^}]*)\\}`))[1];
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const PALETTES = { night: palette(':root, [data-mode="night"]'), day: palette('[data-mode="day"]') };

function parse(c) {
  c = c.trim();
  if (c.startsWith('#')) {
    const h = c.slice(1);
    const full = h.length === 3 || h.length === 4 ? [...h].map((x) => x + x).join('') : h;
    const n = (i) => parseInt(full.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  const p = m[1].split(',').map((x) => Number(x.trim()));
  return [p[0], p[1], p[2], p[3] ?? 1];
}
// Puts a see-through colour over a solid one.
const over = (top, under) => top.slice(0, 3).map((v, i) => v * top[3] + under[i] * (1 - top[3])).concat(1);
function luminance([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contrast(fg, bg) {
  const a = luminance(fg) + 0.05;
  const b = luminance(bg) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

// Each pair: where it is, the text colour, the background, and layers under a see-through background.
const pairs = (p) => {
  const v = (name) => p[name];
  return [
    ['page text', v('text'), v('bg')],
    ['message row letters', v('text'), v('bg')],
    ['mode and day label, Outgoing/Incoming tag', v('muted'), v('bg')],
    ['cards, chart, telegram, Options button', v('ink'), v('paper')],
    ['card buttons', v('paper'), v('ink')],
    ['tutorial sheet text', v('ink'), v('face')],
    ['tutorial hint', '#8a1f1a', v('face')],
    // The start screen always uses the Night Shift colours (main.js renderStart), so only check it there.
    ...(p === PALETTES.night ? [['start screen title', v('paper'), v('wall')], ['start screen subtitle', v('thought'), v('wall')]] : []),
    ['lives as a number', v('face'), v('frame')],
    ['thought line', v('thought'), p === PALETTES.day ? 'rgba(70,40,15,.7)' : 'rgba(0,0,0,.45)', v('desk')],
    ['caption', '#ffffff', 'rgba(0,0,0,.8)', v('desk')],
    ['End game buttons', '#ffffff', '#8a1f1a'],
    ['JUDGE badge', '#ffffff', '#8a1f1a'],
    ['Judge panel text', '#f2e6cc', 'rgba(20,14,10,.92)', v('bg')],
    ['Judge panel headings', '#c9b58a', 'rgba(20,14,10,.92)', v('bg')],
    ['Judge panel buttons', '#2a1d10', '#f2e6cc'],
    ['Judge sound hint', '#ffd27a', 'rgba(20,14,10,.92)', v('bg')],
  ];
};

for (const [mode, p] of Object.entries(PALETTES)) {
  for (const [where, fg, bg, under] of pairs(p)) {
    test(`contrast ${mode}: ${where} is at least 4.5:1 [R10.4]`, () => {
      let back = parse(bg);
      if (back[3] < 1) back = over(back, parse(under));
      const ratio = contrast(parse(fg), back);
      assert.ok(ratio >= 4.5, `${fg} on ${bg}${under ? ` over ${under}` : ''}: ${ratio.toFixed(2)}`);
    });
  }
}

test('strange message colour on the Night Shift background', () => {
  assert.ok(contrast(parse('#d9a48a'), parse(PALETTES.night.bg)) >= 4.5);
});

test('screen reader parts are in place [R5.7, R10]', async () => {
  const { optionsHtml } = await import('../src/ui/options.js');
  const form = readFileSync(resolve(root, 'src/office/forms.js'), 'utf8');
  assert.match(form, /tg-status" aria-live="polite"/); // the form is read out by a live region
  const main = readFileSync(resolve(root, 'src/main.js'), 'utf8');
  assert.match(main, /thought-line" role="status" aria-live="polite"/);
  const cap = readFileSync(resolve(root, 'src/audio/captions.js'), 'utf8');
  assert.match(cap, /'role', 'status'/);
  const g = readFileSync(resolve(root, 'src/office/galvanometer.js'), 'utf8');
  assert.match(g, /setAttribute\('aria-label', livesLabel/);
  assert.match(optionsHtml(), /role="dialog" aria-modal="true"/);
});
