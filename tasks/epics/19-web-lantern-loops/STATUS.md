# Epic 19 — Lantern Loops (daily logic puzzle, full v1 web game)

Status: done (tasks 00 to 08 done; owner browser QA remains)

## Purpose

Build **Lantern Loops** as a full v1 web game on the shared kit (epic 18): daily logic puzzles where
the player routes light from lanterns through an N x N grid (5x5 to 9x9) so every lantern is lit,
every path closes into loops, and the board constraints (numbered stones, mirrors, colour gates)
hold. 120 campaign puzzles in 4 chapters of 30 (Harbor, Garden, Bridge, Sky), a daily puzzle
generated on the device from the date, a 30-day archive, stars, hint tokens, a daily streak with a
weekly freeze, statistics and an emoji-grid share. Every shipped puzzle is proven by a solver to
have exactly one solution.

"Lantern Loops" is the working title and the public name in v1. Slug `lantern-loops`, branch
`feat/web-lantern-loops`, appId `app.w3dev.lanternloops`.

The full game design lives in the knowledge base `.agents/games/lantern-loops/`: start with
[`README.md`](../../../.agents/games/lantern-loops/README.md) (quick facts), then `product.md` (exact
rules), `economy.md` (every number), `content-plan.md` (every named content item).

## Decisions (owner, 2026-10-23)

These are final. Do not reopen them.

| # | Decision |
|---|---|
| 1 | Full v1: complete loop, full content, progression, local save, reviewed art, custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android/iOS projects. No store submission |
| 2 | Wave 1 with Floodplain Dispatch and Cloud Observatory, after the kit (epic 18, merged) |
| 3 | No monetization: soft currency and unlocks only; no ads, IAP, accounts or network calls |
| 4 | QA is browser-only and done by the owner at the end. Agents do no visual QA: no browser, Playwright, screenshots of the app, device, emulator, APK build or JDK install |
| 5 | Stack: TypeScript, Vite, Preact, Vitest (happy-dom), Capacitor 8; DOM/SVG/Canvas 2D; no game engines |
| 6 | `apps-games/lantern-loops` (app) + `apps-games/lantern-loops-core` (pure headless rules) + shared `apps-games/web-kit` |
| 7 | Portrait, offline-first, versioned local save, dailies seeded from the local date and generated on device |
| 8 | All graphics from the MobileGamesDesigner thread after a strict art review; fonts OFL (Fraunces + Nunito); audio CC0 only |
| 9 | Working title is the public name in v1 |
| 10 | One branch, worktree and PR per game; the orchestrator creates, reviews and merges the PR |

## Game design decisions (2026-10-23, see `decisions-log.md` for rationale)

| Area | Choice |
|---|---|
| Rules | Tile bitmask model (N=1, E=2, S=4, W=8); six tiles; multiple loops; every loop has a lantern; stones count lit neighbours; mirrors force a diagonal corner; gates force a straight tile on a loop of their colour; fixed tiles pin uniqueness |
| Content | 120 puzzles: Harbor 10x5x5 + 10x6x6 + 10x7x7; Garden 5/10/10/5; Bridge 4/8/8/6/4; Sky 4/8/10/8 |
| Unlocks | Garden 45, Bridge 120, Sky 210 total stars (max 360); all puzzles of an unlocked chapter are open |
| Stars | 0 hints = 3, 1 hint = 2, 2+ hints = 1 |
| Tokens | Start 3, cap 20, hint costs 1; daily +1 (+1 no hints), milestones 3/7/14/30/60/100 = +1/+2/+2/+4/+5/+8, archive +1 once per date, chapter cleared +5 |
| Streak | Freeze: 1 per ISO week, cap 1, auto-spent on exactly one missed day |
| Daily | Mon 5x5, Tue 6x6, Wed 7x7, Thu 7x7 + mirrors, Fri 8x8, Sat 8x8 + gates, Sun 9x9; generator version `ll-gen-1` |
| Budgets | JS <= 300 KB gzip (art, fonts, audio excluded), art <= 8 MB, audio <= 1.5 MB, each woff2 <= 120 KB |
| Fonts | Fraunces (display), Nunito (body) |

