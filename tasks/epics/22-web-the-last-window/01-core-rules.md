---
epic: 22-web-the-last-window
task: 01-core-rules
status: in-progress
commit_scope: the-last-window
depends_on: []
estimate: XL
owner: agent
---

# Core rules engine (headless, in the-last-window-core)

## Goal

Build the deterministic rules engine in `apps-games/the-last-window-core`: item and decor rule tables, order generation, the arrival schedule, the shift engine (seats, patience, stations with timers, tray, serving, payment, tips, friendship points, closing grade) and the story rules (friendship levels, scene eligibility, the scene player with choice guards and ending resolution). Everything is pure TypeScript with exhaustive tests. No day content or scene text (task 02) and no UI.

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
- **Spec of record:** `product.md` sections "Day, shift and clock", "Weather variants", "Seats, customers and orders", "Making things", "Stock", "Serving and satisfaction", "Closing grade", "Friendship and story scenes", "Decor"; `economy.md` for prices, stock costs, tips, decor and FP. This task implements them exactly; if a rule proves unworkable, change `product.md`, `economy.md` and `decisions-log.md` in the same commit and say why.
- **Purity:** the existing `test/architecture.test.ts` bans `window`, `document`, `Date.now`, `performance.now`, `Math.random` and `localStorage` in `src/`; it must keep passing. The core carries its own seeded PRNG (`src/prng.ts`, sfc32 from a 32-bit integer and an FNV-1a string hash). The app converts kit seeds.
- **Determinism contract:** every function is pure; the same inputs give `JSON.stringify`-equal outputs; inputs are never mutated; no object iteration order may influence results (iterate ids from fixed arrays, seats 0, 1, 2 in order).
- **Engine API** (names are binding for tasks 03 and 04): `createShift(def: ShiftDef, stock: StockPlan): ShiftState`; `tickShift(state): { state; events }` advances exactly one tick; `applyAction(state, action): { state; events }` handles one player action at the current tick; `closeShift(state): ShiftResult` once `state.phase === "closed"`. Actions: `selectSeat {seat}`, `drinkStep {token}` (the `cup` token starts a cup for the active seat), `pastryPick {pastryId}` (is the `plate` step, takes a free plate and one portion), `pastryStep {plate, token}`, `pickBook {bookId}`, `discard {item}`, `serve {}` (active seat). Events include `customer-seated`, `customer-turned-away`, `customer-left`, `step-ok`, `step-wrong`, `item-ready`, `oven-ready`, `served` (with outcome, payment, tip, FP), `patience-warning` (at 100 ticks left), `shift-closed`. The engine never reads a clock; the app calls `tickShift` once per 100 ms of accumulated time.
- **Items belong to the seat selected when they were started**, so switching seats while the oven runs does not move the pastry.
- **Item rule tables** live in `src/rules/items.ts` (6 drinks, 5 pastries, 5 books with steps, durations, prices, stock costs and mood tags) and `src/rules/decor.ts` (8 items with price, unlock day and one typed effect). Tests pin every row against the tables in `product.md` and `economy.md` by reading those files with `node:fs`.
- **Constants** live in `src/constants.ts` and nowhere else: `TICK_MS = 100`, shift lengths (1800, 2100, 2400 ticks), `SEATS = 3`, `DOOR_WAIT_TICKS = 50`, no arrivals in the last 200 ticks, step durations (brew 8, steam 6, water 5, warm 12), plates 2, `PORTIONS_PER_KIND = 5`, shelf slots (3 and 3, +1 each with decor), outcome thresholds (delighted `pct = 1` and `f >= 0.35`, satisfied `pct >= 0.6`), component scores (10, 5, 3, 0), tip percentages (40, 15), closing grade rules and bonuses (20, 10, 5), FP gains (2, 1, 0, chart frame +1, per-serve max 3), `FP_CAP = 8`, `FRIENDSHIP_THRESHOLDS = [1, 2, 4, 6, 8]`, `MAX_SCENES_PER_EVENING = 4` (8 on Day 14), patience table (60, 50, 45, 40 s), rain +6 s, relaxed multiplier 1.5, favourite probability 70 percent, weather probabilities. Each is covered by a test that pins its number.

