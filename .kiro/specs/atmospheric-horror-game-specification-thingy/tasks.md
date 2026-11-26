# Tasks: Night Shift -- 1903

Each task is small enough to become one GitHub issue and one pull request. Tick the box when its "Done when" line is true. Requirement numbers are in brackets, and section numbers point to `design.md`.

Order follows `.kiro/steering/schedule.md`. Tasks in the same phase can run side by side unless a "Needs" line says otherwise.

Cut order if late: T40 slides 1 to 5 (keep slide 6), the extra dread effects in T37, T22 (one-shot sounds), T23 (Day Shift music), T27 (phone), T26 (Dead Air). Never cut T1 to T21, T24, T25, T28 to T31, and T32 to T39, T41 and T42.

Phase 7 (T32 to T42) builds the 1903 office, story and endings from design sections 4 to 18. It runs before Phase 6, and T26, T27 and T29 build on it.

## Phase 1. Base (20.11 to 23.11)

- [ ] **T1. Project setup**
  Create `src/` folders from design section 2, `index.html`, `build.mjs`, `package.json` with `fast-check` as a dev dependency and a `test` script (`node --test`), `.gitignore` that does not ignore `.kiro/`, and a license file.
  Done when: `npm test` runs with one empty passing test; `node build.mjs` writes `dist/index.html`; the build fails if the output has a link to another site. [R11, R14.2, R14.3]

- [ ] **T2. Page skeleton and desk SVG**
  Needs: T1. Build `ui/scene.js` with the desk SVG: telegraph key, sounder, paper area, galvanometer slot, thought line, window. Add the event bus and `main.js`. Colors are CSS variables for Night Shift and Day Shift.
  Done when: the page shows the desk in both palettes (switch with a URL flag for now) and scales from 360 px to 1920 px wide. [R3.2, R7.2, design 8]

- [ ] **T3. Audio engine**
  Needs: T1. Build `audio/engine.js`: AudioContext on first click, music bus, effects bus, compressor, master mute, volume, voice budget of 8.
  Done when: a test page button plays a 600 Hz tone through the effects bus; mute and both sliders work; no sound before the first click. [R1.3, R6.8, design 9]

- [ ] **T4. Settings and saved data**
  Needs: T1. Build `core/settings.js` with `load`, `save`, defaults, version check, and a switch that turns saving off.
  Done when: unit tests pass for defaults, an unknown version being ignored, blocked storage not crashing, and saving off writing nothing. [R8.4, R13.5, design 6]

## Phase 2. Core rules (22.11 to 26.11)

- [ ] **T5. Morse table and decoder**
  Needs: T1. Build `core/morse.js`: letter table, `classifyPress` (300 ms), `decode`, pattern longer than 4 is wrong.
  Done when: example tests for all 26 letters and edges 299 / 300 ms and 699 / 700 ms pass; property tests for encode then decode, no throw on random input, and dot or dash by length pass. [R3.3, R3.4, design 5]

- [ ] **T6. Sending input**
  Needs: T2, T3, T5. Build `input/keyboard.js` and the send flow: Space down and up, repeat events ignored, tone while down, key lever animation, 700 ms gap timer, blur cancels the press, compare with the expected letter, right and wrong results.
  Done when: you can send a letter by hand; holding Space gives one symbol; the property test "many repeat events give one symbol" passes. [R3.1, R3.2, R3.5, R3.6, R3.8]

- [ ] **T7. Message data and day builder**
  Needs: T1. Write the message pool (at least 12 per day, 1870s telegram style, strange and abbreviation flags) and `buildDay` with the seeded `rng`.
  Done when: property tests pass for 1000 seeds: 5 messages, a short and a long one, not sorted by length, strange counts per day and mode, Day 3 has 2 send and 2 receive, Day Shift has no strange messages, same seed gives same result. [R6.3, R6.7, R7.2, R9.2, R12.5, design 6]

