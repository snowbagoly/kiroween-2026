# Requirements: Night Shift -- 1903 (Telegraph Operator Game)

## Introduction

"Night Shift" is a single-page browser game. The year is 1903. The player is a pianist whose dance hall has closed for the winter, and who has taken the night post at Station 7 of the Marsh & Western Telegraph Co., a lone relay station on an autumn marsh. They tap the space bar to send Morse code, and later decode Morse they receive. The game has two modes: Night Shift (default) and Day Shift. It also has a Kiroween Judge mode (R13) for quick demos. All visuals are SVG/CSS and all audio is synthesized with the Web Audio API. The game loads nothing from other sites (R11).

## Glossary

- **Hand**: How long the player's own dots and dashes are. The system learns it from the player's recent presses (R3.3). A new player starts with a dot of 120 ms and a dash of 360 ms.
- **Dot / Dash**: A press shorter than the threshold is a dot, and a press as long or longer is a dash. The threshold sits halfway between the player's typical dot and dash (240 ms for a new player).
- **Letter gap**: Silence that ends the current letter. It is 6 Morse units of the player's hand (720 ms for a new player), and never shorter than 450 ms or longer than 1600 ms.
- **Spaces**: Spaces between words are never sent or played. The player sends and hears only letters. The system skips spaces on its own when it shows the target text.
- **Office**: The telegraph office at night, where the game is played (R18). It has a left wall, a centre and a right wall.
- **Codebook**: The Morse chart (A to Z with the dots and dashes of each letter), pinned up on the office's left wall.
- **HUD** (heads-up display): The information that stays on screen during play: the galvanometer for lives, the mode label, the codebook, and the Options button.
- **Life**: One unit of the player's health. In the regular modes the player starts each day with 10 lives (maximum 10). In Dead Air (R16) the player has 5 lives (maximum 5).
- **Night Shift / Day Shift**: The two game modes. Night Shift has scares and strange messages. Day Shift is calm, with no scares.
- **Horror effects**: Scary sounds, strange message text, the light stuttering, the dark closing in, omens, and the figure.
- **Company notice**: A printed Marsh & Western form, used for the end of a day, the game over and the closing screen.
- **Game clock**: The office's time, from 22:00. It runs in real time while the player works (R9.7). The day always ends at 06:00.
- **Spike**: The spike on the desk where telegrams that arrive while the player is busy wait, shown as forms stacked under the current one.

## Requirements

### R1. Start screen and mode choice
**User story:** As a player, I want to pick Night Shift or Day Shift mode before I play, so the game fits my mood.

Acceptance criteria:
1. WHEN the game loads THEN the system SHALL show the start screen: a printed company card over the empty office (lamp lit, rain on the window, the coat on the hook, the chair pushed back, the clock at one minute to ten, the record still), dimmed and drifting slowly from side to side. The card SHALL show "Marsh & Western Telegraph Co.", the game's name ("Night Shift"), "Station 7" and a duty roster with one row per day, the current day marked in pencil. It SHALL be there from the first paint, with no fade in.
1a. The card SHALL hold the "Night Shift" and "Day Shift" buttons, each with a short line under it ("scares and strange messages" and "calm, no scares"), and the "Dead Air" (R16) and "Kiroween Judge" (R13) buttons. The system SHALL also show a small Options button in the upper right corner. The Options button SHALL stay in the upper right corner on every screen, including during play, and opens the one Options menu.
2. WHEN the player picks a mode THEN the system SHALL remember it for the rest of the session and show it on the HUD.
3. WHEN the start screen is shown THEN the system SHALL NOT play any sound until the player clicks or presses a key (browser audio rules). After that it SHALL play the office's sounds (muffled wind and rain, the wires singing, the room tone). The record SHALL stay silent until the operator sits down at the desk.
4. The system SHALL offer an "End game" button in the Options menu. WHEN the player clicks it THEN the system SHALL ask "End your game? Your current run will be lost." and, on confirm, stop all sound, discard the current run, and return to the start screen, where the player can choose Night Shift or Day Shift again.
5. Night Shift and Day Shift SHALL be separate games: each mode keeps its own best stats. Every new game in either mode SHALL start at Day 1.
6. The system SHALL change mode only from the start screen. It SHALL NOT offer mode switching during a run, and "End game" SHALL be the only way to leave a run early.

