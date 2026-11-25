# Design: Dead Air -- 1873 (Telegraph Operator Game)

This document explains how the requirements in `requirements.md` are built. Requirement numbers (R1 to R16) are written in brackets.

## 1. Overview

- One browser page. Vanilla JavaScript (ES modules), SVG, CSS, and the Web Audio API. No libraries, no external files [R11]. The only package in the project is the dev-only test library `fast-check`.
- Source lives in `src/`. A small Node script, `build.mjs`, with no packages, copies everything into one file, `dist/index.html`. That file is what gets published [R11.1, R14.1].
- All game rules live in plain JavaScript with no browser calls. The browser parts (keys, SVG, audio) sit around it. This lets us test the rules with `node --test` and no browser.
- Time and random numbers are passed in (a `clock` and a seeded `rng`). Tests and Judge mode can then control them.

## 2. Project layout

```
index.html              page shell, loaded by dev server and inlined by the build
build.mjs               inlines src/ into dist/index.html
src/
  main.js               boots the app, wires everything
  core/                 pure rules, no DOM, no audio
    morse.js            letter table, press and gap classifier, decoder
    messages.js         message data and day builder
    lives.js            lives, streak, refill
    stats.js            counters, wpm, rank
    game.js             state machine (screens and day flow)
    settings.js         settings and saved data
    rng.js              seeded random numbers
  input/
    keyboard.js         Space and letter keys
    pointer.js          touch Morse key and typewriter keys   [R15]
  audio/
    engine.js           AudioContext, buses, compressor, mute, volume
    voices.js           telegraph tone, sounder, tick, knock, thunder, crow, scream, rain, static
    music-night.js      drone, hoo tones, heartbeat, tension
    music-day.js        soft music and birdsong
    sequencer.js        plays a letter as tones on the audio clock
    captions.js         sound name to caption text
  director/
    horror.js           intensity and random effect scheduling
    thoughts.js         character thoughts and fact picking
  ui/
    scene.js            desk SVG: key, sounder, paper, galvanometer
    galvanometer.js     dial and needle
    morse-chart.js      left side chart
    screens.js          start, dialog, day intro, stats, game over, closing
    options.js          Options menu
    text-row.js         target text and blanks row
    effects-fx.js       flicker, vignette, static overlay
  judge/
    judge.js            Judge panel, cheats, demo reel, auto-play
test/                   node:test unit tests
docs/                   README, video script
```

## 3. Architecture

```
 input (keys, touch)            audio (Web Audio)
        |                              ^
        v                              |
   +----------+   events    +----------------------+
   |  game.js | ----------> | director + ui + audio |
   |  (rules) | <---------- | (listen and show)     |
   +----------+   input     +----------------------+
        |
        v
   core/lives, stats, messages, morse
```

- `game.js` owns one state object and one function, `dispatch(event)`. Input turns into events such as `PRESS_END`, `LETTER_TYPED`, `NEXT_DAY`. The rules change the state and emit output events such as `LETTER_OK`, `LETTER_WRONG`, `LIFE_LOST`, `DAY_ENDED`.
- UI, audio and the horror director only listen to output events. They never change the rules. This keeps Judge mode simple: cheats are just extra input events.
- A tiny event bus (`on`, `emit`) connects the parts. No framework.

## 4. Screens and flow [R1, R2, R5, R8, R9, R16]

```
boot -> start -> (tutorial dialog) -> (tutorial) -> dayIntro -> playing
playing -> messageDone -> (next message) ... -> dayStats -> dayIntro (next day) | closing
playing -> gameOver -> (Restart this day -> dayIntro) | (Main menu -> start)
Options "End game" -> confirm -> start
```

| State | What it shows | Leaves when |
|---|---|---|
| `start` | Night Shift, Day Shift, Dead Air (locked or open), Kiroween Judge, Options | a mode is picked |
| `tutorialDialog` | "Start tutorial", "Not now", "Never" | a button is pressed |
| `tutorial` | desk with instruction sheets | all sheets done or skipped |
| `dayIntro` | short card (Day 2 and 3 explain receiving, and sending plus receiving) | any key or click |
| `playing` | desk, message, galvanometer, chart | last message done or 0 lives |
| `dayStats` | statistics and rank | "Next day" |
| `gameOver` | "Restart this day" and "Main menu" (Dead Air: "Main menu" only) | a button |
| `closing` | end screen and best stats | any key |

