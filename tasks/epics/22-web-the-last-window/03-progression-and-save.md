---
epic: 22-web-the-last-window
task: 03-progression-and-save
status: in-progress
commit_scope: the-last-window
depends_on: [22-web-the-last-window/02-content]
estimate: XL
owner: agent
---

# Progression, economy, daily mode, versioned save

## Goal

Implement everything that persists or unlocks: coins, stock purchases, decor ownership and effects, friendship and scene progress, choices and endings, the Journal and Shop Diary, campaign day progression, Late Shifts (the endless mode seeded from the local date) with Lamp Bonus and streak, records, share text, and the versioned profile save on the kit save store with migration tests. Rules are pure functions in the core; the app wires them to the kit save store, settings store and clock.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/the-last-window/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** `economy.md` (every number), `product.md` "Friendship and story scenes", "Decor", "Late Shifts (endless mode)", "Share text". The tests assert the economy tables row by row.
- **Core stays dependency-free:** the core cannot import the kit. Date handling is done in the app with the kit (`localDateKey`, `streakStep`, `dailySeed`, `dayNumber`) and passed in as plain values: a `dateKey` string, a `StreakStep` string and a numeric `seed`. The core exports pure reducers that take these values.
- **Profile v1** (`PROFILE_VERSION = 1`, key `the-last-window.profile`): `coins` (start 30), `day` (next campaign day 1 to 14, or 15 when the campaign is complete), `daysDone: Record<day, { stars, earned, served, delighted }>`, `owned: DecorId[]`, `stock: StockPlan` (last plan, prefill), `regulars: Record<regularId, { fp, visits, scenesDone, choices: Record<choiceId, optionId>, ending: "a" | "b" | null }>`, `pendingEvening` (scene ids queued but not yet shown), `diary: day[]`, `late: { count, lastKey, streak, bestStreak, firstOfDayClaimed, records: { bestEarnings, bestDelightedRun } }`, `flags` (tutorial, first-time cards, first rain, and so on), `settings` extras (`recipeGuide`, `relaxed`, `textSize`), `stats` (customers served, delighted, items made, mistakes, scenes read).
- **Migrations:** v1 is the first shipped schema, so `migrations` is empty; the contract is protected by tests (below) and by `sanitizeProfile`, which clamps and drops unknown fields.
- **Late Shifts:** `buildLateShift(seed, index, lateCount, regulars)` returns a `ShiftDef` per `product.md` (240 s, customers `12 + floor(n / 5)` capped at 14, patience `40 - floor(n / 5)` floored at 34, three distinct due regulars from the seed, weather from the seed, everything unlocked). Seed = kit `dailySeed("the-last-window", dateKey)` forked by the index of today's Late Shift.
- **Scene queue:** after each shift the reducer updates visits and FP, computes eligible scenes with task 01 `eligibleScenes`, merges with `pendingEvening`, applies the 4 (8 on Day 14) cap, and returns the ordered queue plus the remainder.
- **Balance report:** a scripted report (test helper plus the evidence README) uses the task 01 bot to play the real 14 days with a casual and a strong policy and records net coins, decor affordable by Day 14 and scenes eligible by Day 14. Targets are in `economy.md` "Balance targets"; if the bot misses them, adjust decor prices first, change `economy.md`, `product.md`, `content-plan.md` and `decisions-log.md` together and say why.

## Implementation Checklist

