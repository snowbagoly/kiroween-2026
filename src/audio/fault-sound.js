// The sounds of a failing line and of the night's dread, Night Shift [design 9, 10, R6.4,
// R6.7, R5.5]. One-off sounds: each builds its nodes on the effects bus and frees them when done.
// They need a click first (no context before), and do nothing without one.

export const STING_ROOT = 77.78; // Eb2: the low swell under a mistake, with a sour tritone above it

// Builds a one-off sound with `build(ctx, out, n)`, where n(node) keeps a node to free after `seconds`.
function faultOneOff(engine, seconds, build, { out = null } = {}) {
  if (!engine.ready) return false;
  const ctx = engine.ctx;
  const nodes = [];
  const n = (node) => { nodes.push(node); return node; };
  build(ctx, out ?? engine.sfxBus, n);
  setTimeout(() => { for (const x of nodes) { try { x.stop?.(); } catch { /* already stopped */ } x.disconnect(); } }, seconds * 1000 + 200);
  return true;
}

function faultNoise(ctx, n, seconds) {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = n(ctx.createBufferSource());
  src.buffer = buf;
  return src;
}

// A short knock of band-passed noise, like a clack on wood or a needle on its stop.
function faultClack(ctx, n, out, level, freq, t) {
  const src = faultNoise(ctx, n, 0.08);
  const bp = n(ctx.createBiquadFilter());
  bp.type = 'bandpass';
  bp.frequency.value = freq * (0.85 + Math.random() * 0.3);
  bp.Q.value = 1.4;
  const g = n(ctx.createGain());
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
  src.connect(bp); bp.connect(g); g.connect(out);
  src.start(t);
}

function faultPanner(ctx, n, out, value) {
  if (!ctx.createStereoPanner) return out;
  const p = n(ctx.createStereoPanner());
  p.pan.value = value;
  p.connect(out);
  return p;
}

// The line spitting at a wrong letter: a stutter of crackle, the needle jolting in its case, and a low
// sour swell on Eb with a tritone above it, which grows and sags as the line weakens [R6.4].
export function lineFault(engine, severity) {
  const fall = 1.2 + severity * 1.8;
  return faultOneOff(engine, fall + 0.2, (ctx, out, n) => {
    const t = ctx.currentTime;
    const length = 0.16 + severity * 0.35;
    const level = 0.08 + severity * 0.14;
    const crackle = faultNoise(ctx, n, length + 0.05);
    const bp = n(ctx.createBiquadFilter());
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.7;
    const spit = n(ctx.createGain());
    spit.gain.setValueAtTime(0, t);
    for (let at = 0; at < length; at += 0.022) spit.gain.setValueAtTime(Math.random() * level, t + at);
    spit.gain.setValueAtTime(0, t + length);
    crackle.connect(bp); bp.connect(spit); spit.connect(out);
    crackle.start(t);
    const peak = 0.025 + severity ** 1.3 * 0.12;
    const swell = n(ctx.createGain());
    swell.gain.setValueAtTime(0, t);
    swell.gain.linearRampToValueAtTime(peak, t + 0.12);
    swell.gain.exponentialRampToValueAtTime(0.001, t + fall);
    const lp = n(ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.value = 350 + severity * 700;
    lp.connect(swell); swell.connect(out);
    for (const [ratio, mix] of [[1, 1], [Math.SQRT2 * 1.004, 0.25 + severity * 0.75], [2.012, 0.3]]) {
      const o = n(ctx.createOscillator());
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(STING_ROOT * ratio, t);
      o.frequency.exponentialRampToValueAtTime(STING_ROOT * ratio * 2 ** (-severity * 3 / 12), t + fall);
      const g = n(ctx.createGain());
      g.gain.value = mix;
      o.connect(g); g.connect(lp);
      o.start(t);
      o.stop(t + fall + 0.05);
    }
  });
}

// The electrical crackle of a failing light.
export function flickerBuzz(engine, seconds) {
  return faultOneOff(engine, seconds + 0.1, (ctx, out, n) => {
    const t = ctx.currentTime;
    const src = faultNoise(ctx, n, seconds + 0.05);
    const hp = n(ctx.createBiquadFilter());
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const g = n(ctx.createGain());
    g.gain.setValueAtTime(0, t);
    for (let at = 0; at < seconds; at += 0.03) g.gain.setValueAtTime(Math.random() * 0.05, t + at);
    g.gain.setValueAtTime(0, t + seconds);
    src.connect(hp); hp.connect(g); g.connect(out);
    src.start(t);
  });
}

// Two or three dull knocks off in the building; or, near, three hard ones on the wall right behind.
export function knock(engine, { near = false } = {}) {
  return faultOneOff(engine, 2, (ctx, out, n) => {
    const p = faultPanner(ctx, n, out, (Math.random() < 0.5 ? -1 : 1) * (near ? Math.random() * 0.2 : 0.4 + Math.random() * 0.4));
    const count = near ? 3 : 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const t = ctx.currentTime + i * (near ? 0.42 + Math.random() * 0.05 : 0.32 + Math.random() * 0.08);
      const src = faultNoise(ctx, n, 0.35);
      const bp = n(ctx.createBiquadFilter());
      bp.type = 'bandpass';
      bp.frequency.value = near ? 110 + Math.random() * 20 : 140 + Math.random() * 40;
      bp.Q.value = 3;
      const g = n(ctx.createGain());
      g.gain.setValueAtTime(near ? 9 : 3.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (near ? 0.3 : 0.2));
      src.connect(bp); bp.connect(g); g.connect(p);
      src.start(t);
      if (near) faultClack(ctx, n, p, 0.5, 800, t); // close by, the knuckle on the wood is heard too
    }
  });
}

