// Effect voices. Each builds its own nodes and plays through the engine's voice budget [design 9].

const ATTACK = 0.005; // seconds, fast but no click
const RELEASE = 0.01;

// Telegraph tone: sine around 600 Hz. With `duration` it stops by itself;
// without it, it plays until `handle.stop()` (for a held key).
export function playTone(engine, { freq = 600, duration, level = 0.4 } = {}) {
  return engine.voice((ctx, out) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(level, t + ATTACK);
    osc.connect(env);
    env.connect(out);
    osc.start(t);
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      const s = ctx.currentTime;
      env.gain.setValueAtTime(level, s);
      env.gain.linearRampToValueAtTime(0, s + RELEASE);
      osc.stop(s + RELEASE + 0.005);
    };
    if (duration != null) {
      const end = t + Math.max(duration, ATTACK);
      env.gain.setValueAtTime(level, end);
      env.gain.linearRampToValueAtTime(0, end + RELEASE);
      osc.stop(end + RELEASE + 0.005);
      stopped = true;
    }
    return { source: osc, nodes: [env], stop };
  });
}

// Galvanometer tick: a very short high band-pass noise [design 9, R5.2].
export function playTick(engine, { level = 0.5 } = {}) {
  return engine.voice((ctx, out) => {
    const t = ctx.currentTime;
    const len = Math.ceil(ctx.sampleRate * 0.03);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3800;
    bp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.value = level;
    src.connect(bp);
    bp.connect(g);
    g.connect(out);
    src.start(t);
    return { source: src, nodes: [bp, g] };
  });
}

// The office galvanometer's needle jolting in its case when a life is lost: a dull wooden tock,
// band-passed noise around 520 Hz that dies in 45 ms [R5.2].
export function playTock(engine, { level = 0.9 } = {}) {
  return engine.voice((ctx, out) => {
    const t = ctx.currentTime;
    const len = Math.ceil(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 520 * (0.85 + Math.random() * 0.3);
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    src.connect(bp);
    bp.connect(g);
    g.connect(out);
    src.start(t);
    return { source: src, nodes: [bp, g] };
  });
}

// Static burst on a mistake in Night Shift: band-passed white noise, 300 ms [design 9, R6.4].
export function playStatic(engine, { level = 0.22, duration = 0.3 } = {}) {
  return engine.voice((ctx, out) => {
    const t = ctx.currentTime;
    const len = Math.ceil(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (i % 900 < 60 ? 0.3 : 1); // small dropouts, like a bad line
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.linearRampToValueAtTime(0, t + duration);
    src.connect(bp);
    bp.connect(g);
    g.connect(out);
    src.start(t);
    return { source: src, nodes: [bp, g] };
  });
}
