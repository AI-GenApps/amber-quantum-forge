import { decodePuzzle } from "../../src/code";
import {
  type Cell,
  COLOURS,
  type Colour,
  gate,
  lantern,
  mirror,
  openCell,
  type Puzzle,
  stoneCell,
} from "../../src/puzzle";
import { E, N, S, W } from "../../src/tile";
import type { Rng } from "./rng";

const GLYPHS: Record<string, number> = {
  ".": 0,
  "─": 10,
  "│": 5,
  "└": 3,
  "┌": 6,
  "┐": 12,
  "┘": 9,
};

/** Builds a board from rows of box glyphs: . empty, ─ │ straights, └ ┌ ┐ ┘ corners. */
export function tilesFrom(rows: readonly string[]): Uint8Array {
  const out: number[] = [];
  for (const row of rows) {
    for (const ch of row) {
      const mask = GLYPHS[ch];
      if (mask === undefined) throw new Error(`bad glyph ${ch}`);
      out.push(mask);
    }
  }
  return Uint8Array.from(out);
}

/** Decodes a puzzle code (rows joined by "|") and throws on a malformed fixture. */
export function puzzleOf(code: string, id = "fixture"): Puzzle {
  const result = decodePuzzle(code, id);
  if (!result.ok) throw new Error(`bad fixture ${code}: ${result.error.message}`);
  return result.value;
}

/** Rows of space-separated puzzle tokens, e.g. "La .  S1 M/ .". */
export function grid(rows: readonly string[], id = "fixture"): Puzzle {
  return puzzleOf(rows.map((row) => row.replace(/ /g, "")).join("|"), id);
}

export function makePuzzle(size: number, cells: readonly Cell[], id = "fixture"): Puzzle {
  return { id, size, cells };
}

