import type { Puzzle } from "../puzzle";
import { propagate, solve } from "../solver";

export interface DifficultyStats {
  readonly size: number;
  /** Cells the player must decide: open cells without a fixed tile. */
  readonly freeCells: number;
  /** Free cells that propagation alone cannot decide. */
  readonly unresolved: number;
  /** Cell assignments (guesses) the solver tried; 0 means propagation solves the board. */
  readonly nodes: number;
}

export type RatingValue = 1 | 2 | 3 | 4 | 5;

export interface Rating {
  readonly rating: RatingValue;
  readonly effort: number;
  readonly stats: DifficultyStats;
}

/** Effort values at which the rating steps from 1 to 2, 2 to 3, 3 to 4 and 4 to 5. */
export const RATING_STEPS: readonly number[] = [3.5, 6, 8.5, 11];

/** Solver statistics of a puzzle; the node budget only bounds the search. */
export function measure(puzzle: Puzzle, nodeBudget?: number): DifficultyStats {
  const result = solve(puzzle, { limit: 2, ...(nodeBudget === undefined ? {} : { nodeBudget }) });
  const { forced } = propagate(puzzle);
  let freeCells = 0;
  for (const cell of puzzle.cells) {
    if (cell.kind === "open" && cell.fixed === undefined) freeCells += 1;
  }
  return {
    size: puzzle.size,
    freeCells,
    unresolved: Math.max(0, freeCells - forced.length),
    nodes: result.nodes,
  };
}

/** Guess count on a log scale, plus the share propagation leaves open, plus 0.5 per size above 5. */
export function effortOf(stats: DifficultyStats): number {
  const open = stats.freeCells === 0 ? 0 : stats.unresolved / stats.freeCells;
  return Math.log2(1 + stats.nodes) + 4 * open + 0.5 * (stats.size - 5);
}

export function ratingOf(stats: DifficultyStats): RatingValue {
  const effort = effortOf(stats);
  return (1 + RATING_STEPS.filter((step) => effort >= step).length) as RatingValue;
}

/** Difficulty rating 1 to 5 of a puzzle, with the raw statistics behind it. */
export function rate(puzzle: Puzzle, nodeBudget?: number): Rating {
  const stats = measure(puzzle, nodeBudget);
  return { rating: ratingOf(stats), effort: effortOf(stats), stats };
}
