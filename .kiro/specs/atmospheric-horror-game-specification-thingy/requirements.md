# Requirements: Dead Air -- 1873 (Telegraph Operator Game)

## Introduction

A single-page browser game. The player is a Victorian telegraph operator. They tap the space bar to send Morse code, and later decode Morse they receive. The game has two modes: Night Shift (default) and Day Shift. It also has a Kiroween Judge mode (R13) for quick demos. All visuals are SVG/CSS and all audio is synthesized with the Web Audio API. There are no external assets.

## Glossary

- **Dot / Dash**: A space bar press shorter than 300 ms is a dot. A press of 300 ms or longer is a dash.
- **Letter gap**: Silence of 700 ms or more after a press ends the current letter.
- **Spaces**: Spaces between words are never sent or played. The player sends and hears only letters. The system skips spaces on its own when it shows the target text.
- **HUD** (heads-up display): The information that stays on screen during play: the candle for lives, the mode label, the Morse chart button, and the Options button.
- **Life**: One unit of the player's health. The player starts each day with 5 lives (maximum 5).
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
1. The system SHALL keep a "Start with tutorial" setting in localStorage with three values: "Yes" (always start with the tutorial), "Ask on start", and "Never". The default is "Ask on start".
1a. WHEN the player picks a mode and the setting is "Ask on start" THEN the system SHALL show a dialog "Start with the tutorial?" with three buttons: "Yes", "Not now", and "Never". The dialog SHALL appear on the first game, and on every later game until the player picks "Never" or finishes or skips the tutorial.
1b. WHEN the player picks "Yes" THEN the system SHALL run the tutorial, then go to Day 1. WHEN the player picks "Not now" THEN the system SHALL go straight to Day 1 and keep the setting at "Ask on start". WHEN the player picks "Never" THEN the system SHALL go straight to Day 1 and set the setting to "Never".
1c. WHEN the setting is "Yes" THEN the system SHALL run the tutorial with no dialog. WHEN the setting is "Never" THEN the system SHALL go straight to Day 1 with no dialog.
1d. WHEN the tutorial is finished or skipped in a game started from the dialog THEN the system SHALL set the setting to "Never", so the dialog does not appear again. The player can change it back in the Options menu.
1e. The dialog SHALL be keyboard-reachable (Tab and Enter), SHALL play no sound, and SHALL show no horror effects.
2. The tutorial SHALL teach, in order: (a) tap Space for a dot, (b) hold Space for a dash, (c) pause for a letter gap, (d) the lives display, (e) how receiving works.
3. WHILE a tutorial step is active THEN the system SHALL show the step text, a Morse reference chart, and a live indicator of the current press length.
4. WHEN the player completes a step correctly THEN the system SHALL advance to the next step. WHEN they fail it THEN the system SHALL repeat the step without removing a life.
5. WHILE the tutorial runs THEN the system SHALL show a visible "Skip tutorial" button on every step. The system SHALL let the player reopen the Morse chart from the HUD at any time.
6. The tutorial SHALL work the same in Night Shift and Day Shift mode, with no horror effects in the tutorial.

### R3. Sending Morse (Day 1 and send messages on Day 3)
**User story:** As an operator, I want to send messages by tapping Space, so I can do my job.

Acceptance criteria:
1. WHEN a message is given THEN the system SHALL show the target text and highlight the letter to send next, with its Morse pattern shown beneath it.
2. WHEN the player holds Space THEN the system SHALL play a telegraph tone for as long as the key is down and animate the telegraph key SVG.
3. WHEN a press ends THEN the system SHALL classify it as dot or dash using the 300 ms threshold.
4. WHEN a letter gap passes THEN the system SHALL decode the entered pattern and compare it to the expected letter.
5. WHEN the letter is right THEN the system SHALL mark it as sent and move to the next letter.
6. WHEN the letter is wrong THEN the system SHALL remove one life, show the mistake, and let the player retry the same letter.
7. WHEN the last letter of a message is sent THEN the system SHALL show "Message sent" and offer the next message.
8. The system SHALL ignore key repeat events while Space is held.

### R4. Receiving Morse (Day 2 and receive messages on Day 3)
**User story:** As an operator, I want to decode incoming beeps and type them, so I can read messages from the other station.

Acceptance criteria:
1. WHEN a Day 2 message starts THEN the system SHALL play it as tones (dot 120 ms, dash 360 ms, 120 ms between symbols, 360 ms between letters; spaces between words add no extra pause) and flash a lamp in sync.
2. WHILE the message plays THEN the system SHALL show an input box for the player to type the text with the keyboard.
3. WHEN the player submits (Enter) THEN the system SHALL compare the answer to the message, ignoring case and all spaces.
4. WHEN the answer has errors THEN the system SHALL remove one life per message, not per wrong character.
5. The system SHALL offer a "Replay" button, limited to 2 replays per message in Night Shift mode and unlimited in Day Shift mode.
6. WHEN Day 2 starts THEN the system SHALL show a short intro explaining that the player now receives.

