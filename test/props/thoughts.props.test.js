import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createThoughts, REACTIONS, fits, MAX_PER_DAY, wordCount, MAX_THOUGHT_WORDS } from '../../src/director/thoughts.js';
import { FACTS } from '../../src/director/thoughts-data.js';
import { lengthClass } from '../../src/core/messages.js';
import { RUNS } from './arbitraries.js';

// A random message: random words of capital letters, sometimes marked as abbreviated.
const word = fc.stringMatching(/^[A-Z]{1,9}$/);
const message = fc.record({ words: fc.array(word, { minLength: 1, maxLength: 10 }), abbreviations: fc.boolean(), strange: fc.boolean() })
  .map(({ words, abbreviations, strange }) => {
    const text = words.join(' ');
    return { text, length: lengthClass(text), abbreviations: strange ? false : abbreviations, strange };
  });

test('R12.2, R12.4a: on random messages, at most 2 a day, at most 20 words, and reactions only when they fit', () => {
  fc.assert(fc.property(fc.integer(), fc.constantFrom('night', 'day', 'deadair'), fc.array(fc.array(message, { minLength: 5, maxLength: 5 }), { minLength: 1, maxLength: 3 }), (seed, mode, days) => {
    let r = seed;
    const rng = () => { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; };
    const t = createThoughts({ rng });
    days.forEach((msgs, i) => {
      t.newDay();
      let today = 0;
      for (const m of msgs) {
        const th = t.pick(m);
        if (!th) continue;
        assert.ok(wordCount(th.text) <= MAX_THOUGHT_WORDS, th.text);
        if (th.kind === 'reaction') assert.ok(fits(REACTIONS.find((x) => x.id === th.id), m), `${th.id} on "${m.text}"`);
        if (th.kind === 'fact') assert.ok(FACTS.some((f) => f.text === th.text));
        t.shown(th);
        today += 1;
      }
      assert.ok(today <= MAX_PER_DAY, `${today} thoughts on day ${i + 1}`);
    });
  }), RUNS);
});

const longMsg = { text: 'ARRIVING TUESDAY NOON TRAIN STOP MEET ME AT DEPOT', length: 'long', abbreviations: false };
const crypticMsg = { text: 'RECD YRS OF TENTH INST', length: 'medium', abbreviations: true };

test('R12.4a: a long message shows "Phew, that must be a rich guy!"', () => {
  const t = createThoughts({ rng: () => 0.99 });
  const th = t.pick(longMsg, { day: 1, mode: 'night' });
  assert.equal(th.text, 'Phew, that must be a rich guy!');
});

test('R12.4a: a cryptic message shows the savings reaction', () => {
  const t = createThoughts({ rng: () => 0.99 });
  const th = t.pick(crypticMsg, { day: 1, mode: 'night' });
  assert.equal(th.text, 'I understand that you want to spare some money, but this message makes no sense anymore.');
});

test('thoughts: at least 6 facts and 4 reactions [R12.4, R12.4a]', () => {
  assert.ok(FACTS.length >= 6);
  assert.ok(REACTIONS.length >= 4);
  for (const x of REACTIONS) assert.ok(wordCount(x.text) <= MAX_THOUGHT_WORDS, x.id);
});
