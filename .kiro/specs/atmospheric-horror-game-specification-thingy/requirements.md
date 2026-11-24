# Requirements: Dead Air -- 1873 (Telegraph Operator Game)

## Introduction

A single-page browser game. The player is a Victorian telegraph operator. They tap the space bar to send Morse code, and later decode Morse they receive. The game has two modes: Night Shift (default) and Day Shift. It also has a Kiroween Judge mode (R13) for quick demos. All visuals are SVG/CSS and all audio is synthesized with the Web Audio API. There are no external assets.

## Glossary

- **Dot / Dash**: A space bar press shorter than 300 ms is a dot. A press of 300 ms or longer is a dash.
- **Letter gap**: Silence of 700 ms or more after a press ends the current letter.
- **Spaces**: Spaces between words are never sent or played. The player sends and hears only letters. The system skips spaces on its own when it shows the target text.
- **HUD** (heads-up display): The information that stays on screen during play: the galvanometer for lives, the mode label, the Morse chart on the left side, and the Options button.
- **Life**: One unit of the player's health. In the regular modes the player starts each day with 10 lives (maximum 10). In Dead Air (R16) the player has 5 lives (maximum 5).
- **Night Shift / Day Shift**: The two game modes. Night Shift has scares and strange messages. Day Shift is calm, with no scares.
- **Horror effects**: Scary sounds, strange message text, flicker, and screen distortion.

## Requirements

### R1. Start screen and mode choice
**User story:** As a player, I want to pick Night Shift or Day Shift mode before I play, so the game fits my mood.

Acceptance criteria:
1. WHEN the game loads THEN the system SHALL show a start screen with "Night Shift" and "Day Shift" buttons, each with a short line under it ("scares and strange messages" and "calm, no scares"). The system SHALL also show a small Options button in the upper right corner. The Options button SHALL stay in the upper right corner on every screen, including during play, and opens the one Options menu.
2. WHEN the player picks a mode THEN the system SHALL remember it for the rest of the session and show it on the HUD.
3. WHEN the start screen is shown THEN the system SHALL NOT play any sound until the player clicks a button (browser audio rules).
4. The system SHALL offer an "End game" button in the Options menu. WHEN the player clicks it THEN the system SHALL ask "End your game? Your current run will be lost." and, on confirm, stop all sound, discard the current run, and return to the start screen, where the player can choose Night Shift or Day Shift again.
5. Night Shift and Day Shift SHALL be separate games: each mode keeps its own best stats. Every new game in either mode SHALL start at Day 1.
6. The system SHALL change mode only from the start screen. It SHALL NOT offer mode switching during a run, and "End game" SHALL be the only way to leave a run early.

### R2. Tutorial
**User story:** As a new player, I want a short guided lesson, so I can learn Morse and the controls.

Acceptance criteria:
1. The system SHALL keep a "Start with tutorial" setting in localStorage with two values: "Ask on start" and "Never". The default is "Ask on start".
1a. WHEN the player picks a mode and the setting is "Ask on start" THEN the system SHALL show a dialog "Start with the tutorial?" with three buttons: "Start tutorial", "Not now", and "Never". The dialog SHALL appear on the first game, and on every later game until the player picks "Never" or finishes or skips the tutorial.
1b. WHEN the player picks "Start tutorial" THEN the system SHALL run the tutorial, then go to Day 1. WHEN the player picks "Not now" THEN the system SHALL go straight to Day 1 and keep the setting at "Ask on start". WHEN the player picks "Never" THEN the system SHALL go straight to Day 1 and set the setting to "Never".
1c. WHEN the setting is "Never" THEN the system SHALL go straight to Day 1 with no dialog.
1d. WHEN the tutorial is finished or skipped THEN the system SHALL set the setting to "Never", so the dialog does not appear again. The player can change it back to "Ask on start" in the Options menu.
1e. The dialog SHALL be keyboard-reachable (Tab and Enter), SHALL play no sound, and SHALL show no horror effects.
2. The tutorial SHALL be part of the story. The new operator finds a stack of handwritten instruction sheets on the desk and reads them one by one. Each sheet is one step, and the sheets SHALL teach, in order: (a) tap Space for a dot, (b) hold Space for a dash, (c) pause for a letter gap, (d) the lives display (the galvanometer), (e) how receiving works.
3. WHILE a sheet is active THEN the system SHALL show it on the desk as paper with the step text, with the Morse chart (see R3.1a) beside it, and a live indicator of the current press length. The operator MAY add a short thought about the sheet (see R12).
4. WHEN the player completes a step correctly THEN the system SHALL put that sheet aside and show the next sheet. WHEN they fail it THEN the system SHALL keep the same sheet and let the player try again without removing a life.
5. WHILE the tutorial runs THEN the system SHALL show a visible "Skip tutorial" button (worded in the story, for example "Put the sheets away").
6. The tutorial SHALL work the same in Night Shift and Day Shift mode, with no horror effects in the tutorial.