### R2. Tutorial
**User story:** As a new player, I want a short guided lesson, so I can learn Morse and the controls.

Acceptance criteria:
1. The system SHALL keep a "Start with tutorial" setting in localStorage with two values: "Ask on start" and "Never". The default is "Ask on start".
1a. WHEN the player picks a mode, the story (R17) is over or skipped, and the setting is "Ask on start" THEN the system SHALL show a dialog "Start with the tutorial?" with three buttons: "Start tutorial", "Not now", and "Never". The dialog SHALL appear on the first game, and on every later game until the player picks "Never" or finishes or skips the tutorial.
1b. WHEN the player picks "Start tutorial" THEN the system SHALL run the tutorial, then go to Day 1. WHEN the player picks "Not now" THEN the system SHALL go straight to Day 1 and keep the setting at "Ask on start". WHEN the player picks "Never" THEN the system SHALL go straight to Day 1 and set the setting to "Never".
1c. WHEN the setting is "Never" THEN the system SHALL go straight to Day 1 with no dialog.
1d. WHEN the tutorial is finished or skipped THEN the system SHALL set the setting to "Never", so the dialog does not appear again. The player can change it back to "Ask on start" in the Options menu.
1e. The dialog SHALL be keyboard-reachable (Tab and Enter), SHALL play no sound, and SHALL show no horror effects.
2. The tutorial SHALL be part of the story. The new operator finds a stack of handwritten instruction sheets on the desk and reads them one by one. Each sheet is one step, and the sheets SHALL teach, in order: (a) tap Space for a dot, (b) hold Space for a dash, (c) pause for a letter gap, (d) the lives display (the galvanometer), (e) how receiving works.
3. WHILE a sheet is active THEN the system SHALL show it on the desk as paper with the step text, with the codebook (see R3.1a) in view, and the hold meter (a live indicator of the current press length, with the learned threshold marked). The operator MAY add a short thought about the sheet (see R12).
4. WHEN the player completes a step correctly THEN the system SHALL put that sheet aside and show the next sheet. WHEN they fail it THEN the system SHALL keep the same sheet and let the player try again without removing a life.
5. WHILE the tutorial runs THEN the system SHALL show a visible "Skip tutorial" button (worded in the story, for example "Put the sheets away").
6. The tutorial SHALL work the same in Night Shift and Day Shift mode, with no horror effects in the tutorial.
7. The tutorial's presses SHALL teach the hand (R3.3) like any other presses.

### R3. Sending Morse (Day 1 and send messages on Day 3)
**User story:** As an operator, I want to send messages by tapping Space, so I can do my job.

Acceptance criteria:
1. WHEN a message is given THEN the system SHALL show it as a handwritten telegram form from the Marsh & Western Telegraph Co., lying on the desk, and highlight the letter to send next. Words on the form SHALL NOT break across lines. The system SHALL NOT show the Morse pattern of the letter beneath the text.
1a. The system SHALL show the codebook on the office's left wall at all times during play, in Night Shift and Day Shift. It is the player's only help for finding a pattern. Clicking it SHALL enlarge it, and clicking again SHALL put it back. Dead Air (R16) SHALL NOT show it.
2. WHEN the player holds Space THEN the system SHALL play a telegraph tone for as long as the key is down and animate the telegraph key, whose silver contacts spark faintly on each press.
3. WHEN a press ends THEN the system SHALL classify it as dot or dash with the threshold of the player's hand. The system SHALL learn the hand from the player's last 20 presses: it splits them into a short and a long group at the point that separates them best, and takes each group's median as the typical dot and dash. WHEN the two groups are less than 1.8 times apart THEN it SHALL treat the presses as one kind and update only the symbol they resemble.
3a. The system SHALL save the learned hand in localStorage, so it carries over between visits. The Options menu SHALL offer "Forget my hand", which goes back to a new player's hand.
3b. The system SHALL show the player's speed in words per minute, worked out from the hand (at n words per minute a dot lasts 1200 / n ms).
4. WHEN a letter gap passes THEN the system SHALL decode the entered pattern and compare it to the expected letter.
4a. The system SHALL draw each press on a paper tape on the desk as a dot or dash, and pencil the decoded letter under each letter's group (a red "?" if the pattern is not a letter). Backspace SHALL tear off the tape.
5. WHEN the letter is right THEN the system SHALL mark it as sent (it fades on the form) and move to the next letter.
6. WHEN the letter is wrong THEN the system SHALL remove one life, strike the letter through in red on the tape, add a red tally mark on the form, and let the player retry the same letter.
7. WHEN the last letter of a message is sent THEN the system SHALL stamp the form "SENT" with the game clock's time, and the next form SHALL slide in.
8. The system SHALL ignore key repeat events while Space is held.

