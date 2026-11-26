// The story's sound [design 9, R17.3, R17.4]: the sounder the story's sound pictures (ambience.js) and its
// piano are built on. Everything goes to the engine's buses, and every node is made through a context
// that keeps track of it, so the whole story can be silenced and freed when it ends.
import { Ambience } from './ambience.js';
import { Piano } from '../audio/piano.js';
import { createPhonograph } from '../audio/phonograph.js';
import { playLetter } from '../audio/sequencer.js';
import { midiToHz } from '../audio/scores.js';
import { encode } from '../core/morse.js';

const CLOCK_STRIKE_GAP = 1.4; // seconds between the strokes when the office clock strikes the hour

// A context that forwards everything to the real one, and notes each source and node it makes.
export function trackingContext(ctx, made) {
  return new Proxy(ctx, {
    get(target, prop) {
      const v = Reflect.get(target, prop, target);
      if (typeof v !== 'function') return v;
      if (typeof prop === 'string' && prop.startsWith('create') && prop !== 'createBuffer') {
        return (...args) => { const node = v.apply(target, args); made.push(node); return node; };
      }
      return v.bind(target);
    },
  });
}

export function createStorySound(engine, { music = true, rng = Math.random } = {}) {
  const made = [];
  const ctx = trackingContext(engine.ctx, made);
  const real = engine.ctx;
  const noiseBuffer = (seconds, brown) => {
    const buf = real.createBuffer(1, Math.ceil(real.sampleRate * seconds), real.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = rng() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  };

  const master = ctx.createGain();
  master.gain.value = 1;
  master.connect(engine.sfxBus);
  const s = {
    ctx,
    master,
    white: noiseBuffer(2, false),
    brown: noiseBuffer(4, true),
    piano: new Piano(ctx, engine.musicBus, { on: music }),
    record: null,
  };

  // Wind out of doors, muffled indoors (the ambience sets windMuffle).
  const windGain = ctx.createGain();
  windGain.gain.value = 0;
  const wind = ctx.createBufferSource();
  wind.buffer = s.white;
  wind.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 500;
  band.Q.value = 0.9;
  const wander = ctx.createOscillator();
  wander.frequency.value = 0.05;
  const wanderDepth = ctx.createGain();
  wanderDepth.gain.value = 250;
  wander.connect(wanderDepth); wanderDepth.connect(band.frequency);
  const gust = ctx.createGain();
  gust.gain.value = 0.5;
  const gustLfo = ctx.createOscillator();
  gustLfo.frequency.value = 0.09;
  const gustDepth = ctx.createGain();
  gustDepth.gain.value = 0.45;
  gustLfo.connect(gustDepth); gustDepth.connect(gust.gain);
  s.windMuffle = ctx.createBiquadFilter();
  s.windMuffle.type = 'lowpass';
  s.windMuffle.frequency.value = 20000;
  wind.connect(band); band.connect(gust); gust.connect(windGain); windGain.connect(s.windMuffle); s.windMuffle.connect(master);
  for (const n of [wind, wander, gustLfo]) n.start();

  // The office's room tone, let in on the office slide only.
  const roomTone = ctx.createGain();
  roomTone.gain.value = 0;
  roomTone.connect(master);
  const rumble = ctx.createBufferSource();
  rumble.buffer = s.brown;
  rumble.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  const rg = ctx.createGain();
  rg.gain.value = 0.06;
  rumble.connect(lp); lp.connect(rg); rg.connect(roomTone);
  rumble.start();
  for (const [f, lvl] of [[50, 0.01], [100, 0.004]]) {
    const o = ctx.createOscillator();
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = lvl;
    o.connect(g); g.connect(roomTone);
    o.start();
  }

  // A struck bell: each partial is [frequency ratio, level, seconds to die away].
  s.ring = (freq, partials, level, start, dest = master) => {
    const out = ctx.createGain();
    out.gain.value = level;
    out.connect(dest);
    for (const [ratio, partLevel, decay] of partials) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq * ratio;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(partLevel, start + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, start + decay);
      o.connect(g); g.connect(out);
      o.start(start);
      o.stop(start + decay + 0.1);
    }
  };
  // A short burst of band-passed noise that rises fast and dies away: paper moving.
  s.swish = (start, freq, level, length, out = master) => {
    const src = ctx.createBufferSource();
    src.buffer = s.white;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(level, start + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, start + length);
    src.connect(bp); bp.connect(g); g.connect(out);
    src.start(start, rng() * 1.5, length + 0.05);
  };
  s.clack = (level, freq, t = ctx.currentTime, out = master) => {
    const src = ctx.createBufferSource();
    src.buffer = s.white;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq * (0.85 + rng() * 0.3);
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    src.connect(bp); bp.connect(g); g.connect(out);
    src.start(t, rng() * 1.5, 0.06);
  };

  s.setWind = (level, tc = 2) => windGain.gain.setTargetAtTime(level * 0.3, ctx.currentTime, tc);
  s.setRoomTone = (level, tc = 0.5) => roomTone.gain.setTargetAtTime(level, ctx.currentTime, tc);
  s.ambience = new Ambience(s);

  // The record stays silent until the letter says the needle is set down [R17.4].
  s.dropNeedle = () => {
    if (s.record) return;
    s.record = createPhonograph(engine, { on: music, rng });
    s.record.start();
    s.clack(0.5, 300);
  };
  // The office clock striking the hour on its coiled gong.
  s.clockStrikes = (count) => {
    const partials = [[1, 0.5, 3.5], [2.42, 0.22, 2], [3.9, 0.1, 1.2], [5.3, 0.05, 0.7]];
    for (let i = 0; i < count; i++) s.ring(midiToHz(58), partials, 0.12, ctx.currentTime + 0.3 + i * CLOCK_STRIKE_GAP);
  };
  // The sounder breaking in: a station calling, at a practised pace.
  s.tapOut = (text, { dot = 0.07, dash = 0.21, gap = 0.07, letterGap = 0.21, wordGap = 0.49 } = {}) => {
    let at = 0;
    for (const c of text) {
      if (c === ' ') { at += wordGap; continue; }
      setTimeout(() => playLetter(engine, c, { hand: { dot, dash, gap }, lead: 0.01 }), at * 1000);
      at += [...(encode(c) ?? '')].reduce((n, sym) => n + (sym === '-' ? dash : dot) + gap, 0) + letterGap;
    }
  };
  s.setMusic = (on) => { s.piano.setOn(on); s.record?.setOn(on); };

  // Fades everything out, then stops and frees every node the story made.
  s.dispose = (fade = 1.5) => {
    s.piano.stop(fade);
    s.record?.stop(fade);
    master.gain.setTargetAtTime(0, real.currentTime, fade / 3);
    setTimeout(() => { for (const n of made) { try { n.stop?.(); } catch { /* not started or stopped */ } n.disconnect?.(); } }, fade * 1000 + 300);
  };
  return s;
}
