import type { Tiles } from "./board";
import {
  buildDomains,
  createPropagator,
  EMPTY_STATE,
  isSingleton,
  LACK,
  STATE_MASKS,
} from "./domains";
import { cellAt, colourBit, type Puzzle } from "./puzzle";
import { E, S } from "./tile";

export interface SolveOptions {
  /** Stop once this many solutions are found. Default 2. */
  limit?: number;
  /** Maximum number of cell assignments tried. Default 2,000,000. Never a clock. */
  nodeBudget?: number;
  /** Tiles that must stay as given; 0 means unknown. */
  partial?: Tiles;
}

export interface SolveResult {
  readonly solutions: Tiles[];
  /** Solutions found; a lower bound when exhausted is true. */
  readonly count: number;
  /** True only when the node budget stopped the search. */
  readonly exhausted: boolean;
  readonly nodes: number;
}

export const DEFAULT_LIMIT = 2;
export const DEFAULT_NODE_BUDGET = 2_000_000;

function single(bits: number): boolean {
  return (bits & (bits - 1)) === 0;
}

const LACK_E = LACK[E] as number;
const LACK_S = LACK[S] as number;

const POPCOUNT = Uint8Array.from({ length: 128 }, (_, v) => {
  let count = 0;
  for (let x = v; x !== 0; x &= x - 1) count++;
  return count;
});

export function solve(puzzle: Puzzle, options: SolveOptions = {}): SolveResult {
  const limit = Math.max(1, options.limit ?? DEFAULT_LIMIT);
  const budget = options.nodeBudget ?? DEFAULT_NODE_BUDGET;
  const n = puzzle.size;
  const total = n * n;
  const dom = buildDomains(puzzle, options.partial);
  const propagator = createPropagator(puzzle);
  if (dom === null || !propagator.full(dom)) {
    return { solutions: [], count: 0, exhausted: false, nodes: 0 };
  }

  const parent = new Int32Array(total);
  const weight = new Int32Array(total);
  const lanternBits = new Uint8Array(total);
  const gateBits = new Uint8Array(total);
  const joined = new Uint8Array(total * 2);
  for (let i = 0; i < total; i++) {
    parent[i] = i;
    weight[i] = 1;
    const clue = cellAt(puzzle, i).clue;
    if (clue?.kind === "lantern") lanternBits[i] = colourBit(clue.colour);
    if (clue?.kind === "gate") gateBits[i] = colourBit(clue.colour);
  }
  const saved = Array.from({ length: total + 1 }, () => new Uint8Array(total));

  const undo: number[] = [];
  const find = (a: number): number => {
    let x = a;
    while (parent[x] !== x) x = parent[x] as number;
    return x;
  };
  const rollback = (mark: number): void => {
    while (undo.length > mark) {
      const kind = undo.pop() as number;
      if (kind === -1) {
        joined[undo.pop() as number] = 0;
        continue;
      }
      const gat = kind;
      const col = undo.pop() as number;
      const wt = undo.pop() as number;
      const big = undo.pop() as number;
      const small = undo.pop() as number;
      parent[small] = small;
      weight[big] = wt;
      lanternBits[big] = col;
      gateBits[big] = gat;
    }
  };
  const union = (a: number, b: number): boolean => {
    let ra = find(a);
    let rb = find(b);
    if (ra === rb) return (lanternBits[ra] as number) !== 0;
    if ((weight[ra] as number) < (weight[rb] as number)) {
      const swap = ra;
      ra = rb;
      rb = swap;
    }
    const lanterns = (lanternBits[ra] as number) | (lanternBits[rb] as number);
    const gates = (gateBits[ra] as number) | (gateBits[rb] as number);
    if (!single(lanterns) || !single(gates)) return false;
    if (lanterns !== 0 && gates !== 0 && lanterns !== gates) return false;
    undo.push(rb, ra, weight[ra] as number, lanternBits[ra] as number, gateBits[ra] as number);
    parent[rb] = ra;
    weight[ra] = (weight[ra] as number) + (weight[rb] as number);
    lanternBits[ra] = lanterns;
    gateBits[ra] = gates;
    return true;
  };
  /** Joins the loops of every edge that the domains now force; false when a loop is invalid. */
  const joinForcedEdges = (): boolean => {
    for (let u = 0; u < total; u++) {
      const set = dom[u] as number;
      if ((set & EMPTY_STATE) !== 0) continue;
      if (u % n < n - 1 && joined[u * 2] === 0 && (set & LACK_E) === 0) {
        joined[u * 2] = 1;
        undo.push(u * 2, -1);
        if (!union(u, u + 1)) return false;
      }
      if (u + n < total && joined[u * 2 + 1] === 0 && (set & LACK_S) === 0) {
        joined[u * 2 + 1] = 1;
        undo.push(u * 2 + 1, -1);
        if (!union(u, u + n)) return false;
      }
    }
    return true;
  };

  const solutions: Tiles[] = [];
  let nodes = 0;
  let exhausted = false;

  const dfs = (depth: number): boolean => {
    let pick = -1;
    let best = 8;
    for (let i = 0; i < total; i++) {
      const size = POPCOUNT[dom[i] as number] as number;
      if (size > 1 && size < best) {
        best = size;
        pick = i;
        if (size === 2) break;
      }
    }
    if (pick < 0) {
      solutions.push(Uint8Array.from(dom, (set) => STATE_MASKS[31 - Math.clz32(set)] as number));
      return solutions.length >= limit;
    }
    const options = dom[pick] as number;
    const backup = saved[depth] as Uint8Array;
    backup.set(dom);
    for (let s = 0; s < 7; s++) {
      if (((options >> s) & 1) === 0) continue;
      if (nodes >= budget) {
        exhausted = true;
        return true;
      }
      nodes += 1;
      const mark = undo.length;
      dom[pick] = 1 << s;
      if (propagator.run(dom, [pick]) && joinForcedEdges()) {
        if (dfs(depth + 1)) {
          rollback(mark);
          return true;
        }
      }
      rollback(mark);
      dom.set(backup);
    }
    return false;
  };

  if (joinForcedEdges()) dfs(0);
  return { solutions, count: solutions.length, exhausted, nodes };
}

