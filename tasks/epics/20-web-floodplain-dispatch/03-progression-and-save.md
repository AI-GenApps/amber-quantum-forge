---
epic: 20-web-floodplain-dispatch
task: 03-progression-and-save
status: in-progress
commit_scope: floodplain-dispatch
depends_on: [20-web-floodplain-dispatch/02-content]
estimate: XL
owner: agent
---

# Progression, economy, daily mode, versioned save

## Goal

Implement everything that persists or unlocks: stars and unlocks, coins, hints, streak freezes, records, the Daily Dispatch (generator, bounded solver, 365-date proof, fallback templates) and the versioned profile save on the kit save store, with migration tests. Rules are pure functions in the core; the app wires them to the kit save store, settings store and clock.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/floodplain-dispatch/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** `economy.md` (every number), `product.md` "Campaign structure", "Daily Dispatch" and "Hints". The tests assert the economy tables row by row.
- **Core stays dependency-free:** the core cannot import the kit. Date handling is therefore done in the app with the kit (`localDateKey`, `streakStep`, `dailySeed`, `dayNumber`) and passed in as plain values: a `dateKey` string, a `StreakStep` string, a numeric `seed` and a weekday number 0 to 6 (0 = Monday). The core exports pure reducers that take these values.
- **Profile v1** (`PROFILE_VERSION = 1`, key `floodplain-dispatch.profile`): `coins`, `stars: Record<mapId, 0 | 1 | 2 | 3>`, `best: Record<mapId, { score, stars, spend }>`, `regionBonusClaimed: Record<regionId, true>`, `themeSelected`, `streakFreezes` (0 to 2), `daily: { lastKey, streak, bestStreak, results: Record<dateKey, { stars, score }> }` (kept for the last 60 days), `history` (last 50 results: kind, id or dateKey, stars, score, spend), `flags` (tutorial and mechanic cards seen), `stats` (seasons run, houses supplied, fields irrigated, houses flooded, hints used).
- **Migrations:** v1 is the first shipped schema, so `migrations` is empty; the contract is protected by tests (below) and by `sanitizeProfile`, which clamps and drops unknown fields.
- **Daily generator:** `generateDaily(seed, tier)` builds a `MapDef` with the core PRNG: tier from weekday (Mon 8 x 12 plain, Tue 8 x 12 surge, Wed 9 x 13 surges, Thu 10 x 14 gates and surges, Fri 10 x 14 reservoirs and droughts, Sat 11 x 15 tides, Sun 12 x 16 every mechanic), a river corridor from an inlet to the sea with value-noise terrain, houses and fields placed by tier counts, then `solveMap` proves a 3-star solution; par is that solution's cost, budget par + 3. Up to 12 attempts (`fork(attempt)`), then a fallback template (14 committed templates, 2 per tier, each with a reference solution).
- **Solver:** `solveMap(def, { maxSims })` is a bounded best-first search (canal corridor candidates from inlet to each target, then barrier, pump, gate and reservoir refinements), at most 20000 simulated seasons, returning a placement or `null`. It also serves the hint feature for the daily.
- **Hints:** campaign hints use the committed reference; daily hints use the solver solution stored with the generated map.

## Implementation Checklist

