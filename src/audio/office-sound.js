// The office's sound at night, Night Shift and Dead Air [design 9, R6.1, R6.2]: rain against the window,
// wind, the wind singing in the telegraph wires, the room tone (the low rumble of an empty building and
// the hum of the mains), and the phonograph in the next room playing the waltz. All synthesized.
// The room goes to the effects bus; the record to the music bus.
import { createPhonograph } from './phonograph.js';

// The rain and the wind stay well under the record, so the waltz can be heard through them.
export const LEVELS = Object.freeze({ rain: 0.035, rumble: 0.06, hum50: 0.01, hum100: 0.004, wind: 0.03, wires: 0.015 });
export const WIRE_PITCH = 318; // Hz; the lowest tone the wires sing
export const KEY_TONE_HZ = 622; // Eb5: the key's tone sits inside the waltz's key [R6.2]
export const WIND_FULL = 0.3; // wind gain at dread 1 (T37)

// `music`: the player's "Music" switch. `tension` (0 to 1, from the horror director) warps the record
// a little as lives fall.
export function createNightSound(engine, { music = true, rng = Math.random, phonograph = null } = {}) {
  let ctx = null;
  let nodes = [];
  let room = null; // everything but the record, faded together
  let windGain = null;
  let humGain = null;
  let running = false;
  const record = phonograph ?? createPhonograph(engine, { on: music, rng });

  const keep = (n) => { nodes.push(n); return n; };

  function noise(seconds, brown = false) {
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = rng() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    const src = keep(ctx.createBufferSource());
    src.buffer = buf;
    src.loop = true;
    return src;
  }
  const osc = (freq, type = 'sine') => { const o = keep(ctx.createOscillator()); o.type = type; o.frequency.value = freq; return o; };
  const gain = (v) => { const g = keep(ctx.createGain()); g.gain.value = v; return g; };
  const filter = (type, freq, q = 1) => { const f = keep(ctx.createBiquadFilter()); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; };
  const chain = (...n) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n.at(-1); };

  function build() {
    ctx = engine.ctx;
    room = gain(0);
    room.connect(engine.sfxBus);
    room.gain.setTargetAtTime(1, ctx.currentTime, 1.5);

    // Rain on the window.
    const rain = noise(3);
    chain(rain, filter('bandpass', 1400, 0.6), filter('lowpass', 5200), gain(LEVELS.rain), room);
    // The low rumble of the building, and the mains hum.
    const rumble = noise(4, true);
    chain(rumble, filter('lowpass', 300), gain(LEVELS.rumble), room);
    const h50 = osc(50);
    chain(h50, gain(LEVELS.hum50), room);
    const h100 = osc(100);
    chain(h100, gain(LEVELS.hum100), room);
    // A second hum a few hertz off the mains, silent until the dread brings it in (T37).
    humGain = gain(0);
    const h53 = osc(53);
    chain(h53, humGain, room);
    // Wind against the window: noise through a wandering band-pass, swelling in slow gusts.
    const wind = noise(2);
    const band = filter('bandpass', 500, 0.9);
    const wander = osc(0.05);
    chain(wander, gain(250), band.frequency);
    const gust = gain(0.5);
    const gustLfo = osc(0.09);
    chain(gustLfo, gain(0.45), gust.gain);
    windGain = gain(LEVELS.wind);
    chain(wind, band, gust, windGain, filter('lowpass', 1200), room); // heard from inside
    // The wind singing in the wires: a few thin tones beating against each other, with the gusts.
    const wires = gain(0.55);
    for (const [f, d] of [[0.09, 0.3], [0.31, 0.15]]) chain(osc(f), gain(d), wires.gain);
    for (const [ratio, lvl] of [[1, 1], [1.008, 0.7], [1.5, 0.5], [2.016, 0.3], [2.21, 0.2]]) chain(osc(WIRE_PITCH * ratio), gain(lvl), wires);
    chain(wires, gain(LEVELS.wires), filter('lowpass', 2400), room);
    for (const n of nodes) n.start?.();
  }

  const api = {
    get running() { return running; },
    get record() { return record; },
    start() {
      if (running || !engine.ready) return false;
      build();
      record.start();
      running = true;
      return true;
    },
    // Fades the room and the record out, then frees every node.
    stop(fade = 0.6) {
      if (!running) return;
      running = false;
      record.stop(fade);
      room.gain.setTargetAtTime(0, ctx.currentTime, fade / 4);
      const old = nodes;
      nodes = [];
      setTimeout(() => { for (const n of old) { try { n.stop?.(); } catch { /* already stopped */ } n.disconnect(); } }, fade * 1000 + 50);
    },
    setMusic(on) { record.setOn(on); },
    // Fewer lives: the record wobbles a little more [R6.2].
    setTension(v) { record.setWarp((Math.min(1, Math.max(0, Number(v) || 0))) * 0.3); },
    // For the dread (T37): wind and the second hum, 0 to 1.
    setWind(v) { if (windGain) windGain.gain.setTargetAtTime(LEVELS.wind + v * (WIND_FULL - LEVELS.wind), ctx.currentTime, 2); },
    setHum(v) { if (humGain) humGain.gain.setTargetAtTime(v * 0.016, ctx.currentTime, 2); },
  };
  return api;
}