### R3. Sending Morse (Day 1 and send messages on Day 3)
**User story:** As an operator, I want to send messages by tapping Space, so I can do my job.

Acceptance criteria:
1. WHEN a message is given THEN the system SHALL show the target text and highlight the letter to send next. The system SHALL NOT show the Morse pattern of the letter beneath the text.
1a. The system SHALL show a Morse chart (A to Z with the dots and dashes of each letter) on the left side of the screen at all times during play, in Night Shift and Day Shift. It is the player's only help for finding a pattern. Dead Air (R16) SHALL NOT show it.
2. WHEN the player holds Space THEN the system SHALL play a telegraph tone for as long as the key is down and animate the telegraph key SVG.
3. WHEN a press ends THEN the system SHALL classify it as dot or dash using the 300 ms threshold.
4. WHEN a letter gap passes THEN the system SHALL decode the entered pattern and compare it to the expected letter.
5. WHEN the letter is right THEN the system SHALL mark it as sent and move to the next letter.
6. WHEN the letter is wrong THEN the system SHALL remove one life, show the mistake, and let the player retry the same letter.
7. WHEN the last letter of a message is sent THEN the system SHALL show "Message sent" and offer the next message.
8. The system SHALL ignore key repeat events while Space is held.

### R4. Receiving Morse (Day 2 and receive messages on Day 3)
**User story:** As an operator, I want to decode incoming beeps one letter at a time and type them, so I can read messages from the other station.

Acceptance criteria:
1. WHEN a received message starts THEN the system SHALL play its letters as tones (dot 120 ms, dash 360 ms, 120 ms between symbols, 360 ms between letters when the next letter follows at once; spaces between words are skipped). The system SHALL also show a telegraph sounder (a small clicker with a moving arm) on the desk. The arm SHALL drop when each tone starts and lift when it ends, in sync with the tones, and SHALL make a short "click" on the way down and a "clack" on the way up.
2. The system SHALL play a received message one letter at a time. WHEN a letter has been played THEN the system SHALL wait for the player to type that letter with the keyboard (or the on-screen keyboard, R15). The system SHALL show the message as a row of blanks, one per letter, and fill in each letter the player gets right.
3. WHEN the player types the right letter THEN the system SHALL fill it in and, after a short pause, play the next letter. Typing is not case-sensitive. The system SHALL need no Enter key.
4. WHEN the player types a wrong letter THEN the system SHALL remove one life, show the mistake, and play the same letter again so the player can retry it.
5. The system SHALL offer a "Replay" button that plays the current letter again, limited to 3 replays per message in Night Shift mode and unlimited in Day Shift mode. A replay after a mistake (R4.4) SHALL NOT count.
5a. WHILE the player has not typed the letter, the system SHALL NOT play the next one. WHEN 15 seconds pass without input THEN the system SHALL replay the current letter once, without removing a life.
5b. WHEN the last letter is typed correctly THEN the system SHALL show "Message received" and offer the next message.
6. WHEN Day 2 starts THEN the system SHALL show a short intro explaining that the player now receives.

