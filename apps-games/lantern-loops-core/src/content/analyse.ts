import type { Tiles } from "../board";
import { decodePuzzle, decodeTiles } from "../code";
import { type Colour, COLOURS, type Puzzle } from "../puzzle";
import { measure, type RatingValue, ratingOf } from "../gen/difficulty";
import type { PuzzleRecord, TutorialRecord } from "./types";

export interface RecordStats {
  readonly id: string;
  readonly size: number;
  readonly rating: RatingValue;
  readonly lanterns: number;
  readonly stones: number;
  readonly mirrors: number;
  readonly gates: number;
  readonly colours: Colour[];
  readonly anchors: number;
  readonly solutionTiles: number;
  /** Anchors as a percentage of the solution tiles, one decimal. */
  readonly anchorShare: number;
  readonly nodes: number;
}

export function puzzleFromRecord(record: PuzzleRecord | TutorialRecord): Puzzle {
  const decoded = decodePuzzle(record.code, record.id);
  if (!decoded.ok) throw new Error(`${record.id}: ${decoded.error.message}`);
  return decoded.value;
}

export function solutionFromRecord(record: PuzzleRecord | TutorialRecord): Tiles {
  const decoded = decodeTiles(record.solution, record.size);
  if (!decoded.ok) throw new Error(`${record.id}: ${decoded.error.message}`);
  return decoded.value;
}

export function countClues(puzzle: Puzzle) {
  let lanterns = 0;
  let stones = 0;
  let mirrors = 0;
  let gates = 0;
  let anchors = 0;
  const colours = new Set<Colour>();
  for (const cell of puzzle.cells) {
    if (cell.kind === "stone") stones += 1;
    else if (cell.clue?.kind === "lantern") {
      lanterns += 1;
      colours.add(cell.clue.colour);
    } else if (cell.clue?.kind === "mirror") mirrors += 1;
    else if (cell.clue?.kind === "gate") gates += 1;
    if (cell.kind === "open" && cell.fixed !== undefined) anchors += 1;
  }
  return {
    lanterns,
    stones,
    mirrors,
    gates,
    anchors,
    colours: COLOURS.filter((colour) => colours.has(colour)),
  };
}

export function analyseRecord(record: PuzzleRecord): RecordStats {
  const puzzle = puzzleFromRecord(record);
  const solution = solutionFromRecord(record);
  const counts = countClues(puzzle);
  const solutionTiles = solution.reduce((n, mask) => n + (mask === 0 ? 0 : 1), 0);
  const stats = measure(puzzle);
  return {
    id: record.id,
    size: record.size,
    rating: ratingOf(stats),
    lanterns: counts.lanterns,
    stones: counts.stones,
    mirrors: counts.mirrors,
    gates: counts.gates,
    colours: counts.colours,
    anchors: counts.anchors,
    solutionTiles,
    anchorShare: Math.round((counts.anchors * 1000) / solutionTiles) / 10,
    nodes: stats.nodes,
  };
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}