### R4. Receiving Morse (Day 2 and receive messages on Day 3)
**User story:** As an operator, I want to decode incoming beeps one letter at a time and type them, so I can read messages from the other station.

Acceptance criteria:
1. WHEN a received message starts THEN the system SHALL play its letters as tones (dot 120 ms, dash 360 ms, 120 ms between symbols, 360 ms between letters when the next letter follows at once; spaces between words are skipped). The system SHALL also show a telegraph sounder (a small clicker with a moving arm) on the desk. The arm SHALL drop when each tone starts and lift when it ends, in sync with the tones, and SHALL make a short "click" on the way down and a "clack" on the way up.
2. The system SHALL play a received message one letter at a time. WHEN a letter has been played THEN the system SHALL wait for the player to type that letter with the keyboard (or the on-screen keyboard, R15). The system SHALL show the message as a row of blanks on an empty telegram form, one per letter, and fill in each letter the player gets right.
3. WHEN the player types the right letter THEN the system SHALL fill it in and, after a short pause, play the next letter. Typing is not case-sensitive. The system SHALL need no Enter key.
4. WHEN the player types a wrong letter THEN the system SHALL remove one life, show the mistake, and play the same letter again so the player can retry it.
5. The system SHALL offer a "Replay" button that plays the current letter again, limited to 3 replays per message in Night Shift mode and unlimited in Day Shift mode. A replay after a mistake (R4.4) SHALL NOT count.
5a. WHILE the player has not typed the letter, the system SHALL NOT play the next one. WHEN 15 seconds pass without input THEN the system SHALL replay the current letter once, without removing a life.
5b. WHEN the last letter is typed correctly THEN the system SHALL stamp the form "RECEIVED" with the game clock's time, and the next form SHALL slide in.
6. WHEN Day 2 starts THEN the system SHALL show a short intro explaining that the player now receives.

### R5. Lives
**User story:** As a player, I want to see how many chances I have left and earn them back.

Acceptance criteria:
1. The system SHALL start each day with 10 lives and show them on the HUD at all times as one galvanometer on the office's right wall: a wooden board with a knot in the grain, a brass bezel with screws, a yellowed enamel dial behind glass, a thin black needle with a shadow, and 10 marked steps. The needle at the top step means 10 lives, and at the bottom step means 1 life. In Dead Air the dial SHALL have 5 marked steps. The dial's lower end is a red zone. A needle that falls out of the last step means 0 lives.
2. WHEN a life is lost THEN the system SHALL swing the needle down by one step with a springy animation and a dull "tock" as it jolts in its case. The needle SHALL tremble more as it gets closer to the red zone.
3. WHEN a life is refilled THEN the system SHALL swing the needle up by one step with a short animation.
4. WHEN the player finishes 3 messages in a row with no mistakes THEN the system SHALL refill one life, up to the maximum of the mode (10, or 5 in Dead Air).
5. WHEN lives reach 0 in Night Shift mode THEN the line SHALL snap (about 2 seconds): a loud electrical crack and a low thump with a white flash, the room jolts, the needle is flung against its zero stop with a hard "tock", the sounder jams into one long tone, and the light stutters, each dip darker and quicker. In the last flash a tall, thin figure SHALL stand in the room in front of the key. Then the system SHALL cut all sound and light at once. In the dark and silence, the sounder SHALL tap out "THE LINE IS DEAD" in the player's own hand, each letter appearing on screen as it is tapped. Then it SHALL show a dismissal telegram (a company notice) with the day's results and two buttons: "Restart this day" and "Main menu". A key press or click during the tapping SHALL skip to the telegram.
6. WHEN lives reach 0 in Day Shift mode THEN the system SHALL show the same dismissal telegram, calm: no snap, no flash, no figure and no dark.
6a. Each day start is a checkpoint. WHEN the player picks "Restart this day" THEN the system SHALL start the same day again from its first message with 10 lives and that day's statistics reset. Earlier days and their statistics SHALL stay as they were. WHEN the player picks "Main menu" THEN the system SHALL return to the start screen.
6b. The checkpoint SHALL last only while the page stays open. Reloading the page SHALL discard the run (see Out of scope).
7. The galvanometer SHALL carry a hidden text label (for example "3 of 10 lives") that only screen readers read. It SHALL NOT be visible on screen.
8. The Options menu SHALL have a "Show lives as a number" setting, off by default. WHEN it is on THEN the system SHALL show the number (for example "3 / 10") next to the galvanometer.

