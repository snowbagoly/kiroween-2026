// Plays one received letter on the audio clock [design 5 Receiving, R4.1].
// Tones, sounder click and clack come from one list of start and end times, so sound and arm stay in step.
import { encode } from '../core/morse.js';

export const DOT_S = 0.12;
export const DASH_S = 0.36;
export const SYMBOL_GAP_S = 0.12;

// Start and end time (seconds) of each tone in a letter, beginning at `t0`.
export function letterSchedule(pattern, t0 = 0) {
  const out = [];
  let t = t0;
  for (const s of pattern) {
    const len = s === '.' ? DOT_S : DASH_S;
    out.push({ start: t, end: t + len });
    t += len + SYMBOL_GAP_S;
  }
  return out;
}

// True while a tone sounds: the arm is down then.
export const armDownAt = (schedule, t) => schedule.some((s) => t >= s.start && t < s.end);

// Adds a short noise burst with a low thump into `data` at `at` seconds.
function burst(data, sr, at, { amp, decay, thumpHz, thumpAmp }) {
  const i0 = Math.floor(at * sr);
  const n = Math.floor(decay * 8 * sr);
  for (let i = 0; i < n && i0 + i < data.length; i++) {
    const k = Math.exp(-i / (decay * sr));
    data[i0 + i] += ((Math.random() * 2 - 1) * amp + Math.sin((2 * Math.PI * thumpHz * i) / sr) * thumpAmp) * k;
  }
}

// One letter is one voice of the engine: a gated sine for the tones and one noise buffer
// holding a "click" when the arm drops and a higher, softer "clack" when it lifts.
// Returns { schedule, end } in audio-clock seconds, or null if there is no sound yet or no room.
export function playLetter(engine, letter, { freq = 600, level = 0.32, lead = 0.05 } = {}) {
  const pattern = encode(letter);
  if (!pattern) return null;
  let schedule = null;
  let end = 0;
  const v = engine.voice((ctx, out) => {
    const t0 = ctx.currentTime + lead;
    schedule = letterSchedule(pattern, t0);
    end = schedule[schedule.length - 1].end;
    const stopAt = end + 0.12;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, ctx.currentTime);
    for (const { start, end: e } of schedule) {
      env.gain.setValueAtTime(0, start);
      env.gain.linearRampToValueAtTime(level, start + 0.005);
      env.gain.setValueAtTime(level, e);
      env.gain.linearRampToValueAtTime(0, e + 0.01);
    }
    osc.connect(env);
    env.connect(out);

    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.ceil((stopAt - t0) * sr), sr);
    const data = buf.getChannelData(0);
    for (const { start, end: e } of schedule) {
      burst(data, sr, start - t0, { amp: 0.8, decay: 0.004, thumpHz: 140, thumpAmp: 0.6 }); // click: arm drops
      burst(data, sr, e - t0, { amp: 0.5, decay: 0.003, thumpHz: 260, thumpAmp: 0.25 }); // clack: arm lifts
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3500;
    const ng = ctx.createGain();
    ng.gain.value = 0.55;
    src.connect(lp);
    lp.connect(ng);
    ng.connect(out);

    osc.start(t0);
    src.start(t0);
    osc.stop(stopAt);
    return { source: osc, nodes: [env, src, lp, ng] };
  });
  return v ? { schedule, end } : null;
}
