# Epic 23 - Dress Rehearsal (full v1 web game)

Status: in progress (task 00 done: knowledge base, design spec and task files; tasks 01 to 08 to do)

## Purpose

Build **Dress Rehearsal** as a full v1 web game on the shared kit (epic 18): a fashion styling
puzzle. A client's brief gives 2 to 4 rules (palette, era, formality, weather, features, budget,
must and must-not pieces). The player drags garments and accessories into 6 to 8 slots on a
flat-lay lookbook board (no body or mannequin), a transparent rule engine scores constraint
satisfaction and style harmony (colour theory and era, dress-code and season tags) for 1 to 3
stars, and the finished board is exported as an image and shared.

v1 ships: 6 chapters (Riviera Summer, Rainy City, Gala Night, Mountain Weekend, Studio
Avant-garde, Vintage 70s), 40 challenges each proven to have a three-star look, 48 closet pieces
that grow with unlocked chapters, 6 recurring clients with original lines and affinity, a Daily
Fitting generated from the date seed with a three-star look proven over 365 dates, stars, coins,
hints and streak freezes, a local gallery of up to 24 boards, image export with four frames,
all screens, custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android and iOS projects,
and an owner browser QA checklist. No store submission, no monetization.

Knowledge base: [`.agents/games/dress-rehearsal/`](../../../.agents/games/dress-rehearsal/README.md)
(product, economy, content plan, store listing, assets index, decisions log, open questions).
Planning evidence and the rules prototype:
`.agents/resources/2026-10-23/web-games/dress-rehearsal/00/`.
Kit: [`tasks/epics/18-web-games-kit/STATUS.md`](../18-web-games-kit/STATUS.md).

## Decisions (owner, 2026-10-23, final)

| # | Decision |
|---|---|
| 1 | Full v1: complete loop, full content, progression, local save, reviewed art, custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android and iOS projects. No store submission. |
| 2 | Wave 2 after the kit (with The Last Window and Lost Parcel Desk). This game is epic 23. |
| 3 | No monetization: soft currency and unlocks only, no ads, no IAP, no accounts, no network. |
| 4 | QA is browser-only and done by the owner at the end; agents never use a browser, device, emulator, JDK or APK build. |
| 5 | Stack: TypeScript, Vite, Preact, Vitest (happy-dom), Capacitor 8; DOM, SVG and Canvas 2D; no engines. |
| 6 | `apps-games/dress-rehearsal` (app) + `apps-games/dress-rehearsal-core` (headless rules); shared code in `apps-games/web-kit`. |
| 7 | Portrait, offline-first, local save only (Preferences on device, localStorage on web), versioned with migrations; daily seeded from the local date, generated on device. |
| 8 | Graphics only from the MobileGamesDesigner thread after strict review; fonts OFL (Playfair Display, DM Sans); audio CC0 only. |
| 9 | Working title is the public name in v1. |
| 10 | Own branch `feat/web-dress-rehearsal` and PR; the orchestrator opens, reviews and merges. |

Design decisions made in task 00 (see `decisions-log.md`): eight slot kinds with a one-piece rule,
16 rule kinds, the five-part harmony score and the three-star bar at 70, stars as presentable /
on brief / polished, a 16-piece starting closet with two open chapters, chapter unlocks at 12 /
27 / 45 / 66 stars, proof counts and share caps per chapter, six clients with affinity at 3 / 9 /
15 stars, coins as the only currency (1460 from the campaign), hints 20 / 30, freezes 25, export
frames 30 / 40 / 60, a seed-look daily generator with 7 fallbacks, a 24-board gallery stored as
data, 63 art slots, 24 sounds and 2 music loops.

## Scope fence

Allowed edits for this epic:

- `apps-games/dress-rehearsal/**`
- `apps-games/dress-rehearsal-core/**`
- `.agents/games/dress-rehearsal/**`
- `.agents/resources/2026-10-23/web-games/dress-rehearsal/**`
- `tasks/epics/23-web-dress-rehearsal/**`

Read-only: `apps-games/web-kit`, every other game and web game, City Drive, Ludo, Flutter games,
`bun.lock`, the root `package.json`, `tasks/STATUS.md`, `scripts/`, workflows. If a task needs a
change outside the fence, stop and report the exact file and change to the orchestrator.

Rules for every task:

- No visual QA; verify with Vitest (happy-dom), `tsc`, `vite build` and Biome.
- Fonts OFL bundled as woff2 with `OFL.txt`; no text falls back to a platform font.
- Audio CC0 only with source URL and licence per file; never synthesised.
- Code files under 800 lines; no `any`; named imports; no comments unless needed.
- Throwaway files under `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/dress-rehearsal/`,
  never `/tmp`.
- The knowledge base is updated in the same commit as any decision or number change.
- Exact-pin rule: no dependency changes (the skeleton already holds the full v1 set).

## Tasks

| ID | Task | Kind | Owner | Status |
|---|---|---|---|---|
| 00 | Knowledge base, design spec and epic task files (no task file; this epic folder) | docs | agent | [x] |
| 01 | [Core rules engine (headless, in dress-rehearsal-core)](01-core-rules.md) | code | agent | [ ] |
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
bun run --filter '@web-games/dress-rehearsal*' typecheck
bun run --filter '@web-games/dress-rehearsal*' test
bun run --filter '@web-games/dress-rehearsal' build
bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core
```

## Evidence

Research notes, tool commands, licence records and the owner QA checklist go under
`.agents/resources/2026-10-23/web-games/dress-rehearsal/` (per-task folders `00/` to `08/`,
`art/masters/`, `qa-checklist.md`), committed with their task.

## Commit format

`type(dress-rehearsal): summary [23-web-dress-rehearsal/NN]`, no co-author or generated-by lines,
never `--no-verify`.
