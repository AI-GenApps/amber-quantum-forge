import type { Tiles } from "../board";
import type { Rng } from "./rng";

export interface SolutionParams {
  readonly size: number;
  /** Closed loops on the board, inclusive. */
  readonly loops: readonly [number, number];
  /** Share of cells that hold a tile, in percent, inclusive. */
  readonly coverage: readonly [number, number];
}

export interface SolutionBoard {
  readonly tiles: Tiles;
  /** The cells of each loop. */
  readonly loops: readonly (readonly number[])[];
}

interface Faces {
  readonly lattice: number;
  readonly size: number;
  readonly inside: Uint8Array;
}

function faceOf(lattice: number, row: number, col: number): number | null {
  if (row < 0 || col < 0 || row >= lattice || col >= lattice) return null;
  return row * lattice + col;
}

function isInside(faces: Faces, row: number, col: number): boolean {
  const face = faceOf(faces.lattice, row, col);
  return face !== null && faces.inside[face] === 1;
}

function pinches(faces: Faces): boolean {
  const { size } = faces;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const a = isInside(faces, row - 1, col - 1);
      const b = isInside(faces, row - 1, col);
      const c = isInside(faces, row, col - 1);
      const d = isInside(faces, row, col);
      if ((a && d && !b && !c) || (b && c && !a && !d)) return true;
    }
  }
  return false;
}

/** True when every face outside the region can reach beyond the board edge. */
function hasNoHole(faces: Faces): boolean {
  const { lattice } = faces;
  const width = lattice + 2;
  const seen = new Uint8Array(width * width);
  const stack = [0];
  seen[0] = 1;
  while (stack.length > 0) {
    const at = stack.pop() as number;
    const row = Math.floor(at / width);
    const col = at % width;
    const around: Array<[number, number]> = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];
    for (const [r, c] of around) {
      if (r < 0 || c < 0 || r >= width || c >= width) continue;
      const next = r * width + c;
      if (seen[next] === 1 || isInside(faces, r - 1, c - 1)) continue;
      seen[next] = 1;
      stack.push(next);
    }
  }
  for (let row = 0; row < lattice; row++) {
    for (let col = 0; col < lattice; col++) {
      if (!isInside(faces, row, col) && seen[(row + 1) * width + (col + 1)] === 0) return false;
    }
  }
  return true;
}

/** Tile mask per boundary vertex of the region (index = cell), 0 elsewhere. */
function boundaryMasks(faces: Faces): Uint8Array {
  const { lattice, size } = faces;
  const masks = new Uint8Array(size * size);
  for (let row = 0; row < lattice; row++) {
    for (let col = 0; col < lattice; col++) {
      if (!isInside(faces, row, col)) continue;
      const nw = row * size + col;
      const ne = nw + 1;
      const sw = nw + size;
      const se = sw + 1;
      if (!isInside(faces, row - 1, col)) {
        masks[nw] = (masks[nw] as number) | 2;
        masks[ne] = (masks[ne] as number) | 8;
      }
      if (!isInside(faces, row + 1, col)) {
        masks[sw] = (masks[sw] as number) | 2;
        masks[se] = (masks[se] as number) | 8;
      }
      if (!isInside(faces, row, col - 1)) {
        masks[nw] = (masks[nw] as number) | 4;
        masks[sw] = (masks[sw] as number) | 1;
      }
      if (!isInside(faces, row, col + 1)) {
        masks[ne] = (masks[ne] as number) | 4;
        masks[se] = (masks[se] as number) | 1;
      }
    }
  }
  return masks;
}

function perimeter(masks: Uint8Array): number {
  let cells = 0;
  for (const mask of masks) if (mask !== 0) cells += 1;
  return cells;
}

function freeFace(blocked: Uint8Array, size: number, face: number, lattice: number): boolean {
  const row = Math.floor(face / lattice);
  const col = face % lattice;
  const nw = row * size + col;
  return (
    blocked[nw] === 0 &&
    blocked[nw + 1] === 0 &&
    blocked[nw + size] === 0 &&
    blocked[nw + size + 1] === 0
  );
}