Checkpoint [R5.6a]: when a day starts, `game.js` keeps a copy of the state (`checkpoint = {day, modeStats}`) in memory only. "Restart this day" restores it with full lives and zeroed stats for that day. Nothing is written for it, so a reload drops the run [R5.6b].

## 5. Morse engine [R3]

**Letter table.** An object `A..Z` to strings of `.` and `-`.

**Sending input** (`core/morse.js` and `input/keyboard.js`):

1. On `keydown` of Space with `event.repeat === false` and no press active, store `t0 = clock.now()`, start the tone, animate the key [R3.2, R3.8]. Ignore `event.repeat === true` events completely, because a held key sends many `keydown`s [R3.8].
2. On `keyup`, compute `d = now - t0`. `d < 300` is a dot, otherwise a dash [R3.3]. Stop the tone. Append to the current pattern. Start a 700 ms letter-gap timer [R3.4].
3. A new press cancels the timer. When the timer fires, `decode(pattern)` returns a letter or `null`.
4. If `pattern.length > 4` the pattern is decoded at once as wrong, since no letter has more than 4 symbols.
5. The window `blur` event cancels any running press, so a held key never gets stuck.
6. Compare with the expected letter. Right: mark it, move on [R3.5]. Wrong: `LIFE_LOST`, show the mistake, same letter again [R3.6].

**Touch** (`input/pointer.js`) uses `pointerdown` and `pointerup` on the on-screen Morse key with the same 300 ms rule [R15.1]. Both inputs call the same `pressStart()` and `pressEnd()` functions.

**Receiving** [R4]: `audio/sequencer.js` plays one letter at a time using the audio clock (`ctx.currentTime`), not `setTimeout`, so the tones stay in step. Timings: dot 120 ms, dash 360 ms, 120 ms between symbols.

```
play letter -> wait for typed letter
   right: fill blank, 400 ms pause, play next letter
   wrong: LIFE_LOST, play same letter again (free)
   15 s no input: replay once (free)
   Replay button: replays; counts 1 of 3 in Night Shift, free in Day Shift, free after a mistake
```

The sounder arm and the "click" and "clack" are scheduled from the same list of tone start and end times as the tones. The arm moves with `requestAnimationFrame` reading the audio clock, so picture and sound stay together [R4.1].

Typed letters come from `keydown` (A to Z, any case) or from the on-screen keys. There is no Enter key [R4.3].

## 6. Data

### Messages [R9, R12.5, R6.3]

`core/messages.js` holds plain data. Each message:

```js
{ id: "d1-03", text: "ARRIVING TUESDAY TRAIN STOP", day: 1 | 2 | 3,
  kind: "send" | "receive" | "either",
  strange: false, abbreviations: false }
```

Derived: `letters` (spaces removed), `length` class: `short` (up to 10 letters), `long` (20 or more), else `medium`.

**Day builder** `buildDay(day, mode, rng)` picks 5 messages:

1. Choose from the pool of that day and mode (Day Shift uses `strange: false` only [R7.2]).
2. Rules to satisfy: at least one short and one long [R9.2]; lengths not sorted (the sequence must not be ascending or descending) [R9.2]; Night Shift strange counts: Day 1 only the 5th, Day 2 at least 2, Day 3 at least 3 [R6.3, R6.7]; Day 3 at least 2 send and 2 receive [R9.2]; Dead Air uses Day 3 strange counts on all days [R16.1].
3. Shuffle with the seeded `rng` and retry (up to 200 times) until all rules hold. The pool is big enough that this always ends; a test checks this for 1000 seeds.

Pool size: at least 12 messages per day (about 5 short, 5 medium, 4 long, 5 strange) so repeat plays differ. Messages are written in 1870s telegram style [R12.5].

### Thoughts [R12]

```js
{ id: "paid-per-word", text: "Each word costs money... that is why everyone writes so short.",
  trigger: "fact" | "long-message" | "cryptic-message" | "tutorial-sheet-3" }
```

At least 6 facts and 4 message reactions, each at most 20 words. `director/thoughts.js` picks at most 2 per day. A reaction is allowed only when its trigger fits the current message (`length === "long"` or `abbreviations === true`). Each thought has one version, the same in every mode [R12.6]. Thoughts show as text at the bottom of the desk, fade after 8 s, never take focus, and are blocked while Space is down or the player is typing [R12.2, R12.3].

