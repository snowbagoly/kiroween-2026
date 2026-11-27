import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutText, textRowStatus } from '../src/office/forms.js';
import { mountMorseChart } from '../src/office/codebook.js';
import { MORSE } from '../src/core/morse.js';

const cells = (html) => [...html.matchAll(/<span class="cell ([^"]*)">([^<]*)<\/span>/g)].map((m) => ({ cls: m[1], text: m[2] }));

test('text row: words keep one letter index across the message', () => {
  const w = layoutText('Train late');
  assert.equal(w.length, 2);
  assert.deepEqual(w[1].map((c) => c.index), [5, 6, 7, 8]);
});

test('text row: screen reader status', () => {
  assert.equal(textRowStatus('SOS', { role: 'send', pos: 1 }), 'Next letter O, 2 of 3');
  assert.equal(textRowStatus('SOS', { role: 'receive', pos: 0 }), 'Letter 1 of 3: listen and type it');
  assert.equal(textRowStatus('SOS', { role: 'send', pos: 3 }), 'Message sent');
  assert.equal(textRowStatus('SOS', { role: 'receive', pos: 3 }), 'Message received');
});

test('morse chart: always put on the wall [R3.1a]', () => {
  let drawn = 0;
  const parent = { insertAdjacentHTML: () => { drawn++; }, querySelector: () => ({}) };
  assert.ok(mountMorseChart(parent));
  assert.equal(drawn, 1);
});