### R6. Night Shift atmosphere (Night Shift mode only)
**User story:** As a player, I want to feel uneasy, so the game feels like a horror story.

Acceptance criteria:
1. WHILE in Night Shift mode THEN the system SHALL play the office's sounds (rain against the window, wind, the wires singing, the room tone of rumble and mains hum), plus random one-shot sounds: thunder, a crow, distant screaming, and knocking.
2. WHILE in Night Shift mode THEN the music SHALL be the station's phonograph, heard from the next room, playing a waltz in E♭ minor on piano and reed organ through a period phonograph sound (needle noise, crackle, warp). It is the waltz the operator wrote years ago (R17). The key's tone SHALL be tuned to the music's key.
3. WHILE in Night Shift mode THEN some messages SHALL contain strange text (for example "IT IS IN THE WIRES", "DO NOT ANSWER") mixed with normal work messages. Day 1 SHALL have normal messages only, except the last (5th) message, which SHALL be strange. Day 2 SHALL have at least 2 strange messages out of 5.
3a. The last message of Day 1 SHALL be a fixed telegram from Head Office to "Mr E. Vane, Station 7": "WHY HAVE YOU NOT REPORTED". Vane is the missing operator. The strange messages MAY also include his wife ("HAS MY HUSBAND BEEN MOVED") and telegrams in his hand (for example "DO NOT ANSWER IT", "IT LEARNS YOUR HAND").
4. WHEN a mistake happens THEN the line SHALL spit (a stutter of crackle on the sounder, the needle jolting, and a low sour swell), the light SHALL stutter, and the rest of the room SHALL dim for a moment, leaving the galvanometer lit. All of it SHALL get stronger the fewer lives are left. Below 7 lives a sour drone and the dark closing in from the corners SHALL join, for as long as lives stay that low. Below 5 lives the line SHALL repeat the wrong letter back faintly, in the operator's own hand. Below 3 lives the light SHALL go out after the stutter, and something SHALL knock three times on the wall behind the operator. (In Dead Air the marks scale to 5 lives: below 4, 3 and 2.)
4a. WHEN lives first fall to 7, 5 and 3 in a day (in Dead Air: 4, 3 and 2) THEN the system SHALL play one omen not yet seen that day, a few seconds later and in a quiet moment: the lamp's flame sinks and burns blue, the air goes heavy (sounds sink away as if under water, the record drags flat), or the record sticks in its groove. The order SHALL be random.
4b. WHEN lives fall to 1 THEN the system SHALL play the last warning: the galvanometer's glass cracks while the room is dim around it, the light stutters out, something knocks three times behind the operator, and as the light snaps back the tall figure is reflected in the window's dark glass, standing behind the operator's chair. It is gone in the next stutter. The crack SHALL stay until the day ends.
4c. Nothing that happens on a mistake SHALL change the key, the tape, the codebook or the form, so it never misleads the player about the work.
5. The system SHALL fire a random effect no more often than once every 8 seconds, and never while the player is holding Space or keying a letter.
6. The system SHALL provide a "Reduce flashing" setting: the light's stutters become a soft dimming, there is no white flash when the line snaps, and the lamp and the dead line's letters stop flickering.
7. Night Shift SHALL build over the days, and through each day. As the game clock moves on, the light stutters more, wind gusts against the window, a second hum throbs against the mains, the record wobbles and sags, the sounder clicks once by itself with the needle twitching, and something knocks far off in the building. Day 1 and Day 2 use the effects at a lower rate, and Day 1 starts calm. WHEN Day 3 runs in Night Shift mode THEN the system SHALL use the full set of effects from the start of the day: every dread effect at full strength from 22:00, every effect type enabled, the random-effect gap shortened to 4 seconds, and at least 3 of 5 messages strange.
8. The system SHALL provide separate volume sliders for music and effects, a mute button, and a "Music" on/off switch.

