# Epic 18 — Web games kit (shared foundation for six web games)

Status: done

## Purpose

Six new games are built as **full v1** web games with TypeScript, Preact, Vite,
Vitest and Capacitor 8. Before any of them starts, this epic delivers the
shared foundation so each game branch only adds game code:

1. `apps-games/web-kit` (`@web-games/kit`): framework code (save, daily seed,
   settings, audio, haptics, share, lifecycle, router, Preact UI primitives,
   fonts, assets, motion, strings), fully unit-tested.
2. Six game skeletons (`apps-games/<slug>` + `apps-games/<slug>-core`), the
   final `bun.lock`, root scripts, Biome and Knip wiring, and six registry
   entries.
3. A web-games CI workflow and the internal architecture doc.

The six games and their epics:

| Epic | Game (working title) | Slug | Wave |
|---|---|---|---|
| 19 | Lantern Loops | `lantern-loops` | 1 |
| 20 | Floodplain Dispatch | `floodplain-dispatch` | 1 |
| 21 | Cloud Observatory | `cloud-observatory` | 1 |
| 22 | The Last Window | `the-last-window` | 2 |
| 23 | Dress Rehearsal | `dress-rehearsal` | 2 |
| 24 | Lost Parcel Desk | `lost-parcel-desk` | 2 |

The game specs live in `.claude/workflows/web-games-v1-args.json` (read-only).
Each game's knowledge base is `.agents/games/<slug>/`, and its epic is
`tasks/epics/<epic>-web-<slug>/STATUS.md`.

## Decisions (owner, 2026-10-23)

These are final. Do not reopen them.

1. Owner decisions 2026-10-23: build all six web games as FULL v1 (complete
   loop, full v1 content, progression, local save, reviewed art, custom OFL
   fonts, CC0 audio, haptics, onboarding, Capacitor Android/iOS projects). No
   store submission.
2. Two waves after a shared kit: wave 1 lantern-loops, floodplain-dispatch,
   cloud-observatory; wave 2 the-last-window, dress-rehearsal,
   lost-parcel-desk.
3. No monetization in v1: soft currency/unlocks only, no ads, no IAP, no
   accounts, no network calls. Economy leaves room for IAP later.
4. QA is browser-only and done by the owner at the end. Agents do NO visual
   QA: no browsers, Playwright, screenshots of the app, device or emulator, no
   APK build, no JDK install.
5. Stack: TypeScript + Vite + Preact + Vitest (happy-dom), Capacitor 8 for
   Android/iOS project files. Rendering is DOM/SVG/Canvas 2D. No Babylon, no
   PixiJS, no game engines.
6. Each game = `apps-games/<slug>` (app, `@web-games/<slug>`) +
   `apps-games/<slug>-core` (pure headless TS rules,
   `@web-games/<slug>-core`). Shared code lives in `apps-games/web-kit`
   (`@web-games/kit`).
7. Portrait orientation, offline-first, local save only (Capacitor Preferences
   on device, localStorage on web), versioned with migrations. Daily modes are
   seeded from the local date, generated on device, no server.
8. All graphics come from the MobileGamesDesigner T3 thread and must pass a
   strict art review; no AI slop is integrated. Fonts are OFL (Google Fonts
   repo); audio is CC0 only (Kenney or sources that state CC0).
9. Working titles are used as public names in v1; naming research is a later
   step.
10. Every game ships through its own branch, worktree and PR; the orchestrator
    (main Claude session) creates, reviews and merges PRs and updates local
    main.

## Pin rule

Exact-pin every dependency. Reuse the exact versions already used by
`apps-games/city-drive/package.json` for preact, vite, vitest, typescript,
happy-dom, sharp, @types/node and all @capacitor/* packages it uses.
@capacitor/share must be the newest 8.x release, exact-pinned. Add no other
runtime dependency to the kit or any skeleton.

Recorded at planning time (2026-10-23), to be re-checked in task 01:
`@capacitor/share` newest stable 8.x is `8.0.3` (npm `latest` tag). Nightly
builds (`8.0.4-nightly-*`) are not releases. City Drive declares
`@types/node` as `^20.11.17`, which resolves to `20.19.43` in `bun.lock`; the
kit uses the exact resolved version.

## Scope fence

Allowed edits for this epic and the game epics that follow it:

- `apps-games/web-kit/**`, and each game's `apps-games/<slug>/**`,
  `apps-games/<slug>-core/**`, `.agents/games/<slug>/README.md` (placeholder)
- `tasks/epics/18-web-games-kit/**`, `tasks/STATUS.md`
- `package.json` (root scripts only), `bun.lock`, `biome.json`, `knip.json`,
  `tsconfig*.json`
- `scripts/games/registry-games.ts`, `scripts/games/registry-types.ts`,
  `scripts/games/*.test.ts`
- `scripts/games/registry.ts` (validation and message logic that `registry-web.test.ts`
  exercises; extension recorded in task 03 because the test cannot pass without it)
- `.github/workflows/web-games-ci.yml`
- `docs-internal/gaming/web-games-kit.md`, `docs-internal/docs.json`
- `.agents/resources/2026-10-23/web-games/**`

Read-only: City Drive (`apps-games/city-drive*`), every Flutter game, Ludo
(`apps-native/games/ludo`, `packages/ludo_rules`, epic 15), Merge Relay, and
all other workflows and apps.

Rules that apply to every task:

- No visual QA by agents (decision 4). Verify headlessly with Vitest
  (happy-dom), `tsc`, `vite build` and Biome.
- Fonts: OFL, bundled as woff2 with `OFL.txt`; no text may fall back to the
  platform default font.
- Audio: CC0 only; record the source URL and licence per file. Never
  synthesize audio and call it CC0.
- Code files stay under 800 lines. No `any`; named imports; no comments unless
  needed (repo convention).
- Throwaway downloads go under
  `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/web-games-kit/`, never
  `/tmp`.
- Evidence goes under `.agents/resources/2026-10-23/web-games/web-games-kit/`.
- The knowledge base `.agents/games/web-games-kit/` is updated in the same
  commit as any decision or number change.

## Execution order

Filename order is execution order. Task 00 is documentation only; tasks 01 to
03 are code and run on branch `feat/web-games-kit`. Game epics 19 to 24 start
only after this epic is merged to `main`; each game branch must not touch
`bun.lock`.

## Tasks

| ID | Task | Owner | Status |
|---|---|---|---|
| 00 | Kit epic, task files and portfolio status | agent | [x] |
| 01 | Shared web-games kit package (`apps-games/web-kit`) | agent | [x] |
| 02 | Six game skeletons, workspace wiring and registry entries | agent | [x] |
| 03 | Web-games CI and internal docs | agent | [x] |

## Verification gate for tasks 01 to 03

```
bun run --filter '@web-games/*' typecheck
bun run --filter '@web-games/*' test
bun run --filter '@web-games/*' build
bunx biome check apps-games scripts/games
bun test --max-concurrency=1 scripts/games/registry-web.test.ts
```

`scripts/games/registry-web.test.ts` is created in task 02.

## Evidence

Research notes, version records and licence records go under
`.agents/resources/2026-10-23/web-games/web-games-kit/<task-id>/` with a
`README.md`, committed with their task.