### Saved data [R8.4, R2, R16.3]

One localStorage key `deadair.v1`:

```js
{ settings: { musicVol, sfxVol, mute, reduceFlashing, captions,
              showLivesNumber, tutorial: "ask" | "never" },
  best: { night: Stats|null, day: Stats|null, deadair: Stats|null },
  deadAirUnlocked: false }
```

`settings.js` wraps storage in `load()` and `save()`. In Judge mode `save()` does nothing, so Judge mode never writes [R13.5]. If localStorage is blocked or full, the game keeps working with defaults in memory. The saved object has a `version`; an unknown version is ignored.

## 7. Lives, stats, rank [R5, R8]

`core/lives.js`:

- `max` is 10, or 5 in Dead Air. `lives` starts at `max` each day [R5.1, R9.6].
- `loseLife()` returns `{ lives, dead }`. `dead` is true when `lives` reaches 0 [R5.5].
- `messageDone(clean)`: if no mistake in that message, `cleanStreak += 1`, else it resets to 0. When `cleanStreak` reaches 3, `lives = min(max, lives + 1)` and `cleanStreak = 0` [R5.4].

`core/stats.js` counts messages, letters correct, mistakes, longest streak without a mistake, and active time. Active time counts only from the first input of a message to its last letter, so thinking pauses between messages do not slow the speed.

- **Words per minute** = `(lettersCorrect / 5) / activeMinutes`. A "word" is 5 letters.
- **Rank** [R8.2]: accuracy rank (below 70% Apprentice, 70 to 94% Operator, 95% or more Master) and speed rank (below 3, 3 to 5.9, 6 or more). The final rank is the lower of the two.
- Best stats compare by rank first, then accuracy, then speed.

## 8. Visuals [R1, R3, R4, R5, R7]

The desk is one inline SVG, 16:9 inside a responsive box. Parts are grouped so each can animate on its own:

| Part | Job |
|---|---|
| Telegraph key | lever tilts while Space is down [R3.2] |
| Sounder | arm drops and lifts with tones [R4.1] |
| Galvanometer | round dial, 10 ticks (5 in Dead Air), needle with CSS transition, tremble near the red zone [R5.1-5.3] |
| Paper | instruction sheets in the tutorial [R2.2] |
| Thought text | bottom line, fades [R12] |
| Window with rain | Night Shift only; Day Shift shows a bright window |

The left side holds the Morse chart, a 2 column list (A to M, then N to Z) with dots and dashes [R3.1a]. It is not drawn in Dead Air [R16.5]. The text row above the desk shows the message letters. In sending mode the next letter is highlighted [R3.1]. In receiving mode it shows blanks that fill in [R4.2].

**Palette** is a set of CSS variables per mode: Night Shift is cold, dark green and grey with sepia paper; Day Shift is warm yellow and cream. All text pairs are checked for 4.5:1 [R10.4].

**Screen effects** (`effects-fx.js`): a vignette layer, a static-noise canvas that is shown for 300 ms, and a flicker done with an opacity animation. With "Reduce flashing" on, flicker and static are replaced by a 600 ms fade and no change faster than 3 times a second [R6.6]. Day Shift loads none of these layers [R7.1].

## 9. Audio [R4, R6, R7]

All sound is synthesized. No sample files.

**Engine** (`audio/engine.js`):

```
voices -> sfxBus ----+
                     +-> compressor -> masterGain -> destination
music  -> musicBus --+
```

- One `AudioContext`, created on the first click or touch (the mode button), because browsers block sound before that [R1.3, R15.5]. If the context is `suspended` it is resumed on every user event.
- Separate volume for `musicBus` and `sfxBus`, and one mute switch [R6.8]. Values come from settings.
- A "voice budget": at most 8 effect voices at once; extra ones are dropped. Every voice disconnects its nodes when it ends, so nothing leaks.

**Voices** (`audio/voices.js`). Each is a function `play(params)` that builds nodes and schedules them:

