// Every story sound's settings in one place [R17.3]. Levels are gains, pitches are in Hz, times in seconds,
// chances from 0 to 1.
export const SOUND_SETTINGS = {
  // Indoors, what is left of the sounds outside, heard through the walls and glass: their top cut at
  // muffleHz, their level, the wind's top, and the rain's dull patter against its hiss out of doors.
  indoors: { muffleHz: 900, level: .5, windHz: 300, patter: 1.2 },
  rain: { level: .05 },
  // Water off a gutter: how loud, how often, and what it lands on in each place (any of DROP_SURFACES).
  drips: { level: .05, gapMin: .25, gapMax: 1.5, doubles: .25, hall: 'puddle stone', room: 'tin' },
  puddle: { level: 1, splash: 3500, bubble: .35, bubblePitch: 1600 },
  stone: { level: 1.6, pitch: 3000, body: .5 },
  tin: { level: 1.5, pitch: 1400, ring: .12 },
  wood: { level: 2.2, pitch: 650 },
  wires: { level: .025, pitch: 318, whistle: 3 },
  billFlap: { level: .16, pitch: 2500 },
  // closeness: how near it passes; nearer gives a sharper peak as it goes by, further a softer one.
  cab: { level: .3, seconds: 10, closeness: .4, stride: .62, hooves: 1.4, hoofPitch: 650, wheels: 1 },
  cabBelow: { level: .23, seconds: 10 }, // the cab's other settings, far below the rented room
  cart: { level: .22, seconds: 12, closeness: .5, stride: 1.1, hooves: 1.4, hoofPitch: 650, wheels: 1.6 },
  distantClock: { level: .05, pitch: 155.6, strokes: 3, gap: 2.2 }, // E-flat, in the music's key
  newsboy: { level: .12, pitch: 400, echo: .2 },
  paperRustle: { level: 1 },
  pencil: { level: .05, pitch: 5200, seconds: 1.2 }, // as long as the ring's animation in story.css
  ticking: { level: .07, seconds: 1 },
  train: { level: .5 },
  chuff: { level: .22, seconds: .27 }, // between the engine's beats, four to a turn of the wheels
  railJoint: { level: 1, seconds: 1.4 },
  rattle: { level: .12, chance: .4 },
  whistle: { level: .045, pitch: 760, seconds: 2.2 },
  bridge: { level: 1, seconds: 4, clang: .05 },
  crows: { level: .3, pitch: 520 },
  crowTakesFright: { level: .34, pitch: 600 },
  curlew: { level: .022, pitch: 1800 },
  rainGust: { level: .08, seconds: 1.6 },
};
const CHUFF_ACCENTS = [1, .55, .8, .5]; // a real engine's beats are never quite even
const DROP_SURFACES = ['puddle', 'stone', 'tin', 'wood'];

// The story's sound pictures: the weather, the street, the train, the marsh and the small sounds of
// each slide. Everything out of doors goes through one channel, so on the slides that are indoors it
// can all be heard muffled, through the walls and the glass. Built on the story's sounder (story-sound.js), which it borrows its
// noise and its clack from; the slides name the one-off sounds here (STORY_SLIDES' sounds).
export class Ambience {
  constructor(sounder) {
    this.sounder = sounder;
    const ctx = this.ctx = sounder.ctx;
    // All of it goes out through one gain, so it can fade with the picture between slides.
    this.bus = ctx.createGain();
    this.bus.connect(sounder.master);
    this.outside = ctx.createGain();
    this.muffle = ctx.createBiquadFilter();
    this.muffle.type = 'lowpass';
    this.muffle.frequency.value = 20000;
    this.outside.connect(this.muffle).connect(this.bus);
    this.quick = false;
    this.newScene();
    this.indoors = false;
    this.rainLevel = 0;
    this.wiresLevel = 0;
    this.trainLevel = 0;
    this.tickLevel = 0;
    this.dripLevel = 0;
    this.startRain();
    this.startTrain();
    this.startWires();
  }

  // ---------- Between slides ----------

