// Night Shift screen effects [design 8, R6.4, R6.6, R7.1]: a vignette, a static-noise overlay and a
// flicker. With "Reduce flashing" the static and flicker become one slow dark fade, and nothing on
// screen changes more than 3 times a second. Day Shift never mounts this module.

export const STATIC_MS = 300;
export const STATIC_FRAME_MS = 50; // a new noise picture every 50 ms while static shows
export const FADE_MS = 600; // "Reduce flashing" replacement
export const MAX_CHANGES_PER_S = 3;
const MIN_GAP_REDUCED_MS = FADE_MS; // a second fade waits until the first is over

// What a mistake does on screen, as a list of steps. Pure, so tests can check the flashing rule.
// Each step: { kind, startMs, durationMs, changes } where `changes` counts sudden picture changes.
export function mistakePlan(reduce) {
  if (reduce) return [{ kind: 'fade', startMs: 0, durationMs: FADE_MS, changes: 0 }];
  return [
    { kind: 'static', startMs: 0, durationMs: STATIC_MS, changes: Math.ceil(STATIC_MS / STATIC_FRAME_MS) },
    { kind: 'flicker', startMs: 0, durationMs: STATIC_MS, changes: 4 },
  ];
}

// Sudden changes per second for a plan (smooth fades count as none).
export function changesPerSecond(plan) {
  const span = Math.max(...plan.map((s) => s.startMs + s.durationMs), 1);
  const changes = plan.reduce((n, s) => n + s.changes, 0);
  return (changes * 1000) / Math.max(span, 1000);
}

// May a new effect start at `now`? In reduced mode effects never overlap, so the screen
// fades at most once per 600 ms, which stays under 3 changes a second.
export function canFire(now, last, reduce) {
  if (!reduce) return true;
  return last === null || now - last >= MIN_GAP_REDUCED_MS;
}

export function mountEffects(container, { reduce = false, now = () => performance.now() } = {}) {
  const doc = container.ownerDocument;
  const layer = doc.createElement('div');
  layer.className = 'fx';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<div class="fx-vignette"></div><canvas class="fx-static" width="160" height="90"></canvas><div class="fx-fade"></div>';
  container.append(layer);
  const canvas = layer.querySelector('.fx-static');
  const fade = layer.querySelector('.fx-fade');
  const vignette = layer.querySelector('.fx-vignette');
  const g = canvas.getContext?.('2d') ?? null;
  let reduced = reduce;
  let last = null;
  let frameTimer = null;
  let fired = 0;

  function noise() {
    if (!g) return;
    const img = g.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  function showStatic() {
    clearInterval(frameTimer);
    noise();
    canvas.classList.add('on');
    frameTimer = setInterval(noise, STATIC_FRAME_MS);
    setTimeout(() => { clearInterval(frameTimer); canvas.classList.remove('on'); }, STATIC_MS);
  }

  function restartClass(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // restart the CSS animation
    el.classList.add(cls);
  }

  return {
    get fired() { return fired; },
    get reduced() { return reduced; },
    setReduce(v) { reduced = !!v; },
    // 0 to 1: how dark the edges are. The horror director sets this (T19).
    setIntensity(v) { vignette.style.opacity = String(0.35 + 0.65 * Math.min(1, Math.max(0, v))); },
    // A mistake [R6.4]. Returns the plan that ran, or null when it had to wait (reduced mode).
    mistake() {
      const t = now();
      if (!canFire(t, last, reduced)) return null;
      last = t;
      fired += 1;
      const plan = mistakePlan(reduced);
      for (const step of plan) {
        if (step.kind === 'static') showStatic();
        if (step.kind === 'flicker') restartClass(container, 'fx-flicker');
        if (step.kind === 'fade') restartClass(fade, 'on');
      }
      return plan;
    },
    destroy() { clearInterval(frameTimer); layer.remove(); container.classList.remove('fx-flicker'); },
  };
}