- [ ] **T8. Lives and galvanometer**
  Needs: T2, T3. Build `core/lives.js` and `ui/galvanometer.js`: 10 steps (5 in Dead Air), needle animation, tremble near the red zone, tick sound, hidden label, "Show lives as a number" text.
  Done when: property tests keep lives between 0 and the max, refill happens after each 3 clean messages, and `dead` is true only at 0; the needle moves one step per life; a screen reader reads "3 of 10 lives". [R5.1 to R5.5, R5.7, R5.8]

- [ ] **T9. Stats, rank and best stats**
  Needs: T4. Build `core/stats.js`: counters, active time, words per minute, accuracy rank, speed rank, final rank, best stats compare.
  Done when: boundary tests pass (69.9, 70, 94.9, 95 percent; 2.9, 3, 5.9, 6 wpm); property tests: accuracy 0 to 100, no NaN, rank never above either part, rank never drops when accuracy or speed rises. [R8.1, R8.2, R8.4]

- [ ] **T10. Game state machine and checkpoint**
  Needs: T7, T8, T9. Build `core/game.js`: screens and events from design section 4, day flow, game over, checkpoint in memory, "Restart this day", "Main menu", "End game".
  Done when: property test: random events never reach an undefined screen; restore gives full lives, zeroed stats for that day, earlier days unchanged; a reload drops the run. [R1.4 to R1.6, R5.5 to R5.6b, R9.3, R9.4]

## Phase 3. Screens and playing (23.11 to 28.11)

- [ ] **T11. Start screen, Options menu, settings UI**
  Needs: T4, T10. Build `ui/screens.js` start screen and `ui/options.js`: Night Shift and Day Shift buttons with their lines, Options button in the upper right, Esc, focus trap, volume sliders, mute, "Reduce flashing", "Captions", "Show lives as a number", "Start with tutorial", "End game". Game time pauses while open.
  Done when: all options work and are saved; Tab reaches every control; Esc opens and closes the menu. [R1.1 to R1.3, R10.1, R10.1a]

- [ ] **T12. Morse chart and text row**
  Needs: T2, T6. Build `ui/morse-chart.js` (left side, A to Z) and `ui/text-row.js` (highlighted next letter, no pattern beneath, blanks for receiving).
  Done when: the chart is always shown in Night Shift and Day Shift and never in Dead Air; the next letter is highlighted while sending. [R3.1, R3.1a, R4.2]

- [ ] **T13. Day flow screens**
  Needs: T10, T11. Day intro cards (Day 2 and Day 3), "Message sent" and "Message received", statistics screen with rank, game-over screen (two buttons, or one in Dead Air), closing screen.
  Done when: you can play Day 1 from start to the stats screen and click "Next day". [R4.6, R8.1 to R8.3, R9.5, R5.5]

- [ ] **T14. Receiving**
  Needs: T3, T10, T12. Build `audio/sequencer.js` (one letter on the audio clock), sounder arm with click and clack, letter-by-letter typing, wrong letter loses a life and replays, Replay button (3 in Night Shift, unlimited in Day Shift), 15 s auto replay.
  Done when: Day 2 plays through; property test: a right letter advances by one, a wrong letter removes exactly one life; the sounder arm moves with each tone. [R4.1 to R4.5b]

- [ ] **T15. Day 3 mixed flow**
  Needs: T6, T14. Mix send and receive messages in one day; switch input mode per message.
  Done when: Day 3 plays through with both kinds in the same day, with no stuck input. [R9.1, R9.2]

- [ ] **T16. Tutorial**
  Needs: T6, T11, T14. Build the dialog ("Start tutorial", "Not now", "Never"), the five instruction sheets, the checks, "Put the sheets away", setting changes, no lives lost, no horror.
  Done when: first start shows the dialog; finishing or skipping sets "Never"; "Not now" keeps asking; the dialog works by keyboard and has no sound. [R2.1 to R2.6]

## Phase 4. Atmosphere (20.11 to 30.11)

- [ ] **T17. Night Shift music and ambience**
  Needs: T3. Build `audio/music-night.js`: rain loop, drone, hoo tones, heartbeat with tension, creaks.
  Done when: Night Shift plays continuous sound; tension changes with a test slider. [R6.1, R6.2]

