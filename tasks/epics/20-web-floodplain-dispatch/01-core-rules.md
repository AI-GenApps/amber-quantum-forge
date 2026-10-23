---
epic: 20-web-floodplain-dispatch
task: 01-core-rules
status: in-progress
commit_scope: floodplain-dispatch
depends_on: []
estimate: L
owner: agent
---

# Core rules engine (headless, in floodplain-dispatch-core)

## Goal

Build the deterministic water-routing engine in `apps-games/floodplain-dispatch-core`: map layout parsing, the board model, placement rules, the fixed-step flood simulation with surges, droughts and tides, the goal metrics and the star and score evaluation. Everything is pure TypeScript, integer arithmetic only, with exhaustive tests. No content (that is task 02) and no UI.

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
- **Spec of record:** `product.md` sections "Grid, terrain and cells", "Pieces and costs", "Water simulation", "Events and forecast" and "Goals, stars and score". This task implements them exactly; if a rule proves unworkable (for example no reference map can be solved), change `product.md`, `economy.md` and `decisions-log.md` in the same commit and say why.
- **Purity:** the existing `test/architecture.test.ts` bans `window`, `document`, `Date.now`, `performance.now`, `Math.random` and `localStorage` in `src/`; it must keep passing. The core has no dependencies, so it cannot import the kit: it carries its own small seeded PRNG (`src/prng.ts`, sfc32 seeded from a 32-bit integer and an FNV-1a string hash) for tests and for tasks 02 and 03. The app converts kit seeds (`dailySeed`) to the integer the core expects.
- **Determinism contract:** `runSeason(def, placements)` is a pure function. Same inputs always give byte-identical results (`JSON.stringify` equal). Inputs are never mutated. No object iteration order may influence results; iterate cells in row-major order and neighbours in the fixed order N, E, S, W.
- **Layout format** (used by task 02 content): one string per row, tokens separated by one space, each token is a kind character plus a height digit 0 to 7. Kinds: `.` land, `H` house, `F` field, `T` scenery, `I` inlet, `S` sea. Example row: `.3 .3 F2 H3 T4 .2 I6 S0`. `MapDef` also carries `inlets` rates in row-major inlet order, house kinds in row-major house order, and events, tide, weeks, pieces, par and budget.
- **Constants** live in `src/constants.ts` and nowhere else: step and week lengths, caps (canal-type edge 4, other edge 2, pump 4, reservoir capacity 10), crest modifiers (canal -2, reservoir -3, barrier +3), thresholds (flood depth 2, supply depth 2, need steps 6, field wet band 1 to 4, max cell depth 99), piece costs (canal 1, barrier 1, sluice gate 2, pump 3, reservoir 4) and the score weights.
- **Board bounds** (8 x 12 to 12 x 16) are a content rule enforced by task 02; the engine accepts any board from 2 x 2 up to 16 x 20 so tests can use tiny hand-checkable boards.

## Implementation Checklist

