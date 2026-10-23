import {
  type Cell,
  evaluate,
  gate,
  lantern,
  mirror,
  type Puzzle,
  stoneCell,
  type Tiles,
} from "@web-games/lantern-loops-core";
import type { HowToPage } from "../app/routes";

export interface DiagramFixture {
  puzzle: Puzzle;
  tiles: Tiles;
  /** Cells drawn with the hint marker. */
  hinted: readonly number[];
}

const plain = (): Cell => ({ kind: "open" });

/** A 3 x 3 ring of eight tiles; the centre stays free. */
const RING: readonly number[] = [6, 10, 12, 5, 0, 5, 3, 10, 9];
const SMALL_LOOP: readonly number[] = [6, 12, 0, 3, 9, 0, 0, 0, 0];

function board(id: string, cells: Cell[], tiles: readonly number[], hinted: number[] = []) {
  const puzzle: Puzzle = { id, size: 3, cells };
  return { puzzle, tiles: Uint8Array.from(tiles), hinted };
}

function cellsWith(overrides: Readonly<Record<number, Cell>>): Cell[] {
  return Array.from({ length: 9 }, (_, i) => overrides[i] ?? plain());
}

/** One tiny solved board per page, built from the same cell kinds the game draws. */
export const DIAGRAMS: Readonly<Record<HowToPage, DiagramFixture>> = {
  basics: board("howto-basics", cellsWith({ 0: lantern("amber") }), SMALL_LOOP),
  stones: board("howto-stones", cellsWith({ 0: lantern("amber"), 4: stoneCell(4) }), RING),
  mirrors: board("howto-mirrors", cellsWith({ 0: lantern("amber"), 8: mirror("/") }), RING),
  gates: board("howto-gates", cellsWith({ 0: lantern("rose"), 1: gate("rose") }), RING),
  daily: board("howto-daily", cellsWith({ 0: lantern("amber") }), SMALL_LOOP),
  hints: board("howto-hints", cellsWith({ 0: lantern("amber") }), SMALL_LOOP, [3]),
};

export function fixtureSolved(fixture: DiagramFixture): boolean {
  return evaluate(fixture.puzzle, fixture.tiles).solved;
}
