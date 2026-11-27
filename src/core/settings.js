// Settings and saved data in one localStorage key [design 6, R8.4, R13.5].
// If storage is blocked or full, the game keeps working with the values in memory.
import { validHand } from './hand.js';

export const STORAGE_KEY = 'nightshift.v1'; // old deadair.v1 saves are not read
export const SAVE_VERSION = 1;
const TUTORIAL_CHOICES = ['ask', 'never'];
const BEST_MODES = ['night', 'day', 'deadair'];

export function defaultData() {
  return {
    version: SAVE_VERSION,
    settings: {
      musicVol: 0.8,
      sfxVol: 0.8,
      mute: false,
      music: true, // the record on the phonograph [R6.8]
      skipStory: false, // always go straight to the desk [R17.6]
      reduceFlashing: false,
      captions: false,
      showLivesNumber: false,
      tutorial: 'ask',
    },
    hand: null, // the learned hand { dot, dash }, or null for a new player [R3.3a]
    best: { night: null, day: null, deadair: null },
    deadAirUnlocked: false,
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const vol = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
const bool = (v, d) => (typeof v === 'boolean' ? v : d);

// Keeps only known fields with the right type; anything else falls back to the default.
export function cleanData(raw) {
  const d = defaultData();
  if (!isObj(raw) || raw.version !== SAVE_VERSION) return d;
  const s = isObj(raw.settings) ? raw.settings : {};
  d.settings.musicVol = vol(s.musicVol, d.settings.musicVol);
  d.settings.sfxVol = vol(s.sfxVol, d.settings.sfxVol);
  for (const k of ['mute', 'music', 'skipStory', 'reduceFlashing', 'captions', 'showLivesNumber']) d.settings[k] = bool(s[k], d.settings[k]);
  if (TUTORIAL_CHOICES.includes(s.tutorial)) d.settings.tutorial = s.tutorial;
  const b = isObj(raw.best) ? raw.best : {};
  for (const m of BEST_MODES) d.best[m] = isObj(b[m]) ? b[m] : null;
  d.deadAirUnlocked = bool(raw.deadAirUnlocked, false);
  d.hand = validHand(raw.hand); // a broken hand is a new player's
  return d;
}

export const SETTING_KEYS = ['musicVol', 'sfxVol', 'mute', 'music', 'skipStory', 'reduceFlashing', 'captions', 'showLivesNumber', 'tutorial'];

// Returns new data with one setting changed. Bad values fall back to the old value.
export function setSetting(data, key, value) {
  if (!SETTING_KEYS.includes(key)) return data;
  const base = cleanData({ ...data, version: SAVE_VERSION });
  const next = cleanData({ ...base, settings: { ...base.settings, [key]: value } });
  if (next.settings[key] !== value) next.settings[key] = base.settings[key];
  return next;
}

// Returns new data with the learned hand, or null to forget it.
export function setHand(data, hand) {
  return { ...cleanData({ ...data, version: SAVE_VERSION }), hand: validHand(hand) };
}

// Reading `localStorage` itself can throw (blocked cookies, sandboxed frames).
export function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// `saving: false` is for Kiroween Judge mode: nothing is ever written.
export function createSettingsStore({ storage = browserStorage(), saving = true } = {}) {
  let on = saving;
  return {
    get saving() { return on; },
    setSaving(v) { on = !!v; },
    load() {
      try {
        const text = storage?.getItem(STORAGE_KEY);
        return text ? cleanData(JSON.parse(text)) : defaultData();
      } catch {
        return defaultData();
      }
    },
    // Returns true only when the data was written.
    save(data) {
      if (!on || !storage) return false;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(cleanData({ ...data, version: SAVE_VERSION })));
        return true;
      } catch {
        return false;
      }
    },
  };
}
