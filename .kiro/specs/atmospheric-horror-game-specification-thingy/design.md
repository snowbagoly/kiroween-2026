# Design: Night Shift -- 1903 (Telegraph Operator Game)

This document explains how the requirements in `requirements.md` are built. Requirement numbers (R1 to R17) are written in brackets.

## 1. Overview

- One browser page. Vanilla JavaScript (ES modules), SVG, CSS, and the Web Audio API. No libraries, no files from other sites [R11]. The only package in the project is the dev-only test library `fast-check`.
- Source lives in `src/`. A small Node script, `build.mjs`, with no packages, copies everything into one file, `dist/index.html`. That file is what gets published [R11.1, R14.1]. The three fonts in `fonts/` are inlined into it as base64 `@font-face` rules [R11.2].
- All game rules live in plain JavaScript with no browser calls. The browser parts (keys, SVG, audio) sit around it. This lets us test the rules with `node --test` and no browser.
- Time and random numbers are passed in (a `clock` and a seeded `rng`). Tests and Judge mode can then control them.

## 2. Project layout

```
index.html              page shell, loaded by dev server and inlined by the build
build.mjs               inlines src/ and fonts/ into dist/index.html
fonts/                  Special Elite, IM Fell English SC, Caveat (.woff2), fonts.css, licences  [R11.2]
src/
  main.js               boots the app, wires everything
  core/                 pure rules, no DOM, no audio
    util.js             clamp and other small shared helpers
    morse.js            letter table, decoder
    hand.js             learns the player's hand: threshold, letter gap, wpm     [R3.3]
    send.js             sending flow (uses hand.js)
    receive.js          receiving flow
    day-clock.js        game clock, arrivals, spike, speed-ups, dawn             [R9.7]
    idle.js             lives lost while idling                                  [R9.7f]
    messages.js         message data, threads and day builder
    lives.js            lives, streak, refill
    stats.js            counters, wpm, rank
    game.js             state machine (screens and day flow)
    tutorial.js         instruction sheets
    settings.js         settings and saved data
    rng.js              seeded random numbers
  input/
    keyboard.js         Space and letter keys
    pointer.js          touch Morse key and typewriter keys   [R15]
  audio/
    engine.js           AudioContext, buses, compressor, mute, volume
    voices.js           telegraph tone, sounder, tick, knock, thunder, crow, scream, rain, static
    office-sound.js     room tone, wind, wires, the line spitting, the snap, bells, robin
    phonograph.js       period record sound: needle, warp, crackle, reverb, sticking
    piano.js            plain piano for the story's nocturne
    scores.js           the waltz and the nocturne as note data
    story-sound.js      each slide's sound picture
    music-day.js        soft music and birdsong
    sequencer.js        plays a letter as tones on the audio clock
    captions.js         sound name to caption text
  director/
    horror.js           intensity and random one-shot scheduling
    dread.js            unease that builds through the night                      [R6.7]
    faults.js           what a mistake does, by lives left; omens; last warning   [R6.4]
    thoughts.js         character thoughts and fact picking
  office/               the Night Shift room                                      [R6, R11.4]
    drawings.js         calendar, clock, window, lamp, galvanometer, key, figure (drawn once)
    scenery.js          grass, reeds, trees, raindrops grown from a seed
    room.js             builds the room, fitRoom(), room-hidden
    forms.js            telegram form, spike, SENT/RECEIVED stamp, paper tape, codebook card
    galvanometer.js     springy needle driven by lives
    light.js            lamp light, stutter, dim-around-the-needle, dark corners, dawn light
    daylight.js         the office by day: the bird past the window                 [R7.2a]
    codebook.js         the codebook card                                          [R3.1a]
  story/                the magic-lantern show                                    [R17]
    intro.js            slide player, letter writer, Space / Esc
    letter.js           the letter's lines per slide
    slides/             hall.js, room.js, advert.js, train.js, station.js, office.js
  ui/
    screens.js          start card, story offer, dialog, title card, notices
    endings.js          game over sequence and dawn                               [R5.5, R9.9]
    options.js          Options menu and "Line Held"
    effects-fx.js       one-shot overlays (static)
  css/                  base, office, forms, endings, story, menu (colours as variables)
  judge/
    judge.js            Judge panel, cheats, demo reel, auto-play
test/                   node:test unit tests and property tests
tools/shots.mjs         headless Chrome screenshots (always --mute-audio)
```

## 3. Architecture

