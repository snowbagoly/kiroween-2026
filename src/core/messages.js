// Message pool and day builder [design 6, R6.3, R6.7, R7.2, R9.2, R12.5, R16.1].
// Work messages read like 1870s telegrams: short, no small words, STOP for a full stop.
// Abbreviations are period business shorthand: RECD received, YR/YRS your/yours, INST this month,
// ULT last month, PROX next month, AMT amount, SHIPT shipment, MDSE merchandise, ADV advise, BAL balance.
import { shuffle, randomInt } from './rng.js';

export const MESSAGES = [
  { id: 'd1-01', day: 1, kind: 'send', text: 'ARRIVING TUESDAY NOON TRAIN STOP MEET ME AT DEPOT', strange: false, abbreviations: false },
  { id: 'd1-02', day: 1, kind: 'send', text: 'SEND MONEY', strange: false, abbreviations: false },
  { id: 'd1-03', day: 1, kind: 'send', text: 'ALL IS WELL', strange: false, abbreviations: false },
  { id: 'd1-04', day: 1, kind: 'send', text: 'MOTHER ILL COME HOME AT ONCE', strange: false, abbreviations: false },
  { id: 'd1-05', day: 1, kind: 'send', text: 'BABY BOY BORN TODAY STOP BOTH WELL', strange: false, abbreviations: false },
  { id: 'd1-06', day: 1, kind: 'send', text: 'CATTLE SOLD GOOD PRICE STOP HOME SATURDAY', strange: false, abbreviations: false },
  { id: 'd1-07', day: 1, kind: 'send', text: 'RECD YRS OF TENTH INST STOP SHIPT GOES MONDAY', strange: false, abbreviations: true },
  { id: 'd1-08', day: 1, kind: 'send', text: 'WIRE ANSWER', strange: false, abbreviations: false },
  { id: 'd1-09', day: 1, kind: 'send', text: 'NO ROOM AT HOTEL STOP FIND OTHER LODGING', strange: false, abbreviations: false },
  { id: 'd1-10', day: 1, kind: 'send', text: 'MISSED TRAIN STOP ARRIVE THURSDAY', strange: false, abbreviations: false },
  { id: 'd1-11', day: 1, kind: 'send', text: 'AMT DUE PAID STOP MDSE FOLLOWS PROX', strange: false, abbreviations: true },
  { id: 'd1-12', day: 1, kind: 'send', text: 'YES', strange: false, abbreviations: false },
  { id: 'd1-13', day: 1, kind: 'send', text: 'WEDDING SET FOR JUNE STOP BRING YOUR BEST COAT', strange: false, abbreviations: false },
  { id: 'd1-14', day: 1, kind: 'send', text: 'PLEASE ADVISE PRICE OF WHEAT', strange: false, abbreviations: false },
  { id: 'd1-15', day: 1, kind: 'send', text: 'SAFE HOME', strange: false, abbreviations: false },
  { id: 'd1-16', day: 1, kind: 'send', text: 'DO NOT ANSWER', strange: true, abbreviations: false },
  { id: 'd1-17', day: 1, kind: 'send', text: 'WHO IS THIS', strange: true, abbreviations: false },
  { id: 'd1-18', day: 1, kind: 'send', text: 'IT IS IN THE WIRES', strange: true, abbreviations: false },
  { id: 'd1-19', day: 1, kind: 'send', text: 'THE LINE IS COLD TONIGHT STOP SOMEONE ELSE IS LISTENING', strange: true, abbreviations: false },
  { id: 'd1-20', day: 1, kind: 'send', text: 'LET ME IN', strange: true, abbreviations: false },
  { id: 'd2-01', day: 2, kind: 'receive', text: 'FLOOD AT MILL CREEK STOP BRIDGE OUT STOP HOLD ALL TRAINS', strange: false, abbreviations: false },
  { id: 'd2-02', day: 2, kind: 'receive', text: 'TRAIN LATE', strange: false, abbreviations: false },
  { id: 'd2-03', day: 2, kind: 'receive', text: 'STORM COMING FROM WEST', strange: false, abbreviations: false },
  { id: 'd2-04', day: 2, kind: 'receive', text: 'PAY OPERATOR TEN CENTS', strange: false, abbreviations: false },
  { id: 'd2-05', day: 2, kind: 'receive', text: 'RECD YR WIRE STOP AMT SENT ULT NOT ARRIVED', strange: false, abbreviations: true },
  { id: 'd2-06', day: 2, kind: 'receive', text: 'NEW OPERATOR ARRIVES MONDAY STOP SHOW HIM THE LINE', strange: false, abbreviations: false },
  { id: 'd2-07', day: 2, kind: 'receive', text: 'DOCTOR NEEDED AT FARM', strange: false, abbreviations: false },
  { id: 'd2-08', day: 2, kind: 'receive', text: 'GOLD FOUND NEAR RIVER STOP MEN LEAVING TOWN BY THE HUNDRED', strange: false, abbreviations: false },
  { id: 'd2-09', day: 2, kind: 'receive', text: 'ALL CLEAR', strange: false, abbreviations: false },
  { id: 'd2-10', day: 2, kind: 'receive', text: 'HOLD MAIL', strange: false, abbreviations: false },
  { id: 'd2-11', day: 2, kind: 'receive', text: 'PRICE OF CORN RISING STOP BUY NOW', strange: false, abbreviations: false },
  { id: 'd2-12', day: 2, kind: 'receive', text: 'MDSE RECD DAMAGED STOP ADV BY RETURN WIRE', strange: false, abbreviations: true },
  { id: 'd2-13', day: 2, kind: 'receive', text: 'SHERIFF COMING ON EVENING STAGE', strange: false, abbreviations: false },
  { id: 'd2-14', day: 2, kind: 'receive', text: 'NOTHING TO REPORT', strange: false, abbreviations: false },
  { id: 'd2-15', day: 2, kind: 'receive', text: 'NO', strange: false, abbreviations: false },
  { id: 'd2-16', day: 2, kind: 'receive', text: 'THEY NEVER LEFT THE STATION', strange: true, abbreviations: false },
  { id: 'd2-17', day: 2, kind: 'receive', text: 'COLD HERE', strange: true, abbreviations: false },
  { id: 'd2-18', day: 2, kind: 'receive', text: 'STOP SENDING STOP STOP SENDING', strange: true, abbreviations: false },
  { id: 'd2-19', day: 2, kind: 'receive', text: 'THE OPERATOR BEFORE YOU DID NOT LISTEN EITHER', strange: true, abbreviations: false },
  { id: 'd2-20', day: 2, kind: 'receive', text: 'BEHIND YOU', strange: true, abbreviations: false },
  { id: 'd3-01', day: 3, kind: 'either', text: 'LINE DOWN NEAR PINE RIDGE STOP REPAIR CREW ON THE WAY', strange: false, abbreviations: false },
  { id: 'd3-02', day: 3, kind: 'either', text: 'ALL TRAINS ON TIME', strange: false, abbreviations: false },
  { id: 'd3-03', day: 3, kind: 'either', text: 'CONFIRM RECEIPT', strange: false, abbreviations: false },
  { id: 'd3-04', day: 3, kind: 'either', text: 'SEND TWO MORE MEN FOR THE NIGHT SHIFT STOP', strange: false, abbreviations: false },
  { id: 'd3-05', day: 3, kind: 'either', text: 'STOCK SHIPT PER YRS INST STOP BAL DUE PROX', strange: false, abbreviations: true },
  { id: 'd3-06', day: 3, kind: 'either', text: 'STATION AGENT WANTED STOP GOOD PAY STOP APPLY IN PERSON', strange: false, abbreviations: false },
  { id: 'd3-07', day: 3, kind: 'either', text: 'WIRE BACK', strange: false, abbreviations: false },
  { id: 'd3-08', day: 3, kind: 'either', text: 'CANNOT COME STOP WRITING LETTER', strange: false, abbreviations: false },
  { id: 'd3-09', day: 3, kind: 'either', text: 'STORM PASSED STOP NO DAMAGE', strange: false, abbreviations: false },
  { id: 'd3-10', day: 3, kind: 'either', text: 'LAMP OIL LOW STOP ORDER MORE', strange: false, abbreviations: false },
  { id: 'd3-11', day: 3, kind: 'either', text: 'GOOD NIGHT', strange: false, abbreviations: false },
  { id: 'd3-12', day: 3, kind: 'either', text: 'RECD STOP WILL ADV', strange: false, abbreviations: true },
  { id: 'd3-13', day: 3, kind: 'either', text: 'MEET AT CHURCH SUNDAY STOP BRING THE CHILDREN', strange: false, abbreviations: false },
  { id: 'd3-14', day: 3, kind: 'either', text: 'HOME SOON', strange: false, abbreviations: false },
  { id: 'd3-15', day: 3, kind: 'either', text: 'THE WIRE GOES NOWHERE', strange: true, abbreviations: false },
  { id: 'd3-16', day: 3, kind: 'either', text: 'NO ONE IS SENDING THIS', strange: true, abbreviations: false },
  { id: 'd3-17', day: 3, kind: 'either', text: 'YOU ARE THE LAST ONE AWAKE', strange: true, abbreviations: false },
  { id: 'd3-18', day: 3, kind: 'either', text: 'DEAD AIR', strange: true, abbreviations: false },
  { id: 'd3-19', day: 3, kind: 'either', text: 'WE HEAR YOU TAPPING STOP WE HAVE ALWAYS HEARD YOU', strange: true, abbreviations: false },
  { id: 'd3-20', day: 3, kind: 'either', text: 'OPEN THE DOOR', strange: true, abbreviations: false },
];

