// Audio engine: one AudioContext, two buses, compressor, master mute and volume [design 9, R1.3, R6.8].
//
//   voices -> sfxBus ----+
//                        +-> compressor -> masterGain -> destination
//   music  -> musicBus --+
//
// The context is only made on the first user click or key, because browsers block sound before that.

export const MAX_VOICES = 8;
const RAMP = 0.02; // seconds, so volume changes do not click

const clamp01 = (v) => Math.min(1, Math.max(0, Number(v) || 0));

export function createAudioEngine({
  createContext = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)(),
  maxVoices = MAX_VOICES,
  music = 0.8,
  sfx = 0.8,
  muted = false,
} = {}) {
  const state = { music: clamp01(music), sfx: clamp01(sfx), muted: !!muted };
  const active = new Set();
  let ctx = null;
  let musicBus = null;
  let sfxBus = null;
  let master = null;

  function setGain(node, value) {
    if (!node || !ctx) return;
    node.gain.setTargetAtTime(value, ctx.currentTime, RAMP);
  }

  function build() {
    ctx = createContext();
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    musicBus.gain.value = state.music;
    sfxBus.gain.value = state.sfx;
    master.gain.value = state.muted ? 0 : 1;
    musicBus.connect(comp);
    sfxBus.connect(comp);
    comp.connect(master);
    master.connect(ctx.destination);
  }

  const engine = {
    // Call from a user event. Makes the context the first time and resumes it if the browser paused it.
    unlock() {
      if (!ctx) build();
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      return ctx;
    },

    // Listens for clicks, touches and keys on a target (usually window) and unlocks on each one.
    attachUnlock(target) {
      const fn = () => engine.unlock();
      const names = ['pointerdown', 'touchstart', 'keydown'];
      for (const n of names) target.addEventListener(n, fn);
      return () => { for (const n of names) target.removeEventListener(n, fn); };
    },

    get ready() { return ctx !== null; },
    get ctx() { return ctx; },
    get musicBus() { return musicBus; },
    get sfxBus() { return sfxBus; },
    get activeVoices() { return active.size; },

    setMusicVolume(v) { state.music = clamp01(v); setGain(musicBus, state.music); },
    setSfxVolume(v) { state.sfx = clamp01(v); setGain(sfxBus, state.sfx); },
    setMuted(m) { state.muted = !!m; setGain(master, state.muted ? 0 : 1); },
    get settings() { return { ...state }; },

    // Adds one effect voice. `make(ctx, out)` builds nodes into `out` and returns
    // { source, nodes } where `source` fires `onended`. Returns null when there is no
    // context yet or the voice budget is full. All nodes are disconnected when the voice ends.
    voice(make) {
      if (!ctx || active.size >= maxVoices) return null;
      const v = make(ctx, sfxBus);
      if (!v || !v.source) return null;
      active.add(v);
      v.source.onended = () => {
        if (!active.delete(v)) return;
        for (const n of v.nodes ?? []) n.disconnect();
        v.source.disconnect();
      };
      return v;
    },
  };
  return engine;
}
