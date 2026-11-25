import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS, MAX_THOUGHT_WORDS, wordCount } from '../src/director/thoughts-data.js';

test('thoughts: at least 6 facts, one version each [R12.4]', () => {
  assert.ok(FACTS.length >= 6);
  assert.equal(new Set(FACTS.map((f) => f.id)).size, FACTS.length);
  for (const f of FACTS) assert.deepEqual(Object.keys(f).sort(), ['id', 'text'], f.id);
});

test('thoughts: every fact has at most 20 words [R12.2]', () => {
  for (const f of FACTS) assert.ok(wordCount(f.text) <= MAX_THOUGHT_WORDS, `${f.id}: ${wordCount(f.text)}`);
});