export const SHORT_MAX = 10; // letters
export const LONG_MIN = 20; // letters
export const MESSAGES_PER_DAY = 5;
const MAX_TRIES = 200;

export const lettersOf = (text) => text.replace(/[^A-Z]/g, '');

export function lengthClass(text) {
  const n = lettersOf(text).length;
  return n <= SHORT_MAX ? 'short' : n >= LONG_MIN ? 'long' : 'medium';
}

// Minimum strange messages per day. Night Shift day 1: only the 5th one.
export function strangeRule(day, mode) {
  if (mode === 'day') return { min: 0, max: 0, lastOnly: false };
  if (mode === 'deadair' || day === 3) return { min: 3, max: 4, lastOnly: false };
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
  if (strange < rule.min || strange > rule.max) broken.push('strange-count');
  if (rule.lastOnly && !list[list.length - 1]?.strange) broken.push('strange-last');
  if (day === 1 && list.some((m) => m.role !== 'send')) broken.push('roles');
  if (day === 2 && list.some((m) => m.role !== 'receive')) broken.push('roles');
  if (day === 3) {
    const send = list.filter((m) => m.role === 'send').length;
    if (send < 2 || MESSAGES_PER_DAY - send < 2) broken.push('roles');
  }
  return broken;
}

const withInfo = (m, role) => ({ ...m, role, letters: lettersOf(m.text), length: lengthClass(m.text) });

