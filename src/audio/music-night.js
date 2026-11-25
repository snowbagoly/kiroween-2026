// Night Shift sound bed [design 9, R6.1, R6.2]: rain on the window, a low drone, slow ghostly
// "hoo" tones, a heartbeat whose tempo follows tension, and creaking wood. All synthesized.
// Rain goes to the effects bus (it is a room sound); the rest goes to the music bus.

export const MIN_BPM = 38;
export const MAX_BPM = 160;
export const DRONE_HZ = 36.71; // D1
// Tritone-heavy notes around D: D, G#, A, D#, used by the hoo and the creaks.
export const NIGHT_SCALE = [293.66, 415.3, 440, 311.13, 349.23];

const clampTension = (v) => Math.min(1, Math.max(0, Number(v) || 0));
export const bpmFor = (tension) => MIN_BPM + clampTension(tension) * (MAX_BPM - MIN_BPM);
export const beatSeconds = (tension) => 60 / bpmFor(tension);
// Seconds between two hoo tones and between two creaks: shorter as tension rises.
export const hooGap = (tension, r = 0.5) => (14 - 8 * clampTension(tension)) * (0.7 + 0.6 * r);
export const creakGap = (tension, r = 0.5) => (18 - 10 * clampTension(tension)) * (0.6 + 0.8 * r);

// Heartbeat times ("lub" then "dub") from `next` up to `until`, at the beat length for `tension`.
export function heartbeatTimes(next, until, tension) {
  const out = [];
  let t = next;
  const beat = beatSeconds(tension);
  while (t < until) {
    out.push({ at: t, strong: true }, { at: t + Math.min(0.2, beat * 0.3), strong: false });
    t += beat;
  }
  return { beats: out, next: t };
}

function noiseBuffer(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < len; i++) {
    b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); // a little darker than white noise
    d[i] = (Math.random() * 2 - 1) * 0.6 + b * 2;
  }
  return buf;
}