// The sounder giving one click by itself, though nobody is sending [R6.7].
export function phantomClick(engine) {
  return faultOneOff(engine, 0.3, (ctx, out, n) => {
    const t = ctx.currentTime;
    faultClack(ctx, n, out, 0.4, 2600, t);
    faultClack(ctx, n, out, 0.2, 2200, t + 0.07);
  });
}

// The flame dropping low and blue: a soft gutter, like a breath across the chimney.
export function flameDrop(engine) {
  return faultOneOff(engine, 1.5, (ctx, out, n) => {
    const t = ctx.currentTime;
    const src = faultNoise(ctx, n, 1.4);
    const lp = n(ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(200, t + 1.2);
    const g = n(ctx.createGain());
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    src.connect(lp); lp.connect(g); g.connect(out);
    src.start(t);
  });
}

// A ringing tone with a few partials, e.g. glass.
function faultRing(ctx, n, out, freq, partials, level, t) {
  for (const [ratio, mix, decay] of partials) {
    const o = n(ctx.createOscillator());
    o.frequency.value = freq * ratio;
    const g = n(ctx.createGain());
    g.gain.setValueAtTime(level * mix, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g); g.connect(out);
    o.start(t);
    o.stop(t + decay + 0.05);
  }
}

// The galvanometer's glass cracking: a sharp snap, the crack running in tiny ticks, a faint ring [R6.4b].
export function glassCrack(engine) {
  return faultOneOff(engine, 1, (ctx, out, n) => {
    const t = ctx.currentTime;
    faultClack(ctx, n, out, 1.6, 4800, t);
    for (let i = 0, at = t + 0.02; i < 6; i++, at += 0.012 + Math.random() * 0.035) faultClack(ctx, n, out, 0.25 + Math.random() * 0.35, 6000 + Math.random() * 3000, at);
    faultRing(ctx, n, out, 3170, [[1, 0.6, 0.5], [1.48, 0.4, 0.35], [2.31, 0.25, 0.25]], 0.03, t);
  });
}

// Someone standing behind the operator [R6.4b]. In the dark, a swell of noise and a low growl rise for
// `swell` seconds and stop dead; on that instant a thump and glassy, clashing tones; then, close behind
// and to the left, a long breath out.
export function apparition(engine, swell) {
  return faultOneOff(engine, swell + 3.5, (ctx, out, n) => {
    const now = ctx.currentTime;
    const t = now + swell;
    const rise = n(ctx.createGain());
    rise.gain.setValueAtTime(0.001, now);
    rise.gain.exponentialRampToValueAtTime(0.5, t);
    rise.gain.setValueAtTime(0.5, t);
    rise.gain.linearRampToValueAtTime(0, t + 0.02);
    rise.connect(out);
    const hiss = faultNoise(ctx, n, swell + 0.05);
    const sweep = n(ctx.createBiquadFilter());
    sweep.type = 'bandpass';
    sweep.Q.value = 0.8;
    sweep.frequency.setValueAtTime(300, now);
    sweep.frequency.exponentialRampToValueAtTime(2400, t);
    const hg = n(ctx.createGain());
    hg.gain.value = 0.5;
    hiss.connect(sweep); sweep.connect(hg); hg.connect(rise);
    hiss.start(now);
    const growl = n(ctx.createBiquadFilter());
    growl.type = 'lowpass';
    growl.frequency.value = 400;
    growl.connect(rise);
    for (const f of [STING_ROOT * 0.75, STING_ROOT * 0.75 * 1.06]) {
      const o = n(ctx.createOscillator());
      o.type = 'sawtooth';
      o.frequency.value = f;
      const g = n(ctx.createGain());
      g.gain.value = 0.35;
      o.connect(g); g.connect(growl);
      o.start(now);
      o.stop(t + 0.05);
    }
    const thump = n(ctx.createOscillator());
    thump.frequency.setValueAtTime(70, t);
    thump.frequency.exponentialRampToValueAtTime(32, t + 0.5);
    const tg = n(ctx.createGain());
    tg.gain.setValueAtTime(0.7, t);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    thump.connect(tg); tg.connect(out);
    thump.start(t);
    thump.stop(t + 0.65);
    const glass = n(ctx.createGain());
    glass.gain.setValueAtTime(0, t);
    glass.gain.linearRampToValueAtTime(0.05, t + 0.15);
    glass.gain.exponentialRampToValueAtTime(0.001, t + 3);
    glass.connect(out);
    for (const f of [880 * 1.003, 1244.5, 1318.5]) {
      const o = n(ctx.createOscillator());
      o.frequency.value = f;
      o.connect(glass);
      o.start(t);
      o.stop(t + 3.1);
    }
    const at = t + 0.45;
    const breath = faultNoise(ctx, n, 1.7);
    const env = n(ctx.createGain());
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.35, at + 0.35);
    env.gain.exponentialRampToValueAtTime(0.001, at + 1.6);
    env.connect(faultPanner(ctx, n, out, -0.4));
    for (const [f, q, lvl] of [[750, 1, 1], [1750, 2.5, 0.6]]) {
      const bp = n(ctx.createBiquadFilter());
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = q;
      const g = n(ctx.createGain());
      g.gain.value = lvl;
      breath.connect(bp); bp.connect(g); g.connect(env);
    }
    breath.start(at);
  });
}

