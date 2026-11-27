# Brief: Night Shift -- 1903 video storyboard

## Presentation Goal
This deck is a storyboard for the Kiroween hackathon video of "Night Shift -- 1903". It is a planning tool, not a talk. Each scene shows what is on screen, what the voice says, and when. The main message of the video is: "Night Shift -- 1903 gives Morse code a second life, and Kiro helped build it spec first." After reading the deck, the maker can record the voice, match the footage to it, and keep the video under 3:00 without more planning.

## Audience
The reader is the maker (Zsofia, a software developer) and anyone who helps film the video. The end viewers of the video are Kiroween judges. They score the Resurrection category. They score "how we used Kiro" most, so that part gets the most time.

## Format
Storyboard style: many slides, one scene per slide or close to it, each with a time range, a screen description and the voice line. The video runs under 3:00 and the plan ends at 2:50, with about 340 spoken words. Six parts: Hook 0:00-0:12, What it is 0:12-0:40, Why Resurrection 0:40-1:05, How we used Kiro 1:05-2:05, Where it's going 2:05-2:25, Close and end card 2:25-2:50. Include an overview of the timing and the cut order.

## Tone & Style
Dark, candle-lit, Victorian telegraph mood that matches the game. Plain and readable, since the deck is a working document. Voice lines must read like natural speech, with short words and contractions. The user allows rewording to make them sound more human. Slide labels and notes follow the same rule: plain words, no marketing phrases, no filler.

## Constraints & Requests
- [MUST] Mark every TODO scene on its slide with a clear "TODO - only if true" badge. The user asked for this.
- [MUST] Show the cut order: the hook line, then the widget line, then the Issue Radar, Design Critique and PPTX Maker line.
- [MUST] Voice lines come from the script. They may be reworded, but only to sound more natural: short words, contractions, no slogans, nothing that reads as AI-written. Keep the facts the same.
- [MUST] Show the video rules from the contest: under 3 minutes, show the app on its device, no copyrighted music or trademarks, upload to YouTube as Public.
- [MUST NOT] Do not claim the game is finished. Requirements are not approved, and design and tasks are not started.
- [MUST NOT] Use no stock photos or copyrighted material. Use placeholders for footage and the user's own drawings.
- [PREFER] Dark theme.

## Materials
| File | Description | Target Slide |
|------|-------------|--------------|
| /Users/zsofiaborbely/private/halloween/.kiro/video-script.md | Source script | all |

## Source Material
All facts below come from /Users/zsofiaborbely/private/halloween/.kiro/video-script.md.

### Contest and video rules
- Category: Resurrection. Bonus: Best Kiro Crew App. Hashtag: #KiroweenHackathon26. (Source: video-script.md)
- Hard limit under 3:00. Judges need not watch past 3:00. The plan ends at 2:50. (video-script.md)
- Show the app working on the device it was built for. (video-script.md)
- No copyrighted music or third-party trademarks. Only the game's own synthesized sound and the user's own drawings. (video-script.md)
- Upload to YouTube as Public and put the link in the Devpost form. (video-script.md)

### Timing table
1. Hook 0:00-0:12. 2. What it is 0:12-0:40. 3. Why Resurrection 0:40-1:05. 4. How we used Kiro 1:05-2:05. 5. Where it's going 2:05-2:25. 6. Close and end card 2:25-2:50. (video-script.md)

### Scenes: screen and voice
1. Hook (0:00-0:12). Screen: black screen, rain, a telegraph click, a candle flame appears. Title card: NIGHT SHIFT -- 1903. Voice: "It's 1873, and you're the night telegraph operator. The line's been quiet for hours. Then it starts to answer you."
2. What it is (0:12-0:40). Screen: gameplay, tapping Space, the key moves, letters light up. Then a candle burning down after a mistake, then "IT IS IN THE WIRES" with a flicker. Voice A: "This is Night Shift, a little horror game about Morse code. You tap the space bar to send. Short tap, dot. Long press, dash. Later on you have to decode messages just by listening." Voice B: "You get five lives, and they're a candle. Every mistake burns it down. And the messages get weirder each day. If that's too much, there's a Cozy mode with no scares."
3. Why Resurrection (0:40-1:05). Screen: the user's own drawing of a telegraph that turns into the game on a phone. Voice: "Nobody sends telegrams anymore, and most people have never tried Morse. We wanted to give it a second life. So it runs in the browser, even on a phone. All the sound is made live, with no audio files. And there are captions, for people who can't hear it."
4. How we used Kiro (1:05-2:05), the longest part because judges score it.
   - Screen: the .kiro folder in the project. Voice: "We started with a spec, before any code."
   - Screen: requirements.md scrolling. Voice: "Kiro helped us turn a rough idea into eleven requirements, each one with a user story and rules we can test. We kept changing them in chat. That's how the lives turned into a candle, and how Cozy mode got its own rules."
   - Screen: steering/schedule.md and GANTT.md. Voice: "We also put our plan in a steering file, with the deadline and which parts overlap. So Kiro always knows what comes next."
   - Screen: widget prototypes (telegraph sound, steam train, ambient drone). Voice: "Before all that, we used Kiro Crew to try out sounds and screens as small live widgets. Hearing an idea in seconds helped a lot."
   - TODO, only if true. Screen: Issue Radar with the repo connected, a Design Critique report on a game screenshot with its pins, then the storyboard deck from PPTX Maker. Voice: "Three more Kiro Crew apps helped. Issue Radar tracks our GitHub issues, Design Critique reviews our screens, and PPTX Maker turned this script into a storyboard."
   - TODO, only if true. Screen: .kiro/hooks. Voice: "A hook checks on every save that we haven't loaded any outside files."
   - TODO, only after they exist. Screen: design.md and tasks.md. Voice: "Then Kiro built the game from the task list, one task at a time."
   - Cut order if this part runs long: the hook line, then the widget line, then the Issue Radar, Design Critique and PPTX Maker line.
5. Where it's going (2:05-2:25). Screen: Kiro Crew dashboard with the app installed, running on the real device. Voice: "In the end, it's a Kiro Crew app, so you can install it and play. The code is open source on GitHub."
6. Close and end card (2:25-2:50). Screen: candle flame goes out, telegraph click. Voice: "Night Shift, 1903. Keep your candle lit." End card for 5 seconds: "Category: Resurrection. Bonus: Best Kiro Crew App. #KiroweenHackathon26".
(All from video-script.md)

### Game facts (spec)
3 days, 5 lives, 5 messages a day, Horror and Cozy modes, captions, Reduce flashing. (video-script.md, Notes)

### Honesty notes
- Requirements are not approved. Design and tasks are not started. Do not say the game is finished.
- Say "Kiro Crew app" only if it is really packaged. Otherwise say "planned".
(video-script.md, Notes)

### Before recording
Read the script aloud with a timer. If it passes 2:50, cut from the cut order first. Record the voice first, then match the screen footage to it. (video-script.md)