### R5. Lives
**User story:** As a player, I want to see how many chances I have left and earn them back.

Acceptance criteria:
1. The system SHALL start each day with 10 lives and show them on the HUD at all times as one galvanometer in SVG: a round dial with a needle, and 10 marked steps. The needle at the top step means 10 lives, and at the bottom step means 1 life. In Dead Air the dial SHALL have 5 marked steps. The dial's lower end is a red zone. A needle that falls out of the last step means 0 lives.
2. WHEN a life is lost THEN the system SHALL swing the needle down by one step with a short animation and a soft "tick" sound. The needle SHALL tremble more as it gets closer to the red zone.
3. WHEN a life is refilled THEN the system SHALL swing the needle up by one step with a short animation.
4. WHEN the player finishes 3 messages in a row with no mistakes THEN the system SHALL refill one life, up to the maximum of the mode (10, or 5 in Dead Air).
5. WHEN lives reach 0 in Night Shift mode THEN the system SHALL show a game-over screen with two buttons: "Restart this day" and "Main menu".
6. WHEN lives reach 0 in Day Shift mode THEN the system SHALL show the same game-over screen, calm and with no horror effects.
6a. Each day start is a checkpoint. WHEN the player picks "Restart this day" THEN the system SHALL start the same day again from its first message with 10 lives and that day's statistics reset. Earlier days and their statistics SHALL stay as they were. WHEN the player picks "Main menu" THEN the system SHALL return to the start screen.
6b. The checkpoint SHALL last only while the page stays open. Reloading the page SHALL discard the run (see Out of scope).
7. The galvanometer SHALL carry a hidden text label (for example "3 of 10 lives") that only screen readers read. It SHALL NOT be visible on screen.
8. The Options menu SHALL have a "Show lives as a number" setting, off by default. WHEN it is on THEN the system SHALL show the number (for example "3 / 10") next to the galvanometer.

### R6. Night Shift atmosphere (Night Shift mode only)
**User story:** As a player, I want to feel uneasy, so the game feels like a horror story.

Acceptance criteria:
1. WHILE in Night Shift mode THEN the system SHALL play looping rain and a low drone, plus random one-shot sounds: thunder, a crow, distant screaming, and knocking.
2. WHILE in Night Shift mode THEN the system SHALL play synthesized background music with ghostly "hoo" tones. Its tension SHALL rise as lives fall.
3. WHILE in Night Shift mode THEN some messages SHALL contain strange text (for example "IT IS IN THE WIRES", "DO NOT ANSWER") mixed with normal work messages. Day 1 SHALL have normal messages only, except the last (5th) message, which SHALL be strange. Day 2 SHALL have at least 2 strange messages out of 5.
4. WHEN a mistake happens THEN the system SHALL trigger a short static burst and screen flicker.
5. The system SHALL fire a random effect no more often than once every 8 seconds, and never while the player is holding Space.
6. The system SHALL provide a "Reduce flashing" setting that replaces flicker with a gentle fade.
7. Night Shift SHALL build over the days. Day 1 and Day 2 use the effects above at a lower rate, and Day 1 starts calm. WHEN Day 3 runs in Night Shift mode THEN the system SHALL use the full set of effects: every effect type enabled, the random-effect gap shortened to 4 seconds, at least 3 of 5 messages strange, and the screen distortion and music tension starting high.
8. The system SHALL provide separate volume sliders for music and effects, and a mute button.

### R7. Day Shift mode
**User story:** As a player, I want a calm version, so I can just practise typing Morse.

