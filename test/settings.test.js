import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { createSettingsStore, defaultData, STORAGE_KEY, SAVE_VERSION } from '../src/core/settings.js';

function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    writes: 0,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) { this.writes++; m.set(k, String(v)); },
    raw: (k) => m.get(k),
  };
}

const blocked = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
};

test('settings: empty storage gives defaults', () => {
  const store = createSettingsStore({ storage: memoryStorage() });
  assert.deepEqual(store.load(), defaultData());
  assert.equal(defaultData().settings.tutorial, 'ask');
  assert.deepEqual(defaultData().best, { night: null, day: null });
});

test('settings: save then load round trip', () => {
  const storage = memoryStorage();
  const store = createSettingsStore({ storage });
  const d = defaultData();
  d.settings.musicVol = 0.3; d.settings.mute = true; d.settings.tutorial = 'never';
  d.best.night = { rank: 'Operator', accuracy: 0.9, wpm: 4 };
  assert.equal(store.save(d), true);
  assert.deepEqual(store.load(), d);
});

test('settings: unknown version is ignored', () => {
  const d = defaultData(); d.version = 99; d.settings.mute = true;
  const store = createSettingsStore({ storage: memoryStorage({ [STORAGE_KEY]: JSON.stringify(d) }) });
  assert.deepEqual(store.load(), defaultData());
});

test('settings: broken JSON and wrong types fall back to defaults', () => {
  assert.deepEqual(createSettingsStore({ storage: memoryStorage({ [STORAGE_KEY]: '{oops' }) }).load(), defaultData());
  const bad = { version: SAVE_VERSION, settings: { musicVol: 'loud', sfxVol: 5, mute: 'yes', tutorial: 'always' } };
  const got = createSettingsStore({ storage: memoryStorage({ [STORAGE_KEY]: JSON.stringify(bad) }) }).load();
  assert.equal(got.settings.musicVol, 0.8);
  assert.equal(got.settings.sfxVol, 1);
  assert.equal(got.settings.mute, false);
  assert.equal(got.settings.tutorial, 'ask');
});

test('settings: blocked storage does not crash', () => {
  const store = createSettingsStore({ storage: blocked });
  assert.deepEqual(store.load(), defaultData());
  assert.equal(store.save(defaultData()), false);
  const none = createSettingsStore({ storage: null });
  assert.deepEqual(none.load(), defaultData());
  assert.equal(none.save(defaultData()), false);
});

test('settings: saving off writes nothing (Judge mode)', () => {
  const storage = memoryStorage();
  const store = createSettingsStore({ storage, saving: false });
  assert.equal(store.save(defaultData()), false);
  store.setSaving(true); store.setSaving(false);
  store.save(defaultData());
  assert.equal(storage.writes, 0);
  assert.equal(storage.raw(STORAGE_KEY), undefined);
});

test('settings (property): any stored text loads to a valid shape without throwing', () => {
  fc.assert(fc.property(fc.oneof(fc.string(), fc.json(), fc.jsonValue().map((v) => JSON.stringify({ version: 1, settings: v, best: v }))), (text) => {
    const d = createSettingsStore({ storage: memoryStorage({ [STORAGE_KEY]: text }) }).load();
    assert.equal(d.version, SAVE_VERSION);
    assert.ok(d.settings.musicVol >= 0 && d.settings.musicVol <= 1);
    assert.ok(['ask', 'never'].includes(d.settings.tutorial));
    assert.deepEqual(Object.keys(d.best), ['night', 'day']);
  }));
});
