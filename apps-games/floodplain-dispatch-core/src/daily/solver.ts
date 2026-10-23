import { createBoard, DIRECTIONS } from "../board";
import { totalCost } from "../placement";
import { createPrng, type Prng } from "../prng";
import { runSeason } from "../simulate";
import type { Board, Direction, MapDef, Placement } from "../types";
import { MinHeap, neighborCells, type PathField, pathField, placementKey, traceBack } from "./grid";
import { shortfall } from "./penalty";

export const DEFAULT_MAX_SIMS = 20000 as const;

export interface SolveOptions {
  maxSims?: number;
  maxCost?: number;
  seed?: number;
  starts?: readonly (readonly Placement[])[];
}

export interface Solution {
  placements: Placement[];
  cost: number;
  sims: number;
}

interface Scored {
  placements: Placement[];
  cost: number;
  penalty: number;
  flooded: number[];
  unmet: number[];
}

interface Ctx {
  def: MapDef;
  board: Board;
  rng: Prng;
  maxSims: number;
  maxCost: number;
  sims: number;
  work: number;
  seen: Map<string, Scored | null>;
}

const PENALTY_WEIGHT = 8;
const COST_WEIGHT = 0.5;
const SWAP_RADIUS = 3;
const SEARCH_SHARE = 0.9;
const MAX_ROUNDS = 6;
const WORK_FACTOR = 6;

function exhausted(ctx: Ctx): boolean {
  return ctx.sims >= ctx.maxSims || ctx.work > ctx.maxSims * WORK_FACTOR;
}

function score(ctx: Ctx, placements: Placement[]): Scored | null {
  const key = placementKey(placements, ctx.board);
  ctx.work++;
  const cached = ctx.seen.get(key);
  if (cached !== undefined) return cached;
  const cost = totalCost(placements);
  if (cost > ctx.maxCost || exhausted(ctx)) {
    ctx.seen.set(key, null);
    return null;
  }
  ctx.sims++;
  const { penalty, flooded, unmet } = shortfall(runSeason(ctx.def, placements).metrics);
  const scored: Scored = { placements, cost, penalty, flooded, unmet };
  ctx.seen.set(key, scored);
  return scored;
}

function cellOf(ctx: Ctx, p: Placement): number {
  return p.y * ctx.board.width + p.x;
}

function place(
  ctx: Ctx,
  index: number,
  rest: Partial<Placement> & Pick<Placement, "kind">,
): Placement {
  return { x: index % ctx.board.width, y: Math.floor(index / ctx.board.width), ...rest };
}

function occupied(ctx: Ctx, placements: readonly Placement[]): Set<number> {
  return new Set(placements.map((p) => cellOf(ctx, p)));
}

function networkCells(ctx: Ctx, placements: readonly Placement[]): number[] {
  const out = [...ctx.board.inletCells];
  for (const p of placements) {
    if (p.kind === "canal" || p.kind === "gate" || p.kind === "reservoir") out.push(cellOf(ctx, p));
  }
  return out;
}

function jitterField(ctx: Ctx, amount: number): Float64Array {
  const out = new Float64Array(ctx.board.width * ctx.board.height);
  for (let i = 0; i < out.length; i++) out[i] = ctx.rng.next() * amount;
  return out;
}

function fieldFor(ctx: Ctx, placements: readonly Placement[], jitter: Float64Array): PathField {
  const taken = occupied(ctx, placements);
  const buildable = (cell: number): boolean => ctx.board.kinds[cell] === "land" && !taken.has(cell);
  const sources: number[] = [];
  for (const cell of networkCells(ctx, placements)) {
    for (const next of neighborCells(ctx.board, cell)) if (buildable(next)) sources.push(next);
  }
  return pathField(ctx.board, sources, buildable, jitter);
}

function pathsToTarget(ctx: Ctx, field: PathField, target: number, variants: number): number[][] {
  const ends = neighborCells(ctx.board, target)
    .filter((cell) => Number.isFinite(field.dist[cell] ?? Number.POSITIVE_INFINITY))
    .sort((a, b) => (field.dist[a] ?? 0) - (field.dist[b] ?? 0));
  return ends.slice(0, variants).map((end) => traceBack(field, end));
}

function withCanals(
  ctx: Ctx,
  placements: readonly Placement[],
  cells: readonly number[],
): Placement[] {
  return [...placements, ...cells.map((cell) => place(ctx, cell, { kind: "canal" }))];
}