Acceptance criteria:
1. WHILE in Day Shift mode THEN the system SHALL NOT play horror sounds, strange messages, flicker, or static.
2. WHILE in Day Shift mode THEN the system SHALL use only normal work messages and a warm colour palette.
3. WHILE in Day Shift mode THEN the system SHALL play soft, cheerful synthesized background music with birdsong, and a mute button. Night Shift and Day Shift SHALL have different music.
4. WHEN a day ends in Day Shift mode THEN the system SHALL show a statistics screen (see R8).
5. Lives SHALL work exactly as in Night Shift mode (R5): mistakes cost lives, clean streaks refill them, and 0 lives ends the game.

### R8. Statistics
**User story:** As a player, I want to see how well I did.

Acceptance criteria:
1. WHEN a day ends (both modes) THEN the system SHALL show: messages completed, letters correct, mistakes, accuracy %, average speed in words per minute, lives left, and longest streak without a mistake.
2. The system SHALL give a rank of "Apprentice", "Operator", or "Master" based on both accuracy and speed. The system SHALL work out an accuracy rank (below 70% Apprentice, 70% to 94% Operator, 95% or more Master) and a speed rank (below 3 words per minute Apprentice, 3 to 5.9 Operator, 6 or more Master), and the final rank SHALL be the lower of the two.
3. WHEN the player clicks "Next day" THEN the system SHALL start the next day; after Day 3 it SHALL show a closing screen.
4. The system SHALL save the best stats per mode in localStorage.

### R9. Days and progression
Acceptance criteria:
1. The game SHALL have 3 days: Day 1 is sending only, Day 2 is receiving only, Day 3 mixes sending and receiving.
2. Each day SHALL have 5 messages in a mixed order of length: short and long messages SHALL NOT be sorted, so the player may get a long message first, then a short one, then a longer one. Each day SHALL include at least one short message (up to 10 letters) and at least one long message (20 letters or more). On Day 3 the messages SHALL be a random mix of "send" and "receive", with at least 2 of each.
3. WHEN a day ends without game over THEN the system SHALL start the next day after the player clicks "Next day".
4. The system SHALL always start a new game at Day 1 and SHALL NOT offer a day picker in normal play. After game over, the player can only restart the current day (R5.6a) or go to the main menu.
5. WHEN Day 3 starts THEN the system SHALL show a short intro explaining that the player now both sends and receives.
6. Lives SHALL reset to 5 at the start of each day.

### R10. Accessibility and controls
Acceptance criteria:
1. The system SHALL support keyboard play only. Esc SHALL open and close the Options menu.
1a. The Options menu SHALL contain: music and effects volume sliders, mute, "Reduce flashing", "Captions", "Show lives as a number", a "Start with tutorial" setting ("Ask on start" or "Never"; used the next time a game starts), and "End game" (only during a run).
3. The system SHALL give text alternatives for sound events (for example captions such as "[thunder]") when "Captions" is turned on.
4. All text SHALL have a contrast ratio of at least 4.5:1.

### R11. Technical constraints
1. The game SHALL be one self-contained page using vanilla JS, SVG, and the Web Audio API.
2. The game SHALL NOT load external audio, images, fonts, or scripts.
3. The game SHALL run in current Chrome, Firefox, Safari and Edge.

### R12. Learning about telegraphs, inside the story
**User story:** As a young player who has never seen a telegraph, I want to learn how it worked while I play, so I understand this old technology without leaving the game.

