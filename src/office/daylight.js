// The office by day, for Day Shift [design 8, R7.2]. The window shows the marsh in daylight with
// clouds drifting (drawWindow and office.css); this file flies the bird past it.
// Now and then a small bird crosses the window, from one side to the other. Never while a letter is
// being keyed or sounding, and never when the player asked for less motion.

export const BIRD_GAP_S = [25, 70]; // seconds between two birds
export const BIRD_FLIGHT_MS = 4200; // one crossing (office.css, bird-fly)
export const BIRD_RETRY_MS = 3000; // busy when one was due: look again a little later

// Seconds until the next bird, for a random number r from 0 to 1.
export const nextBirdGap = (r) => BIRD_GAP_S[0] + r * (BIRD_GAP_S[1] - BIRD_GAP_S[0]);

// Which way it flies and how high it crosses, in the window's own units (200 by 240, sky above 150).
export function birdPath(r1, r2) {
  const leftToRight = r1 < 0.5;
  const y = 40 + r2 * 70;
  return { leftToRight, from: leftToRight ? -16 : 216, to: leftToRight ? 216 : -16, y, dip: 6 + r2 * 10 };
}

// Starts the birds on the office window (an <svg> drawn by drawWindow). `busy()` says the player is
// keying or a letter is sounding; `still()` says motion is to be kept down. Returns { fly, stop }.
export function mountBird(windowSvg, {
  busy = () => false, still = () => false, rng = Math.random, setTimer = setTimeout, clearTimer = clearTimeout,
} = {}) {
  const bird = windowSvg?.querySelector('.window-bird');
  let timer = null;
  let stopped = false;
  const later = (ms) => { if (!stopped) timer = setTimer(tick, ms); };

  function fly() {
    if (!bird) return false;
    const p = birdPath(rng(), rng());
    bird.style.setProperty('--from', `${p.from}px`);
    bird.style.setProperty('--to', `${p.to}px`);
    bird.style.setProperty('--y', `${p.y}px`);
    bird.style.setProperty('--dip', `${p.dip}px`);
    bird.style.setProperty('--face', p.leftToRight ? '1' : '-1');
    bird.classList.remove('flying');
    void bird.getBBox?.(); // restart the flight
    bird.classList.add('flying');
    setTimer(() => bird.classList.remove('flying'), BIRD_FLIGHT_MS + 100);
    return true;
  }

  function tick() {
    if (stopped) return;
    if (still()) { later(nextBirdGap(rng()) * 1000); return; }
    if (busy()) { later(BIRD_RETRY_MS); return; }
    fly();
    later(nextBirdGap(rng()) * 1000);
  }

  later(nextBirdGap(rng()) * 1000);
  return {
    fly,
    stop() { stopped = true; clearTimer(timer); bird?.classList.remove('flying'); },
  };
}
