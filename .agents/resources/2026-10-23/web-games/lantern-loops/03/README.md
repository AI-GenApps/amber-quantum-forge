# Task 03 evidence: progression, economy, daily mode, versioned save

## What was built

- Core (`apps-games/lantern-loops-core/src/progress/`): `stars`, `tokens`, `streak`, `calendar`,
  `daily`, `share`, `stats`. Pure functions on date-key strings and numbers; no clock.
- App (`apps-games/lantern-loops/src/save/`, `src/services/`): `profile` (type, defaults, `parse`,
  v0 migration, store), `runs`, `progression-rules` (pure reducers), `progression` (store-backed
  service), `daily` (cached `puzzleForDate`, `archiveList`), `settings`, `createServices`.
- `src/main.tsx` builds the services once and calls `start()` (load settings and profile, weekly
  freeze refill). The skeleton screen is unchanged; screens are task 04.

## Daily report

`daily-report.json` is written by `apps-games/lantern-loops-core/test/progress/daily.test.ts` for 365
consecutive dates from 2026-10-23 (all seven weekdays, one year boundary): every puzzle has exactly one
solution that equals the stored solution, `evaluate(solution).solved`, matches the weekday size and
mechanics, regenerates to the identical code, and all 365 codes are distinct. The file is only
rewritten when missing or when `LL_WRITE_REPORT=1` is set (timings change on every run). The test
prints a one-line summary (total time, mean, slowest date) with `vitest --reporter=default`.

```
cd apps-games/lantern-loops-core
LL_WRITE_REPORT=1 bunx vitest run test/progress/daily.test.ts --reporter=default
```

## Tests added

| Area | File | Covers |
|---|---|---|
| Stars and unlocks | `test/progress/stars.test.ts` | 0/1/2/5 hints, best-of, 44/45, 119/120, 209/210 boundaries, chapter cleared |
| Tokens | `test/progress/tokens.test.ts` | every source, cap at 19 and 20, refusal at 0 |
| Streak | `test/progress/streak.test.ts` | next day, same day, freeze, reset, clock back, milestones, weekly refill, year-end week |
| Calendar | `test/progress/calendar.test.ts` | weekday and ISO week against `Date` for 2024 to 2030, archive keys |
| Daily | `test/progress/daily.test.ts` | tiers, 365-date generation |
| Share | `test/progress/share.test.ts` | goldens: path hidden and visible, all colour squares, 1 and 3 stars, h:mm:ss |
| Statistics | `test/progress/stats.test.ts` | hand-computed fixture |
| Economy sync | `test/progress/economy-sync.test.ts` | reads `economy.md` tables and compares with the constants |
| Profile | `test/save/profile.test.ts` | defaults, round trip, 28 wrong-type cases, v0 migration, corrupt and newer data |
| Runs | `test/save/runs.test.ts` | store, 160 cap, prune order, parse repair |
| Rules and service | `test/services/*.test.ts` | rewards, caps, streak through the service, archive window, daily cache, services wiring |