## Scope fence

Allowed edits for this epic (every task):

- `apps-games/lantern-loops/**`
- `apps-games/lantern-loops-core/**`
- `.agents/games/lantern-loops/**`
- `.agents/resources/2026-10-23/web-games/lantern-loops/**`
- `tasks/epics/19-web-lantern-loops/**`

Read-only: `apps-games/web-kit` and every other game, `bun.lock`, root `package.json`,
`tasks/STATUS.md`, `scripts/`, `.github/`, `docs-internal/`, City Drive, the Flutter games, Ludo.
Add or change no dependency: the skeleton `package.json` already holds the full v1 dependency set.
If a kit bug blocks a task, work around it inside this game and record a kit follow-up in
`.agents/games/lantern-loops/open-questions.md`. If a task truly needs an out-of-fence change, stop
and return blocked naming the file and the change.

## Rules that apply to every task

- No visual QA by agents (decision 4): verify headlessly with Vitest (happy-dom), `tsc`,
  `vite build` and Biome. No task requires a browser, a device or a screenshot.
- Core purity: `apps-games/lantern-loops-core/src` never mentions `window`, `document`,
  `Date.now`, `performance.now`, `Math.random` or `localStorage` (the architecture test scans for them).
- Code files stay under 800 lines. No `any`. Named imports. No comments unless needed.
- Fonts: OFL, bundled woff2 with `OFL.txt`; no rendered text may fall back to a platform font.
- Audio: CC0 only; record the source URL and licence per file; never synthesize audio and call it CC0.
- Throwaway downloads go under `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/lantern-loops/`,
  never `/tmp`; delete them when done.
- Evidence goes under `.agents/resources/2026-10-23/web-games/lantern-loops/<task-id>/` with a README.
- The knowledge base `.agents/games/lantern-loops/` is updated in the same commit as any decision or
  number change; the README quick facts must match the code constants (tests enforce key numbers).
- Conventional commits `type(lantern-loops): summary [19-web-lantern-loops/NN]`, no Co-Authored-By
  or "Generated with" lines, never `--no-verify`.

## Execution order

Filename order is execution order. Tasks 01 to 08 are all `owner: agent`; none needs a human, but
task 06 can only integrate art that the designer thread delivered and the review accepted, and keeps
code-drawn placeholders for every other slot. The owner does browser QA after task 08.

## Tasks

| ID | Task | Owner | Status |
|---|---|---|---|
| 00 | Knowledge base, design spec and epic task files | agent | [x] |
| 01 | Core rules engine (headless, in `lantern-loops-core`) | agent | [x] |
| 02 | Full v1 content + validators | agent | [x] |
| 03 | Progression, economy, daily mode, versioned save | agent | [x] |
| 04 | All screens, navigation, design tokens, fonts, accessibility | agent | [x] |
| 05 | CC0 audio, haptics, motion polish, onboarding and how-to-play | agent | [x] |
| 06 | Integrate reviewed art from the designer inbox | agent | [x] |
| 07 | Capacitor Android/iOS projects, icons and splash | agent | [x] |
| 08 | Release readiness, budgets, knowledge base, owner QA checklist | agent | [x] |

## Verification gate (every code task)

```
bun run --filter '@web-games/lantern-loops*' typecheck
bun run --filter '@web-games/lantern-loops*' test
bun run --filter '@web-games/lantern-loops' build
bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core
```

Pre-existing failures are proven by running the same command in a throwaway worktree of
`origin/main` and recorded as pre-existing.

## Evidence

Research notes, reports, licence records and the owner QA checklist go under
`.agents/resources/2026-10-23/web-games/lantern-loops/`.