function startTrees(ctx: Ctx, count: number, round: number): Placement[][] {
  const targets = [...ctx.board.houseCells, ...ctx.board.fieldCells];
  const out: Placement[][] = [];
  for (let attempt = 0; attempt < count; attempt++) {
    const jitter = jitterField(ctx, attempt === 0 && round === 0 ? 0 : 0.4 * (1 + round));
    let placements: Placement[] = [];
    const left = new Set(targets);
    while (left.size > 0) {
      const field = fieldFor(ctx, placements, jitter);
      let best = -1;
      let bestCost = Number.POSITIVE_INFINITY;
      for (const target of left) {
        const adjacent = neighborCells(ctx.board, target).some((cell) =>
          networkCells(ctx, placements).includes(cell),
        );
        const cost = adjacent
          ? 0
          : Math.min(
              ...neighborCells(ctx.board, target).map((cell) => field.dist[cell] ?? Infinity),
            );
        const pick = attempt % 2 === 1 ? -cost : cost;
        if (best < 0 || pick < bestCost) {
          best = target;
          bestCost = pick;
        }
      }
      left.delete(best);
      const paths = pathsToTarget(ctx, field, best, 1);
      const path = paths[0];
      if (path) placements = withCanals(ctx, placements, path);
    }
    out.push(placements);
  }
  return out;
}

function directionBetween(board: Board, from: number, to: number): Direction | null {
  for (const dir of DIRECTIONS) {
    const nx = (from % board.width) + (dir === "E" ? 1 : dir === "W" ? -1 : 0);
    const ny = Math.floor(from / board.width) + (dir === "S" ? 1 : dir === "N" ? -1 : 0);
    if (ny * board.width + nx === to && nx >= 0 && nx < board.width) return dir;
  }
  return null;
}

function pumpVariants(
  ctx: Ctx,
  base: readonly Placement[],
  path: readonly number[],
): Placement[][] {
  const ordered = [...path].reverse();
  const out: Placement[][] = [];
  const last = ordered.length - 1;
  for (let k = 0; k < last; k++) {
    const dir = directionBetween(ctx.board, ordered[k] as number, ordered[k + 1] as number);
    if (!dir || (k < last - 4 && k > 1)) continue;
    const cells = ordered.map((cell, at) =>
      at === k ? place(ctx, cell, { kind: "pump", dir }) : place(ctx, cell, { kind: "canal" }),
    );
    out.push([...base, ...cells]);
  }
  return out;
}

function cheb(board: Board, a: number, b: number): number {
  return Math.max(
    Math.abs((a % board.width) - (b % board.width)),
    Math.abs(Math.floor(a / board.width) - Math.floor(b / board.width)),
  );
}

function swapMoves(ctx: Ctx, state: Scored): Placement[][] {
  const out: Placement[][] = [];
  const has = (kind: Placement["kind"]): boolean => ctx.def.pieces.includes(kind);
  const focus = [...state.flooded, ...state.unmet];
  const near = (cell: number): boolean =>
    focus.some((target) => cheb(ctx.board, cell, target) <= SWAP_RADIUS);
  state.placements.forEach((piece, at) => {
    const cell = cellOf(ctx, piece);
    if (!near(cell)) return;
    const swap = (replacement: Placement): void => {
      out.push(state.placements.map((p, i) => (i === at ? replacement : p)));
    };
    if (piece.kind === "canal") {
      if (has("pump")) for (const dir of DIRECTIONS) swap(place(ctx, cell, { kind: "pump", dir }));
      if (has("reservoir")) swap(place(ctx, cell, { kind: "reservoir" }));
      if (has("barrier")) swap(place(ctx, cell, { kind: "barrier" }));
    } else if (piece.kind === "pump") {
      for (const dir of DIRECTIONS)
        if (dir !== piece.dir) swap(place(ctx, cell, { kind: "pump", dir }));
      swap(place(ctx, cell, { kind: "canal" }));
    } else if (piece.kind === "barrier") {
      swap(place(ctx, cell, { kind: "canal" }));
    }
  });
  return out;
}

