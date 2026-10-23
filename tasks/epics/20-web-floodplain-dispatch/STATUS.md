# Epic 20 - Floodplain Dispatch (full v1 web game)

Status: in progress (tasks 00 to 04 done; task 05 in progress; tasks 06 to 08 todo)

## Purpose

Build **Floodplain Dispatch** as a full v1 web game on the shared kit (epic 18): a compact
top-down water-routing puzzle. The player places canals, pumps, sandbag barriers, sluice gates and
reservoirs on a 8 x 12 to 12 x 16 grid, runs a deterministic flood season of 20 to 30 weeks, and
tries to supply every house and field, flood no house, and stay within par.

v1 ships: 40 campaign maps in four regions (Valley, Delta, Highland, Estuary) with proven reference
solutions, a Daily Dispatch with a 3-star solution proven over 365 dates, stars, coins and hints,
seven map themes, records and share text, all screens, custom OFL fonts, CC0 audio, haptics,
onboarding, Capacitor Android and iOS projects, and an owner browser QA checklist. No store
submission, no monetization.

Knowledge base: [`.agents/games/floodplain-dispatch/`](../../../.agents/games/floodplain-dispatch/README.md)
(product, economy, content plan, store listing, assets index, decisions log, open questions).
Kit: [`tasks/epics/18-web-games-kit/STATUS.md`](../18-web-games-kit/STATUS.md).

## Decisions (owner, 2026-10-23, final)

| # | Decision |
|---|---|
| 1 | Full v1: complete loop, full content, progression, local save, reviewed art, custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android and iOS projects. No store submission. |
| 2 | Wave 1 after the kit (with Lantern Loops and Cloud Observatory). This game is epic 20. |
| 3 | No monetization: soft currency and unlocks only, no ads, no IAP, no accounts, no network. |
| 4 | QA is browser-only and done by the owner at the end; agents never use a browser, device, emulator, JDK or APK build. |
| 5 | Stack: TypeScript, Vite, Preact, Vitest (happy-dom), Capacitor 8; DOM, SVG and Canvas 2D; no engines. |
| 6 | `apps-games/floodplain-dispatch` (app) + `apps-games/floodplain-dispatch-core` (headless rules); shared code in `apps-games/web-kit`. |
| 7 | Portrait, offline-first, local save only (Preferences on device, localStorage on web), versioned with migrations; daily seeded from the local date, generated on device. |
| 8 | Graphics only from the MobileGamesDesigner thread after strict review; fonts OFL (Bricolage Grotesque, Atkinson Hyperlegible); audio CC0 only. |
| 9 | Working title is the public name in v1. |
| 10 | Own branch `feat/web-floodplain-dispatch` and PR; the orchestrator opens, reviews and merges. |

Design decisions made in task 00 (see `decisions-log.md`): region mechanics (Valley surges, Delta
sluice timing, Highland reservoirs and droughts, Estuary tides), integer snapshot flow model, step
counting goals, cumulative stars, par equals the reference cost and budget equals par + 3, coins as
the only currency (1250 from the campaign), region unlocks at 12 / 33 / 60 stars, seven themes.

## Scope fence

Allowed edits for this epic:

- `apps-games/floodplain-dispatch/**`
- `apps-games/floodplain-dispatch-core/**`
- `.agents/games/floodplain-dispatch/**`
- `.agents/resources/2026-10-23/web-games/floodplain-dispatch/**`
- `tasks/epics/20-web-floodplain-dispatch/**`

Read-only: `apps-games/web-kit`, every other game and web game, City Drive, Ludo, Flutter games,
`bun.lock`, the root `package.json`, `tasks/STATUS.md`, `scripts/`, workflows. If a task needs a
change outside the fence, stop and report the exact file and change to the orchestrator.

Rules for every task:

- No visual QA; verify with Vitest (happy-dom), `tsc`, `vite build` and Biome.
- Fonts OFL bundled as woff2 with `OFL.txt`; no text falls back to a platform font.
- Audio CC0 only with source URL and licence per file; never synthesised.
- Code files under 800 lines; no `any`; named imports; no comments unless needed.
- Throwaway files under `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/floodplain-dispatch/`,
  never `/tmp`.
- The knowledge base is updated in the same commit as any decision or number change.
- Exact-pin rule: no dependency changes (the skeleton already holds the full v1 set).

## Tasks

| ID | Task | Kind | Owner | Status |
|---|---|---|---|---|
| 00 | Knowledge base, design spec and epic task files (no task file; this epic folder) | docs | agent | [x] |
| 01 | [Core rules engine (headless, in floodplain-dispatch-core)](01-core-rules.md) | code | agent | [x] |
| 02 | [Full v1 content + validators](02-content.md) | code | agent | [x] |
| 03 | [Progression, economy, daily mode, versioned save](03-progression-and-save.md) | code | agent | [x] |
| 04 | [All screens, navigation, design tokens, fonts, accessibility](04-screens-and-ui.md) | code | agent | [x] |
| 05 | [CC0 audio, haptics, motion polish, onboarding and how-to-play](05-audio-haptics-onboarding.md) | code | agent | [x] |
| 06 | [Integrate reviewed art from the designer inbox](06-art-integration.md) | art | agent | [ ] |
| 07 | [Capacitor Android/iOS projects, icons and splash](07-capacitor-packaging.md) | code | agent | [ ] |
| 08 | [Release readiness, budgets, knowledge base, owner QA checklist](08-release-readiness.md) | code | agent | [ ] |

Filename order is execution order. `[~]` means in progress.

## Verification gate (every code task)

```
bun run --filter '@web-games/floodplain-dispatch*' typecheck
bun run --filter '@web-games/floodplain-dispatch*' test
bun run --filter '@web-games/floodplain-dispatch' build
bunx biome check apps-games/floodplain-dispatch apps-games/floodplain-dispatch-core
```

## Evidence

Research notes, tool commands, licence records and the owner QA checklist go under
`.agents/resources/2026-10-23/web-games/floodplain-dispatch/` (per-task folders `02/` to `08/`,
`art/masters/`, `qa-checklist.md`), committed with their task.

## Commit format

`type(floodplain-dispatch): summary [20-web-floodplain-dispatch/NN]`, no co-author or generated-by
lines, never `--no-verify`.
