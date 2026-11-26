// The story [design 4, R17]: how the pianist came to take the night post at Station 7, told as a
// magic-lantern show of six painted slides, with a letter to their sister written out under each.
// Space moves on to the next slide, Esc skips the story; it leads straight into Day 1.
import { hallScene } from './slides/hall.js';
import { roomScene } from './slides/room.js';
import { advertScene } from './slides/advert.js';
import { trainScene } from './slides/train.js';
import { stationScene } from './slides/station.js';
import { officeScene } from './slides/office.js';
import { PAINTS } from '../office/drawings.js';
import { growScenery } from '../office/scenery.js';

export const WRITE_MS_PER_CHAR = 55; // how fast the letter is written out under each slide
export const LINE_PAUSE_MS = 700; // between one line of the letter and the next
export const SLIDE_HOLD_MS = 4400; // after a slide's last line, to linger on the picture before the next
export const SLIDE_FADE_OUT_MS = 1600; // a slide fading to black before the next; matches story.css
export const SLIDE_DARK_MS = 400; // and the dark between them, as the lantern's plates are changed
export const SLIDE_FADE_IN_MS = 2200; // the next slide coming up out of the dark; matches story.css
export const BREAK_OFF_MS = 1800; // from the letter breaking off to the office
export const FADE_OUT_MS = 2200; // the lantern fading into the office; matches story.css

const SCENE_ART = { hall: hallScene, room: roomScene, advert: advertScene, train: trainScene, station: stationScene, office: officeScene };

// Each slide: its picture, the letter's lines, and its sound picture. wind, rain, drips, wires, train
// and ticking are how loud (0 to 1); indoors muffles the sounds outside; music plays the nocturne under
// it; roomTone lets the office's rumble and hum in; sounds are one-off sounds [ms after the slide comes
// up, Ambience method, and to repeat it, every so many ms]; needleAt is the line on which the record starts.
export const STORY_SLIDES = [
  {
    scene: 'hall', music: true, wind: 0.15, rain: 0.4, drips: 1,
    sounds: [[300, 'billFlap', 4600], [400, 'cabPassing']], // the bill lifts every 4.6 s (story.css)
    lines: ['Dearest Ada,', 'the Excelsior Rooms have closed for the winter, and their piano with them.'],
  },
  {
    scene: 'room', music: true, indoors: true, wind: 0.15, rain: 0.3, drips: 0.6, ticking: 1,
    sounds: [[1800, 'distantClock'], [5000, 'cabBelow']],
    lines: ['No hall in the city wants a pianist before spring.', 'I have counted what is left. It will not last me the month.'],
  },
  {
    scene: 'advert', music: true, indoors: true, wind: 0.15, rain: 0.1,
    // The pencil rings the advert at "I saw it" (story.css).
    sounds: [[300, 'paperRustle'], [2500, 'pencilScratch'], [3500, 'cartPassing'], [8500, 'newsboy']],
    lines: ['Then in Tuesday’s paper I saw it.', 'Lodging, a wage, and they will teach me the key. My fingers know rhythm, if nothing else.'],
  },
  {
    scene: 'train', music: true, indoors: true, wind: 0.1, rain: 0.5, train: 1,
    sounds: [[1500, 'whistle'], [6500, 'bridge']],
    lines: ['The line runs out past the last town and across the marshes.', 'Nobody else stayed on the train.'],
  },
  // The shade at the window and the crow in story.css are timed to this slide's letter: if its lines
  // or WRITE_MS_PER_CHAR change, move their animation delays with them.
  {
    scene: 'station', music: true, wind: 0.8, rain: 0.6, wires: 1,
    sounds: [[2600, 'crows'], [4200, 'curlew'], [9000, 'crowTakesFright'], [11000, 'curlew']], // a crow flies off 9 s in
    lines: ['The station stands quite alone.', 'There was a lamp lit in the window, though they told me the office stood empty.'],
  },
  {
    scene: 'office', roomTone: true, indoors: true, wind: 0.3, rain: 0.35, wires: 0.3,
    sounds: [[1500, 'rainGust', 6000]],
    lines: [
      'Whoever was here before me left in a hurry.',
      'His coat is still on the hook, and there was a record on the phonograph.',
      'I set the needle down, Ada.',
      'I know this waltz. I wrote it.',
      'I must stop, the sounder is—',
    ],
    needleAt: 3,
  },
];

// How long a slide takes from coming up to the next one (or the break-off), in ms.
export function slideMs(slide) {
  const writing = slide.lines.reduce((t, line) => t + line.length * WRITE_MS_PER_CHAR + LINE_PAUSE_MS, 1200) - LINE_PAUSE_MS;
  return writing + (slide === STORY_SLIDES.at(-1) ? 0 : SLIDE_HOLD_MS);
}

// The whole show in ms, without skipping, to the office [R17.5: about 60 to 90 seconds].
export const storyMs = () => STORY_SLIDES.reduce((t, s, i) => t + slideMs(s) + (i ? SLIDE_FADE_OUT_MS + SLIDE_DARK_MS : 0), 0) + BREAK_OFF_MS;

