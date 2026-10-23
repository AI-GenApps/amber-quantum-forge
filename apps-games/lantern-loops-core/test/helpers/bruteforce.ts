import type { Cell, Puzzle } from "../../src/puzzle";

type Edge = "N" | "E" | "S" | "W";
const MASK_EDGES: Record<number, Edge[]> = {
  10: ["E", "W"],
  5: ["N", "S"],
  3: ["N", "E"],
  6: ["E", "S"],
  12: ["S", "W"],
  9: ["W", "N"],
};
const BIT: Record<Edge, number> = { N: 1, E: 2, S: 4, W: 8 };

/** A configuration: for each cell the set of incident edges (degree 0 or 2). */
type Config = Edge[][];

const cache = new Map<number, Config[]>();

export function enumerateConfigs(size: number): Config[] {
  const cached = cache.get(size);
  if (cached) return cached;
  const configs: Config[] = [];
  const horizontal: boolean[] = new Array(size * size).fill(false);
  const vertical: boolean[] = new Array(size * size).fill(false);
  const visit = (cellNo: number): void => {
    if (cellNo === size * size) {
      const config: Config = [];
      for (let i = 0; i < size * size; i++) {
        const r = Math.floor(i / size);
        const c = i % size;
        const edges: Edge[] = [];
        if (r > 0 && vertical[i - size]) edges.push("N");
        if (c < size - 1 && horizontal[i]) edges.push("E");
        if (r < size - 1 && vertical[i]) edges.push("S");
        if (c > 0 && horizontal[i - 1]) edges.push("W");
        config.push(edges);
      }
      configs.push(config);
      return;
    }
    const r = Math.floor(cellNo / size);
    const c = cellNo % size;
    const up = r > 0 && vertical[cellNo - size] ? 1 : 0;
    const left = c > 0 && horizontal[cellNo - 1] ? 1 : 0;
    for (const right of c < size - 1 ? [false, true] : [false]) {
      for (const down of r < size - 1 ? [false, true] : [false]) {
        const degree = up + left + (right ? 1 : 0) + (down ? 1 : 0);
        if (degree !== 0 && degree !== 2) continue;
        horizontal[cellNo] = right;
        vertical[cellNo] = down;
        visit(cellNo + 1);
      }
    }
    horizontal[cellNo] = false;
    vertical[cellNo] = false;
  };
  visit(0);
  cache.set(size, configs);
  return configs;
}

function sameSet(a: readonly Edge[], b: readonly Edge[]): boolean {
  return a.length === b.length && a.every((e) => b.includes(e));
}

function neighbourAt(size: number, i: number, edge: Edge): number {
  const r = Math.floor(i / size);
  const c = i % size;
  if (edge === "N") return r > 0 ? i - size : -1;
  if (edge === "S") return r < size - 1 ? i + size : -1;
  if (edge === "W") return c > 0 ? i - 1 : -1;
  return c < size - 1 ? i + 1 : -1;
}

function cellOk(cell: Cell, edges: readonly Edge[]): boolean {
  if (cell.kind === "stone") return edges.length === 0;
  if (cell.fixed !== undefined && !sameSet(edges, MASK_EDGES[cell.fixed] ?? [])) return false;
  const clue = cell.clue;
  if (clue === undefined) return true;
  if (edges.length === 0) return false;
  const horizontal = edges.filter((e) => e === "E" || e === "W").length;
  if (clue.kind === "gate") return horizontal !== 1;
  if (clue.kind === "mirror") {
    if (horizontal !== 1) return false;
    const has = (e: Edge) => edges.includes(e);
    const slash = (has("W") && has("N")) || (has("E") && has("S"));
    return clue.shape === "/" ? slash : !slash;
  }
  return true;
}

function loopsOk(puzzle: Puzzle, config: Config): boolean {
  const size = puzzle.size;
  const seen = new Set<number>();
  for (let start = 0; start < size * size; start++) {
    if ((config[start] as Edge[]).length === 0 || seen.has(start)) continue;
    const stack = [start];
    seen.add(start);
    const lanternColours = new Set<string>();
    const gateColours = new Set<string>();
    while (stack.length > 0) {
      const at = stack.pop() as number;
      const clue = (puzzle.cells[at] as Cell).clue;
      if (clue?.kind === "lantern") lanternColours.add(clue.colour);
      if (clue?.kind === "gate") gateColours.add(clue.colour);
      for (const edge of config[at] as Edge[]) {
        const to = neighbourAt(size, at, edge);
        if (!seen.has(to)) {
          seen.add(to);
          stack.push(to);
        }
      }
    }
    if (lanternColours.size !== 1) return false;
    for (const gc of gateColours) if (!lanternColours.has(gc)) return false;
  }
  return true;
}

function stonesOk(puzzle: Puzzle, config: Config): boolean {
  const size = puzzle.size;
  for (let i = 0; i < size * size; i++) {
    const cell = puzzle.cells[i] as Cell;
    if (cell.kind !== "stone") continue;
    let lit = 0;
    for (const edge of ["N", "E", "S", "W"] as Edge[]) {
      const j = neighbourAt(size, i, edge);
      if (j >= 0 && (config[j] as Edge[]).length > 0) lit += 1;
    }
    if (lit !== cell.stone) return false;
  }
  return true;
}

/** Every solution of the puzzle as a tile array, found by exhaustive enumeration. */
export function bruteSolutions(puzzle: Puzzle): Uint8Array[] {
  const out: Uint8Array[] = [];
  for (const config of enumerateConfigs(puzzle.size)) {
    let ok = true;
    for (let i = 0; i < config.length && ok; i++) {
      ok = cellOk(puzzle.cells[i] as Cell, config[i] as Edge[]);
    }
    if (!ok || !stonesOk(puzzle, config) || !loopsOk(puzzle, config)) continue;
    out.push(Uint8Array.from(config, (edges) => edges.reduce((m, e) => m | BIT[e], 0)));
  }
  return out;
}
