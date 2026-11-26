// The game clock of one day [design 7, R9.7 to R9.7h]: 22:00 to 06:00, running in real time.
// Pure: it gets tick(realMs, ...) calls and returns events, so tests drive it with any times.
// Minutes are counted from 22:00 (0) to 06:00 (480).

export const NIGHT_MINUTES = 480; // 22:00 to 06:00
export const START_HOUR = 22;
export const LAST_ARRIVAL = 360; // 04:00
// Real minutes for the night at 1x [R9.7b]. Tuned in play: 5 to 7 minutes was too short to finish
// five messages at a fair pace.
export const DAY_REAL_MINUTES = { 1: 10, 2: 16, 3: 16 }; // receiving is slower, so Day 2 and 3 get more time
export const IDLE_SPEED = 4; // nothing waiting on the desk [R9.7d]
export const DONE_SPEED = 6; // all done, running on to 06:00
export const LAST_STRETCH_S = 15; // the run to 06:00 after the last message never takes longer
export const MAX_TICK_MS = 1000; // a laptop waking from sleep does not jump the clock
export const ARRIVAL_JITTER = 15; // game minutes either way

// When each of n messages is handed in: the first at 22:00, the last by 04:00, in order.
export function arrivalTimes(n, rng = Math.random) {
  if (n <= 1) return [0];
  const step = LAST_ARRIVAL / (n - 1);
  const out = [0];
  for (let i = 1; i < n; i++) {
    const jitter = i === n - 1 ? -rng() * ARRIVAL_JITTER : (rng() * 2 - 1) * ARRIVAL_JITTER;
    out.push(Math.round(Math.min(LAST_ARRIVAL, Math.max(out[i - 1] + 1, i * step + jitter))));
  }
  return out;
}

// The clock face for minutes after 22:00, e.g. 30 -> 22:30, 480 -> 06:00.
export function clockTime(minutes) {
  const m = Math.round(START_HOUR * 60 + minutes) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// Minutes after midnight, for the wall clock's hands.
export const wallMinutes = (minutes) => (START_HOUR * 60 + minutes) % 1440;

export function createDayClock({ day = 1, arrivals = [0], realMinutes = DAY_REAL_MINUTES[day] ?? 5 } = {}) {
  const perMs = NIGHT_MINUTES / (realMinutes * 60000); // game minutes per real ms at 1x
  let minutes = 0;
  let arrived = 0;
  let started = false;
  let over = false;
  let lastSpeed = null;

  const c = {
    get minutes() { return minutes; },
    get arrived() { return arrived; },
    get started() { return started; },
    get over() { return over; },
    get progress() { return Math.min(1, minutes / NIGHT_MINUTES); },
    // The first press or typed letter of the day starts it [R9.7a]. The first message is on the desk at 22:00.
    start() { started = true; },
    // Judge "Skip message": hands message i in now, moving the clock on to its time if needed.
    bring(i) {
      if (i >= arrivals.length || arrived > i) return [];
      minutes = Math.max(minutes, arrivals[i]);
      const events = [];
      while (arrived <= i) { events.push({ type: 'ARRIVED', index: arrived, at: arrivals[arrived] }); arrived += 1; }
      return events;
    },

    // `inHand`: a message is on the form. `done`: how many of the day's messages are finished.
    // `hold`: never reach 06:00 (Judge "Infinite lives"). Returns the events in this tick, in order.
    tick(realMs, { inHand = false, done = 0, hold = false } = {}) {
      const events = [];
      if (!started || over) return events;
      const ms = Math.max(0, Math.min(MAX_TICK_MS, Number(realMs) || 0));
      const total = arrivals.length;
      const allDone = done >= total;
      const waiting = arrived - done - (inHand ? 1 : 0);
      // The last stretch: its speed is fixed when the work is done, so it takes at most 15 s.
      if (allDone && lastSpeed === null) lastSpeed = Math.max(DONE_SPEED, (NIGHT_MINUTES - minutes) / (LAST_STRETCH_S * 1000 * perMs));
      const speed = allDone ? lastSpeed : inHand || waiting > 0 ? 1 : IDLE_SPEED;
      minutes = Math.min(NIGHT_MINUTES, minutes + ms * perMs * speed);
      if (hold && !allDone) minutes = Math.min(minutes, NIGHT_MINUTES - 1);
      while (arrived < total && arrivals[arrived] <= minutes) {
        events.push({ type: 'ARRIVED', index: arrived, at: arrivals[arrived] });
        arrived += 1;
      }
      if (minutes >= NIGHT_MINUTES) {
        over = true;
        events.push({ type: allDone ? 'DAWN' : 'TIME_UP' });
      }
      return events;
    },
  };
  // The first message is handed in at 22:00, before the clock starts.
  if (arrivals[0] === 0) arrived = 1;
  return c;
}