  // Each slide's one-off sounds go through gains of their own (out of doors and inside), so that what is
  // still to come of them, a cart not yet past, goes with the slide when the next one comes up.
  newScene(fade = .3) {
    const old = this.scene;
    if (old) {
      for (const gain of [old.outside, old.inside]) gain.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 3 + .01);
      setTimeout(() => { old.outside.disconnect(); old.inside.disconnect(); }, fade * 1000 + 300);
    }
    this.scene = { outside: this.ctx.createGain(), inside: this.ctx.createGain() };
    this.scene.outside.connect(this.outside);
    this.scene.inside.connect(this.bus);
  }

  // Everything fading out with the picture, over about the given seconds, and back in with the next.
  fadeOut(seconds) {
    this.bus.gain.setTargetAtTime(0, this.ctx.currentTime, seconds / 3);
  }

  fadeIn(seconds) {
    this.bus.gain.setTargetAtTime(1, this.ctx.currentTime, seconds / 3);
  }

  // Sets the next slide's sounds at once rather than gliding there, while nothing can be heard.
  quickly(set) {
    this.quick = true;
    set();
    this.quick = false;
  }

  // How long a sound takes to settle at a new level: the given time constant, or at once.
  settle(seconds) {
    return this.quick ? .01 : seconds;
  }

  // Indoors, the sounds outside lose their top and much of their loudness, and the rain patters.
  setIndoors(on) {
    const { muffleHz, level, windHz } = SOUND_SETTINGS.indoors;
    const t = this.ctx.currentTime;
    this.indoors = on;
    this.muffle.frequency.setTargetAtTime(on ? muffleHz : 20000, t, this.settle(.6));
    this.outside.gain.setTargetAtTime(on ? level : 1, t, this.settle(.6));
    this.sounder.windMuffle.frequency.setTargetAtTime(on ? windHz : 20000, t, this.settle(.6));
    this.setRain(this.rainLevel);
  }

  // ---------- Helpers ----------

  // A burst of noise through a filter: most small sounds here are made of these.
  burst(start, { freq, q = 1, level, attack = .003, decay, out = this.scene.outside, brown = false, type = 'bandpass' }) {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    src.buffer = brown ? this.sounder.brown : this.sounder.white;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(level, start + attack);
    g.gain.exponentialRampToValueAtTime(.0005, start + attack + decay);
    src.connect(filter).connect(g).connect(out);
    src.start(start, Math.random() * 1.5, attack + decay + .02);
  }

  // A gain that rises to level, holds and falls away again, for a sound that lasts a while.
  envelope(start, level, attack, hold, release, out) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(level, start + attack);
    g.gain.setValueAtTime(level, start + attack + hold);
    g.gain.linearRampToValueAtTime(0, start + attack + hold + release);
    g.connect(out);
    return g;
  }

  // Wide open spaces: a faint echo coming back off whatever is out there.
  echo(out, seconds, feedback) {
    const { ctx } = this;
    const input = ctx.createGain();
    const delay = ctx.createDelay(1);
    delay.delayTime.value = seconds;
    const back = ctx.createGain();
    back.gain.value = feedback;
    input.connect(out);
    input.connect(delay).connect(back).connect(delay);
    back.connect(out);
    return input;
  }

  // ---------- Weather ----------

  // Fine rain: out of doors a soft hiss of drops, swelling and easing a little; indoors a dull patter
  // on the roof and the glass.
  startRain() {
    const { ctx } = this;
    const rain = ctx.createBufferSource();
    rain.buffer = this.sounder.white;
    rain.loop = true;
    const swell = ctx.createGain();
    swell.gain.value = .8;
    const swellLfo = ctx.createOscillator();
    swellLfo.frequency.value = .13;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = .2;
    swellLfo.connect(swellDepth).connect(swell.gain);
    rain.connect(swell);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 2200;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 7000;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    swell.connect(highpass).connect(lowpass).connect(this.rainGain).connect(this.outside);

    const patter = ctx.createBiquadFilter();
    patter.type = 'bandpass';
    patter.frequency.value = 1100;
    patter.Q.value = .6;
    this.patterGain = ctx.createGain();
    this.patterGain.gain.value = 0;
    swell.connect(patter).connect(this.patterGain).connect(this.bus);
    rain.start();
    swellLfo.start();
  }

  // From 0 to 1.
  setRain(level) {
    const loud = level * SOUND_SETTINGS.rain.level;
    const t = this.ctx.currentTime;
    this.rainLevel = level;
    this.rainGain.gain.setTargetAtTime(loud, t, this.settle(1.5));
    this.patterGain.gain.setTargetAtTime(this.indoors ? loud * SOUND_SETTINGS.indoors.patter : 0, t, this.settle(1.5));
  }

  // Water dripping off a gutter: a drop every second or so, now and then two together, landing on what
  // there is in that place (SOUND_SETTINGS.drips). From 0 to 1.
  setDrips(level, place = this.dripPlace) {
    const wasDripping = this.dripLevel > 0;
    this.dripLevel = level;
    this.dripPlace = place;
    if (level > 0 && !wasDripping) this.drip();
  }

  drip() {
    if (!this.dripLevel) return;
    const { gapMin, gapMax, doubles } = SOUND_SETTINGS.drips;
    const surfaces = (SOUND_SETTINGS.drips[this.dripPlace] ?? 'puddle').split(' ').filter((name) => DROP_SURFACES.includes(name));
    const onto = () => surfaces[Math.floor(Math.random() * surfaces.length)] ?? 'puddle';
    const t = this.ctx.currentTime + .02;
    this.drop(t, this.dripLevel, onto());
    if (Math.random() < doubles) this.drop(t + .08 + Math.random() * .1, this.dripLevel * .6, onto());
    setTimeout(() => this.drip(), (gapMin + Math.random() * (gapMax - gapMin)) * 1000);
  }

  // One drop landing. What it lands on makes most of the sound: a short splash or tap, rarely a tone.
  drop(t, amount, surface) {
    const level = amount * SOUND_SETTINGS.drips.level * SOUND_SETTINGS[surface].level;
    ({ puddle: this.dropInPuddle, stone: this.dropOnStone, tin: this.dropOnTin, wood: this.dropOnWood })[surface].call(this, t, level);
  }

  // Into a puddle: a wet splat with a soft plop under it; now and then the faint ring of a tiny bubble
  // caught under the water (rising a little as it nears the top), and a droplet or two falling back.
  dropInPuddle(t, level) {
    const { splash, bubble, bubblePitch } = SOUND_SETTINGS.puddle;
    this.burst(t, { freq: splash * (.8 + Math.random() * .4), q: .8, level: level * 2.4, attack: .001, decay: .012 });
    this.burst(t, { freq: 500, level: level * 1.2, attack: .002, decay: .03 });
    if (Math.random() < bubble) {
      const freq = bubblePitch * (.75 + Math.random() * .5);
      this.ping(t + .008, freq, freq * 1.25, level * .5, .04);
    }
    const droplets = Math.random() < .5 ? 1 : 2;
    for (let i = 0; i < droplets; i++) {
      this.burst(t + .05 + Math.random() * .06, { freq: 5000 + Math.random() * 2000, q: 1.5, level: level * .5, decay: .006 });
    }
  }

  // On the pavement or a stone sill: a hard, dry tick with a little body, and a fine spray.
  dropOnStone(t, level) {
    const { pitch, body } = SOUND_SETTINGS.stone;
    this.burst(t, { freq: pitch * (.85 + Math.random() * .3), q: 1.2, level: level * 2.6, attack: .0007, decay: .006 });
    this.burst(t, { freq: 260, q: 2, level: level * body * 2, attack: .001, decay: .02 });
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      this.burst(t + .004 + Math.random() * .02, { freq: pitch * 1.6, q: 1.5, level: level * .6, decay: .004 });
    }
  }

  // On a zinc sill or a gutter: a short metallic tink, at much the same pitch each time.
  dropOnTin(t, level) {
    const { pitch, ring } = SOUND_SETTINGS.tin;
    const freq = pitch * (1 + (Math.random() - .5) * .04);
    const partials = [[1, 1, ring], [2.32, .5, ring * .6], [4.25, .3, ring * .4], [6.63, .15, ring * .25]];
    this.sounder.ring(freq, partials, level * .6, t, this.scene.outside);
    this.burst(t, { freq: 4000, level: level * 1.2, attack: .0007, decay: .004 });
    this.burst(t, { freq: 1800, q: .8, level: level * .6, attack: .001, decay: .01 });
  }

  // On a wooden sill: a dull tok.
  dropOnWood(t, level) {
    const { pitch } = SOUND_SETTINGS.wood;
    this.burst(t, { freq: pitch * (.9 + Math.random() * .2), q: 3, level: level * 3, attack: .001, decay: .03 });
    this.burst(t, { freq: 2500, level: level * .8, attack: .0007, decay: .005 });
  }

  // A short pure tone gliding from one pitch to another and dying away.
  ping(t, from, to, level, decay) {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + decay * .75);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + .002);
    g.gain.exponentialRampToValueAtTime(.0005, t + decay);
    osc.connect(g).connect(this.scene.outside);
    osc.start(t);
    osc.stop(t + decay + .01);
  }

  // The wind humming and whining in the telegraph wires: a few thin tones that beat against each other,
  // rising and falling with the gusts.
  startWires() {
    const { ctx } = this;
    this.wiresGain = ctx.createGain();
    this.wiresGain.gain.value = 0;
    const gust = ctx.createGain();
    gust.gain.value = .55;
    for (const [freq, depth] of [[.09, .3], [.31, .15]]) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = freq;
      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = depth;
      lfo.connect(lfoDepth).connect(gust.gain);
      lfo.start();
    }
    // The pitch wanders a little as the wind presses harder and eases.
    const wander = ctx.createOscillator();
    wander.frequency.value = .07;
    const wanderDepth = ctx.createGain();
    wanderDepth.gain.value = 25; // cents
    wander.connect(wanderDepth);
    wander.start();
    // Each tone as a multiple of the lowest, so they can be retuned together.
    this.wireTones = [[1, 1], [1.008, .7], [1.5, .5], [2.016, .3], [2.21, .2]].map(([ratio, level]) => {
      const osc = ctx.createOscillator();
      wanderDepth.connect(osc.detune);
      const g = ctx.createGain();
      g.gain.value = level;
      osc.connect(g).connect(gust);
      osc.start();
      return [osc, ratio];
    });
    const whistle = ctx.createBufferSource();
    whistle.buffer = this.sounder.white;
    whistle.loop = true;
    this.whistleBand = ctx.createBiquadFilter();
    this.whistleBand.type = 'bandpass';
    this.whistleBand.Q.value = 30;
    this.whistleGain = ctx.createGain();
    whistle.connect(this.whistleBand).connect(this.whistleGain).connect(gust);
    whistle.start();
    gust.connect(this.wiresGain).connect(this.outside);
    this.setWires(0);
  }

  // From 0 to 1.
  setWires(level) {
    const { level: loud, pitch, whistle } = SOUND_SETTINGS.wires;
    const t = this.ctx.currentTime;
    this.wiresLevel = level;
    this.wiresGain.gain.setTargetAtTime(level * loud, t, this.settle(1.5));
    for (const [osc, ratio] of this.wireTones) osc.frequency.setTargetAtTime(pitch * ratio, t, .05);
    this.whistleBand.frequency.setTargetAtTime(pitch * 2.016, t, .05);
    this.whistleGain.gain.setTargetAtTime(whistle, t, .05);
  }

  // ---------- The street ----------

  // A horse and an iron-tyred vehicle going by on the setts: it comes up from one side, passes and goes
  // off the other way, the wheels rattling and the hooves striking the stones (a trot is two beats a
  // stride, the diagonal pairs landing together; a walk is four).
  passBy({ level, seconds, closeness, stride, hooves, hoofPitch, wheels }, gait, from) {
    const { ctx } = this;
    const t0 = ctx.currentTime + .05;
    const pan = ctx.createStereoPanner();
    pan.pan.setValueAtTime(from * .9, t0);
    pan.pan.linearRampToValueAtTime(-from * .9, t0 + seconds);
    // As loud as it is near: it comes up steadily, passes in a broad swell and dies away as gently,
    // fading to nothing at the very ends. Further off, it's duller too.
    const steps = 64;
    const loudness = new Float32Array(steps);
    const brightness = new Float32Array(steps);
    for (let i = 0; i < steps; i++) {
      const x = i / (steps - 1);
      const along = 2 * x - 1; // from where it starts (-1) to where it goes (1), passing at 0
      const nearness = closeness / Math.hypot(along, closeness);
      const ends = Math.min(1, x / .2, (1 - x) / .2) ** 2;
      loudness[i] = level * nearness * ends;
      brightness[i] = 700 * 9 ** nearness;
    }
    const near = ctx.createGain();
    near.gain.setValueCurveAtTime(loudness, t0, seconds);
    const dull = ctx.createBiquadFilter();
    dull.type = 'lowpass';
    dull.frequency.setValueCurveAtTime(brightness, t0, seconds);
    near.connect(dull).connect(pan).connect(this.scene.outside);

    const rumble = ctx.createBufferSource();
    rumble.buffer = this.sounder.brown;
    rumble.loop = true;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 280;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = wheels * .8;
    rumble.connect(low).connect(rumbleGain).connect(near);
    rumble.start(t0, Math.random() * 3);
    rumble.stop(t0 + seconds);
    for (let at = 0; at < seconds; at += .03 + Math.random() * .05) {
      this.burst(t0 + at, { freq: 1200 + Math.random() * 1600, q: 2, level: wheels * (.06 + Math.random() * .12), decay: .025, out: near });
    }

    const beats = gait === 'walk' ? [0, .25, .5, .75] : [0, .5];
    for (let at = 0; at < seconds; at += stride) {
      for (const beat of beats) {
        const start = t0 + at + beat * stride + (Math.random() - .5) * .025;
        this.burst(start, { freq: hoofPitch * (1 + Math.random() * .45), q: 4, level: hooves, decay: .07, out: near });
        this.burst(start, { freq: hoofPitch * 4, q: 1.5, level: hooves * .2, decay: .015, out: near }); // the shoe on the stone
      }
    }
  }

  // A hansom trotting past the hall.
  cabPassing() {
    this.passBy(SOUND_SETTINGS.cab, 'trot', -1);
  }

  // The same, in the street far below the rented room.
  cabBelow() {
    this.passBy({ ...SOUND_SETTINGS.cab, ...SOUND_SETTINGS.cabBelow }, 'trot', 1);
  }

  // A heavy cart at a walk, under the window where the paper is read.
  cartPassing() {
    this.passBy(SOUND_SETTINGS.cart, 'walk', 1);
  }

  // The torn corner of the dance bill, lifting in the wind: a papery flutter.
  billFlap() {
    const { level, pitch } = SOUND_SETTINGS.billFlap;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      this.burst(t + i * .045 + Math.random() * .02, { freq: pitch * (1 + Math.random() * .8), q: 1.2, level: level * (1 - i * .15), decay: .04 });
    }
  }

  // A clock across the roofs striking three, on a big bell: its hum, prime, minor third, fifth and nominal.
  distantClock() {
    const { level, pitch, strokes, gap } = SOUND_SETTINGS.distantClock;
    const t = this.ctx.currentTime + .05;
    const partials = [[.5, .3, 4], [1, .5, 3], [1.19, .25, 2.2], [1.5, .15, 1.8], [2, .2, 1.5], [2.5, .06, 1]];
    for (let i = 0; i < strokes; i++) this.sounder.ring(pitch, partials, level, t + i * gap, this.scene.outside);
  }

  // A newsboy crying the paper somewhere down the street, "Pay-per!", twice. A crude voice: a reedy
  // tone through the resonances of two vowels; heard far off and through the glass, it passes.
  newsboy() {
    const t = this.ctx.currentTime + .05;
    const out = this.echo(this.scene.outside, .16, SOUND_SETTINGS.newsboy.echo);
    this.cry(t, out);
    this.cry(t + 1.5, out);
  }

  cry(t, out) {
    const { ctx } = this;
    const { level, pitch } = SOUND_SETTINGS.newsboy;
    // Each syllable: [start, length, pitch from, pitch to (as multiples of the voice's pitch), formants].
    const syllables = [[0, .2, 1, 1.1, [600, 2000, 2700]], [.3, .55, 1.18, .85, [750, 1150, 2600]]];
    const voice = ctx.createGain();
    voice.gain.value = level;
    voice.connect(out);
    for (const [at, length, from, to, formants] of syllables) {
      const start = t + at;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch * from, start);
      osc.frequency.linearRampToValueAtTime(pitch * to, start + length);
      const env = this.envelope(start, 1, .03, length - .1, .07, voice);
      formants.forEach((freq, i) => {
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = freq;
        band.Q.value = 8;
        const g = ctx.createGain();
        g.gain.value = [1, .5, .25][i];
        osc.connect(band).connect(g).connect(env);
      });
      osc.start(start);
      osc.stop(start + length + .05);
      this.burst(start - .01, { freq: 900, level: .15, decay: .02, out: voice }); // the p
    }
  }

  // ---------- Paper ----------

  // A newspaper folded back and smoothed flat: a few dry crackles of paper, one after another.
  paperRustle() {
    const { level } = SOUND_SETTINGS.paperRustle;
    const t = this.ctx.currentTime;
    for (const [at, freq, loud, length] of [[0, 1800, .1, .35], [.14, 3400, .06, .2], [.28, 2400, .09, .3], [.55, 4200, .04, .18]]) {
      this.sounder.swish(t + at, freq, loud * level, length, this.scene.inside);
    }
  }

  // A pencil drawn round in a ring: a dry, grainy scratch that swells and fades with the stroke.
  pencilScratch() {
    const { ctx } = this;
    const { level, pitch, seconds } = SOUND_SETTINGS.pencil;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.sounder.white;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = pitch;
    bp.Q.value = .9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    // The lead catches on the grain of the paper, so the level jitters; it presses hardest mid-stroke.
    for (let s = .02; s < seconds; s += .03) {
      g.gain.setValueAtTime(level * Math.sin(Math.PI * s / seconds) * (.5 + Math.random() * .5), t + s);
    }
    g.gain.linearRampToValueAtTime(0, t + seconds + .05);
    src.connect(bp).connect(g).connect(this.scene.inside);
    src.start(t, Math.random() * 1.5);
    src.stop(t + seconds + .1);
  }

  // A cheap clock ticking somewhere in the room; from 0 to 1. Tick and tock differ a little.
  setTicking(level) {
    const wasTicking = this.tickLevel > 0;
    this.tickLevel = level;
    if (level > 0 && !wasTicking) this.tick();
  }

  tick() {
    if (!this.tickLevel) return;
    const { level, seconds } = SOUND_SETTINGS.ticking;
    const { ctx } = this;
    const t = Math.max(this.nextTickAt ?? 0, ctx.currentTime + .05);
    this.nextTickAt = t + seconds;
    this.tock = !this.tock;
    this.sounder.clack(this.tickLevel * level, this.tock ? 2400 : 3000, t, this.bus);
    setTimeout(() => this.tick(), (this.nextTickAt - ctx.currentTime - .2) * 1000);
  }

  // ---------- The train ----------

  // Riding in a railway carriage: the low rumble of the wheels, and the da-dum of each rail joint.
  startTrain() {
    const { ctx } = this;
    this.trainGain = ctx.createGain();
    this.trainGain.gain.value = 0;
    const rumble = ctx.createBufferSource();
    rumble.buffer = this.sounder.brown;
    rumble.loop = true;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 220;
    rumble.connect(lowpass).connect(this.trainGain).connect(this.bus);
    rumble.start();
  }

  // From 0 to 1.
  setTrain(level) {
    this.trainGain.gain.setTargetAtTime(level * SOUND_SETTINGS.train.level, this.ctx.currentTime, this.settle(.8));
    const wasRunning = this.trainLevel > 0;
    this.trainLevel = level;
    if (level > 0 && !wasRunning) {
      this.railJoint();
      this.chuff();
    }
  }

  // The engine up ahead, muffled by the carriages in between: soft bursts of steam, chuga chuga.
  // A turn of the wheels is scheduled at a time on the audio clock, so the beat stays steady.
  chuff() {
    if (this.trainLevel === 0) return;
    const { level, seconds } = SOUND_SETTINGS.chuff;
    const { ctx } = this;
    // Carry on from the last beat; after a pause (or a late timer) pick the beat up again just ahead.
    const t = Math.max(this.nextChuffAt ?? 0, ctx.currentTime + .05);
    this.nextChuffAt = t + seconds * CHUFF_ACCENTS.length;
    CHUFF_ACCENTS.forEach((accent, i) => {
      const start = t + i * seconds;
      const src = ctx.createBufferSource();
      src.buffer = this.sounder.white;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 650 + Math.random() * 120;
      band.Q.value = .7;
      const muffle = ctx.createBiquadFilter();
      muffle.type = 'lowpass';
      muffle.frequency.value = 1600;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(this.trainLevel * accent * level, start + .025);
      g.gain.exponentialRampToValueAtTime(.001, start + .22);
      src.connect(band).connect(muffle).connect(g).connect(this.bus);
      src.start(start, Math.random() * 1.5, .25);
    });
    setTimeout(() => this.chuff(), (this.nextChuffAt - ctx.currentTime - .2) * 1000);
  }

  // The wheels of one bogie and then the next crossing a joint: da-dum. Each hit is a deep thump
  // felt through the floor, a dull knock of steel, and the sharp click of the wheel on the rail end.
  // The jolt sometimes rattles the window in its frame.
  railJoint() {
    if (this.trainLevel === 0) return;
    const { level: loud, seconds } = SOUND_SETTINGS.railJoint;
    const { ctx } = this;
    const t = ctx.currentTime;
    for (const [at, hit] of [[0, 1], [.15, .85]]) {
      const start = t + at;
      const level = this.trainLevel * hit * loud;
      const thump = ctx.createOscillator();
      thump.frequency.setValueAtTime(95, start);
      thump.frequency.exponentialRampToValueAtTime(38, start + .18);
      const thumpGain = ctx.createGain();
      thumpGain.gain.setValueAtTime(level * .7, start);
      thumpGain.gain.exponentialRampToValueAtTime(.001, start + .28);
      thump.connect(thumpGain).connect(this.bus);
      thump.start(start);
      thump.stop(start + .3);
      this.burst(start, { type: 'lowpass', freq: 450, q: .7, level: level * 1.2, decay: .12, brown: true, out: this.bus });
      this.sounder.clack(level * .55, 1500, start, this.bus); // the wheel striking the rail end
    }
    if (Math.random() < SOUND_SETTINGS.rattle.chance) this.rattle(t + .17, this.trainLevel * SOUND_SETTINGS.rattle.level);
    setTimeout(() => this.railJoint(), seconds * 1000);
  }

  // The window rattling in its frame: a quick run of small knocks, dying away.
  rattle(t, level = SOUND_SETTINGS.rattle.level) {
    const count = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      this.sounder.clack(level * (1 - i / count), 3200, t + i * (.022 + Math.random() * .012), this.bus);
    }
  }

  // The engine's whistle up ahead, as the train leaves the last town: one long call, the pitch rising
  // a little as the steam comes through.
  whistle() {
    const { level, pitch, seconds } = SOUND_SETTINGS.whistle;
    const { ctx } = this;
    const t = ctx.currentTime + .05;
    const out = this.envelope(t, level, .12, seconds - .45, .33, this.scene.outside);
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 5;
    const vibratoDepth = ctx.createGain();
    vibratoDepth.gain.value = 3;
    vibrato.connect(vibratoDepth);
    for (const [ratio, loud] of [[1, 1], [2, .3], [3, .1]]) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(pitch * .92 * ratio, t);
      osc.frequency.linearRampToValueAtTime(pitch * ratio, t + .18);
      vibratoDepth.connect(osc.frequency);
      const g = ctx.createGain();
      g.gain.value = loud;
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + seconds + .05);
    }
    vibrato.start(t);
    vibrato.stop(t + seconds + .05);
    // The breath of steam through the bell.
    const steam = ctx.createBufferSource();
    steam.buffer = this.sounder.white;
    steam.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = pitch;
    band.Q.value = 10;
    const steamGain = ctx.createGain();
    steamGain.gain.value = 1.5;
    steam.connect(band).connect(steamGain).connect(out);
    steam.start(t, Math.random() * 1.5);
    steam.stop(t + seconds + .05);
  }

  // Over a bridge across a dyke: for a few seconds the rumble goes hollow and booming, and the girders
  // go by with a dull clang each.
  bridge() {
    const { level, seconds, clang } = SOUND_SETTINGS.bridge;
    const { ctx } = this;
    const t = ctx.currentTime + .05;
    for (const [freq, q, loud] of [[110, 2, .9], [250, 4, .4]]) {
      const src = ctx.createBufferSource();
      src.buffer = this.sounder.brown;
      src.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = freq;
      band.Q.value = q;
      src.connect(band).connect(this.envelope(t, loud * level, .5, seconds - 1.3, .8, this.scene.inside));
      src.start(t, Math.random() * 3);
      src.stop(t + seconds + .1);
    }
    for (let at = .4; at < seconds - .6; at += .42) {
      this.sounder.ring(170 + Math.random() * 25, [[1, .4, .5], [2.7, .15, .3], [4.1, .06, .2]], clang, t + at, this.scene.inside);
    }
  }

  // ---------- The marsh ----------

  // A crow's caw: a harsh, nasal call, falling a little in pitch.
  caw(t, level, pitch, pan) {
    const { ctx } = this;
    const length = .24 + Math.random() * .08;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(this.scene.outside);
    const env = this.envelope(t, level, .02, length * .55, length * .4, panner);
    // The rasp: the voice beaten against itself at a low rate.
    const rasp = ctx.createGain();
    rasp.gain.value = .6;
    const raspLfo = ctx.createOscillator();
    raspLfo.frequency.value = 60 + Math.random() * 20;
    const raspDepth = ctx.createGain();
    raspDepth.gain.value = .4;
    raspLfo.connect(raspDepth).connect(rasp.gain);
    rasp.connect(env);
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch * .95, t);
    osc.frequency.linearRampToValueAtTime(pitch * 1.05, t + .04);
    osc.frequency.linearRampToValueAtTime(pitch * .82, t + length);
    for (const [freq, q, gain] of [[1300, 4, 1], [2600, 5, .5]]) {
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = freq;
      band.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = gain;
      osc.connect(band).connect(g).connect(rasp);
    }
    this.burst(t, { freq: 1600, q: 2, level: .25, attack: .02, decay: length, out: rasp });
    for (const node of [osc, raspLfo]) {
      node.start(t);
      node.stop(t + length + .05);
    }
  }

  // The crows on the wire, calling now and then.
  crows() {
    const { level, pitch } = SOUND_SETTINGS.crows;
    const t = this.ctx.currentTime + .05;
    this.caw(t, level, pitch, .35);
    this.caw(t + .45, level * .9, pitch * .96, .35);
  }

  // One of them takes fright and flies off, calling as it goes.
  crowTakesFright() {
    const { level, pitch } = SOUND_SETTINGS.crowTakesFright;
    const t = this.ctx.currentTime + .05;
    [0, .26, .5].forEach((at, i) => this.caw(t + at, level * (1 - i * .18), pitch, .35 + i * .2));
  }

  // A curlew far out on the marsh: two long rising calls, cour-lee, cour-lee, then a bubbling trill.
  curlew() {
    const { level, pitch } = SOUND_SETTINGS.curlew;
    const { ctx } = this;
    const t = ctx.currentTime + .05;
    const panner = ctx.createStereoPanner();
    panner.pan.value = -.6;
    const far = ctx.createBiquadFilter();
    far.type = 'lowpass';
    far.frequency.value = 3800;
    far.connect(panner).connect(this.scene.outside);
    const out = this.echo(far, .24, .3);
    for (const at of [0, .9]) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(pitch, t + at);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.39, t + at + .5);
      osc.connect(this.envelope(t + at, level, .07, .35, .13, out));
      osc.start(t + at);
      osc.stop(t + at + .6);
    }
    const trill = ctx.createOscillator();
    trill.frequency.setValueAtTime(pitch * 1.28, t + 2);
    trill.frequency.linearRampToValueAtTime(pitch * 1.5, t + 3.2);
    const flutter = ctx.createOscillator();
    flutter.frequency.value = 18;
    const flutterDepth = ctx.createGain();
    flutterDepth.gain.value = pitch * .11;
    flutter.connect(flutterDepth).connect(trill.frequency);
    trill.connect(this.envelope(t + 2, level * .8, .2, .8, .3, out));
    for (const node of [trill, flutter]) {
      node.start(t + 2);
      node.stop(t + 3.4);
    }
  }

  // ---------- The office ----------

  // A gust throws the rain against the office window: a sudden spatter on the glass.
  rainGust() {
    const { level, seconds } = SOUND_SETTINGS.rainGust;
    const { ctx } = this;
    const t = ctx.currentTime + .05;
    const src = ctx.createBufferSource();
    src.buffer = this.sounder.white;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 3200;
    band.Q.value = .8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    // Separate drops striking the glass, thick at first and then thinning out.
    for (let s = 0; s < seconds; s += .012) {
      const swell = Math.sin(Math.PI * Math.min(1, s / seconds * 1.6));
      g.gain.setValueAtTime(level * swell * Math.random() ** 3, t + s);
    }
    g.gain.setValueAtTime(0, t + seconds);
    src.connect(band).connect(g).connect(this.scene.inside);
    src.start(t, Math.random() * 1.5);
    src.stop(t + seconds + .05);
  }
}
