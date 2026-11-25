// Day Shift music [design 9, R7.3]: soft plucked notes from a pentatonic scale over a slow pad,
// with birdsong made of short FM chirps at random times. Calm, in G major. All on the music bus.
// Kept in its own file so it can be cut without touching the rest.

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
// G major pentatonic: G A B D E.
export const PENTATONIC = [55, 57, 59, 62, 64, 67, 69, 71, 74, 76].map(hz);
// Four calm chords, one every 4 beats: G, E minor, C, D.
export const CHORDS = [[43, 55, 59, 62], [40, 52, 55, 59], [36, 48, 52, 55], [38, 50, 54, 57]].map((c) => c.map(hz));
export const BPM = 76;
export const BEAT_S = 60 / BPM;

// Which pentatonic notes fit a chord (share a pitch class with it), so plucks never clash.
export function notesFor(chord) {
  const pc = (f) => Math.round(12 * Math.log2(f / 440) + 69) % 12;
  const inChord = new Set(chord.map(pc));
  return PENTATONIC.filter((f) => inChord.has(pc(f)) || pc(f) === 9 || pc(f) === 4);
}

export function createDayMusic(engine, { rng = Math.random, lookahead = 0.4, tickMs = 100 } = {}) {
  let ctx = null;
  let out = null;
  let timer = null;
  let nodes = [];
  let shots = new Set();
  let nextBeat = 0;
  let beat = 0;
  let nextBird = 0;
  let pad = null;
  let pluckCount = 0;
  let chirpCount = 0;

  function oneShot(src, extra, stopAt) {
    const all = [src, ...extra];
    shots.add(all);
    src.onended = () => { shots.delete(all); for (const n of all) n.disconnect(); };
    src.stop(stopAt);
  }

  function pluck(at, f, vel) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3200, at);
    lp.frequency.exponentialRampToValueAtTime(700, at + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.09 * vel, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, at + 1.4);
    osc.connect(lp); lp.connect(g); g.connect(out);
    osc.start(at);
    oneShot(osc, [lp, g], at + 1.45);
    pluckCount += 1;
  }

  // A slow pad: soft sines on the chord tones, each gliding to the next chord.
  function startPad() {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.05, ctx.currentTime, 2);
    lp.connect(g); g.connect(out);
    const voices = CHORDS[0].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = i % 2 ? 4 : -4;
      o.connect(lp);
      o.start();
      return o;
    });
    nodes.push(lp, g, ...voices);
    pad = { voices };
  }

  function chord(at, c) {
    pad?.voices.forEach((o, i) => o.frequency.setTargetAtTime(c[i], at, 0.6));
  }

  // Birdsong: a few quick chirps, a sine carrier swept up with a fast FM wobble.
  function bird(at) {
    const chirps = 2 + Math.floor(rng() * 4);
    let t = at;
    for (let i = 0; i < chirps; i++) {
      const base = 2400 + rng() * 1600;
      const len = 0.06 + rng() * 0.07;
      const car = ctx.createOscillator();
      car.frequency.setValueAtTime(base, t);
      car.frequency.exponentialRampToValueAtTime(base * (1.25 + rng() * 0.4), t + len);
      const mod = ctx.createOscillator();
      mod.frequency.value = 40 + rng() * 60;
      const modAmt = ctx.createGain();
      modAmt.gain.value = base * 0.06;
      mod.connect(modAmt); modAmt.connect(car.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.035, t + 0.01);
      g.gain.linearRampToValueAtTime(0, t + len);
      car.connect(g); g.connect(out);
      car.start(t); mod.start(t); mod.stop(t + len + 0.02);
      oneShot(car, [mod, modAmt, g], t + len + 0.02);
      chirpCount += 1;
      t += len + 0.05 + rng() * 0.12;
    }
  }

  function tick() {
    const until = ctx.currentTime + lookahead;
    while (nextBeat < until) {
      const bar = Math.floor(beat / 4) % CHORDS.length;
      const c = CHORDS[bar];
      if (beat % 4 === 0) chord(nextBeat, c);
      // Not every beat has a note, and some have two, so it never sounds like a metronome.
      const notes = notesFor(c);
      if (rng() < 0.7) pluck(nextBeat, notes[Math.floor(rng() * notes.length)], 0.7 + 0.3 * rng());
      if (rng() < 0.25) pluck(nextBeat + BEAT_S / 2, notes[Math.floor(rng() * notes.length)], 0.5);
      beat += 1;
      nextBeat += BEAT_S;
    }
    if (nextBird < until) { bird(Math.max(nextBird, ctx.currentTime)); nextBird += 4 + rng() * 9; }
  }

  return {
    get running() { return timer !== null; },
    get plucks() { return pluckCount; },
    get chirps() { return chirpCount; },
    start() {
      if (timer !== null || !engine.ready) return false;
      ctx = engine.ctx;
      out = ctx.createGain();
      out.gain.value = 1;
      out.connect(engine.musicBus);
      nodes = [out];
      startPad();
      nextBeat = ctx.currentTime + 0.8;
      beat = 0;
      nextBird = ctx.currentTime + 2 + rng() * 3;
      tick();
      timer = setInterval(tick, tickMs);
      return true;
    },
    stop(fade = 0.6) {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
      out.gain.setTargetAtTime(0, ctx.currentTime, fade / 4);
      const old = nodes;
      const oldShots = [...shots];
      nodes = [];
      shots = new Set();
      pad = null;
      setTimeout(() => {
        for (const n of old) { try { n.stop?.(); } catch { /* already stopped */ } n.disconnect(); }
        for (const s of oldShots) for (const n of s) n.disconnect();
      }, fade * 1000 + 50);
    },
  };
}
