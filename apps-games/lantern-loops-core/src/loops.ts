import type { Tiles } from "./board";
import { COLOURS, type Colour, cellAt, colOf, type Puzzle, rowOf } from "./puzzle";
import { DIRS, type Dir, dirCol, dirRow, isTileMask, opposite } from "./tile";

export type LoopColour = Colour | "mixed" | null;

/** A connected run of tiles: a closed loop or an open chain. Cells are in path order. */
export interface Component {
  readonly cells: number[];
  readonly lanterns: number[];
  readonly gates: number[];
  readonly colours: Colour[];
  /** The single lantern colour, "mixed" for several, null without lanterns. */
  readonly colour: LoopColour;
}

export type Facing = "edge" | "stone" | "empty" | "mismatch";

export interface LooseEnd {
  readonly cell: number;
  readonly dir: Dir;
  readonly facing: Facing;
}

export interface LoopAnalysis {
  readonly loops: Component[];
  readonly chains: Component[];
  readonly looseEnds: LooseEnd[];
}

/** The tile that counts on cell i: stones and illegal values count as empty. */
export function tileAt(puzzle: Puzzle, tiles: Tiles, i: number): number {
  const cell = cellAt(puzzle, i);
  if (cell.kind === "stone") return 0;
  const mask = tiles[i] ?? 0;
  return isTileMask(mask) ? mask : 0;
}

/** The in-bounds neighbour of cell i in direction dir, or -1. */
export function stepCell(size: number, i: number, dir: Dir): number {
  const row = rowOf(size, i) + dirRow(dir);
  const col = colOf(size, i) + dirCol(dir);
  if (row < 0 || col < 0 || row >= size || col >= size) return -1;
  return row * size + col;
}

function facingOf(puzzle: Puzzle, tiles: Tiles, i: number, dir: Dir): Facing | null {
  const j = stepCell(puzzle.size, i, dir);
  if (j < 0) return "edge";
  if (cellAt(puzzle, j).kind === "stone") return "stone";
  const other = tileAt(puzzle, tiles, j);
  if (other === 0) return "empty";
  return (other & opposite(dir)) === 0 ? "mismatch" : null;
}

function describe(puzzle: Puzzle, cells: number[]): Component {
  const lanterns: number[] = [];
  const gates: number[] = [];
  let bits = 0;
  for (const i of cells) {
    const clue = cellAt(puzzle, i).clue;
    if (clue?.kind === "lantern") {
      lanterns.push(i);
      bits |= 1 << COLOURS.indexOf(clue.colour);
    } else if (clue?.kind === "gate") {
      gates.push(i);
    }
  }
  const colours = COLOURS.filter((_, k) => (bits & (1 << k)) !== 0);
  const colour: LoopColour =
    colours.length === 0 ? null : colours.length === 1 ? (colours[0] as Colour) : "mixed";
  return { cells, lanterns, gates, colours, colour };
}

function walk(
  puzzle: Puzzle,
  tiles: Tiles,
  start: number,
  first: Dir,
  visited: Uint8Array,
): number[] {
  const cells: number[] = [];
  let cur = start;
  let out: Dir = first;
  for (let guard = 0; guard <= tiles.length; guard++) {
    cells.push(cur);
    visited[cur] = 1;
    const next = stepCell(puzzle.size, cur, out);
    if (next < 0 || next === start || visited[next] === 1) break;
    const mask = tileAt(puzzle, tiles, next);
    const back = opposite(out);
    if (mask === 0 || (mask & back) === 0) break;
    const onward = mask & ~back;
    cur = next;
    out = onward as Dir;
  }
  return cells;
}

/** Splits the tiles into closed loops and open chains and lists every loose end. */
export function analyseLoops(puzzle: Puzzle, tiles: Tiles): LoopAnalysis {
  const size = puzzle.size;
  const total = size * size;
  const looseEnds: LooseEnd[] = [];
  const chainStarts: Array<{ cell: number; dir: Dir }> = [];
  for (let i = 0; i < total; i++) {
    const mask = tileAt(puzzle, tiles, i);
    if (mask === 0) continue;
    let linked: Dir | null = null;
    let loose = 0;
    for (const dir of DIRS) {
      if ((mask & dir) === 0) continue;
      const facing = facingOf(puzzle, tiles, i, dir);
      if (facing === null) linked = dir;
      else {
        looseEnds.push({ cell: i, dir, facing });
        loose += 1;
      }
    }
    if (loose > 0)
      chainStarts.push({ cell: i, dir: linked ?? (DIRS.find((d) => (mask & d) !== 0) as Dir) });
  }
  const visited = new Uint8Array(total);
  const chains: Component[] = [];
  for (const { cell, dir } of chainStarts) {
    if (visited[cell] === 1) continue;
    chains.push(describe(puzzle, walk(puzzle, tiles, cell, dir, visited)));
  }
  const loops: Component[] = [];
  for (let i = 0; i < total; i++) {
    const mask = tileAt(puzzle, tiles, i);
    if (mask === 0 || visited[i] === 1) continue;
    const first = DIRS.find((d) => (mask & d) !== 0) as Dir;
    loops.push(describe(puzzle, walk(puzzle, tiles, i, first, visited)));
  }
  return { loops, chains, looseEnds };
}
