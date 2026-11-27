# CLAUDE.md

**Night Shift** is a horror game for Kiroween 2026, played in the browser. You are a telegraph operator using Morse code, alone at a relay station (Station 7 of the Marsh & Western Telegraph Co.) on a marsh in 1903. It is one page with vanilla JS, SVG, CSS and synthesized Web Audio. It uses no libraries and loads nothing from other sites. The submission deadline is 01.12.2026 (see `GANTT.md` and `.kiro/steering/schedule.md`).

## Rule: keep the Kiro spec up to date

The spec in `.kiro/specs/atmospheric-horror-game-specification-thingy/` is the source of truth. Kiro reads it too, so keep it in step with the code **in the same change**:

- `requirements.md`: numbered requirements R1–R18, each with acceptance criteria (R3.3a etc.). Change it when behaviour the player sees changes.
- `design.md`: how things are built, in sections 1–20. Update the layout (section 2), screens (4), the data and settings shape (6), timings and numbers (5, 7), audio (9), directors (10) and tests (16) whenever the code moves away from them.
- `tasks.md`: tasks T1–T44. Each task has "Needs", "Done when" and the requirements it covers. When a new piece of work starts, add a task or edit one. Tick `[x]` when its "Done when" is true. Keep the coverage tables at the bottom of `design.md` and `tasks.md` correct.
- `.spec-state.json` records Kiro's approval decisions. Don't edit it by hand.

Write spec text the way it is already written: short, plain sentences, simple words, and requirement numbers in brackets (`[R9.7f]`, `[design 8]`). Code comments use the same tags, so add them to new code too. The operator is always "they".

Other Kiro files: `.kiro/steering/schedule.md` (always included, the schedule and what to cut first), `.kiro/TODO.md` (the submission checklist), `.kiro/video-script.md` and `.kiro/video-storyboard/`. Never add `.kiro/` to `.gitignore`.

### Open work (as of 27.11.2026)

- T27 (phone: touch Morse key, `input/pointer.js`), T44 (the order on Day 3, R18, `director/order.js`) and T45 (the date on the day card, R9.8) are not built yet. Design §2 marks the files that do not exist yet.
- Phase 6 (T28–T31: test run, polish, publish, video) is still open. The `README.md` is still a stub (T30).

## Commands

```sh
npm test              # node --test "test/**/*.test.js"  (unit + fast-check property tests, ~300 tests, ~1 s)
npm run build         # node build.mjs -> dist/index.html, dist/dev-audio.html, dist/dev-night.html
npm run shots         # build, then headless Chrome screenshots into shots/ (always muted)
ONLY=dawn node tools/shots.mjs   # only the shots whose name contains "dawn"; CHROME=... to override the binary
```

To work on it, serve the repo root with any static server and open `index.html`. It loads `src/main.js` as an ES module. The one dev dependency is `fast-check`.

Query strings that help with checks: `?judge=1` (Judge mode, saves nothing), `?test=1` (puts `window.__deadAir = { game, bus, audio, … }` on the page), `?story=N` (opens story slide N), `?dawn` (ten to six with the work done) and `?dread=0.9` (late-night dread right away).

## Build constraints (`build.mjs`)

The build is a tiny bundler of its own that puts **every module in one scope**:
- Only relative named imports work. `import * as` makes the build fail.
- Top-level names must be **unique across all modules**. The build fails on duplicates, which is why there are names like `OfficeGalvanometer` and `OfficeSound`.
- The `export` keywords are removed, and `export default` becomes `const __default`.
- The CSS `<link>`s are inlined, and the fonts become base64 data URIs.
- The build fails if the output holds any `http(s)://` link (except w3.org namespaces) [R11.2].

## Architecture

```
input (keyboard.js; touch is T27) --events--> core/game.js dispatch(event) --output events on bus-->
    office/*, ui/*, audio/*, director/*   (they listen only; they never change the rules)
```

- **`src/core/`**: pure rules with no DOM and no audio. Time (`clock`) and a seeded `rng` are passed in, so `node --test` covers everything here.
  - `game.js`: the state machine (screens, modes `night | day | deadair`, day flow, checkpoint, Judge cheats).
  - `hand.js`: learns the player's dot and dash lengths and gives the threshold, the letter gap and the wpm [R3.3]. `morse.js` holds the letter table and the decoder.
  - `send.js`, `receive.js`, `tutorial.js`, `lives.js`, `stats.js`, `settings.js` (localStorage key `nightshift.v1`).
  - `messages.js` + `message-pool.js`: the 1903 telegrams and `buildDay(day, mode, rng)`, which has many placement rules (design §6).
  - `day-clock.js`: the game clock from 22:00 to 06:00 (Day Shift runs 10:00–18:00), arrivals and speeds. `idle.js`: lives lost to idling and the late drain.
- **`src/main.js`** (~1100 lines): boots everything and wires game events to pictures and sounds. It also plays the game over sequence and the dawn.
- **`src/office/`**: the one SVG room, used for every mode. `room.js` (`mountOffice`, `fitRoom()` scales a 900 px design height, and below 1050 px it becomes one column), `drawings.js`, `scenery.js`, `forms.js` (the telegram form, spike, stamp, tape), `galvanometer.js` (lives), `light.js` (lamp, stutter, dark), `codebook.js`, `daylight.js` (Day Shift: the `.office.daylight` class and the bird).
- **`src/audio/`**: everything is synthesized. `engine.js` sends sfxBus and musicBus through a compressor to the master. `voices.js`, `office-sound.js`, `fault-sound.js` and `horror-voices.js` make the sounds. Music: `phonograph.js` plays the Night Shift waltz from `scores.js`, `piano.js` plays the story's nocturne and `music-day.js` plays the Day Shift waltz. Also `sequencer.js` (received letters) and `captions.js`.
- **`src/director/`**: atmosphere at night only (Day Shift starts none of it). `horror.js` (one-shots), `dread.js` (unease that grows through the night), `faults.js` (what a mistake does, by lives left; omens; last warning), `thoughts.js` + `thoughts-data.js`.
- **`src/story/`**: the magic-lantern intro. `intro.js` and six slides in `slides/`, plus `ambience.js` and `story-sound.js`.
- **`src/ui/`**: `screens.js` (start card, cards, notices), `options.js` (Options / "Line Held" pause), `effects-fx.js`. **`src/judge/judge.js`**: the Kiroween Judge panel [R13].
- **`src/css/`** and the inline `<style>` in `index.html`: colours are CSS variables per `data-mode` (night/day). Text contrast must stay ≥ 4.5:1 [R10.4].
- **`dev/`**: manual audio check pages (built to `dist/dev-*.html`). **`tools/shots.mjs`**: the screenshot list from design §16.

Modes: **Night Shift** (horror, 10 lives), **Day Shift** (calm, no directors), **Dead Air** (hard, 5 lives, no codebook, unlocked after Night Shift Day 3). There are 3 days in each. Day 1 is sending, Day 2 is receiving, Day 3 is mixed.

## Workflow conventions

- There is one branch per task, named `tNN-short-name` (or `spec-…` for spec-only changes). A PR goes to `main`.
- Commit messages start with the task or requirement id (`T43: …`, `R18.7: …`) and say what changed in plain words.
- Add tests in `test/` for rule changes, and property tests in `test/props/` (shared arbitraries in `arbitraries.js`). Run `npm test` and `npm run build` before you commit. Take screenshots before and after visual changes.
- If time runs short, cut in the order given in design §18 and the top of `tasks.md`. Never cut sending, receiving, lives, the hand, the clock, the office, game over, dawn, Judge mode or the thoughts.
