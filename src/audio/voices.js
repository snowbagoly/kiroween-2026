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