export interface RandomSolution {
  readonly size: number;
  readonly tiles: Uint8Array;
  readonly loops: number[][];
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function faceEdges(size: number, face: number): Array<[number, number]> {
  const m = size - 1;
  const fr = Math.floor(face / m);
  const fc = face % m;
  const tl = fr * size + fc;
  return [
    [tl, tl + 1],
    [tl + size, tl + size + 1],
    [tl, tl + size],
    [tl + 1, tl + size + 1],
  ];
}

/** The boundary cycle of a set of faces as an ordered cell list, or null if it is not one cycle. */
function boundaryCycle(size: number, faces: ReadonlySet<number>): number[] | null {
  const counts = new Map<string, [number, number]>();
  for (const face of faces) {
    for (const [a, b] of faceEdges(size, face)) {
      const key = edgeKey(a, b);
      const entry = counts.get(key);
      if (entry) entry[0] += 1;
      else counts.set(key, [1, a < b ? a : b]);
    }
  }
  const adjacency = new Map<number, number[]>();
  for (const [key, [count]] of counts) {
    if (count !== 1) continue;
    const [a, b] = key.split("-").map(Number) as [number, number];
    adjacency.set(a, [...(adjacency.get(a) ?? []), b]);
    adjacency.set(b, [...(adjacency.get(b) ?? []), a]);
  }
  for (const list of adjacency.values()) if (list.length !== 2) return null;
  const start = adjacency.keys().next().value as number;
  const order = [start];
  let prev = -1;
  let cur = start;
  for (;;) {
    const options = adjacency.get(cur) as number[];
    const next = options[0] === prev ? (options[1] as number) : (options[0] as number);
    if (next === start) break;
    order.push(next);
    prev = cur;
    cur = next;
  }
  return order.length === adjacency.size ? order : null;
}

function dirBetween(size: number, a: number, b: number): number {
  if (b === a + 1) return E;
  if (b === a - 1) return W;
  return b === a + size ? S : N;
}

/** Random disjoint rectilinear loops, grown from face polyominoes. */
export function randomSolution(size: number, rng: Rng, loopTarget = 3): RandomSolution {
  const tiles = new Uint8Array(size * size);
  const loops: number[][] = [];
  const used = new Set<number>();
  const faceCount = (size - 1) * (size - 1);
  const m = size - 1;
  for (let attempt = 0; attempt < loopTarget * 6 && loops.length < loopTarget; attempt++) {
    const seed = rng.int(faceCount);
    let faces = new Set<number>([seed]);
    let cycle = boundaryCycle(size, faces) as number[];
    if (cycle.some((c) => used.has(c))) continue;
    const growth = rng.int(1 + Math.floor(faceCount / 2));
    for (let step = 0; step < growth; step++) {
      const around = new Set<number>();
      for (const f of faces) {
        const fr = Math.floor(f / m);
        const fc = f % m;
        if (fr > 0) around.add(f - m);
        if (fr < m - 1) around.add(f + m);
        if (fc > 0) around.add(f - 1);
        if (fc < m - 1) around.add(f + 1);
      }
      const options = [...around].filter((f) => !faces.has(f));
      if (options.length === 0) break;
      const grown = new Set(faces).add(rng.pick(options));
      const next = boundaryCycle(size, grown);
      if (next === null || next.some((c) => used.has(c))) continue;
      faces = grown;
      cycle = next;
    }
    for (const c of cycle) used.add(c);
    loops.push(cycle);
    cycle.forEach((cell, k) => {
      const before = cycle[(k + cycle.length - 1) % cycle.length] as number;
      const after = cycle[(k + 1) % cycle.length] as number;
      tiles[cell] = dirBetween(size, cell, before) | dirBetween(size, cell, after);
    });
  }
  return { size, tiles, loops };
}

export interface ClueDensity {
  stone: number;
  lantern: number;
  mirror: number;
  gate: number;
  fixed: number;
  colours: number;
}

export const SPARSE: ClueDensity = {
  stone: 0.2,
  lantern: 0.25,
  mirror: 0.2,
  gate: 0.2,
  fixed: 0.1,
  colours: 3,
};
export const DENSE: ClueDensity = {
  stone: 0.75,
  lantern: 0.45,
  mirror: 0.6,
  gate: 0.6,
  fixed: 0.25,
  colours: 3,
};

const SLASH = new Set([9, 6]);

/** Derives clues from a solution so that the solution always satisfies them. */
export function puzzleFromSolution(
  solution: RandomSolution,
  rng: Rng,
  density: ClueDensity,
  id = "generated",
): Puzzle {
  const { size, tiles, loops } = solution;
  const palette: Colour[] = COLOURS.slice(0, Math.max(1, density.colours));
  const loopColour = new Map<number, Colour>();
  const guaranteed = new Set<number>();
  for (const loop of loops) {
    const colour = rng.pick(palette);
    for (const cell of loop) loopColour.set(cell, colour);
    guaranteed.add(rng.pick(loop));
  }
  const cells: Cell[] = [];
  for (let i = 0; i < size * size; i++) {
    const mask = tiles[i] as number;
    if (mask === 0) {
      let count = 0;
      for (const dir of [N, E, S, W]) {
        const r = Math.floor(i / size) + (dir === N ? -1 : dir === S ? 1 : 0);
        const c = (i % size) + (dir === E ? 1 : dir === W ? -1 : 0);
        if (r >= 0 && c >= 0 && r < size && c < size && tiles[r * size + c] !== 0) count++;
      }
      cells.push(rng.chance(density.stone) ? stoneCell(count) : openCell());
      continue;
    }
    const colour = loopColour.get(i) as Colour;
    const fixed = rng.chance(density.fixed) ? mask : undefined;
    const corner = mask !== 10 && mask !== 5;
    if (guaranteed.has(i) || rng.chance(density.lantern)) cells.push(lantern(colour, fixed));
    else if (corner && rng.chance(density.mirror))
      cells.push(mirror(SLASH.has(mask) ? "/" : "\\", fixed));
    else if (!corner && rng.chance(density.gate)) cells.push(gate(colour, fixed));
    else cells.push(openCell(undefined, fixed));
  }
  return { id, size, cells };
}

/** Clues placed without regard to any solution: often unsolvable or ambiguous. */
export function randomCluePuzzle(size: number, rng: Rng, id = "random"): Puzzle {
  const cells: Cell[] = [];
  for (let i = 0; i < size * size; i++) {
    const roll = rng.next();
    const colour = rng.pick(COLOURS.slice(0, 2));
    if (roll < 0.15) cells.push(stoneCell(rng.int(4)));
    else if (roll < 0.3) cells.push(lantern(colour));
    else if (roll < 0.36) cells.push(mirror(rng.chance(0.5) ? "/" : "\\"));
    else if (roll < 0.42) cells.push(gate(colour));
    else if (roll < 0.46) cells.push(openCell(undefined, rng.pick([10, 5, 3, 6, 12, 9])));
    else cells.push(openCell());
  }
  return { id, size, cells };
}