### R7. Day Shift mode
**User story:** As a player, I want a calm version, so I can just practise typing Morse.

Acceptance criteria:
1. WHILE in Day Shift mode THEN the system SHALL NOT play horror sounds, strange messages, flicker, or static.
2. WHILE in Day Shift mode THEN the system SHALL use only normal work messages and a warm colour palette.
2a. Until the office by daylight is drawn (see TODO.md), Day Shift SHALL keep its current desk scene and palette. The start screen, the company notices and the story are shared with Night Shift.
3. WHILE in Day Shift mode THEN the system SHALL play soft, cheerful synthesized background music with birdsong, and a mute button. Night Shift and Day Shift SHALL have different music.
4. WHEN a day ends in Day Shift mode THEN the system SHALL show a statistics screen (see R8).
5. Lives SHALL work exactly as in Night Shift mode (R5): mistakes cost lives, clean streaks refill them, and 0 lives ends the game.

### R8. Statistics
**User story:** As a player, I want to see how well I did.

Acceptance criteria:
1. WHEN a day ends (both modes) THEN the system SHALL show, on a company notice ("SHIFT ENDED 06:00 STOP / RELIEF OPERATOR ARRIVED / REPORT AGAIN 22:00 TOMORROW"): messages completed, letters correct, mistakes, accuracy %, average speed in words per minute, lives left, and longest streak without a mistake.
2. The system SHALL give a rank of "Apprentice", "Operator", or "Master" based on both accuracy and speed. The system SHALL work out an accuracy rank (below 70% Apprentice, 70% to 94% Operator, 95% or more Master) and a speed rank (below 3 words per minute Apprentice, 3 to 5.9 Operator, 6 or more Master), and the final rank SHALL be the lower of the two.
3. WHEN the player clicks "Next day" THEN the system SHALL start the next day; after Day 3 it SHALL show a closing screen, also as a company notice.
4. The system SHALL save the best stats per mode in localStorage.

### R9. Days and progression
Acceptance criteria:
1. The game SHALL have 3 days: Day 1 is sending only, Day 2 is receiving only, Day 3 mixes sending and receiving.
2. Each day SHALL have 5 messages in a mixed order of length: short and long messages SHALL NOT be sorted, so the player may get a long message first, then a short one, then a longer one. Each day SHALL include at least one short message (up to 10 letters) and at least one long message (20 letters or more). On Day 3 the messages SHALL be a random mix of "send" and "receive", with at least 2 of each.
3. WHEN a day ends without game over THEN the system SHALL start the next day after the player clicks "Next day".
4. The system SHALL always start a new game at Day 1 and SHALL NOT offer a day picker in normal play. After game over, the player can only restart the current day (R5.6a) or go to the main menu.
5. WHEN Day 3 starts THEN the system SHALL show a short intro explaining that the player now both sends and receives.
6. Lives SHALL reset to the mode maximum (10, or 5 in Dead Air) at the start of each day.
7. Each day SHALL run from 22:00 on the game clock, which runs in real time. The wall clock's hands SHALL show it.
7a. The clock SHALL start with the player's first press of the key (or first typed letter) of the day, and SHALL stop while the game is held (R10.1b).
7b. Each day SHALL have its own real length at normal clock speed (to start with: Day 1 10 minutes, Day 2 12 minutes, Day 3 14 minutes; tuned in playtesting). Its 5 messages SHALL be handed in at set times between 22:00 and 04:00, each with a ring of the counter bell.
7c. WHEN a message is handed in while the player is busy THEN it SHALL wait on the spike. WHEN a message is done and one is waiting THEN the next SHALL slide in at once.
7d. WHILE no message is waiting THEN the clock SHALL run 4 times faster. WHEN all 5 messages are done THEN it SHALL run 6 times faster to 06:00, leaving a last quiet stretch of about 10 to 15 seconds before dawn.
7e. The day SHALL always end at 06:00 on the game clock. WHEN all 5 messages are done before 06:00 THEN the clock SHALL run on to 06:00 and the day SHALL end with the dawn (R9.9) and the end-of-day notice (R8.1).
7f. In Night Shift and Dead Air, WHILE a message is waiting and the player has not pressed the key or typed for 6 seconds THEN the system SHALL remove one life, and one more every 17 seconds after that, until the player acts. The idle time SHALL only count once the player has started the day. Day Shift SHALL NOT remove lives for idling.
7g. WHEN the clock reaches 06:00 and a message is still in hand or on the spike THEN the player SHALL lose the day, the same as losing all lives: in Night Shift and Dead Air the game over of R5.5 plays; in Day Shift the calm game over of R5.6 shows. The dismissal telegram SHALL say why ("RELIEF OPERATOR ARRIVED / TELEGRAMS NOT SENT STOP") and SHALL offer the same buttons as R5.5, R5.6 and R16.6.
7h. In Night Shift and Dead Air, WHILE the clock is past 04:00 and a message is still not done THEN the system SHALL remove one life every 20 seconds of real time, even with no mistakes. From 05:00 it SHALL be every 10 seconds. Each loss SHALL play like a mistake (R6.4). Day Shift SHALL NOT do this.
8. WHEN each day starts THEN the system SHALL show a title card with the day and its date in November 1903 (for example "Day 1 · Wednesday, 4 November 1903"). The calendar on the office wall SHALL be crossed off up to that date.
9. WHEN the last message of a day is done in Night Shift mode THEN the system SHALL play the dawn: the window's sky turns pale, a soft shaft of light slants across the room with dust in it, the window's panes fall as a patch of light on the desk, the oil lamp gutters out and smokes, the music fades, a church bell strikes six, and a robin sings. Then it SHALL show the end-of-day notice (R8.1). The window's sky SHALL already start to lighten from 60% of the day.