| Voice | Recipe |
|---|---|
| Telegraph tone | sine around 600 Hz with a fast attack and release so it does not click; plays for as long as the key is down |
| Sounder click, clack | two short filtered noise bursts with a low thump, clack a bit higher |
| Galvanometer tick | very short high band-pass noise |
| Knock | 2 to 3 low sine thuds with a short low-pass |
| Thunder | long noise through a falling low-pass, slow swell |
| Crow | 2 to 3 sawtooth bursts with a pitch glide and a formant band-pass |
| Distant scream | detuned saws gliding upward, low-pass and delayed echo so it sounds far away |
| Static | white noise with a band-pass, 300 ms |
| Rain | looped noise buffer through band-pass and low-pass, always on in Night Shift |

**Music.**

- Night Shift (`music-night.js`): low drone (D1), a slow "hoo" (sine with vibrato and a vowel-like filter), a heartbeat kick whose tempo follows tension (38 to 160 bpm), creaking notes from a tritone-heavy scale. Tension rises as lives fall [R6.2]. This reuses the idea of the earlier Dead Air music prototype.
- Day Shift (`music-day.js`): soft plucked notes from a pentatonic scale, a slow pad, and birdsong made of short FM chirps at random times [R7.3]. It has its own file so it can be cut without touching the rest.

**Captions** [R10.3]: each voice call emits `{caption: "[thunder]"}`. If "Captions" is on, `captions.js` shows the text near the top for 2 s.

## 10. Horror director [R6, R16]

`director/horror.js` computes one number, `intensity` from 0 to 1:

```
intensity = clamp( dayBase[day] + livesPressure * 0.3 )
dayBase  = { 1: 0.15, 2: 0.45, 3: 0.8 }        // Dead Air: 0.8 from Day 1
livesPressure = 1 - lives / max
judge scare dial overrides the result
```

It drives:

- Music tension, drone loudness, rain loudness.
- A scheduler for random effects. It picks a random time `gap = lerp(20 s, 8 s, intensity)` (on Day 3 the lower bound is 4 s) [R6.5, R6.7]. At the time it picks an effect from a weighted list, with a screams-and-knocks share that grows with intensity. It then checks that no key is down and no letter is being played; if a key is down it tries again in 500 ms. The gap between any two effects is never below the minimum (8 s, 4 s on Day 3) [R6.5].
- Static burst and flicker on every mistake [R6.4].
- Which messages are strange comes from the day builder, not from here.

Day Shift: the director is never started [R7.1].

## 11. Options and settings [R10]

The Options button (upper right) and Esc open the same panel as a modal dialog (`role="dialog"`, focus trapped, Esc closes). Content: music and effects sliders, mute, "Reduce flashing", "Captions", "Show lives as a number", "Start with tutorial" (Ask on start / Never), and "End game" during a run. While open, game time pauses: the letter-gap timer, the 15 s timer, the director and the music tension stop; audio is not stopped except effects in progress.

## 12. Tutorial [R2]

A list of 5 sheets as data: `{ id, text, check(state) }`. The `check` function looks at the events the player produced. For example, sheet 1 passes on one dot, sheet 2 on one dash, sheet 3 on a full letter (pattern then a 700 ms gap), sheet 4 on any key press after the galvanometer pulses, sheet 5 on typing one letter heard. A failed check keeps the sheet. No lives are lost in the tutorial: `loseLife` is switched off in that state [R2.4]. "Put the sheets away" ends it at any time. The tutorial never starts the horror director [R2.6].

## 13. Kiroween Judge mode [R13]

- **Entry:** the "Kiroween Judge" button, or `?judge=1` on load. The query string is read once at boot.
- **Safe by design:** Judge mode sets `ctx.judge = true`. Storage writes are switched off [R13.5], and the tutorial is skipped.
- **Cheats are events:** the panel only calls `dispatch` with normal events plus a few extra ones (`JUDGE_JUMP_DAY`, `JUDGE_AUTOSOLVE`, `JUDGE_SET_LIVES`, `JUDGE_INFINITE`, `JUDGE_FORCE_GAMEOVER`, `JUDGE_SHOW_STATS`). The rule modules handle them. Normal play never emits them [R13.8].
- **Auto-solve and auto-play:** they call the same sequencer used by the player, so sounds and animation are real. Auto-play types or sends the expected letter for the current message with human-like timing, scaled by the speed switch (x1, x2, x4) [R13.4e, R13.4f].
- **Demo reel:** a list of timed steps (an array of `{ at: ms, run: fn }`) that runs on its own timer and is stopped by Esc or any step error [R13.4d]:

  | Time | Step |
  |---|---|
  | 0 s | Day Shift, Day 1, auto-send a short message |
  | 8 s | switch to Night Shift without restart |
  | 11 s | thunder, then a crow |
  | 16 s | a strange message and a thought |
  | 22 s | one mistake: needle swings, static |
  | 27 s | stats screen with rank |