export function storyHtml() {
  const slides = STORY_SLIDES.map((s) => SCENE_ART[s.scene]('of')).join('');
  return `<section class="intro active started" aria-label="The story">
  ${PAINTS}
  <div class="lantern">
    <svg class="lantern-defs" width="0" height="0" aria-hidden="true"><defs>
      <filter id="ln-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
      <linearGradient id="ln-cloud-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".8"/><stop offset=".95" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="ln-cloud-mask" maskUnits="userSpaceOnUse" x="-200" y="0" width="2000" height="600"><rect x="-200" y="0" width="2000" height="600" fill="url(#ln-cloud-fade)"/></mask>
    </defs></svg>
    ${slides}
  </div>
  <div class="intro-letter" aria-live="polite"></div>
  <p class="intro-hint"><kbd>Space</kbd> next picture · <kbd>Esc</kbd> skip</p>
</section>`;
}

// Plays the show in `parent` with the sounder from story-sound.js. `onDone()` runs once, at the end or on Esc.
export function playStory(parent, sound, { onDone = () => {}, from = 0 } = {}) {
  parent.insertAdjacentHTML('beforeend', storyHtml());
  const root = parent.lastElementChild;
  growScenery(root);
  const letterEl = root.querySelector('.intro-letter');
  let timers = [];
  let index = -1;
  let done = false;
  const later = (ms, f) => timers.push(setTimeout(f, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const { ambience } = sound;

  function writeLine(text) {
    const el = document.createElement('p');
    el.textContent = text;
    el.style.setProperty('--write', `${text.length * WRITE_MS_PER_CHAR}ms`);
    letterEl.append(el);
  }

  // Between slides the picture, the letter and its sounds fade out together; in the dark the next
  // slide's sounds are set, and they come up with its picture. The nocturne plays on across them.
  function changeSlide(i) {
    for (const el of root.querySelectorAll('.slide')) el.classList.remove('shown');
    root.classList.add('between');
    ambience.fadeOut(SLIDE_FADE_OUT_MS / 1000);
    sound.setWind(0, SLIDE_FADE_OUT_MS / 3000);
    sound.setRoomTone(0, SLIDE_FADE_OUT_MS / 3000);
    if (!STORY_SLIDES[i].music) sound.piano.stop(SLIDE_FADE_OUT_MS / 1000);
    later(SLIDE_FADE_OUT_MS + SLIDE_DARK_MS, () => play(i, { fromDark: true }));
  }

  function play(i, { fromDark = false } = {}) {
    clear();
    index = i;
    root.classList.remove('between');
    const slide = STORY_SLIDES[i];
    if (!slide.music) sound.piano.stop(SLIDE_FADE_OUT_MS / 1000);
    for (const el of root.querySelectorAll('.slide')) el.classList.toggle('shown', el.dataset.scene === slide.scene);
    const fadeIn = fromDark ? SLIDE_FADE_IN_MS / 1000 : 0.5;
    ambience.newScene(fromDark ? 0 : 0.5);
    sound.setWind(slide.wind, fromDark ? fadeIn / 3 : 2);
    sound.setRoomTone(slide.roomTone ? 1 : 0, slide.roomTone ? fadeIn / 3 : 0.3);
    const set = () => {
      ambience.setIndoors(!!slide.indoors);
      ambience.setRain(slide.rain ?? 0);
      ambience.setWires(slide.wires ?? 0);
      ambience.setTrain(slide.train ?? 0);
    };
    if (fromDark) ambience.quickly(set);
    else set();
    ambience.fadeIn(fadeIn);
    ambience.setDrips(slide.drips ?? 0, slide.scene);
    ambience.setTicking(slide.ticking ?? 0);
    for (const [at, name, every] of slide.sounds ?? []) {
      const go = () => { ambience[name](); if (every) later(every, go); };
      later(at, go);
    }
    letterEl.replaceChildren();
    let t = 1200; // let the picture come up first
    slide.lines.forEach((line, n) => {
      later(t, () => {
        writeLine(line);
        if (n === slide.needleAt) { sound.dropNeedle(); root.classList.add('needle-down'); }
      });
      t += line.length * WRITE_MS_PER_CHAR + LINE_PAUSE_MS;
    });
    if (i < STORY_SLIDES.length - 1) later(t - LINE_PAUSE_MS + SLIDE_HOLD_MS, () => changeSlide(i + 1));
    else later(t - LINE_PAUSE_MS, breakOff);
  }

  // The letter breaks off as the sounder starts clattering, and the office takes over.
  function breakOff() {
    sound.tapOut('CQ CQ');
    root.classList.add('clatter');
    sound.clockStrikes(10); // and the shift begins: the clock strikes ten
    later(BREAK_OFF_MS, finish);
  }

  function finish() {
    if (done) return;
    done = true;
    clear();
    window.removeEventListener('keydown', onKey, true);
    root.classList.add('leaving');
    sound.dispose(1.5);
    setTimeout(() => root.remove(), FADE_OUT_MS);
    onDone();
  }

  // Space (or a click) moves on to the next slide at once; Esc skips the story [R17.5].
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finish(); return; }
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); next(); }
  }
  const next = () => { if (!done && index < STORY_SLIDES.length - 1) play(index + 1); };
  window.addEventListener('keydown', onKey, true);
  root.addEventListener('click', next);

  sound.setRoomTone(0, 0.01); // the show does not start in the office
  if (STORY_SLIDES[from].music) sound.piano.play();
  void root.offsetWidth; // so the first slide comes up out of the dark
  play(from, { fromDark: true });
  return { get index() { return index; }, next, skip: finish, root };
}