```
 input (keys, touch)            audio (Web Audio)
        |                              ^
        v                              |
   +----------+   events    +----------------------------------+
   |  game.js | ----------> | directors + office/ui + audio     |
   |  (rules) | <---------- | (listen and show)                 |
   +----------+   input     +----------------------------------+
        |
        v
   core/lives, stats, messages, morse, hand, day-clock, idle
```

- `game.js` owns one state object and one function, `dispatch(event)`. Input turns into events such as `PRESS_END`, `LETTER_TYPED`, `TICK`, `NEXT_DAY`. The rules change the state and emit output events such as `LETTER_OK`, `LETTER_WRONG`, `LIFE_LOST`, `ARRIVED`, `MESSAGE_DONE`, `DAWN`, `DAY_ENDED`.
- UI, audio and the directors only listen to output events. They never change the rules. This keeps Judge mode simple: cheats are just extra input events.
- A tiny event bus (`on`, `emit`) connects the parts. No framework.
- **One office, night and day.** Every mode is played in the office (`office/room.js`). Day Shift mounts it with `daylight: true`: the `.office.daylight` class shows the day sky, clouds, sunlight and bird (`.day-only`) and hides the lamp's flame, the rain and the drops. The lamp light, the faults, the dread, the dying line and the dawn are only mounted at night.
- **One scope.** The bundler puts all modules in one scope, so top-level names must be unique across modules (the build checks this). The office's galvanometer class is `OfficeGalvanometer` and its sound class is `OfficeSound`, so they do not clash with the Day Shift ones.

## 4. Screens and flow [R1, R2, R5, R8, R9, R16, R17]

```
boot -> start -> (storyOffer) -> (story) -> (tutorialDialog) -> (tutorial) -> dayTitle -> playing
playing -> (forms arrive, are done, the next slides in) ... -> dawn (Night Shift) -> dayNotice
dayNotice -> dayTitle (next day) | closing
playing (0 lives, or 06:00 with work left) -> gameOver sequence -> notice (Restart this day -> dayTitle) | (Main menu -> start)
Options "End game" -> confirm -> start
```

| State | What it shows | Leaves when |
|---|---|---|
| `start` | company card over the empty office: name, Station 7, roster, mode buttons, Judge | a mode is picked |
| `storyOffer` | "Read the letter", "Go straight to the desk", tick "Always go straight to the desk" | a button |
| `story` | the lantern show | last slide ends, or Esc |
| `tutorialDialog` | "Start tutorial", "Not now", "Never" | a button is pressed |
| `tutorial` | the desk with instruction sheets | all sheets done or skipped |
| `dayTitle` | "Day 1 · Wednesday, 4 November 1903", plus the Day 2 / Day 3 line | any key or click |
| `playing` | office, form, spike, tape, galvanometer, codebook, wall clock | `DAWN`, 0 lives, or `TIME_UP` |
| `dawn` | the dawn (Night Shift and Dead Air only) | about 12 s, then the notice |
| `dayNotice` | "SHIFT ENDED 06:00" company notice with stats and rank, "Next day" | "Next day" |
| `gameOver` | snap, dark, "THE LINE IS DEAD", dismissal telegram with buttons | a button |
| `closing` | closing company notice and best stats | any key |

Skipping rules: `storyOffer` and `story` are skipped when "Always skip the story" is on, in Dead Air, and in Judge mode [R16.8, R13.5]. `dawn` is skipped in Day Shift; the notice comes straight away.

Day dates: Day 1 is Wednesday, 4 November 1903 (the newspaper on slide 3 is dated Tuesday, 3 November). Day 2 and Day 3 follow. The calendar on the wall is crossed off up to the day before [R9.8].

Checkpoint [R5.6a]: when a day starts, `game.js` keeps a copy of the state (`checkpoint = {day, modeStats}`) in memory only. "Restart this day" restores it with full lives, zeroed stats for that day and a fresh clock at 22:00. Nothing is written for it, so a reload drops the run [R5.6b]. The learned hand is not part of the checkpoint; it keeps learning.

## 5. Morse engine [R3]

**Letter table.** An object `A..Z` to strings of `.` and `-`.

**The hand** (`core/hand.js`) [R3.3]:

```
state: { dot, dash, recent[] }          new player: dot 120, dash 360
threshold = (dot + dash) / 2            new player: 240 ms
unit      = (dot + dash / 3) / 2        new player: 120 ms
letterGap = clamp(unit * 6, 450, 1600)  new player: 720 ms
wpm       = round(1200 / unit)
classify(ms): push clamp(ms, 30, 2000) to recent (keep last 20);
              if recent has 4 or more, learn(); return ms >= threshold ? '-' : '.'
learn(): sort the logs of recent; pick the split that best separates two groups
         (largest n1 * n2 * (mean1 - mean2)^2); short = median of group 1, long = median of group 2;
         if long / short >= 1.8: dot = short, dash = long
         else: one kind only; move whichever symbol it resembles, keep the other at least 2x apart
```

Medians keep one stray press (a key held for seconds) from throwing the hand off. The hand is pure: no clock, no storage. `main.js` loads `{dot, dash}` from settings at boot and saves it after each letter (not in Judge mode) [R3.3a]. "Forget my hand" resets it to the new player's hand.

**Sending input** (`core/send.js` and `input/keyboard.js`):

1. On `keydown` of Space with `event.repeat === false` and no press active, store `t0 = clock.now()`, start the tone, press the key [R3.2, R3.8]. Ignore `event.repeat === true` events completely [R3.8].
2. On `keyup`, compute `d = now - t0`. `hand.classify(d)` gives the dot or dash and learns from it. Stop the tone. Append to the current pattern and to the tape. Start a letter-gap timer of `hand.letterGap` [R3.4].
3. A new press cancels the timer. When the timer fires, `decode(pattern)` returns a letter or `null`. The tape pencils the letter (or a red `?`) under the group [R3.4a].
4. If `pattern.length > 4` the pattern is decoded at once as wrong, since no letter has more than 4 symbols.
5. The window `blur` event cancels any running press, so a held key never gets stuck.
6. Compare with the expected letter. Right: the letter fades on the form, move on [R3.5]. Wrong: `LIFE_LOST`, red strike on the tape, red tally on the form, same letter again [R3.6].

The hold meter shows the current press growing, with a mark at `hand.threshold`, during the tutorial and in play [R2.3].

**Touch** (`input/pointer.js`) uses `pointerdown` and `pointerup` on the on-screen Morse key and the same `hand.classify` [R15.1]. Both inputs call the same `pressStart()` and `pressEnd()` functions.

**Receiving** [R4]: `audio/sequencer.js` plays one letter at a time using the audio clock (`ctx.currentTime`). Timings stay fixed at dot 120 ms, dash 360 ms, 120 ms between symbols: the other station has its own hand, not the player's.

```
play letter -> wait for typed letter
   right: fill blank, 400 ms pause, play next letter
   wrong: LIFE_LOST, play same letter again (free)
   15 s no input: replay once (free)
   Replay button: replays; counts 1 of 3 in Night Shift, free in Day Shift, free after a mistake
```

The sounder arm and the "click" and "clack" are scheduled from the same list of tone times as the tones [R4.1]. In the office the received message fills a blank telegram form [R4.2], stamped RECEIVED at the end [R4.5b].

**Tape.** Backspace tears the tape off [R3.4a]. The tape keeps at most 120 items. Backspace is ignored while the game waits for a typed letter.

## 6. Data

### Messages [R9, R12.5, R6.3]

`core/messages.js` holds plain data, written for 1903: routine traffic (births, deaths, freight prices), people's lives, quiet small-hours telegrams that are faintly off, threads (small stories in parts) and strange messages. Each message:

```js
{ id: "d1-03", to: "J. Pell, Harbour Office", from: "Capt. Wren",
  text: "ARRIVING TUESDAY TRAIN STOP", day: 1 | 2 | 3,
  kind: "send" | "receive" | "either",
  strange: false, abbreviations: false, thread: null | { id: "ship", part: 1 } }
```

`to` and `from` are written on the form; only `text` is keyed. Derived: `letters` (spaces removed), `length` class: `short` (up to 10 letters), `long` (20 or more), else `medium`.

**Day builder** `buildDay(day, mode, rng)` picks 5 messages and their arrival times:

