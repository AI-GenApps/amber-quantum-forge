---
epic: 19-web-lantern-loops
task: 03-progression-and-save
status: pending
commit_scope: lantern-loops
depends_on: [19-web-lantern-loops/02-content]
estimate: L
owner: agent
---

# Progression, economy, daily mode, versioned save

## Goal

Add everything that is not the board or the screens: stars and chapter unlocks, hint tokens, the daily
puzzle generator with weekday tiers, the 30-day archive, the streak with its weekly freeze, statistics,
the share text, and the versioned local save on the kit save store with tested migrations. Pure rules go
into `lantern-loops-core`; persistence and services go into the app. Numbers must match
`.agents/games/lantern-loops/economy.md` exactly.

## Context / Decisions

- Numbers (single source `economy.md`): stars 0/1/2+ hints = 3/2/1; unlocks Garden 45, Bridge 120,
  Sky 210; tokens start 3, cap 20, hint cost 1; daily +1 and +1 with 0 hints; milestones 3/7/14/30/60/100
  days = +1/+2/+2/+4/+5/+8 once per streak run; archive +1 once per date on a 0-hint solve; chapter cleared
  +5; freeze 1 per ISO week (Monday start), cap 1, auto-spent on exactly one missed day, a new install
  starts with 1.
- Core stays free of the kit and of any clock: pure functions take `dateKey` strings (`YYYY-MM-DD`) and
  numbers. The app uses kit `localDateKey`, `daysBetween`, `dailySeed`, `streakStep` and passes results
  in. Calendar helpers needed by the core (`weekdayOf(dateKey)`, `isoWeekKey(dateKey)`) are pure integer
  arithmetic, tested against `Date` inside the tests.
- Daily seed: the app computes `dailySeed("lantern-loops", dateKey)` (kit) and calls the core with the
  seed plus `weekday`; the core mixes in the generator version `ll-gen-1`. Tier table (product.md): Mon 5x5
  lanterns; Tue 6x6 +stones; Wed 7x7 +stones; Thu 7x7 +mirrors; Fri 8x8 +mirrors; Sat 8x8 +gates and 2 to 3
  colours; Sun 9x9 all mechanics with 3 to 5 colours.
- Save: kit `createSaveStore` with `createDefaultAdapter()` (Preferences on device, `localStorage` on web);
  profile key `lantern-loops.profile`, runs key `lantern-loops.runs`; settings use the kit
  `createSettingsStore(adapter, "lantern-loops")`. Profile starts at version 1. A development-preview
  shape (v0: `solvedIds: string[]`, `hintsLeft: number`, no streak) is registered as a migration source
  so the migration path is tested for real; also test the "newer than known" and corrupt-data paths.
- No network, no `Date` in the core; only the app reads the clock (injected `now: () => Date`).

## Implementation Checklist

Core (`apps-games/lantern-loops-core/src/progress/`):

- [ ] `stars.ts`: `starsForHints`, `bestStars`, `totalStars(stars)`, `STAR_UNLOCKS`, `isChapterUnlocked`,
      `starsToUnlock`, `chaptersCleared`.
- [ ] `tokens.ts`: `TOKEN_CONFIG` (start 3, cap 20, hint cost 1, rewards), `grant(balance, amount)` returning
      `{ balance, granted, capped }`, `spendHint`, reward functions `dailyReward(hints)`,
      `milestoneReward(days)`, `archiveReward`, `chapterReward`.
- [ ] `streak.ts`: `applyDailySolve(state, { today, daysSinceLast, hints })` and `refreshOnOpen(state, { today })`
      (weekly freeze refill by ISO week key); returns the new state plus events (`freeze-used`,
      `streak-reset`, `milestone`, `clock-went-back`).
- [ ] `calendar.ts`: `weekdayOf`, `isoWeekKey`, `archiveKeys(today, count = 30)`.
- [ ] `daily.ts`: `DAILY_TIERS`, `dailyParams(weekday)`, `generateDaily(seed, weekday)` reusing task 02's
      `generatePuzzle`; `dailyId(dateKey)`; `GENERATOR_VERSION = "ll-gen-1"`.
- [ ] `share.ts`: `buildShareText({ dateKey, stars, seconds, puzzle, tiles, hidePath })` producing the format in
      `product.md` (time as `m:ss`, grid rows as emoji, path hidden by default).
- [ ] `stats.ts`: `computeStats(profile, campaign)` for the statistics screen (solved, stars, per-chapter
      stars and solved, dailies solved, current and best streak, 3-star count, hints used, total play time,
      best times, solves by weekday).

App (`apps-games/lantern-loops/src/save/`, `src/services/`):

