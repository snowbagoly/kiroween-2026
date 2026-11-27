import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { mountBird, nextBirdGap, birdPath, BIRD_GAP_S, BIRD_RETRY_MS } from '../src/office/daylight.js';

// A window with a bird in it, and a timer the test moves by hand.
function setup({ busy = () => false, still = () => false } = {}) {
  const classes = new Set();
  const bird = { style: { setProperty() {} }, classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) } };
  const svg = { querySelector: () => bird };
  let timers = [];
  const setTimer = (f, ms) => { const t = { f, ms }; timers.push(t); return t; };
  const clearTimer = (t) => { timers = timers.filter((x) => x !== t); };
  const fire = () => { const t = timers.shift(); t.f(); return t.ms; };
  let flights = 0;
  bird.classList.add = (c) => { classes.add(c); if (c === 'flying') flights++; };
  const b = mountBird(svg, { busy, still, rng: () => 0.5, setTimer, clearTimer });
  return { b, fire, flights: () => flights, timers: () => timers };
}

test('bird: flies now and then, 25 to 70 s apart [design 8]', () => {
  fc.assert(fc.property(fc.double({ min: 0, max: 1, noNaN: true }), (r) => {
    const g = nextBirdGap(r);
    return g >= BIRD_GAP_S[0] && g <= BIRD_GAP_S[1];
  }));
  const { fire, flights } = setup();
  assert.equal(fire(), nextBirdGap(0.5) * 1000);
  assert.equal(flights(), 1);
});

test('bird: never while a letter is keyed or sounding; it waits and tries again', () => {
  let busy = true;
  const { fire, flights } = setup({ busy: () => busy });
  fire();
  assert.equal(flights(), 0);
  busy = false;
  assert.equal(fire(), BIRD_RETRY_MS);
  assert.equal(flights(), 1);
});

test('bird: never with reduced motion, and stop() ends it', () => {
  const { b, fire, flights, timers } = setup({ still: () => true });
  for (let i = 0; i < 5; i++) fire();
  assert.equal(flights(), 0);
  b.stop();
  assert.equal(timers().length, 0);
});

test('bird: crosses the whole window above the marsh, either way', () => {
  fc.assert(fc.property(fc.double({ min: 0, max: 0.999, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), (r1, r2) => {
    const p = birdPath(r1, r2);
    const [a, z] = p.leftToRight ? [p.from, p.to] : [p.to, p.from];
    return a < 0 && z > 200 && p.y >= 40 && p.y + p.dip <= 150;
  }));
});
