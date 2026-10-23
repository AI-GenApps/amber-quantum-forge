---
epic: 21-web-cloud-observatory
task: 01-core-rules
status: todo
commit_scope: cloud-observatory
depends_on: []
estimate: L
owner: agent
---

# Core rules engine (headless, in cloud-observatory-core)

## Goal

Implement every rule of Cloud Observatory as pure, deterministic, DOM-free TypeScript in
`apps-games/cloud-observatory-core`, with exhaustive tests. After this task the whole game can be
played in a test: gather, tick, buy, upgrade, chart, Eclipse, boons and offline progress. Content
tables, saves, achievements, the daily Comet and the UI come later.

## Context / Decisions

- Task 00 produced the design; the numbers are in
  `.agents/games/cloud-observatory/economy.md` and the exact rules in `product.md`. Do not invent
  new rules; if a number must change, change `economy.md` and `decisions-log.md` in this commit.
- The core package has no dependency on the kit (its `package.json` is fixed). Anything random
  takes `{ next(): number }` (the kit `Rng` satisfies it); time is always a parameter.
- `test/architecture.test.ts` forbids the tokens `window`, `document`, `Date.now`,
  `performance.now`, `Math.random`, `localStorage` in `src/**`, even in comments and strings.
- Ids are plain `string` aliases (`InstrumentId`, `UpgradeId`, `ConstellationId`, `BoonId`,
  `AchievementId`) so the rules run against any catalog; this task tests against a small fixture
  catalog in `test/fixtures/catalog.ts` (2 instruments, 3 upgrades, 2 constellations, 3 boons),
  and task 02 supplies the real tables.
- State is a plain JSON-serializable object; every function returns a new state and never mutates
  its input. Values are doubles, clamped to `MAX_VALUE = 1e300`; `NaN` never enters the state.

## Implementation Checklist

Files under `apps-games/cloud-observatory-core/src/` (each under 800 lines):

- [ ] `constants.ts`: `RULES` with `STARTING_STARLIGHT = 10`, `ATLAS_BONUS = 0.05`,
      `ACHIEVEMENT_BONUS = 0.01`, `OFFLINE_CAP_SECONDS = 28800`, `OFFLINE_EFFICIENCY_BASE = 0.5`,
      `ECLIPSE_DIVISOR = 1e9`, `ECLIPSE_MIN_SHARDS = 5`, `UPGRADE_THRESHOLDS = [10, 25, 50]`,
      `UPGRADE_COST_FACTORS = [10, 100, 1000]`, `UPGRADE_MULTIPLIERS = [2, 2, 3]`,
      `STAR_MIN_SPACING = 140`, `MAP_WIDTH = 1000`, `MAP_HEIGHT = 1400`, `MAP_MARGIN = 100`,
      `MAX_VALUE = 1e300`.
- [ ] `types.ts`: id aliases; `InstrumentDef { id, name, baseCost, baseSps, growth }`;
      `UpgradeDef { id, instrumentId, tier, name }`; `ConstellationDef { id, name, stars:
      readonly Point[], closed: boolean, cost, requires: { instrumentId, count } }`;
      `BoonDef { id, name, cost, effect: BoonEffect }` where `BoonEffect` is a discriminated union
      (`start-starlight`, `instrument-mult`, `cost-mult`, `offline-efficiency`, `start-owned`,
      `atlas-factor`, `upgrade-cost-mult`, `global-mult`); `Catalog`; `GameState`
      (`starlight`, `cycleStarlight`, `lifetimeStarlight`, `shards`, `shardsEarned`, `owned`,
      `upgrades`, `charted`, `boons`, `achievements`, `eclipses`, `taps`, `cycleSeconds`);
      `GameEvent` union (`purchased`, `upgraded`, `charted`, `eclipsed`, `boon-bought`).
