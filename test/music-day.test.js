import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAY_WALTZ, DAY_CHORDS, DAY_BEAT_S, barNotes, barBeat, createDayMusic } from '../src/audio/music-day.js';
import { createAudioEngine } from '../src/audio/engine.js';

const pcs = (notes) => new Set(notes.map((n) => n % 12));

test('day music: the night waltz in Eb major, three beats to every bar, about 80 s [R7.3]', () => {
  let seconds = 0;
  DAY_WALTZ.forEach(([chord, melody], i) => {
    assert.ok(DAY_CHORDS[chord], chord);
    assert.equal(melody.reduce((n, [, beats]) => n + beats, 0), 3, `bar ${i + 1}`);
    seconds += 3 * barBeat(i);
  });
  assert.equal(DAY_WALTZ.length, 32);
  assert.ok(seconds > 70 && seconds < 90, `${seconds.toFixed(0)} s`);
  const all = DAY_WALTZ.flatMap(([c, m]) => [DAY_CHORDS[c].bass, ...DAY_CHORDS[c].chord, ...m.map(([n]) => n).filter((n) => n !== null)]);
  const ebMajor = [3, 5, 7, 8, 10, 0, 2];
  assert.ok([...pcs(all)].every((p) => ebMajor.includes(p)));
  // The night's Gb, Cb and Db are gone: that is what makes it glad.
  assert.ok(![6, 11, 1].some((p) => pcs(all).has(p)));
  assert.equal(Math.round(60 / DAY_BEAT_S), 75);
  // Each phrase end takes a breath; it does not slow at the end, as it goes round.
  assert.ok(barBeat(7) > barBeat(6));
  assert.equal(barBeat(DAY_WALTZ.length - 2), barBeat(DAY_WALTZ.length - 3));
});

test('day music: the tune is legato, each note held into the next; bass on one, the chord on two', () => {
  for (let i = 0; i < DAY_WALTZ.length; i++) {
    const [name, melody] = DAY_WALTZ[i];
    const notes = barNotes(i, 10);
    const { bass, chord } = DAY_CHORDS[name];
    const beat = barBeat(i);
    assert.equal(notes[0].note, bass);
    assert.equal(notes[0].at, 10);
    for (const c of chord) assert.ok(notes.some((n) => n.note === c && Math.abs(n.at - (10 + beat)) < 1e-9));
    const tune = notes.slice(1 + chord.length);
    assert.equal(tune.length, melody.filter(([n]) => n !== null).length);
    for (let k = 0; k + 1 < tune.length; k++) assert.ok(tune[k].until > tune[k + 1].at, `bar ${i + 1}: note ${k + 1} is held into the next`);
    for (const n of notes) assert.ok(n.until > n.at && n.velocity > 0 && n.velocity < 1);
  }
});

function fakeCtx() {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const made = [];
  const node = (k) => { const n = { k, out: [], dis: 0, connect(x) { n.out.push(x); return x; }, disconnect() { n.dis++; } }; made.push(n); return n; };
  const src = (k) => { const n = node(k); n.start = () => { n.started = true; }; n.stop = () => { n.stopped = true; }; return n; };
  return {
    made, state: 'running', currentTime: 0, sampleRate: 4000, destination: node('dest'),
    createGain() { const n = node('gain'); n.gain = param(); return n; },
    createDynamicsCompressor() { return node('comp'); },
    createOscillator() { const n = src('osc'); n.frequency = param(); n.detune = param(); return n; },
    createBiquadFilter() { const n = node('bq'); n.frequency = param(); n.Q = param(); return n; },
    createConvolver() { return node('conv'); },
    createStereoPanner() { const n = node('pan'); n.pan = param(); return n; },
    createBuffer(ch, len) { const d = new Float32Array(len); return { getChannelData: () => d }; },
    createBufferSource() { return src('buf'); },
  };
}

test('day music: starts only after a click, books piano notes and birds on the music bus, stops and frees nodes', async () => {
  let ctx;
  const engine = createAudioEngine({ createContext: () => (ctx = fakeCtx()) });
  const day = createDayMusic(engine, { rng: () => 0.1, tickMs: 5, lookahead: 6 });
  assert.equal(day.start(), false);
  engine.unlock();
  assert.equal(day.start(), true);
  assert.ok(day.notes > 0, 'piano notes');
  assert.ok(day.chirps > 0, 'birdsong');
  const reaches = (n, t, seen = new Set()) => n === t || (!seen.has(n) && (seen.add(n), n.out.some((x) => reaches(x, t, seen))));
  const osc = ctx.made.find((n) => n.k === 'osc');
  assert.ok(reaches(osc, engine.musicBus));
  assert.ok(!reaches(osc, engine.sfxBus));
  day.stop(0.01);
  assert.equal(day.running, false);
  await new Promise((r) => setTimeout(r, 100));
  const feed = ctx.made.find((n) => n.k === 'gain' && n.out.includes(engine.musicBus));
  assert.ok(feed.dis > 0); // the whole day music is let go from the bus
});