export function countSolutions(puzzle: Puzzle, limit = DEFAULT_LIMIT, nodeBudget?: number): number {
  return solve(puzzle, {
    limit,
    ...(nodeBudget === undefined ? {} : { nodeBudget }),
  }).count;
}

/** True only when exactly one solution exists and the search finished within the budget. */
export function isUnique(puzzle: Puzzle, nodeBudget?: number): boolean {
  const result = solve(puzzle, {
    limit: 2,
    ...(nodeBudget === undefined ? {} : { nodeBudget }),
  });
  return !result.exhausted && result.count === 1;
}

export function solveOne(puzzle: Puzzle, partial?: Tiles, nodeBudget?: number): Tiles | null {
  const result = solve(puzzle, {
    limit: 1,
    ...(partial === undefined ? {} : { partial }),
    ...(nodeBudget === undefined ? {} : { nodeBudget }),
  });
  return result.solutions[0] ?? null;
}

export interface ForcedCell {
  readonly cell: number;
  readonly mask: number;
}

export interface Propagation {
  readonly contradiction: boolean;
  /** Open cells without a given tile whose value is the same in every solution (by propagation). */
  readonly forced: ForcedCell[];
}

export function propagate(puzzle: Puzzle, partial?: Tiles): Propagation {
  const dom = buildDomains(puzzle, partial);
  const propagator = createPropagator(puzzle);
  if (dom === null || !propagator.full(dom)) return { contradiction: true, forced: [] };
  const forced: ForcedCell[] = [];
  for (let i = 0; i < dom.length; i++) {
    const cell = cellAt(puzzle, i);
    if (cell.kind === "stone" || cell.fixed !== undefined) continue;
    if ((partial?.[i] ?? 0) !== 0) continue;
    const set = dom[i] as number;
    if (!isSingleton(set)) continue;
    forced.push({ cell: i, mask: STATE_MASKS[31 - Math.clz32(set)] as number });
  }
  return { contradiction: false, forced };
}
