// Night Shift one-shot sounds [design 9 Voices, R6.1]: thunder, a crow, a distant scream and knocking.
// All synthesized. Each is one voice of the engine (so the 8-voice budget holds) and frees its nodes.

function noise(ctx, seconds, shape = () => 1) {
  const len = Math.ceil(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * shape(i / len, i);
  return buf;
}

// Thunder: long noise through a falling low-pass with a slow swell, and a few cracks at the start.
export function playThunder(engine, { level = 0.55, seconds = 5 } = {}) {
  return engine.voice((ctx, out) => {
    const t = ctx.currentTime;
    const crackAt = [0.05 + Math.random() * 0.2, 0.35 + Math.random() * 0.3];
    const src = ctx.createBufferSource();
    src.buffer = noise(ctx, seconds, (x) => {
      const crack = crackAt.some((c) => Math.abs(x * seconds - c) < 0.04) ? 2.2 : 1;
      return crack * (0.6 + 0.4 * Math.random());
    });
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.8;
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(320, t + 0.8);
    lp.frequency.exponentialRampToValueAtTime(90, t + seconds);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.35);
    g.gain.setValueAtTime(level, t + 0.9);
    g.gain.exponentialRampToValueAtTime(level * 0.5, t + 2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(lp); lp.connect(g); g.connect(out);
    src.start(t);
    return { source: src, nodes: [lp, g] };
  });
}

// Crow: 2 or 3 harsh caws, a sawtooth gliding down through a nasal band-pass, a little far away.
export function playCrow(engine, { level = 0.22, caws = 2 + Math.round(Math.random()) } = {}) {
  return engine.voice((ctx, out) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500;
    bp.Q.value = 2.5;
    const lp = ctx.createBiquadFilter(); // distance
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    let at = t + 0.02;
    for (let i = 0; i < caws; i++) {
      const f = 620 + Math.random() * 80;
      osc.frequency.setValueAtTime(f, at);
      osc.frequency.linearRampToValueAtTime(f * 0.72, at + 0.26);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(level, at + 0.03);
      g.gain.setValueAtTime(level, at + 0.18);
      g.gain.linearRampToValueAtTime(0, at + 0.28);
      at += 0.42 + Math.random() * 0.12;
    }
    osc.connect(bp); bp.connect(lp); lp.connect(g); g.connect(out);
    osc.start(t);
    osc.stop(at + 0.05);
    return { source: osc, nodes: [bp, lp, g] };
  });
}

// Distant scream: two detuned saws gliding up, muffled, with a slow echo so it sounds far off.
export function playScream(engine, { level = 0.12, seconds = 1.6 } = {}) {
  return engine.voice((ctx, out) => {
    const t = ctx.currentTime;
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    a.type = 'sawtooth';
    b.type = 'sawtooth';
    for (const [o, d] of [[a, 1], [b, 1.012]]) {
      o.frequency.setValueAtTime(420 * d, t);
      o.frequency.exponentialRampToValueAtTime(880 * d, t + seconds * 0.55);
      o.frequency.exponentialRampToValueAtTime(640 * d, t + seconds);
    }
    const vib = ctx.createOscillator();
    vib.frequency.value = 6;
    const vibAmt = ctx.createGain();
    vibAmt.gain.value = 14;
    vib.connect(vibAmt); vibAmt.connect(a.frequency); vibAmt.connect(b.frequency);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.25);
    g.gain.setValueAtTime(level, t + seconds * 0.7);
    g.gain.linearRampToValueAtTime(0, t + seconds);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.32;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const wet = ctx.createGain();
    wet.gain.value = 0.6;
    a.connect(lp); b.connect(lp); lp.connect(g);
    g.connect(out);
    g.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(out);
    const end = t + seconds + 1.6; // let the echo die away
    a.start(t); b.start(t); vib.start(t);
    b.stop(end); vib.stop(end); a.stop(end);
    return { source: a, nodes: [b, vib, vibAmt, lp, g, delay, fb, wet] };
  });
}

// Knocking: 2 or 3 low thuds on a wooden door, a falling sine with a short muffled click.
export function playKnock(engine, { level = 0.6, knocks = 2 + Math.round(Math.random()) } = {}) {
  return engine.voice((ctx, out) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, t);
    const click = ctx.createBufferSource();
    const span = knocks * 0.3 + 0.3;
    const sr = ctx.sampleRate;
    const times = Array.from({ length: knocks }, (_, i) => 0.03 + i * (0.26 + Math.random() * 0.05));
    click.buffer = noise(ctx, span, (x, i) => {
      const s = i / sr;
      const k = times.find((at) => s >= at && s < at + 0.03);
      return k === undefined ? 0 : Math.exp(-(s - k) / 0.006);
    });
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const cg = ctx.createGain();
    cg.gain.value = level * 0.7;
    for (const at of times) {
      osc.frequency.setValueAtTime(110, t + at);
      osc.frequency.exponentialRampToValueAtTime(55, t + at + 0.12);
      og.gain.setValueAtTime(0, t + at);
      og.gain.linearRampToValueAtTime(level, t + at + 0.004);
      og.gain.exponentialRampToValueAtTime(0.001, t + at + 0.16);
    }
    osc.connect(og); og.connect(out);
    click.connect(lp); lp.connect(cg); cg.connect(out);
    osc.start(t); click.start(t);
    osc.stop(t + span);
    return { source: osc, nodes: [og, click, lp, cg] };
  });
}

export const HORROR_SOUNDS = { thunder: playThunder, crow: playCrow, scream: playScream, knock: playKnock };
