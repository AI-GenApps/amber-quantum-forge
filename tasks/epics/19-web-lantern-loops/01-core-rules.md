---
epic: 19-web-lantern-loops
task: 01-core-rules
status: in-progress
commit_scope: lantern-loops
depends_on: []
estimate: L
owner: agent
---

# Core rules engine (headless, in `lantern-loops-core`)

## Goal

Implement every rule of Lantern Loops as pure, deterministic, DOM-free TypeScript in
`apps-games/lantern-loops-core`: tiles, puzzle and board model, the puzzle text code, the full
solved/violation evaluator, the uniqueness solver (counts solutions up to a limit, with propagation),
the edit model (tap, rotate, drag-draw, erase, locking), undo/redo history and the hint picker.
Exhaustive tests prove the rules, including a brute-force cross-check of the solver. No UI, no
content, no generator yet (task 02).

## Context / Decisions

Read first: `.agents/games/lantern-loops/product.md` (exact rules), `content-plan.md` (clue ranges),
`decisions-log.md`. Key facts:

- Tiles are bitmasks N=1, E=2, S=4, W=8; the six legal tiles are 10, 5, 3, 6, 12, 9. `0` = empty.
- Cells: open or stone (stone numbers 0 to 4, never holds a tile). Clues on open cells: lantern
  (colour), mirror (`/` allows 9 or 6; `\` allows 12 or 3), gate (colour; straight tiles 10 or 5 only).
  Any open cell may carry a fixed (locked) tile that satisfies its own clue.
- Solved = no loose ends; lanterns, mirrors, gates all hold a tile; every loop holds at least one
  lantern; stone counts exact; loops are single-colour; gates are crossed only by a loop of their
  colour; fixed tiles unchanged. Several loops are allowed.
- The core is imported by the app and by Node scripts: no `window`, `document`, `Date.now`,
  `performance.now`, `Math.random`, `localStorage` anywhere in `src` (existing
  `test/architecture.test.ts` scans for them). Time is injected where needed (the solver takes a node
  budget, never a clock). `lib` is ES2022 only (no DOM types).
- No dependency on `@web-games/kit` (the core package declares none and none may be added).
- Keep `export const version` (existing `test/version.test.ts`); bump it to `"0.1.0"` and update that test.

## Implementation Checklist

- [x] `src/tile.ts`: mask constants `N,E,S,W`; `TILE_MASKS`; `isStraight`, `isCorner`, `isLegalTile`;
      `openings(mask)`; `opposite(dir)`; `rotateCorner`; the tap cycles `STRAIGHT_CYCLE = [0,10,5]` and
      `CORNER_CYCLE = [0,3,6,12,9]`; `MIRROR_CORNERS = { "/": [9,6], "\\": [12,3] }`.
- [x] `src/puzzle.ts`: types `Colour = "amber"|"rose"|"jade"|"azure"|"violet"`, `Cell` (`kind: "open"|"stone"`,
      optional `clue` lantern/mirror/gate, optional `fixed` mask, `stone` number), `Puzzle { id, size, cells }`,
      `cellIndex`, `neighbours(size, i)`, `validatePuzzleShape(puzzle)` (size 4 to 9, 4 only for tutorials;
      anchors legal for their clue; no clue on stones; stone 0..4).
- [x] `src/code.ts`: `encodePuzzle` / `decodePuzzle` for a compact single-string format (one row per
      segment, one token per cell: `.` open, `L<colour letter>` lantern, `S<0-4>` stone, `M/` `M\` mirror,
      `G<colour letter>` gate, optional `=<hex digit of fixed mask>` suffix) plus `encodeTiles` /
      `decodeTiles` for boards and solutions (one hex digit per cell). Round-trip tested; malformed input
      returns a typed error result, never throws or loops.
- [x] `src/board.ts`: `Tiles = Uint8Array` (length size squared) helpers `emptyTiles(puzzle)` (fixed tiles
      pre-placed), `withTile(tiles, i, mask)` (returns a copy), `equalTiles`, `lockedMask(puzzle, hintCells)`.
- [x] `src/loops.ts`: `analyseLoops(puzzle, tiles)` returning closed loops (cell lists), open chains, each
      loop's lanterns and derived colour (or `mixed`), and loose ends (cell + direction).
- [x] `src/rules.ts`: `evaluate(puzzle, tiles)` returns `{ solved, violations, incomplete }` where each
      violation has `kind` (`loose-end`, `lantern-dark`, `dark-loop`, `stone-count`, `mirror-shape`,
      `gate-shape`, `colour-mix`, `gate-colour`, `fixed-changed`), the cells involved, and `severity`
      (`conflict` = cannot be repaired by adding tiles, `pending` = still fixable). `conflicts(puzzle,
      tiles)` returns only `conflict` items for the live feedback (stone exceeded or unreachable, dark
      closed loop, mixed colours, wrong mirror/gate shape, closed loop through a wrong-colour gate).
- [x] `src/solver.ts` (search is smallest-domain-first with arc consistency per node, see decisions-log; a lantern reachability prune was built and measured, it cut no nodes and cost 10x time, so it is not included): `solve(puzzle, { limit = 2, nodeBudget = 2_000_000, partial? })` returning
      `{ solutions: Tiles[], count, exhausted, nodes }`; row-major search over the 7 states per cell
      with edge consistency against already assigned neighbours, stone count bounds, mirror/gate/fixed
      restrictions, union-find loop tracking (reject a closed loop with no lantern or two colours,
      reject a gate crossed by the wrong colour), lantern reachability pruning. `countSolutions`,
      `isUnique(puzzle)`, `solveOne`, and `propagate(puzzle, partial)` returning forced cell values and a
      `contradiction` flag; `exhausted` is true only when the node budget stopped the search.
- [x] `src/history.ts`: `createHistory(initial)` with `push`, `undo`, `redo`, `canUndo`, `canRedo`,
      `current`, step grouping for one drag (`beginGroup`/`endGroup`), cap of 2,000 steps (oldest dropped).
- [x] `src/edit.ts`: `Brush = "straight"|"corner"|"erase"`; `tapCell(puzzle, tiles, locked, i, brush)`
      following the cycles and family conversion in `product.md`; `dragPath(puzzle, tiles, locked, cells)`
      (tile joins previous and next cell; first and last cell get a straight tile along the drag; skips stones,
      fixed and hint-locked cells; ignores non-adjacent jumps by splitting the path); `eraseCells`;
      `longPressErase`. All return a new `Tiles` and the list of changed cells (empty list = no-op, so no
      undo step is recorded).
- [x] `src/hint.ts`: `pickHint(puzzle, tiles, solution, locked)` implementing the rule in `product.md`
      (forced-by-propagation first, then row-major), returning `{ cell, mask } | null`; `applyHint`
      adds the cell to the locked set.
- [x] `src/index.ts`: re-export the public API; keep `version`.
- [x] Tests in `test/` (Vitest, no DOM): see Acceptance Criteria for the minimum coverage.
- [x] Update the knowledge base only if a rule detail changed while implementing (same commit).

## Files Touched

- `apps-games/lantern-loops-core/src/{tile,puzzle,code,board,loops,rules,solver,history,edit,hint,index}.ts`
- `apps-games/lantern-loops-core/test/{tile,puzzle,code,loops,rules,solver,solver-bruteforce,history,edit,hint}.test.ts`
  and `test/helpers/{fixtures,bruteforce,rng}.ts` (the brute-force enumerator is independent of
  `solver.ts`: it enumerates edge sets with degree 0 or 2 per cell, then filters with its own checks)
- `apps-games/lantern-loops-core/test/version.test.ts` (version bump)
- `.agents/games/lantern-loops/*` only if a rule detail changed

## Acceptance Criteria

- [x] `tile` tests: all six masks, rotation cycles, `opposite`, mirror corner sets; every illegal mask
      (0 and the nine others from 1 to 15 not in the six) is rejected by `isLegalTile` except 0 as empty.
- [x] `rules` tests, at least 40 table-driven cases: a solved fixture per mechanic (lanterns only, stones,
      mirrors both slashes with both corners, gates with matching colour, two loops, adjacent loops,
      stone 0, edge stone) and a failing fixture per violation kind, including each of: loose end at the
      board edge, loose end facing a stone, lantern empty, loop with no lantern, stone count too high and
      too low, mirror straight tile, mirror wrong corner, gate on a corner, gate crossed by wrong colour,
      two colours on one loop, moved fixed tile, empty board (not solved, only pending violations).
- [x] `solver` tests: unique, multiple (count stops at the limit 2), unsolvable and trivially solved
      fixtures; `nodeBudget` exhaustion reports `exhausted: true` and never a wrong `count`; solutions
      returned always satisfy `evaluate(...).solved`; `partial` boards respect existing tiles.
- [x] Brute-force cross-check: for at least 300 seeded random puzzles on 3x3 and 4x4 (lanterns, stones,
      mirrors, gates, fixed tiles mixed), `solve` count (capped at 2) equals the independent enumerator's
      count, and the solution sets match when the count is 1.
- [x] Performance guards (generous thresholds so CI is stable): `isUnique` on a dense 9x9 fixture with
      all mechanics under 500 ms; on a 5x5 under 50 ms; `propagate` on a 9x9 under 100 ms. The measured
      times are printed once in the test output.
- [x] `edit` tests: tap cycles for both brushes from every start state; family conversion; drag draws
      straight and L-shaped paths in all 8 direction combinations; drag overwrites own tiles but skips
      stones, fixed and hint-locked cells; a random edit fuzz of 2,000 operations on a seeded puzzle
      never places a tile on a stone, never changes a locked cell and only ever produces legal masks.
- [x] `history` tests: undo/redo order, drag grouped into one step, redo cleared after a new edit, cap of
      2,000 steps, no-op edits not recorded.
- [x] `hint` tests: never picks a cell that already matches, prefers forced cells, falls back to row-major,
      returns `null` when solved, locked cell then rejects edits.
- [x] `code` tests: round trip for 200 seeded random puzzles and boards; at least 20 malformed strings
      (wrong row count, bad token, illegal anchor, stone with fixed tile, size 10) produce typed errors.
- [x] Core purity: `test/architecture.test.ts` still passes (no forbidden tokens in `src`).
- [x] All verification commands below pass; no file in `src` exceeds 800 lines; no `any`.

## Verification Commands

```
bun run --filter '@web-games/lantern-loops*' typecheck
bun run --filter '@web-games/lantern-loops*' test
bun run --filter '@web-games/lantern-loops' build
bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core
```

## Out of Scope

Puzzle generation, campaign or daily content, difficulty rating (task 02); stars, tokens, streaks,
saves (task 03); any UI, audio, art or Capacitor work; changes to `apps-games/web-kit`.

## Commit message

`feat(lantern-loops): headless rules engine, solver and edit model [19-web-lantern-loops/01]`