Acceptance criteria:
1. The system SHALL teach telegraph facts only through the game world, never in a separate pop-up or museum-style screen. The main way is the player character, a new operator, thinking aloud: short first-person lines shown as thought text at the bottom of the desk scene, for example "Each word costs money... that is why everyone writes so short." The system MAY also use a note beside the desk or a line from the other operator, but the character's thoughts SHALL be the main source.
1a. The character's thoughts SHALL sound curious and new to the job (wondering, guessing, sometimes wrong and then corrected). They SHALL NOT sound like a lecture.
2. Each day SHALL show at most 2 thoughts, each at most 20 words, and each SHALL appear when a message appears or between messages, and never while the player is pressing Space or typing.
3. A thought SHALL never block input. The player SHALL be able to ignore it, and it SHALL fade out by itself after 8 seconds.
4. The system SHALL include at least 6 facts, for example: telegrams were paid per word so people wrote short; "STOP" marked the end of a sentence; operators could recognise each other by their tapping style; messages travelled along a wire as on/off current.
4a. The character SHALL also react to the message in front of him. For example, WHEN a message is very long THEN he may think "Phew, that must be a rich guy!". WHEN a message is cryptic, with many abbreviations, THEN he may think "I understand that you want to spare some money, but this message makes no sense anymore." At least 4 such reactions SHALL exist, and each SHALL show only when the message fits it.
5. Work messages in Day 1 and Day 2 SHALL read like real 1870s telegrams (short, no small words, "STOP" used for full stops).
6. In Night Shift mode some thoughts SHALL turn uneasy (for example, "The wire only carries on and off... so who is answering?"). The real fact SHALL still be readable.

### R13. Kiroween Judge mode
**User story:** As a Kiroween judge with only a few seconds, I want to jump around the game and see its best moments right away, so I can judge it without playing it through.

Acceptance criteria:
1. The start screen SHALL show a "Kiroween Judge" button. The system SHALL also open Judge mode when the page URL contains `?judge=1`.
2. WHEN Judge mode is on THEN the system SHALL show a small, always-visible "Judge panel" that can be collapsed, and a "JUDGE" badge on the HUD. The panel SHALL work with the mouse and with these keys: J (open/close panel), N (next day), M (next message), C (complete the current letter or message correctly).
3. The Judge panel SHALL provide these cheats:
   a. **Jump to day**: buttons for Day 1, Day 2, Day 3, and the closing screen. All days are reachable at once.
   b. **Auto-solve**: "Type it correctly" completes the current letter, or the whole message, as if the player had done it perfectly. It SHALL play the sent or received tones, so the audio still shows.
   c. **Skip message**: go straight to the next message.
   d. **Lives**: buttons for "+1 life", "Full galvanometer", "-1 life", and an "Infinite lives" switch. WHEN lives are infinite THEN the system SHALL never show game over.
   e. **Force game over**: shows the game-over screen at once.
   f. **Show stats**: opens the statistics screen with sample numbers.
4. The Judge panel SHALL also provide "show-off" tools so the game looks good in seconds:
   a. **Mode switch without restart**: Night Shift and Day Shift toggle that keeps the current day. This replaces R1.6 for Judge mode only.
   b. **Scare dial**: a slider from 0 to 100% that sets the horror intensity, up to the Day 3 full level.
   c. **Trigger effect**: one button per horror effect (thunder, crow, scream, knocking, static burst, flicker, strange message). Each fires at once and ignores the R6.5 time limit.
   d. **Demo reel**: a "Play demo" button that runs a 30-second scripted tour on its own: auto-sending a message in Day Shift mode, switching to Night Shift, firing thunder, a crow and a strange message, losing a life with static, and ending on the statistics screen. The player can stop it with Esc.
   e. **Auto-play**: a switch that makes the game send and receive messages by itself at normal speed, so a judge can watch without touching the keyboard.
   f. **Speed**: x1 / x2 / x4 for the demo and auto-play.
   g. **Captions on**: a button that turns on sound captions (R10.3) so a muted judge still sees "[thunder]", "[crow]".
   h. **Show a thought**: a button that shows the next character thought (R12) at once, in any mode and day.
5. WHILE Judge mode is on THEN the system SHALL NOT save progress, best stats, or the "Start with tutorial" setting to localStorage, and SHALL skip the tutorial.
6. WHEN a judge opens the page with `?judge=1` THEN the system SHALL show a one-screen welcome card that lists the shortcut keys and has a "Start demo" button and an "Explore" button. The card SHALL need no more than one click to reach any day.
7. The system SHALL work with sound off, since browsers block sound until a click. WHILE no click has happened yet THEN the Judge panel SHALL show "Click anywhere to enable sound".
8. Judge mode SHALL be a separate switch from Night Shift and Day Shift and SHALL NOT change the rules of normal play. The system SHALL leave Judge mode through an "Exit Kiroween Judge" button that returns to the start screen.