- [ ] **T18. Screen effects**
  Needs: T2. Build `ui/effects-fx.js`: vignette, static overlay, flicker; "Reduce flashing" fade instead. Not loaded in Day Shift.
  Done when: a mistake in Night Shift shows static and flicker; with "Reduce flashing" there is no change faster than 3 times a second; Day Shift loads none of it. [R6.4, R6.6, R7.1]

- [ ] **T19. Horror director**
  Needs: T3, T10, T17. Build `director/horror.js`: intensity from day and lives, random effect scheduler with the minimum gap, no effect while a key is down, Day 3 full set, Dead Air from Day 1.
  Done when: property test: no two effects closer than 8 s (4 s on Day 3), none while a key is down; the scheduler is never started in Day Shift. [R6.5, R6.7, R16.1]

- [ ] **T20. Strange messages**
  Needs: T7, T19. Write the strange messages; connect them to the director and the day builder.
  Done when: Day 1 shows a strange message only as the 5th message; Day 2 has at least 2; Day 3 has at least 3. [R6.3, R6.7]

- [ ] **T21. Character thoughts and facts**
  Needs: T2, T7. Build `director/thoughts.js`: at least 6 facts, at least 4 message reactions, at most 2 per day, at most 20 words, fade after 8 s, blocked while pressing or typing.
  Done when: property test on random text passes (count, length, trigger fits); a long message shows "Phew, that must be a rich guy!"; a cryptic message shows the savings reaction. [R12.1 to R12.4a]

- [ ] **T22. Horror one-shot sounds** (first cut)
  Needs: T3, T19. Build thunder, crow, scream, knocking, static voices and the captions.
  Done when: each sound plays from the Judge test button or a console call; caption text shows when "Captions" is on. [R6.1, R10.3]

- [ ] **T23. Day Shift music** (second cut)
  Needs: T3. Build `audio/music-day.js`: soft plucks, pad, birdsong chirps.
  Done when: Day Shift plays different music from Night Shift and mute works. [R7.3]

## Phase 5. Extras (27.11 to 30.11)

- [ ] **T24. Kiroween Judge mode**
  Needs: T10, T14, T19, T21. Build `judge/judge.js`: button, `?judge=1`, panel (mouse only, no shortcut keys), cheats, show-off tools, demo reel, auto-play, speed, welcome card, "Click anywhere to enable sound", exit button. No storage writes.
  Done when: a judge can reach any day in one click; the demo reel runs 30 seconds and ends on the stats screen; property test: Judge mode writes nothing to storage. [R13.1 to R13.8]

- [ ] **T25. Accessibility pass**
  Needs: T11, T13. Check keyboard-only play, live regions, hidden label, contrast script, captions on by default if audio is blocked.
  Done when: the contrast test passes at 4.5:1 for every pair; a full game is playable with the keyboard alone. [R10]

- [ ] **T26. Dead Air hard mode** (fourth cut)
  Needs: T10, T13, T19. Add the locked button, unlock on Night Shift Day 3, 5 lives with a 5 step dial, no chart, no restart, own best stats, no tutorial dialog.
  Done when: Dead Air is locked on a fresh browser and unlocks after Night Shift Day 3; at 0 lives only "Main menu" shows. [R16]

- [ ] **T27. Phone support** (third cut)
  Needs: T14, T15. Build `input/pointer.js`: touch Morse key, typewriter keyboard A to Z, layout from 360 px wide, chart drawer, touch rules, 44 px targets.
  Done when: Day 1 to Day 3 play through in device mode at an iPhone size and an Android size. [R15]

## Phase 7. The 1903 office (26.11 to 29.11)

- [ ] **T32. Fonts and the empty office**
  Needs: T2. Bundle `fonts/` into the build as base64 `@font-face`. Add `core/util.js`, `office/drawings.js`, `office/scenery.js`, `office/room.js` and the office CSS. Night Shift and Dead Air show the office (window, codebook spot, calendar, wall clock, galvanometer spot, lamp, key, desk); Day Shift keeps its desk through the shared desk interface. `fitRoom()` scales the 900 px room; below 1050 px it is one column.
  Done when: the build has no link to another site and fails on one; screenshots of the office at 1440, 1920 and 360 px look right; Day Shift looks as before. [R11.2, R11.4, R7.2a, design 3, 8]