## Implementation Checklist

- [x] `src/types.ts`: `DrinkId`, `PastryId`, `BookId`, `MoodId`, `StepToken`, `Weather`, `Outcome`, `Component`, `Order`, `Seat`, `Customer` (kind regular or walk-in, regular id, likes), `ShiftDef` (day or late, weather, length ticks, base patience ticks, relaxed flag, decor effects, unlocked ids, arrival list, seed), `StockPlan`, `ShiftState`, `ShiftAction`, `ShiftEvent`, `ShiftResult`, `Grade`.
- [x] `src/constants.ts` with every constant above, each exported as a readonly value and pinned by a test.
- [x] `src/prng.ts`: `createPrng(seed)`, `hashString`, `next()`, `int(n)`, `pick`, `shuffle`, `fork(label)`; sequence-stability tests against hard-coded values.
- [x] `src/rules/items.ts` and `src/rules/decor.ts` as described, plus `decorEffects(ownedIds)` returning patience bonus, rain patience bonus, book bonus, drink bonus, shelf slots, FP bonus and tip bonus points.
- [x] `src/rules/weather.ts`: `weatherForDay(day)` (`day mod 3`), `weatherRules(weather)` (pastry and book chances, rain customer and patience bonuses).
- [x] `src/rules/patience.ts`: `patienceSeconds(day, weather, decor)`, `patienceTicks(seconds, relaxed)` (floor to a tick, relaxed x 1.5), Late Shift patience formula `40 - floor(n / 5)` floored at 34.
- [x] `src/rules/stock.ts`: `stockCost(plan)`, `validateStockPlan(plan, unlocked, slots, coins)` returning typed errors (`TOO_MANY_PASTRIES`, `TOO_MANY_BOOKS`, `LOCKED_ITEM`, `NEED_A_BOOK`, `CANNOT_AFFORD`), `suggestStock(dueRegulars, unlocked, slots)`.
- [x] `src/shift/orders.ts`: `generateOrder(rng, customer, unlocked, weather, shelfEmpty)` implementing the favourite probability (only if unlocked), weather chances, mood choice (regular's two moods 50/50, walk-in any mood covered by an unlocked book) and the empty-pastry-shelf exception.
- [x] `src/shift/schedule.ts`: `buildArrivals(seed, count, lengthTicks, regularsDue)` giving arrival ticks (no arrival in the final 200 ticks, at least 30 ticks between arrivals, deterministic), shuffled regular and walk-in order, and each customer's order.
- [x] `src/shift/stations.ts`: drink cup (one at a time, step list per drink, duration lock, wrong step empties the cup and counts a mistake), pastry plates (two, `pastryPick`, `warm` timer of 12 ticks that runs in the background, steps in order), book tray.
- [x] `src/shift/serve.ts`: component scores, `pct`, `f`, outcome, payment (substitute half rounded down minimum 1, wrong-mood book 1), tip rounding up with decor points, FP gain with chart frame and the per-serve maximum, mood face for the customer.
- [x] `src/shift/engine.ts` (and `state.ts` if needed): seat taking, door wait and turn-away, patience drain only for seated customers, leaving at zero, stock portion use, events, closing when time is up and no seated customer remains, no arrivals after the cut-off.
- [x] `src/shift/grade.ts`: `gradeShift(summary)` giving stars and bonus coins, `ShiftResult` totals (payments, tips, bonus, per-regular FP gains, counts by outcome, customers arrived, longest delighted run).
- [x] `src/story/types.ts`: `SceneScript` (id, regular, index 1 to 5, title, beats with speaker, text, optional guard `{choice, option}`, optional `choice`, scene 5 `endings: {a, b}`), `Choice`, `Option` (label, lean, reaction beats).
- [x] `src/story/friendship.ts`: `levelForFp`, `addFp` (cap 8), `nextThreshold`.
- [x] `src/story/eligibility.ts`: `eligibleScenes(progress)` (level >= k, k visits served, previous scene done), `eveningQueue(eligible, cap, day)` ordered by regular index then scene index with the 4 and 8 caps.
- [x] `src/story/player.ts`: `startScene`, `advanceBeat`, `chooseOption`, `visibleBeats(script, choicesMade)` honouring guards, `resolveEnding(leans)` (majority; last choice breaks a two-choice disagreement), `finishScene` returning the gift coins (5 or 15) and recorded choice.
- [x] `src/index.ts` re-exports the public API (keep the existing `version` export).
- [x] `test/helpers/bot.ts`: a deterministic bot that plays any `ShiftDef` through the real engine with a policy (`perfect`: instant correct actions with a fixed reaction delay in ticks; `casual`: larger delay and a fixed wrong-tap rate from a PRNG) and returns the `ShiftResult`; used here and by task 03 for balance reports.
- [x] Tests in `test/` (one file per module, hand-computed expectations, no snapshot files): constants; PRNG; every item row; decor effects; weather for Days 1 to 14 and the Late Shift sample; patience for every row of the table, rain, decor and relaxed (floor to tick); stock plan errors and costs (including 4 kinds with the cake stand, maximum 30 coins); order generation statistics over 2000 seeded draws (favourite near 70 percent, weather chances, no locked ids, empty-shelf exception); arrival schedule properties (cut-off, spacing, determinism, regulars all present); station steps for every drink and pastry (correct, wrong, duration lock, oven runs while the cup is made); component scores for all 3 x 3 x 3 combinations; outcome boundaries (`f` of 0.34 and 0.35, `pct` of 0.59 and 0.6); payment, tip rounding and decor points; FP rules including the maximum of 3; door wait and turn-away at tick 50; patience drain, `patience-warning` at 100 ticks; leaving at 0; items stay with the seat they started on; closing time and the arrival cut-off; grade boundaries (80 percent with nobody left, 60 percent); friendship thresholds at every boundary; eligibility with missing visits, missing level, unfinished previous scene; evening cap 4 and 8; scene player with guards, both choice counts, tie break and ending resolution; a property test over 100 random seeds and policies: the engine never throws, coins are never negative, no seat holds two customers, results repeat exactly.
- [x] `test/determinism.test.ts`: the same scenario twice compared as full JSON, including every event.
- [x] A largest-case test: 14 customers, 2400 ticks, three seats, bot `perfect` and `casual`, asserting a stable result hash and that the shift closes.
- [x] Confirm `test/architecture.test.ts` still passes and no file in `src/` exceeds 800 lines.

## Files Touched

- `apps-games/the-last-window-core/src/{types,constants,prng,index}.ts`
- `apps-games/the-last-window-core/src/{rules,shift,story}/*.ts`
- `apps-games/the-last-window-core/test/**` (new test files, existing two kept)
- `.agents/games/the-last-window/{product,economy,decisions-log}.md` (only if a rule changed)
- `tasks/epics/22-web-the-last-window/STATUS.md` (tick task 01)

## Acceptance Criteria

- `tickShift` and `applyAction` are deterministic: two runs of 100 seeded scenarios produce identical JSON including events.
- Every rule in `product.md` "Seats, customers and orders", "Making things", "Serving and satisfaction", "Closing grade" and "Friendship and story scenes" has at least one test that fails if the rule changes.
- A `perfect` bot finishes a Day 1 style shift with 3 stars and no left customers, and a `casual` bot finishes without error (balance numbers are reported by task 03, not asserted here).
- No `any`, no DOM types in the core, `architecture.test.ts` passes, no source file over 800 lines.
- The four verification commands pass (the app package still builds because it only uses `version`).

## Verification Commands

- `bun run --filter '@web-games/the-last-window*' typecheck`
- `bun run --filter '@web-games/the-last-window*' test`
- `bun run --filter '@web-games/the-last-window' build`
- `bunx biome check apps-games/the-last-window apps-games/the-last-window-core`

## Out of Scope

- Days, calendar, regulars, scene text and validators (task 02).
- Profile, coins accounting across days, Late Shift generation and the save (task 03).
- Any rendering, UI or audio.

## Commit message

`feat(the-last-window): add headless shift engine, orders and story rules [22-web-the-last-window/01]`