// Picks 5 messages for a day. `mode` is 'night', 'day' or 'deadair'. `rng` comes from createRng(seed).
export function buildDay(day, mode, rng) {
  const pool = MESSAGES.filter((m) => m.day === day);
  const normal = pool.filter((m) => !m.strange);
  const strange = mode === 'day' ? [] : pool.filter((m) => m.strange);
  const rule = strangeRule(day, mode);
  for (let i = 0; i < MAX_TRIES; i++) {
    const k = rule.min + randomInt(rng, rule.max - rule.min + 1);
    const odd = shuffle(strange, rng).slice(0, k);
    const work = shuffle(normal, rng).slice(0, MESSAGES_PER_DAY - k);
    const picked = rule.lastOnly ? [...shuffle(work, rng), ...odd] : shuffle([...work, ...odd], rng);
    const roles = day === 1 ? Array(MESSAGES_PER_DAY).fill('send')
      : day === 2 ? Array(MESSAGES_PER_DAY).fill('receive')
      : shuffle(['send', 'send', 'receive', 'receive', rng() < 0.5 ? 'send' : 'receive'], rng);
    const list = picked.map((m, j) => withInfo(m, roles[j]));
    if (checkDay(list, day, mode).length === 0) return list;
  }
  throw new Error(`buildDay: no valid day ${day} ${mode} after ${MAX_TRIES} tries`);
}
