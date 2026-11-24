import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBus } from '../src/core/events.js';
import { deskSvg, getMode, DESK_PARTS } from '../src/ui/scene.js';

test('bus: on, emit, unsubscribe', () => {
  const bus = createBus(); const got = [];
  const off = bus.on('x', (v) => got.push(v));
  bus.emit('x', 1); off(); bus.emit('x', 2);
  assert.deepEqual(got, [1]);
});

test('scene: has every desk part', () => {
  const svg = deskSvg();
  for (const id of DESK_PARTS) assert.ok(svg.includes(`id="${id}"`), id);
});

test('scene: URL flag picks the palette', () => {
  assert.equal(getMode(''), 'night');
  assert.equal(getMode('?mode=day'), 'day');
  assert.equal(getMode('?mode=junk'), 'night');
});
