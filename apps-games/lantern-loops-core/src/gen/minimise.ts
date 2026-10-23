import type { Tiles } from "../board";
import { type Cell, cellAt, type Puzzle } from "../puzzle";
import { evaluate } from "../rules";
import { solve } from "../solver";
import type { ClueRanges } from "./ranges";
import type { Rng } from "./rng";

export type ClueKind = "lantern" | "stone" | "mirror" | "gate";

export function withCell(puzzle: Puzzle, i: number, cell: Cell): Puzzle {
  const cells = puzzle.cells.slice();
  cells[i] = cell;
  return { ...puzzle, cells };
}

function withFixed(puzzle: Puzzle, i: number, fixed: number | undefined): Puzzle {
  const { fixed: _drop, ...rest } = cellAt(puzzle, i);
  return withCell(puzzle, i, fixed === undefined ? rest : { ...rest, fixed });
}

export function anchorCells(puzzle: Puzzle): number[] {
  const out: number[] = [];
  puzzle.cells.forEach((cell, i) => {
    if (cell.kind === "open" && cell.fixed !== undefined) out.push(i);
  });
  return out;
}

export function clueKind(cell: Cell): ClueKind | null {
  if (cell.kind === "stone") return "stone";
  return cell.clue?.kind ?? null;
}

function provenUnique(puzzle: Puzzle, nodeBudget: number): boolean {
  const result = solve(puzzle, { limit: 2, nodeBudget });
  return !result.exhausted && result.count === 1;
}

/**
 * Pins solution tiles one at a time until the solver proves a single solution. Always ends: in the
 * worst case every tile is pinned, and a board with every loop pinned has no other solution.
 */
export function pinUntilUnique(
  rng: Rng,
  puzzle: Puzzle,
  solution: Tiles,
  nodeBudget: number,
): Puzzle {
  let current = puzzle;
  for (let guard = 0; guard <= solution.length; guard++) {
    const result = solve(current, { limit: 2, nodeBudget });
    if (!result.exhausted && result.count === 1) return current;
    const pinned = new Set(anchorCells(current));
    const differing: number[] = [];
    for (const other of result.solutions) {
      for (let i = 0; i < solution.length; i++) {
        if ((solution[i] as number) !== 0 && other[i] !== solution[i] && !pinned.has(i)) {
          differing.push(i);
        }
      }
    }
    const pool = differing;
    if (pool.length === 0) {
      for (let i = 0; i < solution.length; i++) {
        if ((solution[i] as number) !== 0 && !pinned.has(i)) pool.push(i);
      }
    }
    if (pool.length === 0) return current;
    const pick = rng.pick(pool);
    current = withFixed(current, pick, solution[pick] as number);
  }
  return current;
}

/** Drops pinned tiles, in a seeded order, while the board stays provably unique. */
export function removeAnchors(rng: Rng, puzzle: Puzzle, nodeBudget: number): Puzzle {
  let current = puzzle;
  for (const i of rng.shuffle(anchorCells(puzzle))) {
    const trial = withFixed(current, i, undefined);
    if (provenUnique(trial, nodeBudget)) current = trial;
  }
  return current;
}

function countKinds(puzzle: Puzzle): Record<ClueKind, number> {
  const counts: Record<ClueKind, number> = { lantern: 0, stone: 0, mirror: 0, gate: 0 };
  for (const cell of puzzle.cells) {
    const kind = clueKind(cell);
    if (kind !== null) counts[kind] += 1;
  }
  return counts;
}

function colourSet(puzzle: Puzzle): Set<string> {
  const out = new Set<string>();
  for (const cell of puzzle.cells) {
    if (cell.clue?.kind === "lantern") out.add(cell.clue.colour);
  }
  return out;
}

function minimumOf(ranges: ClueRanges, kind: ClueKind): number {
  if (kind === "lantern") return ranges.lanterns[0];
  if (kind === "stone") return ranges.stones[0];
  return kind === "mirror" ? ranges.mirrors[0] : ranges.gates[0];
}

/** Drops clues above the range minimum, in a seeded order, while the board stays unique. */
export function removeClues(
  rng: Rng,
  puzzle: Puzzle,
  solution: Tiles,
  ranges: ClueRanges,
  nodeBudget: number,
): Puzzle {
  let current = puzzle;
  const colours = colourSet(puzzle);
  const clueCells: number[] = [];
  puzzle.cells.forEach((cell, i) => {
    if (clueKind(cell) !== null) clueCells.push(i);
  });
  for (const i of rng.shuffle(clueCells)) {
    const cell = cellAt(current, i);
    const kind = clueKind(cell);
    if (kind === null) continue;
    if (countKinds(current)[kind] <= minimumOf(ranges, kind)) continue;
    const { clue: _clue, stone: _stone, ...rest } = cell;
    const trial = withCell(current, i, { ...rest, kind: "open" });
    if (kind === "lantern") {
      if (colourSet(trial).size < colours.size) continue;
      if (!evaluate(trial, solution).solved) continue;
    }
    if (provenUnique(trial, nodeBudget)) current = trial;
  }
  return current;
}
