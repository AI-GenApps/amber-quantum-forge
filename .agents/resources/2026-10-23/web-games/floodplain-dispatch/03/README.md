# Task 03 - progression, economy, daily mode, versioned save (evidence)

Date: 2026-10-23. Everything here was produced and checked headlessly (engine runs, Vitest,
tsc, vite build, Biome). No browser, device or emulator was used.

## What is proven

- Every number in `economy.md` is asserted: `test/economy.test.ts` (sources, sinks, upgrades, region
  bonus, perfect campaign replay = exactly 1250 coins), `test/daily-rewards.test.ts` (10/15/20,
  difference on upgrade, streak bonus cap on day 7 and 8, freezes, clock going back),
  `test/unlocks.test.ts` (region thresholds 11/12, 32/33, 59/60; theme thresholds at every
  boundary) and `test/economy-doc.test.ts` (parses the tables of `economy.md` and compares).
- The profile save (`test/profile.test.ts` in the core, `test/save.test.ts` in the app): fresh = 50
  coins, round trip, persists across a new store, corrupt JSON recovered with the backup key
  written, a future version recovered without throwing, the committed fixture
  `apps-games/floodplain-dispatch/test/fixtures/profile-v1.json` loads as `loaded`, unknown fields
  stripped, values clamped, a local version-2 schema with a stub migration 1 to 2 proves the chain
  runs through the same `parse`, `resetProgress` keeps settings, settings persist separately.
- The game store (`test/game-store.test.tsx`): serialised actions, injected clock and
  `localDateKey`, streak/freeze behaviour from the kit `streakStep`, flush on pause wiring,
  save failure flagged without losing the in-memory change, a `useGame` hook that re-renders.
- Daily Dispatch: `test/daily-generator.test.ts` (determinism, tier ladder, validation, 14 fallback
  templates validate on their own and are exercised with `maxAttempts: 0`) and
  `test/daily-365.test.ts` (365 consecutive dates from 2026-01-01, each re-verified at three stars
  and by `validateDailyMap`, at most 18 fallbacks).
- The core stays free of kit and DOM imports (`test/architecture.test.ts`, extended).

## 365-date summary (`bun scripts/daily-365-report.ts [start] [days]`)

Window 2026-01-01 to 2026-12-31 (the committed test):

- fallbacks used: 0 of 365 (limit 18); dates without a verified 3-star solution: 0.
- simulated seasons per date (all attempts, shaping, trimming): min 1, median 76, max 12762.
- Two extra windows, not committed as tests: 2027-03-01 + 365 days (0 fallbacks, sims min 2, median
  115, max 6755) and 2028-02-01 + 120 days (0 fallbacks, sims min 2, median 59, max 5419).

| Weekday | Dates | Avg par | Avg attempts | Avg ms (Bun, desktop) |
|---|---|---|---|---|
| Mon | 52 | 8.8 | 1.17 | 21 |
| Tue | 52 | 9.3 | 1.13 | 12 |
| Wed | 52 | 12.8 | 1.31 | 65 |
| Thu | 53 | 15.6 | 1.34 | 107 |
| Fri | 52 | 18.5 | 1.67 | 205 |
| Sat | 52 | 17.8 | 1.50 | 128 |
| Sun | 52 | 23.3 | 1.65 | 330 |

Per-attempt success (60 seeds per tier, attempt 0 only): Mon 55, Tue 44, Wed 52, Thu 49, Fri 37,
Sat 46, Sun 37 of 60. Twelve independent attempts make a fallback roughly (0.4)^12, about 1 in
100000 per date. The slowest observed date took 12762 simulated seasons (about 2 to 4 seconds on a
desktop under V8); a phone will be slower, so the Daily screen (task 04) must generate asynchronously
with a short "preparing today's dispatch" state and keep the result in memory
(`dailyPuzzle(dateKey)` already caches).

Total for 365 dates: about 45 s under Bun, about 60 s inside the Vitest run of the whole core suite.

## How the generator reached these numbers (what was tried)

1. Random terrain (cone from the inlet plus value noise) and a bounded solver: 15 to 40 percent of
   attempts. The water model lets overland water pool in any canal, so flat or lumpy random terrain
   rarely has a flood-free supply solution within the simulation cap.
2. Canal tree first, then terrain annealing against the engine (the method the campaign authoring
   used): about 40 to 60 percent. Random-search sweeps over eight terrain parameters (tree top and
   bottom height, bank height, house minimum height, field dip, relief channel length and top)
   found the final constants (`tuning` in `src/daily/terrain.ts`): reach-limited targets, houses at
   height 6 or 7, fields two below their canal, relief channel of 3 to 4 cells draining the inlet.
   Two rounds of 40 configurations each, 20 seeds per tier.
3. A "wet near targets with the empty board" penalty (to forbid free sump solutions) lowered the
   success rate to 10 to 40 percent and was dropped: reference = trimmed tree, par = its cost
   (open question Q13 records that cheaper sump placements can exist, as on the campaign).
4. Event windows are placed so that start + duration never passes the last week (a defect the
   per-date validator found in the first 365-date run).

## Bounded solver on the campaign (`bun scripts/solve-campaign-report.ts [prefix]`)

