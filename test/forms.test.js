// The telegram form and the paper tape [T34 in part, design 8, R3.1, R3.4a, R3.7, R4.2].
import test from 'node:test';
import assert from 'node:assert/strict';
import { formBodyHtml, formHtml, wordStarts, formatTime, STAMPS, MAX_TAPE_ITEMS } from '../src/office/forms.js';

test('form: each word is kept whole, one span per letter', () => {
  const html = formBodyHtml('SEND MONEY');
  assert.equal((html.match(/class="tg-word"/g) ?? []).length, 2);
  assert.equal((html.match(/class="tg-char /g) ?? []).length, 9);
  assert.match(html, /tg-space/);
});

test('form: sent letters fade, the next one is marked', () => {
  const html = formBodyHtml('ALL WELL', { pos: 2 });
  assert.equal((html.match(/tg-char sent/g) ?? []).length, 2);
  assert.match(html, /tg-char current" data-i="2">L</);
});

test('form: a received message shows blanks until each letter is typed', () => {
  const html = formBodyHtml('COME HOME', { role: 'receive', pos: 3 });
  assert.match(html, />C<.*>O<.*>M</);
  assert.equal((html.match(/blank/g) ?? []).length, 5);
  assert.doesNotMatch(html, />E</);
});

test('form: the company form with a stamp for sent and received', () => {
  const html = formHtml();
  assert.match(html, /Marsh &amp; Western Telegraph Co\./);
  assert.match(html, /tg-stamp/);
  assert.deepEqual(STAMPS, { send: 'Sent', receive: 'Received' });
});

test('tape: a gap goes before the first letter of each word after the first', () => {
  assert.deepEqual([...wordStarts('SEND MONEY NOW')], [4, 9]);
  assert.deepEqual([...wordStarts('YES')], []);
});

test('stamp time: hours and minutes, past midnight too', () => {
  assert.equal(formatTime(22 * 60), '22:00');
  assert.equal(formatTime(24 * 60 + 5), '00:05');
  assert.equal(formatTime(5 * 60 + 59.6), '06:00');
});

test('tape: keeps at most 120 items', () => {
  assert.equal(MAX_TAPE_ITEMS, 120);
});