// The moment the line dies [R5.5]: a loud electrical crack and a low thump, the needle hitting its stop,
// and the sounder jamming into one long tone for `jam` seconds.
export function lineSnaps(engine, { jam = 1.8, freq = 622 } = {}) {
  return faultOneOff(engine, jam + 0.5, (ctx, out, n) => {
    const t = ctx.currentTime;
    const crack = faultNoise(ctx, n, 0.4);
    const hp = n(ctx.createBiquadFilter());
    hp.type = 'highpass';
    hp.frequency.value = 700;
    const cg = n(ctx.createGain());
    cg.gain.setValueAtTime(1.2, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    crack.connect(hp); hp.connect(cg); cg.connect(out);
    crack.start(t);
    const thump = n(ctx.createOscillator());
    thump.frequency.setValueAtTime(90, t);
    thump.frequency.exponentialRampToValueAtTime(35, t + 0.3);
    const tg = n(ctx.createGain());
    tg.gain.setValueAtTime(0.8, t);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    thump.connect(tg); tg.connect(out);
    thump.start(t);
    thump.stop(t + 0.4);
    faultClack(ctx, n, out, 1.4, 700, t + 0.12);
    const tone = n(ctx.createOscillator());
    tone.frequency.value = freq;
    const g = n(ctx.createGain());
    g.gain.setValueAtTime(0, t);
    g.gain.setTargetAtTime(0.25, t + 0.05, 0.004);
    g.gain.setValueAtTime(0.25, t + jam);
    g.gain.linearRampToValueAtTime(0, t + jam + 0.01); // cut dead
    tone.connect(g); g.connect(out);
    tone.start(t);
    tone.stop(t + jam + 0.05);
  });
}

// The ears ringing faintly while the air is heavy.
export function earRing(engine, seconds) {
  return faultOneOff(engine, seconds + 0.1, (ctx, out, n) => {
    const t = ctx.currentTime;
    const o = n(ctx.createOscillator());
    o.frequency.value = 5600;
    const g = n(ctx.createGain());
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.006, t + seconds * 0.3);
    g.gain.linearRampToValueAtTime(0, t + seconds);
    o.connect(g); g.connect(out);
    o.start(t);
    o.stop(t + seconds + 0.05);
  });
}

// One phrase of robin song outside the window at dawn, faint and to the left [R9.9]: a run of thin,
// high notes, each sliding up or down, some trilled, with tiny gaps between.
export function robin(engine) {
  return faultOneOff(engine, 3, (ctx, out, n) => {
    const g0 = n(ctx.createGain());
    g0.gain.value = 0.05;
    g0.connect(faultPanner(ctx, n, out, -0.5));
    let t = ctx.currentTime;
    const notes = 7 + Math.floor(Math.random() * 6);
    for (let i = 0; i < notes; i++) {
      const length = 0.05 + Math.random() * 0.14;
      const from = 2600 + Math.random() * 3200;
      const o = n(ctx.createOscillator());
      o.frequency.setValueAtTime(from, t);
      o.frequency.exponentialRampToValueAtTime(from * (0.7 + Math.random() * 0.7), t + length);
      const g = n(ctx.createGain());
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + 0.01);
      g.gain.setValueAtTime(1, t + length - 0.02);
      g.gain.linearRampToValueAtTime(0, t + length);
      if (Math.random() < 0.3) {
        const trill = n(ctx.createOscillator());
        trill.frequency.value = 28 + Math.random() * 20;
        const depth = n(ctx.createGain());
        depth.gain.value = from * 0.06;
        trill.connect(depth); depth.connect(o.frequency);
        trill.start(t);
        trill.stop(t + length);
      }
      o.connect(g); g.connect(g0);
      o.start(t);
      o.stop(t + length + 0.01);
      t += length + 0.02 + Math.random() * 0.09;
    }
  });
}