### R14. Submission and presentation
Acceptance criteria:
1. The game SHALL be published at a public link that opens with one click and needs no login or install.
2. The repository SHALL be public, have an open-source license, and have a README that states the problem, the audience, how to play, and how to open Judge mode.
3. The `.kiro` folder (specs, steering, hooks) SHALL be committed and not ignored.
4. The project SHALL include a script for a 3-minute video that covers: the problem, who it is for, a live demo (using the demo reel from R13.4d), and why it matters.

### R15. Phone support (optional)
**User story:** As a player on a phone, I want to play the whole game by touch, so I can try it without a computer.

This requirement is optional. If the schedule slips, it is cut after the horror one-shot sounds and the Day Shift music (see the project schedule).

Acceptance criteria:
1. WHEN the game runs on a touch device THEN the system SHALL show a touch-friendly on-screen Morse key for sending. A short touch SHALL be a dot and a touch of 300 ms or longer SHALL be a dash, the same as the space bar.
2. The system SHALL provide its own on-screen typewriter-style keyboard with the letters A to Z only (no space, delete, or send keys), shown when the player has to type a received message (Day 2 and Day 3). It SHALL NOT use the phone's own keyboard. Its keys SHALL be at least 32 px wide and 44 px tall, so ten keys fit in a row on a 360 px wide phone.
3. The layout SHALL fit screens from 360 px wide, in portrait and landscape, without hiding the galvanometer, the message, or the telegraph desk.
4. WHILE the player touches the Morse key or the keyboard THEN the system SHALL NOT zoom, scroll, select text, or open a context menu.
5. The system SHALL start sound after the first touch, since phones block sound until then.
6. The system SHALL be tested by hand on one iPhone-sized and one Android-sized screen (for example with the browser's device mode), covering Day 1, Day 2 and Day 3 in both modes.
7. The Options button and all dialogs SHALL be usable by touch, with targets at least 44 px tall.

### R16. Dead Air (hard mode)
**User story:** As a player who finished the game, I want a harder run with no safety net, so I can prove I know Morse.

Acceptance criteria:
1. "Dead Air" is the hard version of Night Shift only. There SHALL be no hard version of Day Shift, and finishing Day Shift SHALL NOT unlock Dead Air. It SHALL use the Night Shift atmosphere (R6) at full strength from Day 1, and the same 3 days and message types.
2. The start screen SHALL show a "Dead Air" button (with a short line "hard: 5 lives, no Morse chart, no second chance") next to "Night Shift" and "Day Shift". WHILE it is locked THEN the button SHALL be visible but disabled, with the line "Finish Night Shift to unlock".
3. WHEN the player finishes Day 3 in Night Shift THEN the system SHALL unlock Dead Air and save this in localStorage.
4. In Dead Air the player SHALL have 5 lives, shown on the galvanometer with 5 steps (R5.1). Lives SHALL refill with the same rule as R5.4, up to 5.
5. In Dead Air the system SHALL NOT show the Morse chart (R3.1a), neither during play nor in the tutorial.
6. WHEN lives reach 0 in Dead Air THEN the system SHALL show a game-over screen with only a "Main menu" button. There SHALL be no "Restart this day" and no checkpoint. Starting Dead Air again SHALL begin at Day 1.
7. Dead Air SHALL keep its own best stats, shown with a "Dead Air" label.
8. The system SHALL NOT offer the tutorial dialog (R2) when Dead Air starts.
9. WHEN Judge mode is on THEN Dead Air SHALL be unlocked, and Judge mode SHALL NOT save the unlock.

## Out of scope
- Online play or a real second player (the other operator is scripted).
- More than 3 days.
- Saving mid-day progress.