`solveMap(def, { maxSims: 20000 })` is a best-first search (canal tree starts, canal paths to unmet
targets, pump variants along paths, pump/reservoir/barrier swaps near failures, barrier/pump
/reservoir candidates around flooded houses, gate windows around events). "Stars" is what the found
placement earns on the real engine; the goal is two stars within budget, so a cost above par shows 2.

| Map | Par | Budget | Solver cost | Stars | Sims | ms |
|---|---|---|---|---|---|---|
| v01 | 6 | 9 | 6 | 3 | 8 | 4 |
| v02 | 9 | 12 | 9 | 3 | 71 | 9 |
| v03 | 9 | 12 | 9 | 3 | 12789 | 861 |
| v04 | 11 | 14 | 8 | 3 | 149 | 14 |
| v05 | 12 | 15 | 12 | 3 | 16 | 2 |
| v06 | 14 | 17 | 15 | 2 | 493 | 42 |
| v07 | 15 | 18 | 14 | 3 | 1013 | 104 |
| v08 | 16 | 19 | 14 | 3 | 199 | 24 |
| v09 | 17 | 20 | 17 | 3 | 436 | 53 |
| v10 | 18 | 21 | null | - | - | 2219 |
| d01 | 14 | 17 | 14 | 3 | 75 | 8 |
| d02 | 15 | 18 | 13 | 3 | 3909 | 473 |
| d03 | 16 | 19 | 9 | 3 | 119 | 14 |
| d04 | 17 | 20 | 14 | 3 | 172 | 24 |
| d05 | 19 | 22 | 20 | 2 | 172 | 28 |
| d06 | 19 | 22 | 20 | 2 | 3051 | 439 |
| d07 | 20 | 23 | 19 | 3 | 223 | 34 |
| d08 | 22 | 25 | 22 | 3 | 17085 | 2654 |
| d09 | 23 | 26 | null | - | - | 2871 |
| d10 | 25 | 28 | 25 | 3 | 119 | 20 |
| h01 | 16 | 19 | 16 | 3 | 21 | 3 |
| h02 | 18 | 21 | 18 | 3 | 47 | 6 |
| h03 | 19 | 22 | 19 | 3 | 49 | 5 |
| h04 | 20 | 23 | 16 | 3 | 19 | 3 |
| h05 | 22 | 25 | 19 | 3 | 604 | 103 |
| h06 | 23 | 26 | 19 | 3 | 149 | 23 |
| h07 | 24 | 27 | 24 | 3 | 215 | 35 |
| h08 | 26 | 29 | 22 | 3 | 862 | 150 |
| h09 | 27 | 30 | 24 | 3 | 36 | 6 |
| h10 | 29 | 32 | null | - | - | 2083 |
| e01 | 17 | 20 | null | - | - | 2200 |
| e02 | 19 | 22 | null | - | - | 2289 |
| e03 | 21 | 24 | 22 | 2 | 46 | 8 |
| e04 | 22 | 25 | 20 | 3 | 33 | 6 |
| e05 | 24 | 27 | 25 | 2 | 236 | 51 |
| e06 | 25 | 28 | 23 | 3 | 13451 | 3100 |
| e07 | 27 | 30 | 28 | 2 | 791 | 169 |
| e08 | 29 | 32 | 26 | 3 | 916 | 183 |
| e09 | 31 | 34 | 24 | 3 | 451 | 109 |
| e10 | 34 | 37 | 30 | 3 | 1895 | 663 |

solved 35 of 40

Reading the table:

- 35 of 40 maps solved (Valley 9, Delta 9, Highland 9, Estuary 8); null for v10, d09, h10, e01,
  e02. The test requires at least 8 of 10 for Valley and Delta and at least 30 of 40 overall.
- Where the solver cost is below par the campaign par is looser than the best placement the
  solver found (for example v04 8 vs 11, d03 9 vs 16, d04 14 vs 17, h04 16 vs 20, h05 19 vs 22, h06 19 vs 23,
  h08 22 vs 26, h09 24 vs 27, e04 20 vs 22, e06 23 vs 25, e08 26 vs 29, e09 24 vs 31, e10 30 vs 34).
  This is the quantified version of the known "par is a reference, not a minimum" gap
  (question Q10). No par was changed in this task.
- Campaign hints use the committed references, so a `null` here never blocks play.

## Files added or changed (code)

- Core `src/progress/{profile,unlocks,economy,daily,records}.ts`, `src/daily/{dates,tiers,terrain,
  anneal,reference,penalty,grid,solver,generate,validate,fallbacks}.ts`, `src/index.ts`; engine
  hot loops use local constant aliases in `src/simulate.ts` (output unchanged, about 3x faster
  under Vitest).
- Core `scripts/{gen-fallbacks,daily-365-report,solve-campaign-report}.ts`.
- App `src/state/{saveStores,game,useGame,services,dailyInfo}.ts`, `src/main.tsx`.
- Fixture `apps-games/floodplain-dispatch/test/fixtures/profile-v1.json`.

## Commands run for the gate (final results are in the task report)

```
bun run --filter '@web-games/floodplain-dispatch*' typecheck
bun run --filter '@web-games/floodplain-dispatch*' test
bun run --filter '@web-games/floodplain-dispatch' build
bunx biome check apps-games/floodplain-dispatch apps-games/floodplain-dispatch-core
```

Regenerate the fallback templates after any generator change with
`bun apps-games/floodplain-dispatch-core/scripts/gen-fallbacks.ts` followed by
`bunx biome check --write` on the core package.