- [x] `src/types.ts`: `CellKind`, `PieceKind` (`canal | barrier | pump | gate | reservoir`), `Direction`, `Placement` (x, y, kind, optional `dir` for pumps, optional `opensWeek` and `closesWeek` for gates), `MapDef`, `Board`, `SeasonEvent` (`surge | drought | storm-tide`), `TideSpec`, `SeasonMetrics`, `SeasonResult`, `Evaluation`.
- [x] `src/constants.ts` with every balance constant named above, each exported as a readonly value and covered by a test that pins its number (so doc and code cannot drift silently).
- [x] `src/prng.ts`: `createPrng(seed)`, `hashString`, `next()`, `int(n)`, `pick`, `shuffle`, `fork(label)`; tests for sequence stability against hard-coded values.
- [x] `src/layout.ts`: `parseLayout(rows)` returning a typed grid or a typed `LayoutError` (`EMPTY`, `RAGGED_ROW`, `BAD_TOKEN`, `BAD_HEIGHT`) with row and column; `formatLayout` for round-trip tests.
- [x] `src/board.ts`: `createBoard(def)`, `cellIndex`, `neighbors(x, y)` in N, E, S, W order, `isBuildable`, `effectiveCrest(cell, piece)`, `isCanalType(cell, piece)`.
- [x] `src/placement.ts`: `checkPlacement(def, placements, candidate)` returning `null` or a `PlacementError` code (`OUT_OF_BOUNDS`, `NOT_BUILDABLE`, `OCCUPIED`, `PIECE_UNAVAILABLE`, `OVER_BUDGET`, `BAD_DIRECTION`, `BAD_GATE_WEEKS`); `placementCost`, `budgetLeft`, immutable `addPlacement`, `removePlacement`, `rotatePump`, `setGateWeeks`.
- [x] `src/events.ts`: `inletRate(def, inletIndex, week)` (base plus surges minus droughts, floor 0) and `tideLevel(def, week)` using the integer formula in `product.md`, plus storm-tide deltas.
- [x] `src/simulate.ts`: `createSimState`, `stepOnce` (inlets, pumps, flow from snapshot, sea reset, metrics, in that order) and `runSeason` returning per-week depth frames (`Uint8Array` per week, plus the step-level frames when `{ keepSteps: true }`), the per-cell metrics and the final `SeasonResult`. Row-major order everywhere; flows computed from a snapshot and applied together; outflow per cell clipped to its depth in the order of ascending neighbour surface, then N, E, S, W.
- [x] `src/evaluate.ts`: `evaluate(def, result, placements)` giving `housesSupplied`, `fieldsIrrigated`, `housesFlooded`, `spend`, `stars` (cumulative 0 to 3), `cleared`, `score` (formula in `product.md`, floor 0) and the partial-progress counts for the result sheet.
- [x] `src/index.ts` re-exports the public API (keep the existing `version` export).
- [x] Tests in `test/` (one file per module, hand-computed expectations, no snapshot files): layout parse and error cases; board geometry and neighbour order; crest and canal-type for every piece; placement legality for each error code and for refunds; flow downhill and equalisation (difference 1 never moves, difference 2 moves 1); edge cap 2 versus 4; flow limited by source depth; mirror-symmetric boards give mirror-symmetric depths (no order bias); mass conservation on boards without sea or inlet and with a known inflow and drain; barrier overtopping at the exact depth; pump moves 4 uphill, stalls with a full target, obeys direction, runs in row-major order; gate open and closed on both week boundaries (`opensWeek` inclusive, `closesWeek` exclusive); reservoir walls, capacity 10, filling only through canal neighbours; tide table for periods 6, 8, 10 and amplitudes 1 to 3 including a storm-tide overlap; surge and drought sums, overlap and the floor at 0; metrics thresholds at 5 and 6 supplied steps, flood at depth 1 and 2, field wet band at 0, 1, 4 and 5; star rules for all combinations of (supplied, irrigated, flooded, spend vs par); score formula including the floor; PRNG-driven property test over 200 random boards and random legal placements: the run is repeatable, never throws, depths stay within 0 to 99, and the input is not mutated; a hand-built 5 x 6 golden season with every depth frame spelled out.
- [x] Add `test/determinism.test.ts` that runs the same random scenario twice and compares full JSON.
- [x] Confirm `test/architecture.test.ts` still passes and no file in `src/` exceeds 800 lines.
- [x] Update `product.md` and `decisions-log.md` only if a constant changed; otherwise leave them.

## Files Touched

- `apps-games/floodplain-dispatch-core/src/{types,constants,prng,layout,board,placement,events,simulate,evaluate,index}.ts`
- `apps-games/floodplain-dispatch-core/test/*.test.ts` (new test files, existing two kept)
- `.agents/games/floodplain-dispatch/product.md`, `decisions-log.md` (only if a rule changed)
- `tasks/epics/20-web-floodplain-dispatch/STATUS.md` (tick task 01)

## Acceptance Criteria

- `runSeason` is deterministic: two runs of 200 random scenarios produce identical JSON.
- Every rule in `product.md` "Water simulation" and "Goals, stars and score" has at least one test that fails if the rule changes.
- A test runs the largest legal season (12 x 16, 30 weeks, `keepSteps: true`) and asserts 30 week frames, 120 step frames, depths within 0 to 99, and a stable result hash.
- No `any`, no DOM types in the core, `architecture.test.ts` passes, no source file over 800 lines.
- The four verification commands pass (the app package still builds because it only uses `version`).

## Verification Commands

- `bun run --filter '@web-games/floodplain-dispatch*' typecheck`
- `bun run --filter '@web-games/floodplain-dispatch*' test`
- `bun run --filter '@web-games/floodplain-dispatch' build`
- `bunx biome check apps-games/floodplain-dispatch apps-games/floodplain-dispatch-core`

## Out of Scope

- The 40 maps, reference solutions and content validators (task 02).
- Progression, coins, daily generation and the solver (task 03).
- Any rendering, UI or audio.

## Commit message

`feat(floodplain-dispatch): add headless flood simulation and rules engine [20-web-floodplain-dispatch/01]`