- [ ] `numbers.ts`: `clampValue`, `formatNumber` (rules: below 10 up to 2 decimals trimmed, below
      100 up to 1 decimal trimmed, below 1000 integer, then K M B T Qa Qi Sx Sp Oc No Dc with 3
      significant digits up to 1e33, then `1.23e45` scientific, valid to 1e300, `NaN` as "0",
      infinities and anything at or above 1e300 as "1.00e300+", negatives with a leading "-"),
      `formatNumberWords` (aria label, "1.2 million"), `formatDuration` (seconds to "2h 05m").
- [ ] `economy.ts`: `instrumentUnitCost`, `bulkCost(def, owned, count, costMult)` (closed-form
      geometric sum), `maxAffordable(def, owned, budget, costMult)` (exact boundary, verified
      against a loop), `upgradeCost`, `instrumentMultiplier`, `gatherMultiplier`,
      `atlasFactor`, `globalMultiplier`, `starlightPerSecond`, `gatherValue`, `chartCost`,
      `offlineEfficiency`, all as specified in `economy.md` including boon effects.
- [ ] `state.ts`: `createInitialState(catalog)` (10 starlight, empty everything);
      `sanitizeState(unknown, catalog)` returning a valid state or `null` (rejects `NaN`,
      negatives, unknown ids; clamps to `MAX_VALUE`).
- [ ] `actions.ts`: `gather`, `tick(state, seconds, catalog)` (production for `seconds`, adds to
      `starlight`, `cycleStarlight`, `lifetimeStarlight`, `cycleSeconds`), `buyInstrument(state,
      id, quantity | "max", catalog)`, `buyUpgrade`, `buyBoon`, `applyOffline(state, elapsed,
      catalog)` returning `{ state, gained, secondsCounted, capped }`. Every purchase function
      returns `{ ok: false, reason }` for: unknown id, not enough starlight or shards, already
      owned, threshold not met, instrument not yet unlocked.
- [ ] `chart.ts`: `canChart`, `startChart(constellation)`, `tapStar(session, index)` returning a
      new session plus `result: "correct" | "wrong" | "repeat" | "complete" | "invalid"`,
      `completeChart(state, session, catalog)` (pays the cost, adds the id to `charted`, emits the
      event, records `flawless`), `hitTestStar(stars, point, radius)`, `minStarDistance(stars)`,
      `starsInsideMargin(stars)`.
- [ ] `eclipse.ts`: `pendingShards(cycleStarlight)`, `canEclipse`, `eclipse(state, catalog)`
      (resets starlight, instruments, upgrades, `cycleStarlight`, `cycleSeconds`; keeps charted,
      achievements, boons, lifetime, taps; banks shards; applies `start-starlight` and
      `start-owned` boons; increments `eclipses`).
- [ ] `reducer.ts`: `reduce(state, action, catalog)` over an `Action` union returning
      `{ state, events, ok, reason? }`, so the UI has a single entry point.
- [ ] `index.ts` re-exports the public API (named exports only); keep `version`.

Tests under `apps-games/cloud-observatory-core/test/` (all deterministic; any pseudo-randomness
comes from a local seeded LCG written in the test, never `Math.random`):

- [ ] `numbers.test.ts`: table of 40+ formatting cases including 0, 0.2, 9.99, 10.04, 99.95, 999,
      1000, 1234, 999999, 1e6, 1e33, 1e36, 1.234e45, 1e300, 1e301, `NaN`, `-5`, `Infinity`;
      words labels; duration cases; `clampValue` bounds.
- [ ] `economy.test.ts`: bulk cost equals the sum of unit costs for k in 1..250 within 1e-9
      relative error; `maxAffordable` boundary (budget exactly at, just below and just above the
      cost of k units) for every growth in the fixture; multiplier combinations (atlas factor 1 and
      1.5, achievements 0 and 20, corona and totality); `starlightPerSecond` hand-computed
      examples; gather multiplier from Telescope upgrades.
