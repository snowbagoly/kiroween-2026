import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBus } from '../src/core/events.js';
import { createSendFlow } from '../src/core/send.js';
import { createPressReader, attachKeyboard } from '../src/input/keyboard.js';

// Fake clock and timers so tests control time.
function harness() {
  let now = 0;
  const timers = new Map();
  let id = 0;
  const log = [];
  const reader = createPressReader({
    clock: { now: () => now },
    setTimer: (fn, ms) => { timers.set(++id, { fn, at: now + ms }); return id; },
    clearTimer: (i) => timers.delete(i),
    onPressStart: () => log.push('start'),
    onPressEnd: (e) => log.push(e.cancelled ? 'cancel' : 'end'),
    onSymbol: ({ symbol }) => log.push(symbol),
    onLetter: (r) => log.push(r),
  });
  const advance = (ms) => {
    now += ms;
    for (const [k, t] of [...timers]) if (t.at <= now) { timers.delete(k); t.fn(); }
  };
  const listeners = {};
  const target = { addEventListener: (n, f) => { listeners[n] = f; }, removeEventListener: (n) => { delete listeners[n]; } };
  const fire = (name, e = {}) => listeners[name]?.({ code: 'Space', key: ' ', repeat: false, ...e });
  return { reader, advance, log, target, fire, listeners, letters: () => log.filter((x) => typeof x === 'object') };
}

function tap(h, ms, gap = 100) { h.reader.pressStart(); h.advance(ms); h.reader.pressEnd(); h.advance(gap); }

test("send: dot, dash, then the new player's 720 ms gap gives A", () => {
  const h = harness();
  tap(h, 100); tap(h, 400, 0);
  h.advance(719);
  assert.equal(h.letters().length, 0);
  h.advance(1);
  assert.deepEqual(h.letters(), [{ pattern: '.-', letter: 'A' }]);
});

test('send: a new press cancels the gap timer', () => {
  const h = harness();
  tap(h, 100, 650); tap(h, 100, 650); tap(h, 100, 720);
  assert.deepEqual(h.letters(), [{ pattern: '...', letter: 'S' }]);
});

test('send: five symbols is wrong at once, without waiting', () => {
  const h = harness();
  for (let i = 0; i < 5; i++) tap(h, 50, 10);
  assert.deepEqual(h.letters(), [{ pattern: '.....', letter: null }]);
});

test('send: keyboard ignores repeats and other keys, blur cancels the press', () => {
  const h = harness();
  attachKeyboard(h.target, h.reader);
  h.fire('keydown', { code: 'KeyA', key: 'a' });
  assert.equal(h.reader.pressing, false);
  h.fire('keydown'); h.advance(200);
  h.fire('keydown', { repeat: true }); h.fire('keydown', { repeat: true });
  h.fire('blur');
  assert.equal(h.reader.pressing, false);
  assert.deepEqual(h.log, ['start', 'cancel']);
  h.fire('keyup');
  assert.deepEqual(h.log, ['start', 'cancel']);
});

test('send: Space does not scroll the page', () => {
  const h = harness();
  attachKeyboard(h.target, h.reader);
  let prevented = 0;
  h.fire('keydown', { preventDefault: () => prevented++ });
  h.fire('keyup', { preventDefault: () => prevented++ });
  assert.equal(prevented, 2);
});

test('send: keyboard can be switched off', () => {
  const h = harness();
  attachKeyboard(h.target, h.reader, { enabled: () => false });
  h.fire('keydown');
  assert.equal(h.reader.pressing, false);
});

test('send flow: listeners see the new position on LETTER_OK', () => {
  const bus = createBus();
  const flow = createSendFlow('AB', bus);
  let seen = null;
  bus.on('LETTER_OK', (p) => { seen = [p.index, p.next, flow.index]; });
  flow.letter({ pattern: '.-', letter: 'A' });
  assert.deepEqual(seen, [0, 1, 1]);
});

test('send flow: right letters move on, wrong ones stay, message sent at the end', () => {
  const bus = createBus(); const ev = [];
  for (const n of ['LETTER_OK', 'LETTER_WRONG', 'MESSAGE_SENT']) bus.on(n, (p) => ev.push([n, p]));
  const flow = createSendFlow('So s', bus);
  assert.deepEqual(flow.letters, ['S', 'O', 'S']);
  assert.equal(flow.letter({ pattern: '...', letter: 'S' }), true);
  assert.equal(flow.letter({ pattern: '..', letter: 'I' }), false);
  assert.equal(flow.expected, 'O');
  assert.equal(flow.letter({ pattern: '.....', letter: null }), false);
  flow.letter({ pattern: '---', letter: 'O' });
  flow.letter({ pattern: '...', letter: 'S' });
  assert.equal(flow.done, true);
  assert.deepEqual(ev.map((e) => e[0]), ['LETTER_OK', 'LETTER_WRONG', 'LETTER_WRONG', 'LETTER_OK', 'LETTER_OK', 'MESSAGE_SENT']);
  assert.deepEqual(ev.at(-1)[1], { text: 'SOS', mistakes: 2 });
  assert.equal(flow.letter({ pattern: '.', letter: 'E' }), null);
});