- [ ] **T33. The learned hand**
  Needs: T6. Build `core/hand.js` and use it in sending, the tutorial and touch. Save the hand; add "Forget my hand"; show wpm and the hold meter with the threshold mark.
  Done when: unit and property tests for the hand pass; the 300 / 700 ms tests are replaced; a new player's threshold is 240 ms and letter gap 720 ms. [R3.3, R3.3a, R3.3b, R2.3, R2.7]

- [ ] **T34. Form, spike, tape, codebook and galvanometer in the office**
  Needs: T32, T33. Build `office/forms.js` (telegram form, spike, SENT/RECEIVED stamp, paper tape with pencilled letters and red strikes, Backspace tears it) and `office/galvanometer.js` (springy needle from lives, 10 or 5 steps, red zone, tock). The codebook card enlarges on click.
  Done when: Day 1 to Day 3 play through in the office in Night Shift; screenshots show a sent form and a mistake on the tape. [R3.1, R3.1a, R3.4a, R3.5 to R3.7, R4.2, R4.5b, R5.1 to R5.3]

- [ ] **T35. Game clock, arrivals, idling and the late drain**
  Needs: T10, T34. Build `core/day-clock.js` and `core/idle.js`: real-time clock from the first input, arrivals with the counter bell, the spike, 4x and 6x speeds, the day ends at 06:00, `TIME_UP` loses the day, a life per 6 s then 17 s idle, a life per 20 s past 04:00 and 10 s past 05:00. Wall clock hands and the window sky follow the clock.
  Done when: unit and property tests pass; a day left unfinished at 06:00 ends in a game over with "TELEGRAMS NOT SENT". [R9.7 to R9.7h, R9.8]

- [ ] **T36. Office sound and the phonograph waltz**
  Needs: T3, T32. Build `audio/office-sound.js`, `audio/phonograph.js` and `audio/scores.js` on the engine's buses. Remove `audio/music-night.js`. Add the "Music" switch.
  Done when: Night Shift plays the room tone, wind, wires and the waltz; mute, both sliders and "Music" work; captions exist for the new sounds. [R6.1, R6.2, R6.8, R10.3]

- [ ] **T37. Faults, omens, last warning and dread**
  Needs: T34, T35, T36. Build `office/light.js`, `director/faults.js` and `director/dread.js`. Day 2 dread starts at 70% of Day 1's points; Day 3 and Dead Air are full from 22:00. "Reduce flashing" softens every stutter.
  Done when: faults tests pass for 10 and 5 lives; each omen plays at most once a day; screenshots of the dimmed room, the dark corners and the last warning. [R6.4 to R6.7]

- [ ] **T38. Game over sequence, dawn and company notices**
  Needs: T37. Build `ui/endings.js`: the snap, the figure, the dark, "THE LINE IS DEAD" tapped in the player's hand (a key skips it), the dismissal telegram; the dawn with the bell and robin; the "SHIFT ENDED 06:00" and closing notices. Day Shift gets the calm versions.
  Done when: game over, time up, dawn and closing all show their notices with the right buttons in every mode; screenshots of each. [R5.5, R5.6, R8.1, R8.3, R9.9, R16.6]

- [ ] **T39. Start card and "Line Held"**
  Needs: T32, T11. Build the company card over the drifting empty office with the roster and the mode buttons. Move Options onto a company card; holding the game stops the clock, idling and all sound. Add "Always skip the story" and "Full screen".
  Done when: the start card shows from the first paint with no sound before a click; Esc during play holds and resumes the game. [R1.1, R1.1a, R1.3, R10.1a, R10.1b, R11.6]

- [ ] **T40. The story**
  Needs: T36, T39. Build `story/` (six slides, the letter, the lantern fades, Space and Esc), `audio/piano.js` with the nocturne, and `audio/story-sound.js`. Offer the story after a mode is picked; skip it in Dead Air, Judge mode and with "Always skip the story".
  Done when: the story runs about 60 to 90 seconds and leads into Day 1; screenshots of each slide. [R17]