- [x] `src/progress/profile.ts`: `Profile` type, `defaultProfile()`, `sanitizeProfile(data)` returning `Profile | null` (clamps coins >= 0, FP 0 to 8, scenes 0 to 5, drops unknown keys and unknown ids, rejects wrong types, trims diary to 14 and stats to sane maxima).
- [x] `src/progress/shift.ts`: `applyShiftResult(profile, day | late info, result)` implementing coin rules (payments, tips, closing bonus), FP and visits per regular, diary entry on a completed campaign day, day advance (only on completing the current day; replays pay but do not advance), unlock lookup for the next day, and a typed event list (`coins-gained`, `friendship-level`, `scene-eligible`, `unlock`, `decor-unlocked`, `campaign-complete`).
- [x] `src/progress/stock.ts`: `buyStock(profile, plan)` (deducts the plan cost, rejects invalid plans through the task 01 validator) and `defaultStockPlan(profile)` (previous plan filtered by unlocks, or the suggestion).
- [x] `src/progress/decor.ts`: `buyDecor(profile, id, day)` (needs unlock day reached unless Late Shifts are open, needs coins, once only), `ownedEffects(profile)` feeding `ShiftDef`.
- [x] `src/progress/scenes.ts`: `queueEvening(profile, day)`, `completeScene(profile, sceneId, choice?)` (gift coins once, records the choice, sets `ending` on scene 5 through `resolveEnding`), `journalEntries(profile)`, `canReplay(profile, sceneId)`; replays pay nothing.
- [x] `src/progress/late.ts`: Late Shift builder above, `applyLateResult` adding the Lamp Bonus (15) and streak bonus (`2 x min(streak, 7)`) once per local date using the kit `StreakStep` value (`next-day`, `same-day`, `gap` resets to 1, `clock-went-back` changes nothing), records, count.
- [x] `src/progress/records.ts`: stats totals, best-of records, `shareText(kind, ...)` producing exactly the two templates in `product.md`.
- [x] App `src/state/saveStores.ts`: `createProfileStore(adapter)` using kit `createSaveStore` (key, version 1, defaults, empty migrations, `parse: sanitizeProfile`) and `createSettingsStore(adapter, "the-last-window")`; adapter chosen by `createDefaultAdapter()` in `main.tsx`, memory adapter in tests.
- [x] App `src/state/game.ts`: a small subscribable game store holding the loaded profile with actions `finishShift`, `finishLateShift`, `finishScene`, `buyStock`, `buyDecor`, `markFlag`, `setPreference`, `resetProgress`; every action updates through `store.update` and notifies subscribers; a `useGame` hook on `preact/hooks`; clock and `localDateKey` injected.
- [x] Flush on pause: wire `lifecycle.onPause` to await any pending save in `main.tsx` (no UI beyond the skeleton).
- [x] Core tests: every row of the `economy.md` source, sink and decor tables; item payment with substitutes; tips at 40 and 15 percent with gramophone; closing bonuses 5, 10, 20; scene gifts once only (replay pays 0); decor unlock day and price; stock purchase rejection with insufficient coins; the total cost of all 8 decor equals 1,200; FP cap at 8 and level thresholds; visit counting; day advance only on the current day; scene queue cap (4, and 8 on Day 14) with remainder carried; endings recorded for both leans and the tie-break; Late Shift builder for `n` of 0, 5, 30, 100 (customers capped at 14, patience floored at 34), same seed gives identical `ShiftDef`, different dates differ; Lamp Bonus once per date; streak after a gap, next day, same day and clock-went-back; bonus capped at 7; `sanitizeProfile` clamps and rejects; coins never negative; share text exact strings.
- [x] Save tests (app, memory adapter): fresh profile has 30 coins; round trip; persists across a new store on the same adapter; corrupt JSON gives `recovered` with the backup key written; a future-version envelope gives `recovered` without throwing; a committed fixture `test/fixtures/profile-v1.json` loads as `loaded`; unknown fields are stripped; a local test schema at version 2 with a stub migration 1 to 2 proves the chain runs through the same `parse`; `resetProgress` returns defaults and keeps kit settings; settings persist separately.
- [x] Balance report test (`test/balance-report.test.ts`, slow tests under 60 s): casual and strong bots over the real 14 days, writing a table to stdout only; assertions limited to sanity (strong >= casual coins, strong sees more scenes, nobody ends with negative coins). Copy the numbers into `.agents/resources/2026-10-23/web-games/the-last-window/03/README.md`.
- [x] Update `economy.md`, `product.md`, `content-plan.md` and `decisions-log.md` if any number or rule changed.

## Files Touched

- `apps-games/the-last-window-core/src/progress/*.ts`, `src/index.ts`
- `apps-games/the-last-window-core/test/{economy,profile,decor,scenes-progress,late-shift,records,balance-report}.test.ts`
- `apps-games/the-last-window/src/state/{saveStores,game}.ts`, `src/main.tsx`
- `apps-games/the-last-window/test/{save,game-store}.test.ts`, `test/fixtures/profile-v1.json`
- `.agents/games/the-last-window/{economy,product,content-plan,decisions-log}.md` (only if changed)
- `.agents/resources/2026-10-23/web-games/the-last-window/03/README.md`
- `tasks/epics/22-web-the-last-window/STATUS.md` (tick task 03)

## Acceptance Criteria

- Every number in `economy.md` is asserted by a test; decor total 1,200, starting coins 30, scene gifts 280 over the campaign (a test sums them).
- Late Shifts are deterministic per date and index, honour the caps, and pay the Lamp Bonus and streak once per local date.
- The profile save loads, migrates (chain proven), recovers from corruption and future versions, and never throws.
- The balance report is committed and either meets the targets in `economy.md` or the economy files were changed to match with the reason logged.
- The core stays free of kit and DOM imports; the architecture test passes.

## Verification Commands

- `bun run --filter '@web-games/the-last-window*' typecheck`
- `bun run --filter '@web-games/the-last-window*' test`
- `bun run --filter '@web-games/the-last-window' build`
- `bunx biome check apps-games/the-last-window apps-games/the-last-window-core`

## Out of Scope

- Any screen or visual (task 04).
- Audio and onboarding UI (task 05); this task only stores the flags.
- Purchases, accounts or network code of any kind.

## Commit message

`feat(the-last-window): add progression, economy, late shifts and versioned save [22-web-the-last-window/03]`
