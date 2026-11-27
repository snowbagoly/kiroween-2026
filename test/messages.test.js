import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MESSAGES, buildDay, lengthClass, checkDay } from '../src/core/messages.js';
import { createRng } from '../src/core/rng.js';
import { MORSE } from '../src/core/morse.js';

test('messages: at least 12 work messages per day, strange ones on top', () => {
  for (const d of [1, 2, 3]) {
    assert.ok(MESSAGES.filter((m) => m.day === d && !m.strange).length >= 12, `day ${d}`);
    assert.ok(MESSAGES.filter((m) => m.day === d && m.strange).length >= 5, `day ${d} strange`);
  }
});

test('messages: ids are unique and text uses only letters Morse can send', () => {
  assert.equal(new Set(MESSAGES.map((m) => m.id)).size, MESSAGES.length);
  for (const m of MESSAGES) {
    for (const ch of m.text.replace(/ /g, '')) assert.ok(MORSE[ch], `${m.id}: ${ch}`);
    assert.equal(m.text, m.text.trim());
  }
});

test('messages: some work messages use abbreviations, strange ones never do', () => {
  assert.ok(MESSAGES.filter((m) => m.abbreviations).length >= 4);
  assert.ok(MESSAGES.every((m) => !(m.strange && m.abbreviations)));
});

test('messages: length classes', () => {
  assert.equal(lengthClass('ALL IS WELL'), 'short');
  assert.equal(lengthClass('DO NOT ANSWER'), 'medium');
  assert.equal(lengthClass('ARRIVING TUESDAY NOON TRAIN'), 'long');
});

test('messages: Day Shift Day 1 example', () => {
  const day = buildDay(1, 'day', createRng(42));
  assert.equal(day.length, 5);
  assert.deepEqual(checkDay(day, 1, 'day'), []);
  assert.ok(day.every((m) => !m.strange && m.role === 'send'));
});

test('messages: no long message among the last two of any day, for 1000 seeds [R9.2]', async () => {
  const { createRng } = await import('../src/core/rng.js');
  const { buildDay } = await import('../src/core/messages.js');
  for (let seed = 1; seed <= 1000; seed++) {
    for (const mode of ['night', 'day', 'deadair']) {
      for (const day of [1, 2, 3]) {
        const list = buildDay(day, mode, createRng(seed));
        assert.ok(list.slice(-2).every((m) => m.length !== 'long'), `${seed} ${mode} ${day}`);
      }
    }
  }
});

test('messages: Day 1 starts short and keeps every telegram within two lines, for 1000 seeds [R9.2a]', async () => {
  const { createRng } = await import('../src/core/rng.js');
  const { buildDay, formLines, MESSAGES } = await import('../src/core/messages.js');
  assert.equal(formLines('MISSED TRAIN STOP ARRIVE THURSDAY'), 2);
  assert.equal(formLines('YES'), 1);
  assert.ok(MESSAGES.filter((m) => m.day === 1).every((m) => formLines(m.text) <= 2));
  for (let seed = 1; seed <= 1000; seed++) {
    for (const mode of ['night', 'day', 'deadair']) {
      const list = buildDay(1, mode, createRng(seed));
      assert.equal(list[0].length, 'short', `${seed} ${mode}`);
      assert.ok(list.every((m) => formLines(m.text) <= 2), `${seed} ${mode}`);
    }
  }
});