- [ ] **T41. Messages and thoughts for 1903, and the name**
  Needs: T7, T21. Rewrite the pool for 1903 with threads and the Vane telegram as Day 1's last in Night Shift and Dead Air; give every message its To and From, written on the form (design 6); set the day dates and the calendar. Check every thought is true for 1903 and uses "they". Rename the game to "Night Shift" in the title, README, Judge card and storage key (`nightshift.v1`).
  Done when: message tests pass for 1000 seeds; every message has a To and a From; no "Dead Air -- 1873" or "1873" is left outside the hard mode's name. [R6.3a, R9.8, R12.4, R12.5, design 6, 17]

- [ ] **T42. Judge additions and screenshot script**
  Needs: T24, T38, T40. Add "Dawn" to Jump to day, "Play the story", one button per omen and the last warning; infinite lives covers idling and the late drain; the speed switch speeds the clock. Add `tools/shots.mjs` (always `--mute-audio`).
  Done when: every new Judge button works with sound off; `tools/shots.mjs` writes the full shot list from design 16. [R13.3a, R13.3g, R13.4c, R13.5]
- [ ] **T43. The office by daylight for Day Shift**
  Needs: T32, T34. Draw the office by day in the same drawings: the window shows the marsh in daylight with clouds drifting, sunlight falls through the panes as a patch on the desk with dust in the beam, no lamp flame. Now and then a bird flies past in front of the window. Day Shift then uses the office: the telegram form with its SENT/RECEIVED stamp, the paper tape and the codebook. Drop the old desk (`ui/scene.js`, `ui/galvanometer.js`, `ui/morse-chart.js`, `ui/text-row.js`) and the short "Message sent" card. Open: whether the story's slides get a day version.
  Done when: Day Shift plays Day 1 to Day 3 in the daylight office; the bird flies past at random, never while a letter is being keyed and not with reduced motion; screenshots at 1440, 1920 and 360 px. [R7.2, R7.2a, R11.4, design 8]

## Phase 6. Finish (29.11 to 01.12)

- [ ] **T28. Full test run and bug fixes**
  Needs: T1 to T27 (those not cut). Run all unit and property tests, then `docs/test-checklist.md` in Chrome, Firefox, Safari and Edge.
  Done when: all tests pass and every checklist item is ticked or has an issue. [R11.3, R15.6]

- [ ] **T29. Statistics and polish pass**
  Needs: T13. Check wording of every screen, game-over feel, galvanometer tremble, flicker strength, and Day 1 calm start.
  Done when: one full play in each mode feels right to the team. [R6.7, R8]

- [ ] **T30. Publish and repository**
  Needs: T28. Build `dist/index.html`, publish to a public link, write the README (problem, audience, how to play, how to open Judge mode), confirm the license and that `.kiro/` is committed.
  Done when: the public link opens with one click on a clean browser; the repository is public. [R14.1 to R14.3]

- [ ] **T31. Video script and recording**
  Needs: T24, T30. Update `.kiro/video-script.md` to 3 minutes: problem, who it is for, demo using the demo reel, why it matters. Record and upload.
  Done when: a video of 3 minutes or less shows the game working from start to finish. [R14.4]

## Requirement coverage

| Req | Tasks |
|---|---|
| R1 | T10, T11, T39 |
| R2 | T16, T33 |
| R3 | T5, T6, T12, T33, T34 |
| R4 | T13, T14, T34 |
| R5 | T8, T10, T13, T34, T38 |
| R6 | T17, T18, T19, T20, T22, T36, T37 |
| R7 | T2, T18, T23, T32 |
| R8 | T9, T13, T38 |
| R9 | T7, T10, T15, T35, T38, T41 |
| R10 | T11, T22, T25, T36, T39 |
| R11 | T1, T28, T32, T39 |
| R12 | T7, T20, T21, T41 |
| R13 | T24, T42 |
| R14 | T1, T30, T31 |
| R15 | T27 |
| R16 | T19, T26, T38 |
| R17 | T40 |
