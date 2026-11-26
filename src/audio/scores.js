// The music, as score data [design 9, R6.2, R17.4]. First the piece the phonograph plays: the slow parlour
// waltz in Eb minor the operator wrote years ago, in AABA form, three beats to a bar; then the story's
// nocturne (at the end). Notes are MIDI numbers
// (60 = middle C), durations are in beats.

export const WALTZ_BEAT_SECONDS = .8;
export const PAUSE_BETWEEN_PLAYS = 7; // the record runs out, crackles a while, and starts again

export const midiToHz = (note) => 440 * 2 ** ((note - 69) / 12);

// Bass note on the downbeat, plus the chord played on beats two and three.
export const HARMONY = {
  Ebm: { bass: 39, chord: [54, 58, 63] },
  Abm: { bass: 44, chord: [56, 59, 63] },
  Db:  { bass: 37, chord: [53, 56, 61] },
  Gb:  { bass: 42, chord: [54, 58, 61] },
  Cb:  { bass: 47, chord: [54, 59, 63] },
  Bb:  { bass: 46, chord: [53, 58, 62] },
  Bb7: { bass: 46, chord: [56, 62, 65] },
};

// One entry per bar: [chord, [[note, beats], ...]].
export const SECTIONS = {
  // The main theme: rises, settles, and falls back home to the low Eb.
  A: [
    ['Ebm', [[70, 2], [66, 1]]],
    ['Abm', [[71, 2], [70, .5], [68, .5]]],
    ['Db',  [[65, 2], [68, 1]]],
    ['Gb',  [[66, 3]]],
    ['Cb',  [[75, 2], [73, 1]]],
    ['Abm', [[71, 1.5], [70, .5], [68, 1]]],
    ['Bb7', [[66, 1], [65, 1], [62, 1]]],
    ['Ebm', [[63, 3]]],
  ],
  // The middle: brighter, in the relative major, reaching higher before turning back.
  B: [
    ['Gb',  [[70, 1], [73, 1], [78, 1]]],
    ['Db',  [[77, 2], [75, 1]]],
    ['Ebm', [[75, 1.5], [73, .5], [70, 1]]],
    ['Bb',  [[74, 3]]],
    ['Cb',  [[75, 1], [78, 1], [75, 1]]],
    ['Gb',  [[73, 2], [70, 1]]],
    ['Abm', [[71, 1], [70, 1], [68, 1]]],
    ['Bb7', [[65, 3]]],
  ],
};

// The main theme again, but the last two bars climb to the high Eb instead of falling.
SECTIONS.A2 = [
  ...SECTIONS.A.slice(0, 6),
  ['Bb7', [[68, 1], [70, 1], [74, 1]]],
  ['Ebm', [[75, 3]]],
];

// Play order. The piano starts alone; the reed organ joins from the second section.
export const FORM = [
  { section: 'A',  organ: false },
  { section: 'A2', organ: true },
  { section: 'B',  organ: true },
  { section: 'A',  organ: true },
];

// ---------- The story's nocturne ----------

// The story's music: a slow nocturne in Eb minor for piano alone, heard plainly rather than on the
// record, under the story from the hall to the station [R17.4]. Four beats to a bar; rests are null.
export const NOCTURNE_BEAT_SECONDS = 1.05;

// Each chord as the left hand spreads it, from the bass up.
export const NOCTURNE_CHORDS = {
  Ebm: [39, 46, 51, 54],
  Cb:  [35, 42, 47, 51],
  Abm: [44, 51, 56, 59],
  Bb:  [34, 41, 46, 50],
  Bb7: [34, 41, 44, 50],
  Gb:  [42, 49, 54, 58],
  Db:  [37, 44, 49, 53],
  EbmLow: [27, 34, 39, 42], // the last chord, low and open
};

// One entry per bar: [chord, [[note, beats], ...]].
export const NOCTURNE = [
  // A sigh, twice over: each phrase falls a step at its end and settles low.
  ['Ebm', [[null, 1], [70, 2], [71, .5], [70, .5]]],
  ['Cb',  [[66, 3], [65, 1]]],
  ['Abm', [[71, 2], [70, 1], [68, 1]]],
  ['Bb',  [[65, 3], [null, 1]]],
  ['Ebm', [[null, 1], [78, 2], [77, .5], [75, .5]]],
  ['Cb',  [[75, 2], [73, 1], [71, 1]]],
  ['Abm', [[71, 1.5], [70, .5], [68, 2]]],
  ['Bb7', [[68, 1], [66, 1], [65, 2]]],
  // Reaching up into the major for a moment, and falling back.
  ['Gb',  [[null, 1], [73, 2], [75, 1]]],
  ['Db',  [[77, 3], [75, 1]]],
  ['Ebm', [[78, 2], [77, 1], [75, 1]]],
  ['Cb',  [[75, 2], [73, 1], [71, 1]]],
  ['Abm', [[71, 2], [70, 2]]],
  // The raised D, then Cb held against the Bb chord: the ache before home.
  ['Bb',  [[70, 1], [74, 2], [71, 1]]],
  ['Ebm', [[70, 2], [66, 2]]],
  ['EbmLow', [[63, 4]]],
];
