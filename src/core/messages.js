// Message pool and day builder [design 6, R6.3, R6.7, R7.2, R9.2, R12.5].
// The telegrams themselves are in message-pool.js.
import { POOL } from './message-pool.js';
import { shuffle, randomInt } from './rng.js';

export const MESSAGES = POOL;
// Day 1's last telegram in Night Shift: Head Office asking Mr Vane why he has not reported [R6.3a].
export const VANE_ID = 'd1-16';

export const SHORT_MAX = 10; // letters
export const LONG_MIN = 20; // letters
export const MESSAGES_PER_DAY = 5;
// Day 1 is the first night: every telegram fits two lines on the form [R9.2a]. Measured in Chrome,
// a line of the form holds 17 characters or more.
export const FORM_LINE_CHARS = 17;
export const DAY1_MAX_LINES = 2;

// How many lines a text takes on the form, words kept whole.
export function formLines(text, perLine = FORM_LINE_CHARS) {
  let lines = 0;
  let used = Infinity;
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    if (used + 1 + w.length > perLine) { lines += 1; used = w.length; } else used += 1 + w.length;
  }
  return lines;
}
const MAX_TRIES = 5000; // cheap: a day is five messages, and Day 1 has tight rules

export const lettersOf = (text) => text.replace(/[^A-Z]/g, '');

export function lengthClass(text) {
  const n = lettersOf(text).length;
  return n <= SHORT_MAX ? 'short' : n >= LONG_MIN ? 'long' : 'medium';
}

// Minimum strange messages per day. Night Shift day 1: only the 5th one.
export function strangeRule(day, mode) {
  if (mode === 'day') return { min: 0, max: 0, lastOnly: false };
  if (day === 3) return { min: 3, max: 4, lastOnly: false };
  if (day === 2) return { min: 2, max: 3, lastOnly: false };
  return { min: 1, max: 1, lastOnly: true };
}

const isMonotonic = (ns) => ns.every((n, i) => i === 0 || n >= ns[i - 1]) || ns.every((n, i) => i === 0 || n <= ns[i - 1]);

// Checks every rule for a built day. Returns a list of broken rule names (empty means fine).
export function checkDay(list, day, mode) {
  const broken = [];
  const lens = list.map((m) => m.letters.length);
  const strange = list.filter((m) => m.strange).length;
  const rule = strangeRule(day, mode);
  if (list.length !== MESSAGES_PER_DAY) broken.push('count');
  if (!list.some((m) => m.length === 'short')) broken.push('short');
  if (!list.some((m) => m.length === 'long')) broken.push('long');
  if (isMonotonic(lens)) broken.push('sorted');
  // The day gets easier toward 06:00: no long message among the last two [R9.2].
  if (list.slice(-2).some((m) => m.length === 'long')) broken.push('late-long');
  // A story told in parts keeps its order: a later part only after the one before it [R12.5].
  for (const [i, m] of list.entries()) {
    if (m.thread?.part > 1 && !list.slice(0, i).some((x) => x.thread?.id === m.thread.id && x.thread.part === m.thread.part - 1)) broken.push('thread-order');
  }
  // The first night starts gently: a short first telegram, and none longer than two lines [R9.2a].
  if (day === 1 && list[0]?.length !== 'short') broken.push('day1-first-short');
  if (day === 1 && list.some((m) => formLines(m.text) > DAY1_MAX_LINES)) broken.push('day1-lines');
  if (strange < rule.min || strange > rule.max) broken.push('strange-count');
  if (rule.lastOnly && !list[list.length - 1]?.strange) broken.push('strange-last');
  if (day === 1 && mode !== 'day' && list[list.length - 1]?.id !== VANE_ID) broken.push('vane-last');
  if (day === 1 && list.some((m) => m.role !== 'send')) broken.push('roles');
  if (day === 2 && list.some((m) => m.role !== 'receive')) broken.push('roles');
  if (day === 3) {
    const send = list.filter((m) => m.role === 'send').length;
    if (send < 2 || MESSAGES_PER_DAY - send < 2) broken.push('roles');
  }
  return broken;
}

const withInfo = (m, role) => ({ ...m, role, letters: lettersOf(m.text), length: lengthClass(m.text) });

// Picks 5 messages for a day. `mode` is 'night' or 'day'. `rng` comes from createRng(seed).
export function buildDay(day, mode, rng) {
  const pool = MESSAGES.filter((m) => m.day === day);
  const normal = pool.filter((m) => !m.strange);
  const strange = mode === 'day' ? [] : pool.filter((m) => m.strange);
  const rule = strangeRule(day, mode);
  for (let i = 0; i < MAX_TRIES; i++) {
    const k = rule.min + randomInt(rng, rule.max - rule.min + 1);
    // Day 1: the Vane telegram is the last, any other strange ones come before it.
    const vane = day === 1 ? strange.find((x) => x.id === VANE_ID) : null;
    const others = vane ? strange.filter((x) => x !== vane) : strange;
    const odd = shuffle(others, rng).slice(0, vane ? k - 1 : k);
    const work = shuffle(normal, rng).slice(0, MESSAGES_PER_DAY - k);
    const picked = vane ? [...shuffle([...work, ...odd], rng), vane]
      : rule.lastOnly ? [...shuffle(work, rng), ...odd] : shuffle([...work, ...odd], rng);
    const roles = day === 1 ? Array(MESSAGES_PER_DAY).fill('send')
      : day === 2 ? Array(MESSAGES_PER_DAY).fill('receive')
      : shuffle(['send', 'send', 'receive', 'receive', rng() < 0.5 ? 'send' : 'receive'], rng);
    const list = picked.map((m, j) => withInfo(m, roles[j]));
    if (checkDay(list, day, mode).length === 0) return list;
  }
  throw new Error(`buildDay: no valid day ${day} ${mode} after ${MAX_TRIES} tries`);
}