- **Scare dial, effect buttons, Show a thought, Captions on:** set the director's override, call the voices, call `thoughts.showNext()`, or set the setting in memory only [R13.4b, c, g, h].
- **Welcome card** on `?judge=1`, and "Click anywhere to enable sound" until the first click [R13.6, R13.7].
- **Dead Air** is unlocked in Judge mode without saving [R16.9].

## 14. Accessibility and phones [R10, R15]

- **Keyboard only:** every control is a real `button` or `input`, reachable with Tab; Esc opens Options; dialogs trap focus [R10.1].
- **Screen readers:** the galvanometer has `role="img"` and an `aria-label` such as "3 of 10 lives", updated on every change and drawn nowhere visible [R5.7]. The message row has `aria-live="polite"`. Thoughts use `role="status"`.
- **Show lives as a number:** an extra text element beside the dial, hidden by default [R5.8].
- **Contrast:** colors are CSS variables; a test script computes the contrast of each text pair and fails the build under 4.5:1 [R10.4].
- **Phone** (optional) [R15]: `<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">`, `touch-action: none` on the Morse key and typewriter keys, `user-select: none`, `contextmenu` prevented on them. The typewriter keyboard is a 3 row grid (10, 9, 7 keys) with `min-width: 32px; min-height: 44px`. It shows only when `matchMedia("(pointer: coarse)")` is true and a letter is awaited. Layout uses CSS grid with `clamp()` and a container that keeps the 16:9 desk; at 360 px wide the chart collapses to a slide-in drawer, because the left column does not fit [R15.3].

## 15. Errors and edge cases

| Case | Behavior |
|---|---|
| Tab loses focus during a press | press is cancelled, no symbol is added |
| Audio blocked or unsupported | game runs silent; captions on by default; one small notice |
| localStorage blocked | defaults in memory, no crash |
| Two keys at once (Space and a letter) | Space is ignored while the game waits for a typed letter, and letters are ignored while it waits for Morse |
| Window resized or rotated | SVG scales; no state change |
| Page reload | run is dropped; settings and best stats stay [R5.6b] |
| `AudioContext` suspended (iOS) | resumed on the next touch |

## 16. Testing

**Unit tests** (`node --test`, no packages):

- `morse.test.js`: all 26 letters decode; dot and dash edge at 299 ms and 300 ms; gap at 699 ms and 700 ms; patterns longer than 4 are wrong.
- `messages.test.js`: for 1000 seeds, every built day meets R9.2, R6.3 and R6.7 rules in both modes and in Dead Air.
- `lives.test.js`: loss, 3 clean messages refill, caps at 10 and at 5, game over at 0.
- `stats.test.js`: wpm and every rank boundary; the final rank is the lower of the two.
- `game.test.js`: day flow; checkpoint restores the day; Dead Air has no restart; unlock after Night Shift Day 3; Judge mode writes nothing to storage.
- `a11y.test.js`: contrast of all palette pairs.
- Example tests stay for the exact edge values (299 ms, 300 ms, 699 ms, 700 ms). Property tests cover everything in between.

**Property-based tests** (`test/props/*.test.js`) use the `fast-check` package. It is a dev dependency used only by tests; it is never put into `dist/index.html`, so R11.2 still holds. Each test runs 200 random cases by default and prints the seed when it fails, so a failure can be replayed. The properties:

| Property (for any random input) | Covers |
|---|---|
| Encoding a letter to Morse and decoding it gives the same letter, for all A to Z | R3.4 |
| A random list of press lengths and gaps never makes the decoder throw, and a pattern longer than 4 symbols is always wrong | R3 |
| A press under 300 ms is always a dot and 300 ms or more is always a dash, whatever the other presses were | R3.3 |
| Any number of `keydown` repeat events between one `keydown` and `keyup` gives exactly one symbol | R3.8 |
| For any seed, mode, day, and Dead Air on or off, `buildDay` returns 5 messages that obey every length, strange-count, and send/receive rule, and is not sorted by length | R9.2, R6.3, R6.7 |
| Day Shift days never contain a strange message | R7.1 |
| `buildDay` with the same seed gives the same result | tests and Judge |
| For any random list of right and wrong messages, lives are never below 0 or above the max (10, or 5 in Dead Air), and refill happens exactly after each run of 3 clean messages | R5.4 |
| `dead` is true exactly when lives reach 0 | R5.5 |
| For any random run, the checkpoint restore gives full lives, zero stats for that day, and leaves earlier days unchanged | R5.6a |
| Accuracy is always from 0 to 100, speed is never negative or NaN, and the final rank is never above either of the two ranks | R8.2 |
| Rank is monotonic: more accuracy or more speed never gives a lower rank | R8.2 |
| For any random event sequence, the game state machine only moves along the allowed screen arrows and never reaches an undefined screen | section 4 |
| For any random event sequence in Judge mode, nothing is written to storage | R13.5 |
| For any random effect times from the director, no two effects are closer than 8 s (4 s on Day 3), and none fires while a key is down | R6.5 |
| For any random text, the thought picker returns at most 2 thoughts per day, each at most 20 words, and a reaction only when its trigger fits | R12.2, R12.4a |
| For any random typed letters in receiving, a right letter advances by exactly one, and a wrong letter removes exactly one life and does not advance | R4.3, R4.4 |

Two ways to keep these tests useful: the random generators are small and written once in `test/props/arbitraries.js` (press lists, event lists, seeds, mode and day), and each property is named after its requirement so a failure points straight to it.

**Manual checklist** (`docs/test-checklist.md`), each item tied to a requirement number: sound on all three browsers, phone tests on two screen sizes [R15.6], full play through of both modes and Dead Air, Judge mode demo reel, "Reduce flashing", captions.

**Smoke test with the Judge mode:** because `?judge=1` can jump to any day and auto-solve, one short script (Playwright, optional) loads the page, plays the demo reel and checks that the stats screen appears.

## 17. Build, publish, repository [R14]

- `node build.mjs` writes `dist/index.html` (inline CSS and JS, no network calls). The test script fails if the output contains `http://` or `https://` links to other sites [R11.2].
- Publish `dist/` to a static host (GitHub Pages) [R14.1].
- The repository is public with an open-source license and a README. `.kiro/` is committed and not in `.gitignore` [R14.2, R14.3].
- `docs/video-script.md` follows the existing `.kiro/video-script.md` [R14.4].

## 18. Order of work and cuts

Follows `.kiro/steering/schedule.md`: audio engine and logic skeleton first, then Morse, sending, lives, tutorial, receiving, days, then Night Shift effects, Day Shift, stats, accessibility, tests.

If late, cut in this order:

1. Horror one-shot sounds (crow, scream, knocking, thunder) [R6.1]. The drone, rain and static stay.
2. Day Shift music (the mode then plays with only the sounder and key sounds) [R7.3].
3. Phone support [R15].
4. Dead Air [R16] (it only turns off the chart, cuts lives to 5 and removes the restart).

Never cut: Morse sending, receiving, lives, Judge mode (R13), and the story thoughts (R12).

## 19. Requirement coverage

| Req | Where in this design |
|---|---|
| R1 | 4 Screens, 6 Saved data, 9 Engine (audio unlock) |
| R2 | 4, 12 Tutorial |
| R3 | 5 Morse engine, 8 Visuals |
| R4 | 5 Receiving, 9 Voices (sounder) |
| R5 | 4 (checkpoint), 7 Lives, 8 Galvanometer |
| R6 | 9 Audio, 10 Horror director |
| R7 | 8 Palette, 9 Day music, 10 |
| R8 | 7 Stats and rank |
| R9 | 6 Messages and day builder |
| R10 | 11 Options, 14 Accessibility |
| R11 | 1 Overview, 17 Build |
| R12 | 6 Thoughts |
| R13 | 13 Judge mode |
| R14 | 17 Build and repository |
| R15 | 5 Touch, 14 Phones |
| R16 | 4, 6, 7, 10 (Dead Air notes) |