### R10. Accessibility and controls
Acceptance criteria:
1. The system SHALL support keyboard play only. Esc SHALL open and close the Options menu.
1a. The Options menu SHALL contain: music and effects volume sliders, mute, "Music" on/off, "Reduce flashing", "Captions", "Show lives as a number", "Always skip the story", "Full screen", "Forget my hand", a "Start with tutorial" setting ("Ask on start" or "Never"; used the next time a game starts), and "End game" (only during a run).
1b. WHILE the Options menu is open during a run (or the tab is hidden) THEN the game SHALL be held: the game clock, the effects and all sound stop, and the card SHALL read "Line Held".
3. The system SHALL give text alternatives for sound events (for example captions such as "[thunder]") when "Captions" is turned on.
4. All text SHALL have a contrast ratio of at least 4.5:1.

### R11. Technical constraints
1. The game SHALL be one self-contained page using vanilla JS, SVG, and the Web Audio API.
2. The game SHALL NOT load anything from other sites: no audio, images, fonts or scripts. Its three fonts (Special Elite for typewriter text, IM Fell English SC for printed forms, Caveat for handwriting; all under the SIL Open Font License) SHALL be bundled with the game.
3. The game SHALL run in current Chrome, Firefox, Safari and Edge.
4. The office SHALL be laid out at a design height of 900 px and scaled as a whole to fit the screen, so its proportions hold from a laptop to a large display. Very wide screens SHALL get a wider office (up to 1700 px of design width). Below 1050 px wide it SHALL become a single scrolling column without the window, clock, calendar and lamp.
5. Visuals, sound and wording SHALL fit 1903, with no anachronisms. All content SHALL be original, including the music.
6. WHILE the start screen or the story covers the office THEN the office SHALL not be drawn and its animations SHALL hold still, so simple hardware is not slowed.

### R12. Learning about telegraphs, inside the story
**User story:** As a young player who has never seen a telegraph, I want to learn how it worked while I play, so I understand this old technology without leaving the game.

Acceptance criteria:
1. The system SHALL teach telegraph facts only through the game world, never in a separate pop-up or museum-style screen. The main way is the player character, a new operator, thinking aloud: short first-person lines shown as thought text at the bottom of the desk scene, for example "Each word costs money... that is why everyone writes so short." The system MAY also use a note beside the desk or a line from the other operator, but the character's thoughts SHALL be the main source.
1a. The character's thoughts SHALL sound curious and new to the job (wondering, guessing, sometimes wrong and then corrected). They SHALL NOT sound like a lecture. The character is a pianist, so a thought MAY compare the work to music.
2. Each day SHALL show at most 2 thoughts, each at most 20 words, and each SHALL appear when a message appears or between messages, and never while the player is pressing Space or typing.
3. A thought SHALL never block input. The player SHALL be able to ignore it, and it SHALL fade out by itself after 8 seconds.
4. The system SHALL include at least 6 facts, for example: telegrams were paid per word so people wrote short; "STOP" marked the end of a sentence; operators could recognise each other by their tapping style; messages travelled along a wire as on/off current. Each fact SHALL be true for 1903.
4a. The character SHALL also react to the message in front of them. For example, WHEN a message is very long THEN they may think "Phew, that must be a rich guy!". WHEN a message is cryptic, with many abbreviations, THEN they may think "I understand that you want to spare some money, but this message makes no sense anymore." At least 4 such reactions SHALL exist, and each SHALL show only when the message fits it.
5. Work messages in Day 1 and Day 2 SHALL read like real telegrams of around 1903 (short, no small words, "STOP" used for full stops): births, deaths, freight prices, and small stories told in parts across a day (for example a sick mother, an overdue ship).
6. Each thought SHALL have one version, the same in Night Shift and Day Shift.

