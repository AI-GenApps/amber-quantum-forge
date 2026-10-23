import type { Tiles } from "../board";
import type { Colour, Puzzle } from "../puzzle";
import { type DifficultyStats, measure, type RatingValue, ratingOf } from "./difficulty";
import { anchorCells, pinUntilUnique, removeAnchors, removeClues } from "./minimise";
import { placeClues } from "./place";
import { type Mechanics, type Range, rangesFor } from "./ranges";
import { createRng, mixSeed } from "./rng";
import { generateSolution } from "./solution";

export interface GenParams {
  readonly id?: string;
  readonly size: number;
  readonly mechanics: Mechanics;
  readonly colours?: readonly Colour[];
  readonly relaxStones?: boolean;
  readonly lanterns?: Range;
  readonly loops?: Range;
  readonly coverage?: Range;
  readonly maxAnchorShare?: number;
  /** Accepted ratings, inclusive. */
  readonly rating?: Range;
  readonly attempts?: number;
  readonly nodeBudget?: number;
}

export interface GenResult {
  readonly puzzle: Puzzle;
  readonly solution: Tiles;
  readonly stats: DifficultyStats;
  readonly rating: RatingValue;
  /** True when the share and rating limits of the params are met. */
  readonly accepted: boolean;
  readonly anchors: number;
  readonly solutionTiles: number;
  readonly attempt: number;
  readonly fallback: boolean;
}

export const GENERATOR_VERSION = "ll-gen-1";
export const DEFAULT_ATTEMPTS = 6;
export const GEN_NODE_BUDGET = 40_000;
const FALLBACK_TRIES = 64;

function solutionTiles(tiles: Tiles): number {
  let n = 0;
  for (const mask of tiles) if (mask !== 0) n += 1;
  return n;
}

function candidate(params: GenParams, seed: number, attempt: number, fallback: boolean) {
  const rng = createRng(mixSeed(seed, attempt));
  const colours = params.colours ?? ["amber"];
  const ranges = rangesFor(params.size, params.mechanics, params.relaxStones === true);
  const lanterns = params.lanterns ?? ranges.lanterns;
  const budget = params.nodeBudget ?? GEN_NODE_BUDGET;
  const full = { ...ranges, lanterns };
  const board = generateSolution(rng, {
    size: params.size,
    loops: params.loops ?? [Math.max(1, colours.length), lanterns[1]],
    coverage: params.coverage ?? [45, 70],
  });
  const placed = placeClues(
    rng,
    board,
    { id: params.id ?? `gen-${seed}`, size: params.size, colours, ranges: full },
    fallback,
  );
  if (placed === null) return null;
  let puzzle = pinUntilUnique(rng, placed.puzzle, placed.solution, budget);
  if (!fallback) {
    puzzle = removeAnchors(rng, puzzle, budget);
    puzzle = removeClues(rng, puzzle, placed.solution, full, budget);
    puzzle = removeAnchors(rng, puzzle, budget);
  }
  return { puzzle, solution: placed.solution };
}

function penalty(share: number, limit: number, rating: number, range: Range | undefined): number {
  const outside = range === undefined ? 0 : Math.max(range[0] - rating, rating - range[1], 0);
  return outside * 100 + Math.max(0, share - limit);
}

/**
 * Deterministic for (params, seed). Tries `attempts` boards, each from a derived seed, and returns
 * the first that meets the anchor-share and rating limits, else the closest. With `attempts = 0`
 * (or when no attempt can place its clues) up to 64 more boards are built with top-of-range clues
 * and pinned only until the solver proves a single solution, without the removal passes; such a
 * board is always unique. Throws only for params no board can satisfy (more colours than lanterns).
 */
export function generatePuzzle(params: GenParams, seed: number): GenResult {
  const attempts = params.attempts ?? DEFAULT_ATTEMPTS;
  const limit = params.maxAnchorShare ?? 50;
  let best: GenResult | null = null;
  let bestPenalty = Number.POSITIVE_INFINITY;
  const total = attempts + FALLBACK_TRIES;
  for (let attempt = 0; attempt < total; attempt++) {
    const fallback = attempt >= attempts;
    if (fallback && best !== null) break;
    const made = candidate(params, seed, attempt, fallback);
    if (made === null) continue;
    const tiles = solutionTiles(made.solution);
    const anchors = anchorCells(made.puzzle).length;
    const stats = measure(made.puzzle);
    const rating = ratingOf(stats);
    const cost = penalty((anchors * 100) / tiles, limit, rating, params.rating);
    if (cost < bestPenalty) {
      bestPenalty = cost;
      best = {
        puzzle: made.puzzle,
        solution: made.solution,
        stats,
        rating,
        accepted: cost === 0,
        anchors,
        solutionTiles: tiles,
        attempt,
        fallback,
      };
    }
    if (cost === 0) break;
  }
  if (best === null) throw new Error("generator found no placeable board for these params");
  return best;
}
