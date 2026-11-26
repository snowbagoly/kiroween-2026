# Kiroween Submission TODO

Deadline: 1 December 2026. Category: Resurrection.
Status: requirements.md drafted, not approved. design.md and tasks.md not started. No code yet.

## 1. Build
- [ ] Approve requirements.md
- [ ] Write design.md and approve it
- [ ] Write tasks.md and approve it
- [ ] Build the game, one task at a time
- [ ] Day Shift: draw the office by daylight (the Night Shift room is ported first; Day Shift keeps its old desk until then, see R7.2a). It brings the telegram form with its SENT/RECEIVED stamp and the paper tape to Day Shift; then drop the short "Message sent" card there too
- [x] Receiving: ignore typed letters until the current letter's signal has played once, so the player can't guess ahead from the word
- [ ] Package it as a Kiro Crew app (newly created in the Submission Period)
- [ ] Check it runs on the device you show in the video (computer, and phone if you claim it)
- [ ] Public URL to the working app. If judges need a login, add it in Devpost (the game needs none)

## 2. GitHub repo (must be GitHub, not GitLab or Bitbucket)
- [ ] Make a public repo
- [ ] Add an open source license file (for example MIT). Check it shows in the About box at the top of the page
- [ ] Add a README: what it is, how to run or install it
- [ ] Keep all source and assets in the repo
- [ ] Keep `/.kiro` at the repo root (specs, steering, hooks)
- [ ] Do NOT put `.kiro` in `.gitignore`. Check this file after you create it
- [ ] Not Skeleton Crew, so one app folder is enough

## 3. Kiro usage writeup
Answer each point. If you did not use it, skip it. Do not invent.
- [ ] Which Kiro tools: IDE, CLI, Web, Crew. How they differed
- [ ] Issue Radar (Kiro Crew app): enable it in Apps, connect the GitHub repo (its pipeline view works with GitHub only), and really use it to track issues. Write down what it did for you
- [ ] Design Critique (Kiro Crew app): enable it in Apps, then give it screenshots of the game (start screen, send, receive, game over, Cozy). Keep the report and note what you changed because of it
- [ ] PPTX Maker (Kiro Crew app, already enabled): give it `video-script.md` and make a storyboard deck, one slide per scene. Keep the deck in the repo (for example `docs/storyboard.pptx`). Check each slide against the script and the 3-minute limit
- [ ] Custom agents: any? Where? What changed?
- [ ] Hooks: what did they automate? (add at least one real hook in `.kiro/hooks`)
- [ ] Spec-driven work: how the spec was built, and how it compares to vibe coding
- [ ] Steering: `schedule.md` plus any more. Which one helped most
- [ ] MCP: any server used, and what it allowed
- [ ] Property-based tests: for example Morse encode then decode gives the same text
- [ ] Powers: any used?

## 4. Devpost form
- [ ] Text description of features and functionality
- [ ] Choose category: Resurrection
- [ ] Add the GitHub URL, the app URL and the YouTube URL
- [ ] Say how the project fits Resurrection (Morse and telegraph are dead tech, brought back with today's tools)

## 5. Video (under 3 minutes)
- [ ] Record it. Script is `video-script.md`
- [ ] Show the app working on the real device
- [ ] No copyrighted music, no third-party logos. Use the game's own sound
- [ ] Upload to YouTube, set to Public
- [ ] Open the link while logged out to check it plays

## 6. Optional bonus prizes (not needed)
- [ ] Social Blitz: post that starts with #KiroweenHackathon26, during the Submission Period
- [ ] Blog: public post that says it is for Kiroween 2026, published in the period

## 7. Final check
- [ ] Check the Submission Period dates against the first date of your work (prototypes started 30 Oct)
- [ ] Open the repo in a private browser window: public, license visible, `.kiro` there
- [ ] Submit before the deadline, not at the last minute