### R13. Kiroween Judge mode
**User story:** As a Kiroween judge with only a few seconds, I want to jump around the game and see its best moments right away, so I can judge it without playing it through.

Acceptance criteria:
1. The start screen SHALL show a "Kiroween Judge" button. The system SHALL also open Judge mode when the page URL contains `?judge=1`.
2. WHEN Judge mode is on THEN the system SHALL show a small, always-visible "Judge panel" that can be collapsed, and a "JUDGE" badge on the HUD. The panel SHALL be used with the mouse. It has no shortcut keys, because the letter keys are needed for typing received letters.
3. The Judge panel SHALL provide these cheats:
   a. **Jump to day**: buttons for Day 1, Day 2, Day 3, the dawn, and the closing screen. All days are reachable at once.
   b. **Auto-solve**: "Type it correctly" completes the current letter, or the whole message, as if the player had done it perfectly. It SHALL play the sent or received tones, so the audio still shows.
   c. **Skip message**: go straight to the next message.
   d. **Lives**: buttons for "+1 life", "Full galvanometer", "-1 life", and an "Infinite lives" switch. WHEN lives are infinite THEN the system SHALL never show game over.
   e. **Force game over**: plays the game over at once.
   f. **Show stats**: opens the statistics screen with sample numbers.
   g. **Play the story**: plays the story (R17) from its first slide.
4. The Judge panel SHALL also provide "show-off" tools so the game looks good in seconds:
   a. **Mode switch without restart**: Night Shift and Day Shift toggle that keeps the current day. This replaces R1.6 for Judge mode only.
   b. **Scare dial**: a slider from 0 to 100% that sets the horror intensity, up to the Day 3 full level.
   c. **Trigger effect**: one button per horror effect (thunder, crow, scream, knocking, static burst, flicker, strange message, each omen, the last warning). Each fires at once and ignores the R6.5 time limit.
   d. **Demo reel**: a "Play demo" button that runs a 30-second scripted tour on its own: auto-sending a message in Day Shift mode, switching to Night Shift, firing thunder, a crow and a strange message, losing a life with static, and ending on the statistics screen. The player can stop it with Esc.
   e. **Auto-play**: a switch that makes the game send and receive messages by itself at normal speed, so a judge can watch without touching the keyboard.
   f. **Speed**: x1 / x2 / x4 for the demo and auto-play.
   g. **Captions on**: a button that turns on sound captions (R10.3) so a muted judge still sees "[thunder]", "[crow]".
   h. **Show a thought**: a button that shows the next character thought (R12) at once, in any mode and day.
