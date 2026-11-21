# Dead Air -- 1873: plan with overlaps

Start: 2026-11-19. Submit: 2026-12-01. That is 13 days.
Work overlaps on purpose. Requirements keep changing while music and logic are built.

```mermaid
gantt
    title Dead Air -- 1873 (Kiroween)
    dateFormat  YYYY-MM-DD
    axisFormat  %d.%m
    todayMarker on

    section Spec (stays open)
    Refine requirements (ongoing)   :crit, spec1, 2026-11-19, 8d
    Design.md                       :spec2, 2026-11-20, 4d
    Tasks.md                        :spec3, 2026-11-23, 2d

    section Music and sound (early)
    Audio engine, mixer             :aud1, 2026-11-20, 4d
    Horror music, drone, rain       :aud2, 2026-11-22, 6d
    Horror one-shots, static        :aud3, 2026-11-25, 5d
    Cozy music                      :aud4, 2026-11-28, 2d

    section Logic
    Page skeleton, SVG              :core1, 2026-11-20, 2d
    Morse engine (press, gap)       :core2, 2026-11-21, 3d
    Sending                         :game1, 2026-11-23, 3d
    Lives and candle                :game2, 2026-11-25, 3d
    Tutorial                        :game3, 2026-11-26, 3d
    Receiving                       :game4, 2026-11-27, 3d
    Days and progression            :game5, 2026-11-28, 2d

    section Modes and polish
    Day 3 full horror               :atm2, 2026-11-28, 3d
    Cozy mode                       :atm3, 2026-11-28, 2d
    Stats, ranks, saves             :pol1, 2026-11-29, 2d
    Accessibility                   :pol2, 2026-11-29, 2d

    section Ship
    Browser tests, bug fixes        :crit, pol3, 2026-11-29, 3d
    Final build and submit          :crit, ship1, 2026-12-01, 1d
```

## Overlaps

| Work A | Overlaps with | Why |
|---|---|---|
| Requirements | Design, audio, Morse engine | Wording changes, code follows |
| Audio engine | Design | Sound needs no final design |
| Horror music | Sending, lives | Music is a separate file |
| Tutorial | Lives, receiving | Reuses the same Morse engine |
| Day 3 horror, Cozy | Days, stats | Same screens, new rules |
| Tests | Polish | Fix bugs as they show up |

## Milestones

| Date  | Goal |
|-------|------|
| 22.11 | Audio engine and Morse engine work |
| 25.11 | Requirements and design settled |
| 26.11 | Sending works |
| 28.11 | Lives, tutorial work |
| 01.12 | Submit |

## Risks

- No spare day. Stop adding features on 30.11.
- Cut first if late: horror one-shot sounds, then Cozy music.
- Test Safari and Firefox audio on 29.11, not later.