// `rng` is a function giving 0..1, so tests can make the timing fixed.
export function createNightMusic(engine, { rng = Math.random, lookahead = 0.4, tickMs = 100 } = {}) {
  let ctx = null;
  let nodes = []; // long-running nodes, disconnected on stop
  let out = null; // music gain for this bed
  let rainOut = null;
  let drone = null;
  let timer = null;
  let tension = 0;
  let nextBeat = 0;
  let nextHoo = 0;
  let nextCreak = 0;
  let oneShots = new Set();
  let beatCount = 0; // strong beats booked so far, for tests and the test page

  const keep = (...n) => { nodes.push(...n); return n[0]; };

  function startRain() {
    const src = keep(ctx.createBufferSource());
    src.buffer = noiseBuffer(ctx, 3);
    src.loop = true;
    const bp = keep(ctx.createBiquadFilter());
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 0.6;
    const lp = keep(ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.value = 5200;
    rainOut = keep(ctx.createGain());
    rainOut.gain.value = 0;
    rainOut.gain.setTargetAtTime(0.16, ctx.currentTime, 1.5);
    src.connect(bp); bp.connect(lp); lp.connect(rainOut); rainOut.connect(engine.sfxBus);
    src.start();
  }

  function startDrone() {
    const t = ctx.currentTime;
    const low = keep(ctx.createOscillator());
    low.type = 'sawtooth';
    low.frequency.value = DRONE_HZ;
    const up = keep(ctx.createOscillator());
    up.type = 'sine';
    up.frequency.value = DRONE_HZ * 2;
    up.detune.value = 7;
    const lp = keep(ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.value = 110;
    lp.Q.value = 3;
    // A slow wobble on the filter so the drone breathes.
    const lfo = keep(ctx.createOscillator());
    lfo.frequency.value = 0.07;
    const lfoAmt = keep(ctx.createGain());
    lfoAmt.gain.value = 35;
    lfo.connect(lfoAmt); lfoAmt.connect(lp.frequency);
    const g = keep(ctx.createGain());
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.22, t, 2);
    low.connect(lp); up.connect(lp); lp.connect(g); g.connect(out);
    low.start(); up.start(); lfo.start();
    drone = { lp, g };
  }

  // Short-lived sounds: they free their nodes when done.
  function oneShot(src, extra, stopAt) {
    const all = [src, ...extra];
    oneShots.add(all);
    src.onended = () => { oneShots.delete(all); for (const n of all) n.disconnect(); };
    src.stop(stopAt);
  }

  function hoo(at) {
    const f = NIGHT_SCALE[Math.floor(rng() * NIGHT_SCALE.length)] / 2;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f * 1.03, at);
    osc.frequency.linearRampToValueAtTime(f, at + 0.8); // a small sigh into the note
    const vib = ctx.createOscillator();
    vib.frequency.value = 4.5;
    const vibAmt = ctx.createGain();
    vibAmt.gain.value = f * 0.012;
    vib.connect(vibAmt); vibAmt.connect(osc.frequency);
    const vowel = ctx.createBiquadFilter(); // "oo" sits low, around 350 Hz
    vowel.type = 'bandpass';
    vowel.frequency.value = 350;
    vowel.Q.value = 1.2;
    const env = ctx.createGain();
    const len = 3.2;
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.11, at + 1.2);
    env.gain.linearRampToValueAtTime(0, at + len);
    osc.connect(vowel); vowel.connect(env); env.connect(out);
    osc.start(at); vib.start(at); vib.stop(at + len + 0.05);
    oneShot(osc, [vib, vibAmt, vowel, env], at + len + 0.05);
  }

  function beat(at, strong) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(strong ? 62 : 55, at);
    osc.frequency.exponentialRampToValueAtTime(38, at + 0.14);
    const env = ctx.createGain();
    const peak = (strong ? 0.5 : 0.32) * (0.35 + 0.65 * tension);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(peak, at + 0.008);
    env.gain.exponentialRampToValueAtTime(0.001, at + 0.22);
    osc.connect(env); env.connect(out);
    osc.start(at);
    oneShot(osc, [env], at + 0.25);
  }

  function creak(at) {
    // A slow buzz through a narrow filter that slides, like an old floorboard.
    const rate = 22 + rng() * 30;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(rate, at);
    osc.frequency.linearRampToValueAtTime(rate * (0.7 + rng() * 0.6), at + 0.9);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    const f = NIGHT_SCALE[Math.floor(rng() * NIGHT_SCALE.length)] * 2;
    bp.frequency.setValueAtTime(f, at);
    bp.frequency.linearRampToValueAtTime(f * (rng() < 0.5 ? 0.8 : 1.25), at + 0.9);
    bp.Q.value = 9;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.07, at + 0.15);
    env.gain.linearRampToValueAtTime(0.04, at + 0.6);
    env.gain.linearRampToValueAtTime(0, at + 1);
    osc.connect(bp); bp.connect(env); env.connect(out);
    osc.start(at);
    oneShot(osc, [bp, env], at + 1.05);
  }

  // Looks a little ahead and books sounds on the audio clock, so timing stays even.
  function tick() {
    const until = ctx.currentTime + lookahead;
    const hb = heartbeatTimes(nextBeat, until, tension);
    for (const b of hb.beats) if (b.at >= ctx.currentTime) { beat(b.at, b.strong); if (b.strong) beatCount += 1; }
    nextBeat = hb.next;
    if (nextHoo < until) { hoo(Math.max(nextHoo, ctx.currentTime)); nextHoo += hooGap(tension, rng()); }
    if (nextCreak < until) { creak(Math.max(nextCreak, ctx.currentTime)); nextCreak += creakGap(tension, rng()); }
  }

  const api = {
    get running() { return timer !== null; },
    get tension() { return tension; },
    get beatCount() { return beatCount; },
    start() {
      if (timer !== null || !engine.ready) return false;
      ctx = engine.ctx;
      out = keep(ctx.createGain());
      out.gain.value = 1;
      out.connect(engine.musicBus);
      startRain();
      startDrone();
      const t = ctx.currentTime;
      nextBeat = t + 1.5;
      nextHoo = t + 2 + rng() * 3;
      nextCreak = t + 5 + rng() * 6;
      api.setTension(tension);
      tick();
      timer = setInterval(tick, tickMs);
      return true;
    },
    // 0 is calm, 1 is the worst. Faster heartbeat, louder drone with a brighter filter [R6.2].
    setTension(v) {
      tension = clampTension(v);
      if (!drone) return;
      const t = ctx.currentTime;
      drone.g.gain.setTargetAtTime(0.18 + 0.17 * tension, t, 1.2);
      drone.lp.frequency.setTargetAtTime(90 + 160 * tension, t, 1.2);
    },
    // Fades out, then frees every node.
    stop(fade = 0.6) {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
      const t = ctx.currentTime;
      out.gain.setTargetAtTime(0, t, fade / 4);
      rainOut.gain.setTargetAtTime(0, t, fade / 4);
      const old = nodes;
      const shots = [...oneShots];
      nodes = [];
      oneShots = new Set();
      drone = null;
      setTimeout(() => {
        for (const n of old) { try { n.stop?.(); } catch { /* already stopped */ } n.disconnect(); }
        for (const s of shots) for (const n of s) n.disconnect();
      }, fade * 1000 + 50);
    },
  };
  return api;
}