1. Choose from the pool of that day and mode (Day Shift uses `strange: false` only [R7.2]).
2. Rules to satisfy: at least one short and one long [R9.2]; lengths not sorted [R9.2]; no long message among the last two [R9.2]; on Day 1 a short first message and every message within two lines of the form (`formLines`, 17 characters a line) [R9.2a]; Night Shift strange counts: Day 1 only the 5th, Day 2 at least 2, Day 3 at least 3 [R6.3, R6.7]; Day 3 at least 2 send and 2 receive [R9.2]; Dead Air uses Day 3 strange counts on all days [R16.1].
3. The 5th message of Day 1 in Night Shift and Dead Air is the fixed telegram to "Mr E. Vane, Station 7": `WHY HAVE YOU NOT REPORTED` (it counts as strange and long) [R6.3a]. In Day Shift it is a normal message.
4. A day may hold one thread, and its parts keep their order [R12.5].
5. Arrival times: the first at 22:00, the rest spread to 04:00 with a little seeded jitter, in order [R9.7b].
6. Shuffle with the seeded `rng` and retry (up to 200 times) until all rules hold. A test checks this for 1000 seeds.

Pool size: at least 12 messages per day. Text is at most 30 letters on Day 1.

### Thoughts [R12]

As before, plus: every fact is checked to be true for 1903 (some lines were written for 1873), the operator is "they", and up to 2 thoughts may compare the work to music [R12.1a, R12.4].

### Story [R17]

