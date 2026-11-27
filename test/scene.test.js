import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBus } from '../src/core/events.js';
import { morseChartHtml } from '../src/office/codebook.js';

test('bus: on, emit, unsubscribe', () => {
  const bus = createBus(); const got = [];
  const off = bus.on('x', (v) => got.push(v));
  bus.emit('x', 1); off(); bus.emit('x', 2);
  assert.deepEqual(got, [1]);
});

test('codebook: lists all 26 letters with their dots and dashes', () => {
  const html = morseChartHtml();
  assert.equal((html.match(/<li /g) ?? []).length, 26);
  assert.ok(html.includes('aria-label="A: dot dash"'));
  assert.ok(html.includes('aria-label="Q: dash dash dot dash"'));
});