5. WHILE Judge mode is on THEN the system SHALL NOT save progress, best stats, the learned hand, or the "Start with tutorial" setting to localStorage, and SHALL skip the story and the tutorial.
6. WHEN a judge opens the page with `?judge=1` THEN the system SHALL show a one-screen welcome card that explains the panel and has a "Start demo" button and an "Explore" button. The card SHALL need no more than one click to reach any day.
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
1. WHEN the game runs on a touch device THEN the system SHALL show a touch-friendly on-screen Morse key for sending. A touch SHALL be classified as a dot or dash with the player's hand (R3.3), the same as the space bar.
2. The system SHALL provide its own on-screen typewriter-style keyboard with the letters A to Z only (no space, delete, or send keys), shown when the player has to type a received message (Day 2 and Day 3). It SHALL NOT use the phone's own keyboard. Its keys SHALL be at least 32 px wide and 44 px tall, so ten keys fit in a row on a 360 px wide phone.
3. The layout SHALL fit screens from 360 px wide, in portrait and landscape, without hiding the galvanometer, the message, or the telegraph desk. On narrow screens the office's single column (R11.4) is used.
4. WHILE the player touches the Morse key or the keyboard THEN the system SHALL NOT zoom, scroll, select text, or open a context menu.
5. The system SHALL start sound after the first touch, since phones block sound until then.
6. The system SHALL be tested by hand on one iPhone-sized and one Android-sized screen (for example with the browser's device mode), covering Day 1, Day 2 and Day 3 in both modes.
7. The Options button and all dialogs SHALL be usable by touch, with targets at least 44 px tall.

### R16. Dead Air (hard mode)
**User story:** As a player who finished the game, I want a harder run with no safety net, so I can prove I know Morse.

Acceptance criteria:
1. "Dead Air" is the hard version of Night Shift only. There SHALL be no hard version of Day Shift, and finishing Day Shift SHALL NOT unlock Dead Air. It SHALL use the Night Shift atmosphere (R6) at full strength from Day 1, and the same 3 days and message types.
2. The start screen SHALL show a "Dead Air" button (with a short line "hard: 5 lives, no codebook, no second chance") next to "Night Shift" and "Day Shift". WHILE it is locked THEN the button SHALL be visible but disabled, with the line "Finish Night Shift to unlock".
3. WHEN the player finishes Day 3 in Night Shift THEN the system SHALL unlock Dead Air and save this in localStorage.
4. In Dead Air the player SHALL have 5 lives, shown on the galvanometer with 5 steps (R5.1). Lives SHALL refill with the same rule as R5.4, up to 5.
5. In Dead Air the system SHALL NOT show the codebook (R3.1a), neither during play nor in the tutorial. Its place on the wall SHALL be bare, with the pin marks left.
6. WHEN lives reach 0 in Dead Air THEN the system SHALL play the Night Shift game over (R5.5) and end on a dismissal telegram with only a "Main menu" button. There SHALL be no "Restart this day" and no checkpoint. Starting Dead Air again SHALL begin at Day 1.
7. Dead Air SHALL keep its own best stats, shown with a "Dead Air" label.
8. The system SHALL NOT offer the story (R17) or the tutorial dialog (R2) when Dead Air starts.
9. WHEN Judge mode is on THEN Dead Air SHALL be unlocked, and Judge mode SHALL NOT save the unlock.

### R17. The story
**User story:** As a player, I want to know who I am and why I am at this station, so the night means something.

Acceptance criteria:
1. The story SHALL be told as a magic-lantern show of six painted slides, with a letter the operator writes to their sister shown in handwriting under each slide, a line at a time. The slides are: (1) the dance hall shut for the season, (2) a rented room with the last coins counted out, (3) the newspaper advertisement for a night operator, circled in pencil, (4) the train crossing the autumn marsh, (5) the station from outside, alone on the marsh, (6) inside the office: the coat on the hook, the chair pushed back, the record on the phonograph.
2. The mood SHALL be dark, gloomy autumn: slightly eerie, nothing heavy. The story SHALL only hint that the previous operator has disappeared. The operator does not know it.
3. Each slide SHALL fade in and out as the plates are changed, push in slowly, flicker with the lantern, and have small moving details (rain, fog, smoke). Each slide SHALL have its own sounds, muffled on the slides indoors.
4. A slow piano nocturne in E♭ minor SHALL play under the story, from the hall to the station, and fade out as the office slide comes up. The record SHALL stay silent until the letter says the needle is set down.
5. Space SHALL move on to the next slide, and Esc SHALL skip the story. The whole show SHALL take about 60 to 90 seconds.
6. WHEN the player picks Night Shift or Day Shift and "Always skip the story" is off THEN the system SHALL offer the story first ("Read the letter" or "Go straight to the desk", with an "Always go straight to the desk" tick box). The story SHALL lead straight into Day 1 (or the tutorial dialog, R2.1a).
7. The story SHALL be the same in Night Shift and Day Shift, with no horror effects.

## Out of scope
- Online play or a real second player (the other operator is scripted).
- More than 3 days.
- Saving mid-day progress.
- The office by daylight for Day Shift (for now; see TODO.md).
- For now: the other three devices (push button, bare wires, signal lamp), the call-up ritual, the sound workbench, and recorded sound samples.
