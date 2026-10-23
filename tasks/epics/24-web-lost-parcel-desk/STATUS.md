# Epic 24 - Lost Parcel Desk (full v1 web game)

Status: in progress (task 00 done; task 01 done; task 02 done; task 03 done; task 04 done; tasks 05 to 08 pending)

## Purpose

Build **Lost Parcel Desk** as a full v1 web game on the shared kit (epic 18): bite-sized detective stories at
a small-town post office. In each of 12 cases the player opens a lost parcel, inspects 4 or 5 evidence
objects (pick up, flip to read notes and stamps, magnify small details), pins clues to a deduction board,
links them to three townsfolk (fits or rules out) and accuses the owner. A wrong accusation costs a stamp.
Hints reveal a clue link. Every case is proven by a validator to have exactly one consistent owner, with
every clue necessary or marked flavour.

v1 ships: 12 original cases in 3 chapters with 49 evidence objects, 70 clues and 24 deductions (direct,
key-and-lock pairs and rule-outs), a recurring cast of 12 townsfolk, a flood-night ledger told in 12
fragments, a town map that fills in, stamps (1 to 3 per case, 36 in total), postage and hints, a generated
Daily Parcel with a streak proven over 365 dates, 12 achievements, 5 desk themes, all screens, custom OFL
fonts, CC0 audio, haptics, onboarding, Capacitor Android and iOS projects and an owner browser QA
checklist. No store submission, no monetization.

Knowledge base: [`.agents/games/lost-parcel-desk/`](../../../.agents/games/lost-parcel-desk/README.md)
(product, economy, content plan, store listing, assets index, decisions log, open questions).
Kit: [`tasks/epics/18-web-games-kit/STATUS.md`](../18-web-games-kit/STATUS.md).

## Decisions (owner, 2026-10-23, final)

| # | Decision |
|---|---|
| 1 | Full v1: complete loop, full content, progression, local save, reviewed art, custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android and iOS projects. No store submission. |
| 2 | Wave 2 after the kit (with The Last Window and Dress Rehearsal). This game is epic 24. |
| 3 | No monetization: soft currency and unlocks only, no ads, no IAP, no accounts, no network. |
| 4 | QA is browser-only and done by the owner at the end; agents never use a browser, device, emulator, JDK or APK build. |
| 5 | Stack: TypeScript, Vite, Preact, Vitest (happy-dom), Capacitor 8; DOM, SVG and Canvas 2D; no engines. |
| 6 | `apps-games/lost-parcel-desk` (app) + `apps-games/lost-parcel-desk-core` (headless rules); shared code in `apps-games/web-kit`. |
| 7 | Portrait, offline-first, local save only (Preferences on device, localStorage on web), versioned with migrations; daily seeded from the local date, generated on device. |
| 8 | Graphics only from the MobileGamesDesigner thread after strict review; fonts OFL (Courier Prime, IBM Plex Sans); audio CC0 only. |
| 9 | Working title is the public name in v1. |
| 10 | Own branch `feat/web-lost-parcel-desk` and PR; the orchestrator opens, reviews and merges. |

Design decisions made in task 00 (see `decisions-log.md`): the facet logic model (four facets x six
values, each value held by two people, three candidates, two necessary deductions per case), trade as
identity only, direct / key-and-lock / rule-out deductions, the link-and-accuse board with a two-witness
rule, stamps equal 3 minus wrong accusations with delivery by elimination, hints as clue links for
postage (20 campaign, 15 daily), postage as the only currency (450 from the campaign), chapter unlocks at
7 and 18 stamps, a generated Daily Parcel, 49 evidence objects (cases 01 to 11 have 4, case 12 has 5), 67
art slots, 27 sounds and 2 music loops, 5 desk themes at 0 / 6 / 14 / 24 / 33 stamps.

## Scope fence

Allowed edits for this epic:

- `apps-games/lost-parcel-desk/**`
- `apps-games/lost-parcel-desk-core/**`
- `.agents/games/lost-parcel-desk/**`
- `.agents/resources/2026-10-23/web-games/lost-parcel-desk/**`
- `tasks/epics/24-web-lost-parcel-desk/**`

Read-only: `apps-games/web-kit`, every other game and web game, City Drive, Ludo, Flutter games,
`bun.lock`, the root `package.json`, `tasks/STATUS.md`, `scripts/`, workflows. If a task needs a change
outside the fence, stop and report the exact file and change to the orchestrator.

Rules for every task:

- No visual QA; verify with Vitest (happy-dom), `tsc`, `vite build` and Biome.
- Fonts OFL bundled as woff2 with `OFL.txt`; no text falls back to a platform font.
- Audio CC0 only with source URL and licence per file; never synthesised.
- Code files under 800 lines; no `any`; named imports; no comments unless needed.
- Throwaway files under `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/lost-parcel-desk/`, never `/tmp`.
- The knowledge base is updated in the same commit as any decision or number change.
- Exact-pin rule: no dependency changes (the skeleton already holds the full v1 set).

## Tasks

| ID | Task | Kind | Owner | Status |
|---|---|---|---|---|
| 00 | Knowledge base, design spec and epic task files (no task file; this epic folder) | docs | agent | [x] |
| 01 | [Core rules engine (headless, in lost-parcel-desk-core)](01-core-rules.md) | code | agent | [x] |
| 02 | [Full v1 content + validators](02-content.md) | code | agent | [x] |
| 03 | [Progression, economy, daily mode, versioned save](03-progression-and-save.md) | code | agent | [x] |
| 04 | [All screens, navigation, design tokens, fonts, accessibility](04-screens-and-ui.md) | code | agent | [x] |
| 05 | [CC0 audio, haptics, motion polish, onboarding and how-to-play](05-audio-haptics-onboarding.md) | code | agent | [ ] |
| 06 | [Integrate reviewed art from the designer inbox](06-art-integration.md) | art | agent | [ ] |
| 07 | [Capacitor Android/iOS projects, icons and splash](07-capacitor-packaging.md) | code | agent | [ ] |
| 08 | [Release readiness, budgets, knowledge base, owner QA checklist](08-release-readiness.md) | code | agent | [ ] |

Filename order is execution order. `[~]` means in progress.

## Verification gate (every code task)

```
bun run --filter '@web-games/lost-parcel-desk*' typecheck
bun run --filter '@web-games/lost-parcel-desk*' test
bun run --filter '@web-games/lost-parcel-desk' build
bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core
```

## Evidence

Research notes, tool commands, licence records and the owner QA checklist go under
`.agents/resources/2026-10-23/web-games/lost-parcel-desk/` (per-task folders `02/` to `08/`,
`art/masters/`, `qa-checklist.md`), committed with their task.

## Commit format

`type(lost-parcel-desk): summary [24-web-lost-parcel-desk/NN]`, no co-author or generated-by lines, never
`--no-verify`.
