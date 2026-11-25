import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS, MAX_THOUGHT_WORDS, wordCount, factText } from '../src/director/thoughts-data.js';

test('thoughts: at least 6 facts, each with an uneasy version [R12.4, R12.6]', () => {
  assert.ok(FACTS.length >= 6);
  assert.equal(new Set(FACTS.map((f) => f.id)).size, FACTS.length);
  for (const f of FACTS) assert.ok(f.text && f.uneasy && f.text !== f.uneasy, f.id);
});

test('thoughts: every line has at most 20 words [R12.2]', () => {
  for (const f of FACTS) {
    assert.ok(wordCount(f.text) <= MAX_THOUGHT_WORDS, `${f.id}: ${wordCount(f.text)}`);
    assert.ok(wordCount(f.uneasy) <= MAX_THOUGHT_WORDS, `${f.id} uneasy: ${wordCount(f.uneasy)}`);
  }
});

test('thoughts: the uneasy version keeps the real fact readable [R12.6]', () => {
  for (const f of FACTS) {
    assert.ok(f.text.includes(f.core), `${f.id} text`);
    assert.ok(f.uneasy.includes(f.core), `${f.id} uneasy`);
  }
});

test('thoughts: Day Shift never gets the uneasy version', () => {
  assert.equal(factText(FACTS[0], 'day', true), FACTS[0].text);
  assert.equal(factText(FACTS[0], 'night', true), FACTS[0].uneasy);
  assert.equal(factText(FACTS[0], 'night', false), FACTS[0].text);
});