function candidatesFor(ctx: Ctx, state: Scored): Placement[][] {
  const { def, board } = ctx;
  const out: Placement[][] = [];
  const taken = occupied(ctx, state.placements);
  const has = (kind: Placement["kind"]): boolean => def.pieces.includes(kind);
  const jitter = jitterField(ctx, 0.2);
  const field = fieldFor(ctx, state.placements, jitter);
  for (const target of state.unmet) {
    for (const path of pathsToTarget(ctx, field, target, 2)) {
      out.push(withCanals(ctx, state.placements, path));
      if (has("pump")) out.push(...pumpVariants(ctx, state.placements, path));
    }
  }
  const canalCells = state.placements.filter((p) => p.kind === "canal");
  for (const house of state.flooded) {
    for (const cell of neighborCells(board, house)) {
      if (board.kinds[cell] !== "land") continue;
      if (!taken.has(cell)) {
        if (has("barrier")) out.push([...state.placements, place(ctx, cell, { kind: "barrier" })]);
        if (has("pump")) {
          for (const dir of DIRECTIONS) {
            out.push([...state.placements, place(ctx, cell, { kind: "pump", dir })]);
          }
        }
        if (has("reservoir"))
          out.push([...state.placements, place(ctx, cell, { kind: "reservoir" })]);
      } else {
        const at = state.placements.findIndex((p) => cellOf(ctx, p) === cell);
        const piece = state.placements[at];
        if (piece?.kind === "canal" && has("barrier")) {
          out.push(
            state.placements.map((p, i) => (i === at ? place(ctx, cell, { kind: "barrier" }) : p)),
          );
        }
      }
    }
    for (const cell of neighborCells(board, house)) {
      for (const far of neighborCells(board, cell)) {
        if (board.kinds[far] === "land" && !taken.has(far) && has("barrier")) {
          out.push([...state.placements, place(ctx, far, { kind: "barrier" })]);
        }
      }
    }
  }
  out.push(...swapMoves(ctx, state));
  if (has("gate") && def.events.length > 0 && state.flooded.length > 0) {
    for (const canal of canalCells) {
      const at = state.placements.indexOf(canal);
      for (const event of def.events) {
        if (event.type === "drought") continue;
        const spans: [number, number][] = [
          [0, event.week],
          [event.week + event.weeks, def.weeks],
        ];
        for (const [opens, closes] of spans) {
          if (opens >= closes) continue;
          const gate = place(ctx, cellOf(ctx, canal), {
            kind: "gate",
            opensWeek: opens,
            closesWeek: closes,
          });
          out.push(state.placements.map((p, i) => (i === at ? gate : p)));
        }
      }
    }
  }
  if (has("reservoir") && state.flooded.length > 0) {
    for (const canal of canalCells.slice(0, 6)) {
      const at = state.placements.indexOf(canal);
      out.push(
        state.placements.map((p, i) =>
          i === at ? place(ctx, cellOf(ctx, canal), { kind: "reservoir" }) : p,
        ),
      );
    }
  }
  return out;
}

function prune(ctx: Ctx, start: Scored): Scored {
  let best = start;
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = best.placements.length - 1; i >= 0; i--) {
      const trial = best.placements.filter((_, at) => at !== i);
      const scored = score(ctx, trial);
      if (scored && scored.penalty === 0) {
        best = scored;
        changed = true;
        break;
      }
    }
  }
  return best;
}

function downgrade(ctx: Ctx, start: Scored): Scored {
  let best = start;
  for (let i = 0; i < best.placements.length; i++) {
    const piece = best.placements[i];
    if (!piece || piece.kind === "canal") continue;
    const cell = cellOf(ctx, piece);
    const trial = best.placements.map((p, at) =>
      at === i ? place(ctx, cell, { kind: "canal" }) : p,
    );
    const scored = score(ctx, trial);
    if (scored && scored.penalty === 0 && scored.cost < best.cost) best = scored;
  }
  return best;
}

export function solveMap(def: MapDef, options: SolveOptions = {}): Solution | null {
  const board = createBoard(def);
  const maxCost = options.maxCost ?? def.budget;
  const ctx: Ctx = {
    def,
    board,
    rng: createPrng(options.seed ?? 0x5eed),
    maxSims: Math.floor((options.maxSims ?? DEFAULT_MAX_SIMS) * SEARCH_SHARE),
    maxCost,
    sims: 0,
    work: 0,
    seen: new Map(),
  };
  let found: Scored | null = null;
  const consider = (state: Scored | null): void => {
    if (state && state.penalty === 0 && (!found || state.cost < found.cost)) found = state;
  };
  const given = (options.starts ?? []).map((start) => start.map((p) => ({ ...p })));
  for (let round = 0; round < MAX_ROUNDS && !found && !exhausted(ctx); round++) {
    const heap = new MinHeap<Scored>();
    const queued = new Set<Scored>();
    const push = (state: Scored | null): void => {
      if (!state || queued.has(state)) return;
      queued.add(state);
      heap.push(state.penalty * PENALTY_WEIGHT + state.cost * COST_WEIGHT, state);
    };
    const starts =
      round === 0 ? [...given, ...startTrees(ctx, 4, round), []] : startTrees(ctx, 4, round);
    for (const tree of starts) {
      const scored = score(ctx, tree);
      push(scored);
      consider(scored);
    }
    while (!found && heap.size > 0 && !exhausted(ctx)) {
      const state = heap.pop();
      if (!state) break;
      for (const candidate of candidatesFor(ctx, state)) {
        const scored = score(ctx, candidate);
        push(scored);
        consider(scored);
        if (found) break;
      }
    }
  }
  const winner = found as Scored | null;
  if (!winner) return null;
  ctx.maxSims = options.maxSims ?? DEFAULT_MAX_SIMS;
  const pruned = downgrade(ctx, prune(ctx, winner));
  const finalState = prune(ctx, pruned);
  return {
    placements: finalState.placements.map((p) => ({ ...p })),
    cost: finalState.cost,
    sims: ctx.sims,
  };
}