/** Grows one simple closed loop as the boundary of a region of unit faces. */
function growLoop(rng: Rng, size: number, blocked: Uint8Array, goal: number): Uint8Array | null {
  const lattice = size - 1;
  const faces: Faces = { lattice, size, inside: new Uint8Array(lattice * lattice) };
  const starts: number[] = [];
  for (let f = 0; f < lattice * lattice; f++) {
    if (freeFace(blocked, size, f, lattice)) starts.push(f);
  }
  if (starts.length === 0) return null;
  faces.inside[rng.pick(starts)] = 1;
  let masks = boundaryMasks(faces);
  while (perimeter(masks) < goal) {
    const candidates: number[] = [];
    for (let f = 0; f < lattice * lattice; f++) {
      if (faces.inside[f] === 1 || !freeFace(blocked, size, f, lattice)) continue;
      const row = Math.floor(f / lattice);
      const col = f % lattice;
      if (
        isInside(faces, row - 1, col) ||
        isInside(faces, row + 1, col) ||
        isInside(faces, row, col - 1) ||
        isInside(faces, row, col + 1)
      ) {
        candidates.push(f);
      }
    }
    let grew = false;
    for (const f of rng.shuffle(candidates)) {
      faces.inside[f] = 1;
      if (!pinches(faces) && hasNoHole(faces)) {
        grew = true;
        break;
      }
      faces.inside[f] = 0;
    }
    if (!grew) break;
    masks = boundaryMasks(faces);
  }
  return masks;
}

function attempt(rng: Rng, params: SolutionParams): SolutionBoard | null {
  const { size } = params;
  const total = size * size;
  const [minLoops, maxLoops] = params.loops;
  const wanted = rng.between(
    Math.ceil((params.coverage[0] * total) / 100),
    Math.floor((params.coverage[1] * total) / 100),
  );
  const tiles = new Uint8Array(total);
  const blocked = new Uint8Array(total);
  const loops: number[][] = [];
  let covered = 0;
  while (loops.length < maxLoops && (covered < wanted || loops.length < minLoops)) {
    const loopsLeft = Math.max(1, minLoops - loops.length);
    const goal = Math.max(4, Math.round((wanted - covered) / loopsLeft + rng.between(-2, 2)));
    const masks = growLoop(rng, size, blocked, goal);
    if (masks === null) break;
    const cells: number[] = [];
    masks.forEach((mask, cell) => {
      if (mask === 0) return;
      tiles[cell] = mask;
      blocked[cell] = 1;
      cells.push(cell);
    });
    loops.push(cells);
    covered += cells.length;
  }
  const lo = Math.ceil((params.coverage[0] * total) / 100);
  const hi = Math.floor((params.coverage[1] * total) / 100);
  if (loops.length < minLoops || covered < lo || covered > hi) return null;
  return { tiles, loops };
}

/**
 * A random set of disjoint closed loops, deterministic for the generator state. Retries a bounded
 * number of times for the loop and coverage targets; the last try is returned even if it misses
 * them, so the result is always a valid loop set with at least one loop.
 */
export function generateSolution(rng: Rng, params: SolutionParams, tries = 12): SolutionBoard {
  for (let k = 0; k < tries; k++) {
    const found = attempt(rng, params);
    if (found !== null) return found;
  }
  const relaxed = attempt(rng, { ...params, loops: [1, params.loops[1]], coverage: [0, 100] });
  if (relaxed !== null) return relaxed;
  const tiles = new Uint8Array(params.size * params.size);
  const start = rng.int(params.size - 1) * params.size + rng.int(params.size - 1);
  const ring = [start, start + 1, start + params.size + 1, start + params.size];
  const masks = [6, 12, 9, 3];
  ring.forEach((cell, k) => {
    tiles[cell] = masks[k] as number;
  });
  return { tiles, loops: [ring] };
}
