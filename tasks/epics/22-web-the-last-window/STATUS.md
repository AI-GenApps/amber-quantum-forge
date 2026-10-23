# Epic 22 - The Last Window (full v1 web game)

Status: in progress (tasks 00 and 01 done; tasks 02 to 08 todo)

## Purpose

Build **The Last Window** as a full v1 web game on the shared kit (epic 18): a cosy cafe-bookshop shift
game in the harbour town of Port Merrow. The player runs 3 to 4 minute shifts at a three-seat counter,
making drinks and pastries with short tap sequences, matching books to customers' moods, planning
tomorrow's limited shelves, buying decor, and growing friendships with eight regulars whose five-scene
stories (with choices and two endings each) end on Lantern Night, Day 14.

v1 ships: a 14-day campaign (130 customers, three weather variants), 8 regulars with 40 scenes, 12
choices and 16 endings, 6 drinks, 5 pastries, 5 books, 8 decor items, a Journal and Shop Diary, coins and
friendship progression, Late Shifts (endless mode seeded from the local date) with a streak, all
screens, custom OFL fonts (Young Serif, Nunito Sans), CC0 audio, haptics, onboarding, Capacitor Android
and iOS projects and an owner browser QA checklist. No store submission, no monetization.

Knowledge base: [`.agents/games/the-last-window/`](../../../.agents/games/the-last-window/README.md)
(product, economy, content plan, store listing, assets index, decisions log, open questions).
Kit: [`tasks/epics/18-web-games-kit/STATUS.md`](../18-web-games-kit/STATUS.md).

## Decisions (owner, 2026-10-23, final)

| # | Decision |
|---|---|
| 1 | Full v1: complete loop, full content, progression, local save, reviewed art, custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android and iOS projects. No store submission. |
| 2 | Wave 2 after the kit (with Dress Rehearsal and Lost Parcel Desk). This game is epic 22. |
| 3 | No monetization: soft currency and unlocks only, no ads, no IAP, no accounts, no network. |
| 4 | QA is browser-only and done by the owner at the end; agents never use a browser, device, emulator, JDK or APK build. |
| 5 | Stack: TypeScript, Vite, Preact, Vitest (happy-dom), Capacitor 8; DOM, SVG and Canvas 2D; no engines. |
| 6 | `apps-games/the-last-window` (app) + `apps-games/the-last-window-core` (headless rules); shared code in `apps-games/web-kit`. |
| 7 | Portrait, offline-first, local save only (Preferences on device, localStorage on web), versioned with migrations; date-seeded modes generated on device. |
| 8 | Graphics only from the MobileGamesDesigner thread after strict review; fonts OFL (Young Serif, Nunito Sans); audio CC0 only. |
| 9 | Working title is the public name in v1. |
| 10 | Own branch `feat/web-the-last-window` and PR; the orchestrator opens, reviews and merges. |

Design decisions made in task 00 (see `decisions-log.md`): Port Merrow premise and Lantern Night finale;
100 ms tick with 180 / 210 / 240 s shifts; three seats with an active ticket; recipes as step
sequences with timers; 5 moods on 5 books (two tags each); satisfaction tiers and tips; stock plan with 5
portions per kind; friendship thresholds 1, 2, 4, 6, 8 and a visit calendar of 5 visits per regular plus a
Day 14 finale; majority-lean endings; weather by `day mod 3`; decor total 1,200; Late Shifts as the
endless mode; accessibility options (recipe guide, relaxed mode, text size).

## Scope fence

Allowed edits for this epic:

- `apps-games/the-last-window/**`
- `apps-games/the-last-window-core/**`
- `.agents/games/the-last-window/**`
- `.agents/resources/2026-10-23/web-games/the-last-window/**`
- `tasks/epics/22-web-the-last-window/**`

Read-only: `apps-games/web-kit`, every other game and web game, City Drive, Ludo, Flutter games,
`bun.lock`, the root `package.json`, `tasks/STATUS.md`, `scripts/`, workflows. If a task needs a
change outside the fence, stop and report the exact file and change to the orchestrator.

Rules for every task:

- No visual QA; verify with Vitest (happy-dom), `tsc`, `vite build` and Biome.
- Fonts OFL bundled as woff2 with `OFL.txt`; no text falls back to a platform font.
- Audio CC0 only with source URL and licence per file; never synthesised.
- Code files under 800 lines; no `any`; named imports; no comments unless needed.
- Throwaway files under `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/the-last-window/`, never `/tmp`.
- The knowledge base is updated in the same commit as any decision or number change.
- Exact-pin rule: no dependency changes (the skeleton already holds the full v1 set).

## Tasks

| ID | Task | Kind | Owner | Status |
|---|---|---|---|---|
| 00 | Knowledge base, design spec and epic task files (no task file; this epic folder) | docs | agent | [x] |
| 01 | [Core rules engine (headless, in the-last-window-core)](01-core-rules.md) | code | agent | [x] |
| 02 | [Full v1 content + validators](02-content.md) | code | agent | [ ] |
| 03 | [Progression, economy, daily mode, versioned save](03-progression-and-save.md) | code | agent | [ ] |
| 04 | [All screens, navigation, design tokens, fonts, accessibility](04-screens-and-ui.md) | code | agent | [ ] |
| 05 | [CC0 audio, haptics, motion polish, onboarding and how-to-play](05-audio-haptics-onboarding.md) | code | agent | [ ] |
| 06 | [Integrate reviewed art from the designer inbox](06-art-integration.md) | art | agent | [ ] |
| 07 | [Capacitor Android/iOS projects, icons and splash](07-capacitor-packaging.md) | code | agent | [ ] |
| 08 | [Release readiness, budgets, knowledge base, owner QA checklist](08-release-readiness.md) | code | agent | [ ] |

Filename order is execution order. `[~]` means in progress.

## Verification gate (every code task)

```
bun run --filter '@web-games/the-last-window*' typecheck
bun run --filter '@web-games/the-last-window*' test
bun run --filter '@web-games/the-last-window' build
bunx biome check apps-games/the-last-window apps-games/the-last-window-core
```

## Evidence

Research notes, tool commands, licence records and the owner QA checklist go under
`.agents/resources/2026-10-23/web-games/the-last-window/` (per-task folders `02/` to `08/`,
`art/masters/`, `qa-checklist.md`), committed with their task.

## Commit format

`type(the-last-window): summary [22-web-the-last-window/NN]`, no co-author or generated-by lines, never
`--no-verify`.
