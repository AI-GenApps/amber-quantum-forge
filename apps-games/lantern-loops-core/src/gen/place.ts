import {
  type Cell,
  type Colour,
  gate,
  lantern,
  mirror,
  neighbours,
  openCell,
  type Puzzle,
  stoneCell,
} from "../puzzle";
import { isCorner, isStraight } from "../tile";
import type { ClueRanges } from "./ranges";
import type { Rng } from "./rng";
import type { SolutionBoard } from "./solution";

export interface PlaceParams {
  readonly id: string;
  readonly size: number;
  readonly colours: readonly Colour[];
  readonly ranges: ClueRanges;
}

export interface Placed {
  readonly puzzle: Puzzle;
  readonly solution: Uint8Array;
}

function between(rng: Rng, range: readonly [number, number], cap: number): number | null {
  const high = Math.min(range[1], cap);
  if (high < range[0]) return null;
  return rng.between(range[0], high);
}

function litNeighbours(size: number, tiles: Uint8Array, i: number): number {
  return neighbours(size, i).filter((j) => (tiles[j] ?? 0) !== 0).length;
}

/** Assigns each loop a colour; every palette colour is used when the loops allow it. */
function colourLoops(rng: Rng, loops: number, palette: readonly Colour[]): Colour[] | null {
  if (loops < palette.length) return null;
  const order = rng.shuffle(palette);
  const slots = rng.shuffle(Array.from({ length: loops }, (_, k) => k));
  const out: Colour[] = new Array(loops);
  slots.forEach((slot, k) => {
    out[slot] = k < order.length ? (order[k] as Colour) : rng.pick(palette);
  });
  return out;
}

/**
 * Puts lanterns, stones, mirrors and gates on a solved loop set. Counts are drawn inside the
 * ranges (at the top of the range when `fill` is set). Returns null when the board cannot host the
 * counts, so the caller retries with another solution.
 */
export function placeClues(
  rng: Rng,
  board: SolutionBoard,
  params: PlaceParams,
  fill = false,
): Placed | null {
  const { size, ranges } = params;
  const total = size * size;
  const loopColours = colourLoops(rng, board.loops.length, params.colours);
  if (loopColours === null) return null;
  const pickCount = (range: readonly [number, number], cap: number): number | null =>
    fill
      ? range[1] <= cap && range[0] <= range[1]
        ? range[1]
        : cap >= range[0]
          ? cap
          : null
      : between(rng, range, cap);

  const colourAt = new Map<number, Colour>();
  board.loops.forEach((cells, k) => {
    for (const cell of cells) colourAt.set(cell, loopColours[k] as Colour);
  });

  const taken = new Set<number>();
  const clues: Cell[] = new Array(total);
  const lanternTotal = pickCount(ranges.lanterns, total);
  if (lanternTotal === null || lanternTotal < board.loops.length) return null;
  for (const cells of board.loops) {
    const cell = rng.pick(cells);
    taken.add(cell);
  }
  const spare = rng.shuffle(board.loops.flat().filter((cell) => !taken.has(cell)));
  while (taken.size < lanternTotal && spare.length > 0) taken.add(spare.pop() as number);
  if (taken.size < ranges.lanterns[0]) return null;
  const lanternCells = [...taken];
  for (const cell of lanternCells) {
    clues[cell] = lantern(colourAt.get(cell) as Colour);
  }

  const free = (test: (mask: number) => boolean): number[] =>
    rng.shuffle(
      board.loops.flat().filter((cell) => !taken.has(cell) && test(board.tiles[cell] as number)),
    );

  const mirrorCount = pickCount(ranges.mirrors, total);
  const corners = free(isCorner);
  if (mirrorCount === null || corners.length < mirrorCount) return null;
  for (const cell of corners.slice(0, mirrorCount)) {
    const mask = board.tiles[cell] as number;
    clues[cell] = mirror(mask === 9 || mask === 6 ? "/" : "\\");
    taken.add(cell);
  }

  const gateCount = pickCount(ranges.gates, total);
  const straights = free(isStraight);
  if (gateCount === null || straights.length < gateCount) return null;
  for (const cell of straights.slice(0, gateCount)) {
    clues[cell] = gate(colourAt.get(cell) as Colour);
    taken.add(cell);
  }

  const empties: number[] = [];
  for (let i = 0; i < total; i++) if ((board.tiles[i] ?? 0) === 0) empties.push(i);
  const stoneCount = pickCount(ranges.stones, empties.length);
  if (stoneCount === null) return null;
  const lit = rng.shuffle(empties.filter((i) => litNeighbours(size, board.tiles, i) > 0));
  const dark = rng.shuffle(empties.filter((i) => litNeighbours(size, board.tiles, i) === 0));
  const stones: number[] = [];
  while (stones.length < stoneCount) {
    const prefer = lit.length > 0 && (dark.length === 0 || rng.chance(80));
    const next = prefer ? lit.pop() : dark.pop();
    if (next === undefined) break;
    stones.push(next);
  }
  if (stones.length < stoneCount) return null;
  for (const i of stones) clues[i] = stoneCell(litNeighbours(size, board.tiles, i));

  const cells: Cell[] = Array.from({ length: total }, (_, i) => clues[i] ?? openCell());
  return { puzzle: { id: params.id, size, cells }, solution: board.tiles.slice() };
}