- [ ] `actions.test.ts`: gather adds `gatherValue`; `tick` splitting invariance (tick 10 twice
      equals tick 20); purchase failures for each reason; upgrade thresholds exactly at 9/10, 24/25,
      49/50 owned; cost halving by boons; inputs never mutated (deep-freeze the input); `NaN` and
      `Infinity` seconds ignored; bulk and max purchase; unlock-after-previous rule.
- [ ] `chart.test.ts`: in-order completion for 5-, 7- and 10-star layouts; wrong tap increments
      `mistakes` and never advances; tapping an already-lit star is `repeat` and not a mistake;
      out-of-range index is `invalid`; `flawless` only with zero mistakes; completion pays the
      cost on completion, fails when starlight is below cost or the prerequisite unmet, and
      cannot chart twice; `hitTestStar` picks the nearest star within the radius and none outside;
      spacing and margin helpers on good and bad layouts.
- [ ] `eclipse.test.ts`: `pendingShards` boundaries (2.5e10 minus 1 gives 4, 2.5e10 gives 5, 1e11
      gives 10, 0 and negatives give 0), `canEclipse`, everything reset or kept as specified, boons
      applied to the next cycle, shards banked and boon purchases spend shards, repeated Eclipses
      accumulate counters.
- [ ] `offline.test.ts`: cap at 28,800 s with `capped: true`, efficiency 50/75/100 by boon,
      negative or `NaN` elapsed gives 0, zero production gives 0, identical inputs give identical
      outputs, starlight also feeds `cycleStarlight` and `lifetimeStarlight`.
- [ ] `state.test.ts`: `sanitizeState` accepts a valid state, rejects `NaN`, negative counts,
      unknown ids and wrong types, clamps oversized numbers; JSON round trip equals the input.
- [ ] `constants.test.ts`: every `RULES` value asserted literally against `economy.md`.
- [ ] `reducer.test.ts`: a scripted 30-action playthrough on the fixture catalog reaches a
      known end state (assert the exact numbers) and emits the expected event sequence.
- [ ] Keep `architecture.test.ts` and `version.test.ts` green.

## Files Touched

- `apps-games/cloud-observatory-core/src/{constants,types,numbers,economy,state,actions,chart,eclipse,reducer,index}.ts`
- `apps-games/cloud-observatory-core/test/{constants,numbers,economy,actions,chart,eclipse,offline,state,reducer}.test.ts`
- `apps-games/cloud-observatory-core/test/fixtures/catalog.ts`
- `.agents/games/cloud-observatory/{README,economy,decisions-log}.md` (only if a number or rule changed)
- `tasks/epics/21-web-cloud-observatory/STATUS.md` (tick task 01)

## Acceptance Criteria

- `RULES` values equal the numbers in `economy.md`; a constants test asserts each value literally.
- Every exported function has a direct test, and every rejection reason in `actions.ts` and
  `chart.ts` has a test that triggers it.
- `formatNumber` never returns `NaN`, `Infinity` or `undefined` for any double (property check over
  2,000 values spanning 1e-9 to 1e308 and special values) and is monotonic in the suffix order.
- `tick` called with the same inputs always returns an equal state (determinism); splitting a
  tick never changes the result beyond 1e-9 relative error.
- No function mutates its input (frozen-input tests pass).
- The architecture test passes: no forbidden tokens in `src/**`.
- `bun run --filter '@web-games/cloud-observatory*' test` reports at least 120 passing tests in the
  core package.

## Verification Commands

- `bun run --filter '@web-games/cloud-observatory*' typecheck`
- `bun run --filter '@web-games/cloud-observatory*' test`
- `bun run --filter '@web-games/cloud-observatory' build`
- `bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core`

## Out of Scope

- The full content tables, star coordinates and the balance simulator (task 02).
- Achievements, lore unlocks, statistics, the Comet, save migrations (task 03).
- Any UI, audio, art or Capacitor work.
- Changing the kit, other games or dependencies.

## Commit message

`feat(cloud-observatory): add headless core rules engine with exhaustive tests [21-web-cloud-observatory/01]`