- [x] `src/progress/profile.ts`: `Profile` type, `defaultProfile()`, `sanitizeProfile(data)` (returns `Profile | null`; clamps coins >= 0, stars 0 to 3, freezes 0 to 2, trims history to 50 and daily results to 60, drops unknown keys, rejects wrong types).
- [x] `src/progress/unlocks.ts`: `totalStars`, `regionUnlocked` (Delta 12, Highland 33, Estuary 60), `mapUnlocked` (first map of an unlocked region, else previous map cleared), `themesUnlocked` (thresholds 0, 9, 27, 48, 75, 100, 120), `starsToNextUnlock`.
- [x] `src/progress/economy.ts`: `applyCampaignResult(profile, mapId, evaluation)` implementing the coin rules (first clear 10, 5 per new best star, region bonus 50 once, never paying for repeats, starting grant handled by `defaultProfile` with 50 coins), `HINT_PRICE = { campaign: 25, daily: 40 }`, `buyHint`, `FREEZE_PRICE = 30`, `buyFreeze` (max 2, needs coins), all returning a new profile and a typed event list (`coins-gained`, `region-bonus`, `theme-unlocked`, `region-unlocked`, `star-gained`).
- [x] `src/progress/daily.ts`: `applyDailyResult(profile, { dateKey, step, stars, score })` for rewards (10 / 15 / 20, upgrade pays the difference, streak bonus 2 x min(streak, 7) once per day), streak update from the kit step value (`next-day`, `same-day`, `gap` with freeze consumption per missed day, `clock-went-back` changes nothing), best streak.
- [x] `src/progress/records.ts`: history append with cap 50, best-score lookups, totals, and `shareText(kind, ...)` producing exactly the two templates in `product.md`.
- [x] `src/daily/generate.ts`, `src/daily/solver.ts`, `src/daily/tiers.ts`, `src/daily/fallbacks.ts` (14 templates with reference solutions) as described.
- [x] App `src/state/saveStores.ts`: `createProfileStore(adapter)` using kit `createSaveStore` (key, version 1, defaults, empty migrations, `parse: sanitizeProfile`) and `createSettingsStore(adapter, "floodplain-dispatch")`; adapter chosen by `createDefaultAdapter()` in `main.tsx`, memory adapter in tests.
- [x] App `src/state/game.ts`: a small subscribable game store holding the loaded profile, with actions `recordCampaignResult`, `recordDailyResult`, `buyHint`, `buyFreeze`, `selectTheme`, `markFlag`, `resetProgress`; every action updates the profile through `store.update` and notifies subscribers; a `useGame` hook built on `preact/hooks`; the clock and `localDateKey` are injected.
- [x] Flush on pause: wire `lifecycle.onPause` to await any pending save in `main.tsx` (no UI yet beyond the skeleton).
- [x] Tests in the core: every row of the `economy.md` source and sink tables; star-upgrade pays only the difference; region bonus once; unlock thresholds at 11 and 12, 32 and 33, 59 and 60 stars; theme thresholds at each boundary; daily rewards and upgrade differences; streak bonus capped at 7 (cap reached on day 7 and 8); freeze consumed for one missed day, two missed days with one freeze reset the streak, freezes capped at 2; `clock-went-back` neutral; hint and freeze purchases with insufficient coins rejected; `sanitizeProfile` clamps and rejects; history and daily trimming; total stars never above 120.
- [x] Daily tests: same seed gives identical `MapDef` (deep equal); different dates differ; every weekday tier matches size and mechanic ladder; each generated map passes `validateMap`-style checks (bounds, events, pieces); the solver solves all 40 campaign maps within the sim cap or reports `null` honestly (assert on at least the Valley and Delta sets); the 365-date test from `2026-01-01` generates all dates, asserts a verified 3-star solution for every date and that at most 18 dates (5 percent) use a fallback; the 14 fallback templates validate on their own.
- [x] Save tests (app, memory adapter): fresh profile has 50 coins; round trip; persists across a new store on the same adapter; corrupt JSON gives `recovered` with the backup key written; a future-version envelope gives `recovered` without throwing; a committed fixture `test/fixtures/profile-v1.json` loads as `loaded`; unknown fields are stripped on load; a local test schema at version 2 with a stub migration 1 to 2 proves the chain runs through the same `parse`; `resetProgress` returns defaults and keeps settings; settings persist separately.
- [x] Update `economy.md`, `product.md` and `decisions-log.md` if any number or rule changed; add `.agents/resources/2026-10-23/web-games/floodplain-dispatch/03/README.md` with the 365-date summary (fallback count, solver sim counts min, median, max).

## Files Touched

- `apps-games/floodplain-dispatch-core/src/{progress,daily}/*.ts`, `src/index.ts`
- `apps-games/floodplain-dispatch-core/test/{economy,unlocks,daily-rewards,daily-generator,daily-365,profile}.test.ts`
- `apps-games/floodplain-dispatch/src/state/{saveStores,game}.ts`, `src/main.tsx`
- `apps-games/floodplain-dispatch/test/{save,game-store}.test.ts`, `test/fixtures/profile-v1.json`
- `.agents/games/floodplain-dispatch/{economy,product,decisions-log}.md` (only if changed)
- `.agents/resources/2026-10-23/web-games/floodplain-dispatch/03/README.md`
- `tasks/epics/20-web-floodplain-dispatch/STATUS.md` (tick task 03)

## Acceptance Criteria

- Every number in `economy.md` is asserted by a test; campaign maximum income totals 1250 coins including the starting grant (a test replays a perfect campaign and checks it).
- The Daily Dispatch is deterministic per date, has a verified 3-star solution for 365 consecutive dates, and uses at most 18 fallbacks.
- The profile save loads, migrates (chain proven), recovers from corruption and future versions, and never throws.
- The core stays free of kit and DOM imports; the architecture test passes.

## Verification Commands

- `bun run --filter '@web-games/floodplain-dispatch*' typecheck`
- `bun run --filter '@web-games/floodplain-dispatch*' test`
- `bun run --filter '@web-games/floodplain-dispatch' build`
- `bunx biome check apps-games/floodplain-dispatch apps-games/floodplain-dispatch-core`

## Out of Scope

- Any screen or visual (task 04).
- Audio and onboarding flags UI (task 05); this task only stores the flags.
- Purchases, accounts or network code of any kind.

## Commit message

`feat(floodplain-dispatch): add progression, coins, daily dispatch and versioned save [20-web-floodplain-dispatch/03]`