- [ ] `profile.ts`: `Profile` type (stars map, best times, tokens, freezes, `freezeWeek`, streak,
      `bestStreak`, `lastDailyDate`, `milestonesGranted`, `archiveRewarded`, `chaptersCleared`,
      `dailiesSolved` map dateKey to stars and seconds, counters for stats, `onboardingDone`, game settings
      `showTimer`, `showConflicts`, `hidePathInShare`, `brush`), `defaults()`, `parse()` validator, `migrations`
      (v0 to v1), `createProfileStore(adapter)`.
- [ ] `runs.ts`: in-progress boards store (`RunState { puzzleKey, tiles, locked, hintCount, elapsedMs,
      moves }`), keyed by puzzle id or `daily-YYYY-MM-DD`; pruned when solved and capped at 160 entries
      (oldest unsolved campaign runs dropped last).
- [ ] `services/progression.ts`: `completePuzzle`, `completeDaily`, `completeArchive`, `spendHint`,
      `refreshOnOpen(now)`; each returns the rewards and events for the UI (tokens granted, capped,
      milestone, freeze used, chapter unlocked, chapter cleared). Persist after each call.
- [ ] `services/daily.ts`: `todayKey(now)`, `puzzleForDate(dateKey)` with an in-memory cache,
      `archiveList(today, profile)`.
- [ ] `services/settings.ts`: kit settings store wiring.
- [ ] `src/main.tsx`: construct the services once (still rendering the skeleton screen; screens are task 04).

## Files Touched

- `apps-games/lantern-loops-core/src/progress/*.ts`, `src/index.ts`, tests `test/progress/*.test.ts`
- `apps-games/lantern-loops/src/{save,services}/**`, `src/main.tsx`, tests under `test/save/`, `test/services/`
- `.agents/resources/2026-10-23/web-games/lantern-loops/03/{README.md,daily-report.json}`
- `.agents/games/lantern-loops/{economy,product,README,decisions-log}.md` only if a number changed

## Acceptance Criteria

- [ ] Stars: 0/1/2/5 hints give 3/2/1/1; best-of rule; `totalStars` over the 120 ids; unlock boundaries
      44/45, 119/120, 209/210; unlocks never reverse when stars are equal or higher.
- [ ] Tokens: table-driven tests for every source and the cap (granting at 19 and 20, `capped` flag),
      spending at 0 is refused, balance never negative, starting balance 3 on a fresh profile.
- [ ] Streak: next-day increments; same day idempotent (no double reward); one missed day with a freeze
      is saved and the freeze count drops to 0; one missed day without a freeze resets to 1 on solve;
      two missed days resets even with a freeze; clock-went-back changes nothing; milestones 3/7/14/30/60/100
      pay once per run and again after a reset run; weekly refill on the first open of a new ISO week, never
      above 1, never on the same week; a year-end week (2026-12-28 to 2027-01-03) uses one ISO week key.
- [ ] Calendar helpers equal `Date`-derived weekday and ISO week for every day of 2024 to 2030.
- [ ] Daily: for 365 consecutive dates starting 2026-10-23 (covers a year boundary and all weekdays), the
      generated puzzle is unique (`solve` count 1 and equals the stored solution), `evaluate(solution).solved`,
      size and mechanics match the weekday tier, regenerating returns the identical code, and at least 99% of
      the 365 puzzle codes are distinct; total time and the slowest date are printed and written to
      `daily-report.json`; each generation stays under 2 seconds in Node (assert) and the whole test under
      120 seconds.
- [ ] Archive: `archiveKeys` returns the 30 previous dates (never today), oldest last; archive solves give
      +1 token once per date and never touch the streak.
- [ ] Share text: golden tests for a 5x5 daily with path hidden and visible, each colour square, 1-star
      and 3-star headers, time over one hour formats as `h:mm:ss`.
- [ ] Save: fresh load returns defaults with 3 tokens and 1 freeze; update/load round trip; v0 fixture
      migrates to v1 keeping solved puzzles as 3-star (documented in the migration) and tokens; corrupt
      JSON recovers to defaults and keeps a backup key (kit behaviour, asserted); newer-than-known data does
      not crash; `parse` rejects wrong types field by field (table of 15 cases); runs store prunes and caps.
- [ ] Statistics computed from a seeded fixture profile match hand-computed values.
- [ ] Every economy number in `economy.md` appears as one exported constant and a test reads the markdown
      table values (starting balance, cap, hint cost, unlock thresholds) and compares them to the constants.
- [ ] All verification commands below pass.

## Verification Commands

```
bun run --filter '@web-games/lantern-loops*' typecheck
bun run --filter '@web-games/lantern-loops*' test
bun run --filter '@web-games/lantern-loops' build
bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core
```

## Out of Scope

Screens and navigation (task 04), sound and haptics (05), art, Capacitor, any real purchase or ad
code, cloud save, notifications, server-side anything.

## Commit message

`feat(lantern-loops): progression, economy, daily mode and versioned save [19-web-lantern-loops/03]`