### R5. Lives
**User story:** As a player, I want to see how many chances I have left and earn them back.

Acceptance criteria:
1. The system SHALL start each day with 5 lives and show them on the HUD at all times as one candle in an SVG holder. The candle has 5 equal wax segments; each segment is one life, and the flame sits on top of the remaining wax.
2. WHEN a life is lost THEN the system SHALL burn the candle down by one segment with a short animation (flame dips, wax shrinks) and a sound. The flame SHALL flicker harder as the candle gets shorter.
3. WHEN a life is refilled THEN the system SHALL grow the candle back by one segment with a short animation.
4. WHEN the player finishes 3 messages in a row with no mistakes THEN the system SHALL refill one life, up to the maximum of 5.
5. WHEN lives reach 0 in Night Shift mode THEN the system SHALL end the game with a game-over screen. After a short moment (or a click) the system SHALL return to the start screen, where the player picks Night Shift or Day Shift again and starts at Day 1.
6. WHEN lives reach 0 in Day Shift mode THEN the system SHALL end the game the same way, with a calm game-over screen (no horror effects), then return to the start screen.
7. The system SHALL also show lives as text (for example "3 of 5") for screen readers, and the candle SHALL carry a matching text label.

### R6. Night Shift atmosphere (Night Shift mode only)
**User story:** As a player, I want to feel uneasy, so the game feels like a horror story.

Acceptance criteria:
1. WHILE in Night Shift mode THEN the system SHALL play looping rain and a low drone, plus random one-shot sounds: thunder, a crow, distant screaming, and knocking.
2. WHILE in Night Shift mode THEN the system SHALL play synthesized background music with ghostly "hoo" tones. Its tension SHALL rise as lives fall.
3. WHILE in Night Shift mode THEN some messages SHALL contain strange text (for example "IT IS IN THE WIRES", "DO NOT ANSWER") mixed with normal work messages. At least 1 in 3 messages per day SHALL be strange.
4. WHEN a mistake happens THEN the system SHALL trigger a short static burst and screen flicker.
5. The system SHALL fire a random effect no more often than once every 8 seconds, and never while the player is holding Space.
6. The system SHALL provide a "Reduce flashing" setting that replaces flicker with a gentle fade.
7. Night Shift SHALL build over the days. Day 1 and Day 2 use the effects above at a lower rate. WHEN Day 3 runs in Night Shift mode THEN the system SHALL use the full set of effects: every effect type enabled, the random-effect gap shortened to 4 seconds, at least 1 in 2 messages strange, and the screen distortion and music tension starting high.
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
2. The system SHALL give a rank (for example "Apprentice", "Operator", "Master") based on accuracy.
3. WHEN the player clicks "Next day" THEN the system SHALL start the next day; after Day 3 it SHALL show a closing screen.
4. The system SHALL save the best stats per mode in localStorage.

### R9. Days and progression
Acceptance criteria:
1. The game SHALL have 3 days: Day 1 is sending only, Day 2 is receiving only, Day 3 mixes sending and receiving.
2. Each day SHALL have 5 messages, ordered from short to long. On Day 3 the messages SHALL be a random mix of "send" and "receive", with at least 2 of each.
3. WHEN a day ends without game over THEN the system SHALL start the next day after the player clicks "Next day".
4. The system SHALL always start a new game at Day 1 and SHALL NOT offer a day picker in normal play. After game over, a day can never be replayed; the game returns to the start screen.
5. WHEN Day 3 starts THEN the system SHALL show a short intro explaining that the player now both sends and receives.
6. Lives SHALL reset to 5 at the start of each day.

### R10. Accessibility and controls
Acceptance criteria:
1. The system SHALL support keyboard play only. Esc SHALL open and close the Options menu.
1a. The Options menu SHALL contain: music and effects volume sliders, mute, "Reduce flashing", "Captions", a "Start with tutorial" setting ("Yes", "Ask on start", "Never"; used the next time a game starts), and "End game" (only during a run).
2. The system SHALL provide a touch-friendly on-screen key, so the game also works on phones.
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
   d. **Lives**: buttons for "+1 life", "Full candle", "-1 life", and an "Infinite lives" switch. WHEN lives are infinite THEN the system SHALL never show game over.
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

## Out of scope
- Online play or a real second player (the other operator is scripted).
- More than 3 days.
- Saving mid-day progress.