`story/letter.js` holds the six slides as data: `{ scene, lines[], sounds[], at: { lineIndex: event } }`. Events are the one-off moments on a slide (the hall's light going out, the candle dipping). `story/slides/*.js` each export a function that returns the slide's SVG.

### Saved data [R8.4, R2, R16.3, R3.3a]

One localStorage key `nightshift.v1`. Old `deadair.v1` saves are not read.

```js
{ version: 1,
  settings: { musicVol, sfxVol, mute, music: true, reduceFlashing, captions,
              showLivesNumber, skipStory: false, tutorial: "ask" | "never" },
  hand: { dot: 120, dash: 360 },
  best: { night: Stats|null, day: Stats|null, deadair: Stats|null },
  deadAirUnlocked: false }
```

`settings.js` wraps storage in `load()` and `save()`. In Judge mode `save()` does nothing [R13.5]. If localStorage is blocked or full, the game keeps working with defaults in memory.

## 7. Lives, stats, rank, game clock, idling [R5, R8, R9.7]

`core/lives.js` and `core/stats.js` are unchanged (max 10 or 5, refill after 3 clean messages, wpm, rank).

**Game clock** (`core/day-clock.js`, pure: it gets `tick(realMs)` calls and returns events) [R9.7]:

```
day = { realMinutes: 10 | 16 | 16, arrivals: 5 times from 22:00 to 04:00 }
base speed: 480 game minutes per realMinutes     (22:00 to 06:00 at 1x)
speed: 1x while a message is in hand
       4x while nothing is waiting
       6x once all 5 are done, until 06:00
events: ARRIVED(message) -> counter bell; to the desk, or onto the spike if busy
        DAWN             -> all 5 done; the clock runs on at 6x to 06:00
        TIME_UP          -> 06:00 with a message in hand or waiting: the day is lost
state:  minutes, waiting[], started, held
```

The clock starts on the first key press or typed letter of the day, and stops while held [R9.7a]. The stamp on a finished form uses the current time [R3.7]. The day always ends at 06:00 [R9.7e]. `game.js` treats `TIME_UP` like 0 lives: the game over plays, with "TELEGRAMS NOT SENT" on the dismissal telegram [R9.7g].

**Late drain** (in `core/idle.js`) [R9.7h]: past 04:00 with a message not done, it emits `LATE_LIFE_LOST` every 20 s of real time, every 10 s from 05:00. It stops while held, and is off in Day Shift. It runs beside the idle rule; both count, so a slow, idle player loses lives fast. `game.js` treats it like `IDLE_LIFE_LOST`.

**Idling** (`core/idle.js`, pure: `tick(realMs, { waiting, started, mode, held })`) [R9.7f]: after 6 s with no press or typed letter while a message waits, it emits `IDLE_LIFE_LOST`, then again every 17 s. Any press or typed letter resets it. It is off in Day Shift, while held, and before the first input of the day. The 15 s receive auto-replay [R4.5a] is not input, so it does not reset the idle time. `game.js` treats `IDLE_LIFE_LOST` like a mistake for lives, the clean streak and the faults, but not for the stats' mistake count.

## 8. Visuals [R1, R3, R4, R5, R7, R9, R11.4]

### The office (Night Shift and Dead Air) [R11.4]

Laid out at a 900 px design height and scaled as a whole with one CSS `transform: scale()` (`fitRoom()`, on load and resize). Design width is from the screen's aspect, up to 1700 px.

| Area | What is there |
|---|---|
| Left wall | the window (rain, the marsh, the pole the wires run to, a bare tree; clinging drops as an HTML layer), the codebook card below it |
| Centre | the calendar, the paper tape, the hold meter, the key on the desk |
| Right wall | the wall clock (regulator, swinging pendulum), the galvanometer, the telegram form and the spike on the desk |
| Front left | the oil lamp, the largest thing in the room; the room's light comes from it |

Below 1050 px wide the room becomes one scrolling column without the window, clock, calendar and lamp. This is also the phone layout [R15.3]. There the game clock is shown as text.

**Codebook** (`office/forms.js`): a printed card, 2 columns (A to M, N to Z) [R3.1a]. Click enlarges it to the middle of the screen; click again or Esc puts it back. No letter shortcut. In Dead Air it is not drawn; the wall shows two pin marks [R16.5].

**Telegram form**: a Marsh & Western form in IM Fell English SC, with `to`, `from` and the text in Caveat handwriting. Words never break across lines. The next letter is underlined in pencil; sent letters fade; a wrong letter gets a red tally mark. A finished form gets a red SENT or RECEIVED stamp with the time and slides off; the next waiting form slides in [R3.1, R3.7, R4.5b, R9.7c]. Waiting forms show as a stack on the spike.

**Galvanometer** (`office/galvanometer.js`): a springy needle driven by `lives / max`. The dial has 10 marked steps (5 in Dead Air) and a red zone. The needle trembles more near the red zone. Each step down jolts it with a "tock"; 0 lives flings it against the zero stop [R5.1-5.3]. Its glass can carry the crack [R6.4b].

**Light** (`office/light.js`): the lamplight is a gradient layer. It can stutter, dim the room except the galvanometer (a cut-out around it), close the dark in from the corners, go out, and at dawn give way to the window's light shaft. With "Reduce flashing" every stutter is a 600 ms fade [R6.6].

**Window sky**: from 60% of the night (the game clock from 22:00 to 06:00 as 0 to 1) it lightens toward dawn [R9.9].

**Room hidden**: while the start card or the story covers the office, `body.room-hidden` stops drawing it and pauses its animations [R11.6].

### The start card [R1.1]

A second copy of the story's office slide (drawn with its own id prefix), dimmed, drifting sideways at one zoom (zooming made Chrome flicker on a busy graphics card). Over it, a printed company card with the roster. The mode buttons are printed lines on the card. The Options button stays in the upper right.

### The office by day [R7.2a]

The same room for Day Shift (`.office.daylight`). The window has a pale sky and clouds in two copies that drift and loop; the marsh is green-brown, with no rain and no drops on the glass. Sunlight comes through the panes as a beam (a clipped gradient with 14 dust motes) and a skewed patch on the desk with the cross of the window bars in it. The lamp stands unlit. `office/daylight.js` flies a bird across the window every 25 to 70 s, either way, above the marsh; if a letter is being keyed or sounding when one is due it tries again 3 s later, and with reduced motion it never flies. The wall clock and the notices use 10:00 to 18:00 (`startHourFor(mode)` in `core/day-clock.js`). On a narrow screen the sunlight is not drawn, like the window.

**Palette**: CSS variables per mode. All text pairs are checked for 4.5:1 [R10.4], including the new ones (ink on the form, pencil on the tape, the notices, the letter under the slides).

## 9. Audio [R4, R6, R7, R17]

All sound is synthesized. No sample files.

**Engine** (`audio/engine.js`):

```
voices, office-sound -> sfxBus -----+
                                    +-> compressor -> masterGain -> destination
phonograph, piano, music -> musicBus+
```

Every sound module takes `{ ctx, sfxBus, musicBus }` from `engine.js`, so one volume, one mute and one "Music" switch rule everything [R6.8].

**Office voices** (`audio/office-sound.js`): room tone (rumble and mains hum), wind gusts, singing wires, the counter bell, the line spitting (crackle on the sounder, a dull "tock", a low sour swell on E♭ with a tritone), the sour drone, the line repeating a wrong letter, the snap (crack, thump, jammed tone), the church bell striking six, the robin, and the last warning's swell and glassy cluster.

**Music** [R6.2]:

- Night Shift: `phonograph.js` plays the waltz in E♭ minor from `scores.js` through the period sound (needle, crackle, warp, reverb), as if from the next room. The key's tone is tuned to E♭.
- `music-night.js` (drone, hoo tones, heartbeat) is removed: its notes sit around D, a half step off the waltz's E♭, and the record and the room tone fill that space.
- The record can wobble, sag, drag flat and stick (one 0.8 s turn repeated 4 times), on calls from `dread.js` and `faults.js`.
- Story: `piano.js` plays the nocturne from the hall to the station, then fades [R17.4].
- Day Shift: `music-day.js`, unchanged [R7.3].

**Captions** [R10.3]: each new voice gets a caption ("[the counter bell]", "[the line crackles]", "[a knock behind you]", "[a church bell strikes six]", "[the record sticks]").

## 10. Directors [R6, R16]

**Horror** (`director/horror.js`): unchanged. `intensity` from day and lives; random one-shots (thunder, crow, scream, knocking) at least 8 s apart (4 s on Day 3), never while a key is down or a letter is being keyed.

**Dread** (`director/dread.js`) [R6.7]: effects fade in at set points of the night (the game clock as 0 to 1) and grow until dawn. Day 1 uses the points below, Day 2 starts each effect at 70% of them, and Day 3 and Dead Air have every effect at full strength from 22:00.

| From (Day 1) | Effect |
|---|---|
| 15% | the light stutters (late on, a second of near-total dark) |
| 30% | wind gusts against the window |
| 50% | a second hum throbs against the mains |
| 55% | the record wobbles and sags |
| 60% | the sounder clicks once by itself, the needle twitches |
| 75% | something knocks, far off in the building |

Dread one-offs share the one-shot gap with the horror director, so two never come together.

**Faults** (`director/faults.js`) [R6.4]: listens to `LIFE_LOST`, `IDLE_LIFE_LOST` and `LATE_LIFE_LOST`.

| Lives (of 10) | Of 5 (Dead Air) | Adds |
|---|---|---|
| any | any | line spits, light stutters, room dims around the needle; all stronger the lower |
| below 7 | below 4 | sour drone, dark closing in (while lives stay low) |
| below 5 | below 3 | the line repeats the wrong letter, faint, in the player's hand (not on idling) |
| below 3 | below 2 | the light goes out after the stutter; three knocks behind |
| first fall to 7, 5, 3 | to 4, 3, 2 | one omen not yet seen today, 2.5 to 5 s later, in a quiet moment |
| fall to 1 | fall to 1 | the last warning; the crack stays until the day ends |

Omens: blue flame, heavy air, record sticks (only if music is on). Nothing touches the key, tape, codebook or form [R6.4c].

Day Shift starts none of the directors [R7.1].

## 11. Options and settings [R10]

The Options button and Esc open one panel (`role="dialog"`, focus trapped, Esc closes), drawn as a company card. Content: music and effects sliders, mute, "Music", "Reduce flashing", "Captions", "Show lives as a number", "Always skip the story", "Full screen", "Forget my hand", "Start with tutorial", and "End game" during a run [R10.1a].

During a run the card reads "Line Held" and the game is held: the game clock, idling, the letter-gap timer, the 15 s timer, the directors, the clock's hands, the record and all sound stop (the `AudioContext` is suspended). Leaving the tab does the same [R10.1b]. Closing the card resumes it.

## 12. Tutorial [R2]

As before: 5 sheets as data. The sheet for the letter gap uses `hand.letterGap`. The hold meter is shown with the threshold mark. The sheets lie on the office desk, at night or by day. The game clock and idling do not run in the tutorial. Tutorial presses teach the hand [R2.7].

## 13. Kiroween Judge mode [R13]

As before, with these changes:

- Jump to day adds "Dawn" (plays the dawn, then the notice) [R13.3a].
- "Play the story" starts the story at slide 1 [R13.3g].
- Trigger effect adds one button per omen and one for the last warning [R13.4c].
- Infinite lives also covers idling. The speed switch (x1, x2, x4) also speeds the game clock.
- The learned hand is used but not saved [R13.5].
- The story and the tutorial are skipped [R13.5].
- Dev query strings for checks: `?story=5` (slide 5), `?dawn` (ten to six, work done), `?dread=0.9` (late-night room at once). They are not shown to players.

## 14. Accessibility and phones [R10, R15]

As before. New: the story's letter is real text with `aria-live="polite"`, so a screen reader reads each line. The counter bell, the figure, the omens and the dawn have captions. The phone layout is the office's one-column layout [R15.3].

## 15. Errors and edge cases

| Case | Behavior |
|---|---|
| Tab loses focus during a press | press is cancelled, no symbol is added, the game is held |
| Audio blocked or unsupported | game runs silent; captions on by default; one small notice |
| localStorage blocked | defaults in memory, no crash; the hand is learned fresh each visit |
| A saved hand is broken (NaN, out of range) | reset to a new player's hand |
| Two keys at once (Space and a letter) | Space is ignored while the game waits for a typed letter, and letters are ignored while it waits for Morse |
| Window resized or rotated | `fitRoom()` rescales; no state change |
| Page reload | run is dropped; settings, hand and best stats stay [R5.6b] |
| `AudioContext` suspended (iOS) | resumed on the next touch |
| A very long tick (laptop asleep) | the clock and idling cap one tick at 1 s, so no lives vanish at once |

## 16. Testing

**Unit tests** (`node --test`), new and changed:

- `hand.test.js`: a new hand has threshold 240 and letter gap 720; after 20 presses of 100 and 300 ms the threshold is 200; one stray 2 s press does not move it much; "forget" resets; letter gap is clamped to 450 and 1600.
- `day-clock.test.js`: starts at 22:00 only on the first input; 1x, 4x and 6x speeds; arrivals go to the spike while busy; dawn when all done, at 06:00; `TIME_UP` at 06:00 with a message left, never later; held stops it.
- `idle.test.js`: first life after 6 s, then every 17 s; input resets; off in Day Shift, while held and before the first input; a long tick is capped; late drain every 20 s past 04:00 and every 10 s past 05:00, only while work is left.
- `messages.test.js`: adds the Vane telegram as Day 1's 5th in Night Shift and Dead Air, threads in order, arrival times in order from 22:00 to 04:00.
- `faults.test.js`: which effects are on for each lives count, for max 10 and max 5; each omen at most once a day; the last warning only at 1.
- `dread.test.js`: start points per day; Day 3 full from 22:00; nothing fires while a key is down.
- `story.test.js`: six slides, each with at least one line; Esc ends; skip rules for Dead Air and Judge.
- `settings.test.js`: new key; a broken hand resets.
- `build.test.js`: the fonts are inlined; no `http://` or `https://` link to another site [R11.2].
- The old 299/300 ms and 699/700 ms edge tests are replaced by edges at the hand's threshold and letter gap.

**Property-based tests** (`fast-check`), changed and new:

| Property (for any random input) | Covers |
|---|---|
| For any hand, a press below its threshold is a dot and at or above it is a dash | R3.3 |
| For any steady hand (dot d from 60 to 300 ms, dash at 2.5 to 4 times d, with 10% jitter), after 20 presses the threshold lies between d and the dash | R3.3 |
| For any list of presses, the dash is always at least 1.8 times the dot, and neither is NaN | R3.3 |
| The letter gap is always between 450 and 1600 ms | Glossary |
| For any list of tick lengths and inputs, the game clock never goes back, messages arrive in order, and the day never ends with a message left | R9.7 |
| For any idle run in Night Shift, lives lost = 0 before 6 s, then 1 + floor((t - 6) / 17) | R9.7f |
| For any run, no late life is lost before 04:00 or once all 5 are done | R9.7h |
| For any run of lives lost and refilled, each omen plays at most once a day and the last warning only on reaching 1 | R6.4a, R6.4b |
| All earlier properties, with the 300 ms rule replaced by the hand's threshold | as before |

**Screenshots** (`tools/shots.mjs`): headless Chrome with `--mute-audio`, `--no-sandbox` and a fresh `--user-data-dir`. It freezes every animation at a set moment (`document.getAnimations()` paused at a set time) and shoots: the start card, each story slide, the office at Day 1 start, late at night (`?dread=0.9`), the last warning, the game over notice, the dawn, the dawn notice, the one-column layout at 360 px, and the office by day (with the bird mid-flight, and at 360 px). Shots are taken before and after each visual task.

**Manual checklist** as before, plus: the story with sound, the dawn with sound, "Reduce flashing" through the snap and the last warning, a slow day that runs out at 06:00.

## 17. Build, publish, repository [R14]

- `node build.mjs` writes `dist/index.html`: inline CSS, JS and fonts (base64 woff2), no network calls. The build fails on any link to another site [R11.2].
- The font licences (SIL Open Font License for IM Fell English SC and Caveat, Apache 2.0 for Special Elite) are kept in `fonts/` and named in the README.
- Publish `dist/` to a static host (GitHub Pages) [R14.1].
- The game is called "Night Shift" in the page title, the start card, the README, the Judge welcome card and the storage key. The hard mode keeps the name "Dead Air".

## 18. Order of work and cuts

Build in this order, each step ending with something playable:

1. Fonts, CSS, `drawings.js`, `scenery.js`, `room.js`: the empty office behind the game (Night Shift only).
2. The hand: `hand.js` replaces the 300 / 700 ms rules.
3. Forms, spike, tape, codebook, galvanometer: the desk works in the office.
4. Game clock, arrivals, idling, wall clock, window sky.
5. Office sound and the phonograph waltz.
6. Faults, omens, last warning, dread.
7. Game over sequence and dawn, company notices.
8. Start card and "Line Held".
9. The story.
10. Messages for 1903; thoughts checked; the name.
11. Judge additions, accessibility pass, screenshots.

If late, cut in this order:

1. Story slides 1 to 5 (keep slide 6, the office, as a short opening) [R17].
2. Dread's second hum, record wobble and phantom clicks [R6.7]; the light's stutter stays.
3. Horror one-shot sounds (crow, scream, knocking, thunder) [R6.1].
4. Day Shift music [R7.3].
5. Phone support [R15].
6. Dead Air [R16].

Never cut: Morse sending, receiving, lives, the hand, the game clock, the office, the game over, the dawn, Judge mode (R13), and the story thoughts (R12).

## 19. The order on Day 3 [R18]

`director/order.js` (pure) holds the five orders as data: `{ id, text, sign, word }`. `createOrder({ rng })` picks one per run and runs a small state machine:

```
idle -> given (the order message is done) -> sign (at a set game time before 05:00) -> open (20 s)
open: a right letter moves on; a wrong one starts the word again
open -> kept (the whole word in time) -> idle, the day goes on
open -> broken (20 s pass) -> the scare, the newspaper, the game over (reason 'order')
```

- `buildDay` gives Day 3 in Night Shift and Dead Air one extra rule: one of its messages is the order, always a received one, strange. Its `from` is "VN".
- The sign's time is drawn when the order is done: between 10 and 40 s of real time later, and before 05:00 on the game clock.
- `game.js` treats the 20 s as held time for the clock, idling and the late drain (like "Line Held"), and routes letters (from the key or the keyboard) to the order while it is open.
- The signs reuse what exists: `knock({ near: true })` made heavier (a door thud: low boom, a rattle of the latch), the blue flame, `phantomClick()` three times, `ring` 13 times on the clock's gong, and the office sound with the rain and wires faded to nothing. On that day the faults' blue flame omen and the dread's phantom clicks are held back.
- The 20 s in the office: the form fades to 0, an `order-card` in VN's ink takes its place showing the order and the letters sent so far, a heartbeat (two low thumps, from 50 to 120 beats a minute) on the effects bus, the light layer dims the room around the key and the codebook.
- The scare and the ending reuse the light (`watched`, `lightsOut`), the window figure drawn close against the glass, and the story's advert slide with a later date and a slow push-in.


## 20. Requirement coverage

| Req | Where in this design |
|---|---|
| R1 | 4 Screens, 8 Start card, 9 Engine (audio unlock) |
| R2 | 4, 12 Tutorial |
| R3 | 5 Morse engine and the hand, 8 Forms and codebook |
| R4 | 5 Receiving, 8 Forms, 9 Voices (sounder) |
| R5 | 4 (checkpoint), 7 Lives, 8 Galvanometer, 18 step 7 (game over) |
| R6 | 9 Audio, 10 Directors |
| R7 | 3 One office, 8 The office by day, 9 Day music |
| R8 | 7 Stats and rank, 4 Notices |
| R9 | 4 Day dates, 6 Messages and arrivals, 7 Game clock and idling, 8 Window sky |
| R10 | 11 Options and Line Held, 14 Accessibility |
| R11 | 1 Overview, 8 Office, 17 Build |
| R12 | 6 Messages and thoughts |
| R13 | 13 Judge mode |
| R14 | 17 Build and repository |
| R15 | 5 Touch, 8 One column, 14 Phones |
| R16 | 4, 6, 8 (no codebook), 10 (faults for 5 lives) |
| R17 | 4 Story states, 6 Story data, 9 Piano, 18 step 9 |
| R18 | 19 The order |
