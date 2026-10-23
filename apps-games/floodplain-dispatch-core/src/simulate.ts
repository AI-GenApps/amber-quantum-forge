import { createBoard, DIRECTIONS, effectiveCrest } from "./board";
import {
  CANAL_EDGE_CAP,
  FIELD_WET_MAX,
  FIELD_WET_MIN,
  FLOOD_DEPTH,
  FLOW_MIN_DIFF,
  MAX_CELL_DEPTH,
  OTHER_EDGE_CAP,
  PUMP_RATE,
  RESERVOIR_CAPACITY,
  STEPS_PER_WEEK,
  SUPPLY_DEPTH,
} from "./constants";
import { inletRate, tideLevel } from "./events";
import type { Board, MapDef, Placement, SeasonMetrics, SeasonResult } from "./types";

const NEVER = 0x7fffffff;
const ROLE_CANAL = 1;
const ROLE_GATE = 2;
const ROLE_BARRIER = 3;
const ROLE_PUMP = 4;
const ROLE_RESERVOIR = 5;

const ROLE_BY_KIND = {
  canal: ROLE_CANAL,
  gate: ROLE_GATE,
  barrier: ROLE_BARRIER,
  pump: ROLE_PUMP,
  reservoir: ROLE_RESERVOIR,
} as const;

export interface SimContext {
  def: MapDef;
  board: Board;
  role: Uint8Array;
  canalType: Uint8Array;
  crest: Int16Array;
  capacity: Uint8Array;
  pumpTarget: Int32Array;
  gateOpens: Int32Array;
  gateCloses: Int32Array;
  neighbours: Int32Array;
  pumps: number[];
}

export interface SimState {
  ctx: SimContext;
  depths: Uint8Array;
  step: number;
  houseFlooded: Uint16Array;
  houseSupplied: Uint16Array;
  fieldWet: Uint16Array;
  closed: Uint8Array;
  snapshot: Uint8Array;
  surface: Int16Array;
  delta: Int16Array;
  inflow: Int16Array;
}

export interface RunOptions {
  keepSteps?: boolean;
}

function buildContext(def: MapDef, placements: readonly Placement[]): SimContext {
  const board = createBoard(def);
  const { width, height } = board;
  const count = width * height;
  const role = new Uint8Array(count);
  const canalType = new Uint8Array(count);
  const crest = new Int16Array(count);
  const capacity = new Uint8Array(count).fill(MAX_CELL_DEPTH);
  const pumpTarget = new Int32Array(count).fill(-1);
  const gateOpens = new Int32Array(count);
  const gateCloses = new Int32Array(count).fill(NEVER);
  const neighbours = new Int32Array(count * 4).fill(-1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      DIRECTIONS.forEach((dir, d) => {
        const nx = x + (dir === "E" ? 1 : dir === "W" ? -1 : 0);
        const ny = y + (dir === "S" ? 1 : dir === "N" ? -1 : 0);
        if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
          neighbours[(y * width + x) * 4 + d] = ny * width + nx;
        }
      });
    }
  }
  const pieceAt: (Placement | undefined)[] = new Array(count).fill(undefined);
  for (const placement of placements) {
    const { x, y } = placement;
    if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const index = y * width + x;
    if (board.kinds[index] !== "land" || pieceAt[index]) continue;
    pieceAt[index] = placement;
  }
  const pumps: number[] = [];
  for (let i = 0; i < count; i++) {
    const piece = pieceAt[i];
    const kind = board.kinds[i] ?? "land";
    const baseHeight = board.heights[i] ?? 0;
    crest[i] = effectiveCrest(baseHeight, piece ? piece.kind : null);
    canalType[i] = kind === "inlet" || kind === "sea" ? 1 : 0;
    if (!piece) continue;
    role[i] = ROLE_BY_KIND[piece.kind];
    if (piece.kind === "canal" || piece.kind === "gate" || piece.kind === "reservoir") {
      canalType[i] = 1;
    }
    if (piece.kind === "reservoir") capacity[i] = RESERVOIR_CAPACITY;
    if (piece.kind === "gate") {
      gateOpens[i] = piece.opensWeek ?? 0;
      gateCloses[i] = piece.closesWeek ?? NEVER;
    }
    if (piece.kind === "pump") {
      pumps.push(i);
      const d = piece.dir ? DIRECTIONS.indexOf(piece.dir) : -1;
      pumpTarget[i] = d < 0 ? -1 : (neighbours[i * 4 + d] ?? -1);
    }
  }
  return {
    def,
    board,
    role,
    canalType,
    crest,
    capacity,
    pumpTarget,
    gateOpens,
    gateCloses,
    neighbours,
    pumps,
  };
}

export function createSimState(def: MapDef, placements: readonly Placement[]): SimState {
  const ctx = buildContext(def, placements);
  const count = ctx.board.width * ctx.board.height;
  const depths = new Uint8Array(count);
  const level = Math.min(MAX_CELL_DEPTH, Math.max(0, tideLevel(def, 0)));
  for (const cell of ctx.board.seaCells) depths[cell] = level;
  return {
    ctx,
    depths,
    step: 0,
    houseFlooded: new Uint16Array(ctx.board.houseCells.length),
    houseSupplied: new Uint16Array(ctx.board.houseCells.length),
    fieldWet: new Uint16Array(ctx.board.fieldCells.length),
    closed: new Uint8Array(count),
    snapshot: new Uint8Array(count),
    surface: new Int16Array(count),
    delta: new Int16Array(count),
    inflow: new Int16Array(count),
  };
}

function reservoirPartner(ctx: SimContext, other: number, reservoir: number): boolean {
  const r = ctx.role[other];
  if (r === ROLE_CANAL || r === ROLE_GATE) return true;
  return r === ROLE_PUMP && ctx.pumpTarget[other] !== reservoir;
}

function edgeOpen(state: SimState, a: number, b: number): boolean {
  const { ctx, closed } = state;
  const ra = ctx.role[a];
  const rb = ctx.role[b];
  if ((ra === ROLE_GATE && closed[a]) || (rb === ROLE_GATE && closed[b])) return false;
  if (ra === ROLE_RESERVOIR && !reservoirPartner(ctx, b, a)) return false;
  if (rb === ROLE_RESERVOIR && !reservoirPartner(ctx, a, b)) return false;
  return true;
}

function updateGates(state: SimState, week: number): void {
  const { ctx, closed } = state;
  for (let i = 0; i < closed.length; i++) {
    if (ctx.role[i] === ROLE_GATE) {
      closed[i] = week >= (ctx.gateOpens[i] ?? 0) && week < (ctx.gateCloses[i] ?? 0) ? 0 : 1;
    }
  }
}

function addInlets(state: SimState, week: number): void {
  const { ctx, depths } = state;
  ctx.board.inletCells.forEach((cell, k) => {
    const next = (depths[cell] ?? 0) + inletRate(ctx.def, k, week);
    depths[cell] = Math.min(MAX_CELL_DEPTH, next);
  });
}

function runPumps(state: SimState): void {
  const { ctx, depths, closed } = state;
  for (const p of ctx.pumps) {
    const target = ctx.pumpTarget[p] ?? -1;
    if (target < 0) continue;
    if (ctx.role[target] === ROLE_GATE && closed[target]) continue;
    const room = (ctx.capacity[target] ?? 0) - (depths[target] ?? 0);
    const moved = Math.min(PUMP_RATE, depths[p] ?? 0, room);
    if (moved <= 0) continue;
    depths[p] = (depths[p] ?? 0) - moved;
    depths[target] = (depths[target] ?? 0) + moved;
  }
}

const sortKeys = new Int32Array(4);

function flow(state: SimState): void {
  const { ctx, depths, snapshot, surface, delta, inflow } = state;
  const count = depths.length;
  snapshot.set(depths);
  delta.fill(0);
  inflow.fill(0);
  for (let i = 0; i < count; i++) surface[i] = (ctx.crest[i] ?? 0) + (snapshot[i] ?? 0);
  for (let a = 0; a < count; a++) {
    let remaining = snapshot[a] ?? 0;
    if (remaining === 0) continue;
    const surfaceA = surface[a] ?? 0;
    let found = 0;
    for (let d = 0; d < 4; d++) {
      const b = ctx.neighbours[a * 4 + d] ?? -1;
      if (b < 0 || surfaceA - (surface[b] ?? 0) < FLOW_MIN_DIFF || !edgeOpen(state, a, b)) continue;
      const key = (surface[b] ?? 0) * 4 + d;
      let at = found++;
      while (at > 0 && (sortKeys[at - 1] ?? 0) > key) {
        sortKeys[at] = sortKeys[at - 1] ?? 0;
        at--;
      }
      sortKeys[at] = key;
    }
    for (let k = 0; k < found && remaining > 0; k++) {
      const b = ctx.neighbours[a * 4 + ((sortKeys[k] ?? 0) & 3)] ?? -1;
      const cap = ctx.canalType[a] && ctx.canalType[b] ? CANAL_EDGE_CAP : OTHER_EDGE_CAP;
      const diff = surfaceA - (surface[b] ?? 0);
      const limit = ctx.capacity[b] ?? MAX_CELL_DEPTH;
      const room =
        limit < MAX_CELL_DEPTH ? limit - (snapshot[b] ?? 0) - (inflow[b] ?? 0) : MAX_CELL_DEPTH;
      const moved = Math.min(cap, Math.floor(diff / 2), remaining, room);
      if (moved <= 0) continue;
      remaining -= moved;
      delta[a] = (delta[a] ?? 0) - moved;
      delta[b] = (delta[b] ?? 0) + moved;
      inflow[b] = (inflow[b] ?? 0) + moved;
    }
  }
  for (let i = 0; i < count; i++) {
    depths[i] = Math.min(MAX_CELL_DEPTH, Math.max(0, (snapshot[i] ?? 0) + (delta[i] ?? 0)));
  }
}

function setSea(state: SimState, week: number): void {
  const level = Math.min(MAX_CELL_DEPTH, Math.max(0, tideLevel(state.ctx.def, week)));
  for (const cell of state.ctx.board.seaCells) state.depths[cell] = level;
}

function supplied(state: SimState, cell: number): boolean {
  const { ctx, depths, closed } = state;
  for (let d = 0; d < 4; d++) {
    const n = ctx.neighbours[cell * 4 + d] ?? -1;
    if (n < 0 || !ctx.canalType[n]) continue;
    if (ctx.role[n] === ROLE_GATE && closed[n]) continue;
    if ((depths[n] ?? 0) >= SUPPLY_DEPTH) return true;
  }
  return false;
}

export function recordMetrics(state: SimState): void {
  const { ctx, depths } = state;
  ctx.board.houseCells.forEach((cell, h) => {
    if ((depths[cell] ?? 0) >= FLOOD_DEPTH)
      state.houseFlooded[h] = (state.houseFlooded[h] ?? 0) + 1;
    if (supplied(state, cell)) state.houseSupplied[h] = (state.houseSupplied[h] ?? 0) + 1;
  });
  ctx.board.fieldCells.forEach((cell, f) => {
    const depth = depths[cell] ?? 0;
    if (depth >= FIELD_WET_MIN && depth <= FIELD_WET_MAX) {
      state.fieldWet[f] = (state.fieldWet[f] ?? 0) + 1;
    }
  });
}

export function stepOnce(state: SimState): void {
  const week = Math.floor(state.step / STEPS_PER_WEEK);
  updateGates(state, week);
  addInlets(state, week);
  runPumps(state);
  flow(state);
  setSea(state, week);
  recordMetrics(state);
  state.step++;
}

export function collectMetrics(state: SimState): SeasonMetrics {
  const { board } = state.ctx;
  return {
    houses: board.houseCells.map((index, h) => ({
      index,
      x: index % board.width,
      y: Math.floor(index / board.width),
      floodedSteps: state.houseFlooded[h] ?? 0,
      suppliedSteps: state.houseSupplied[h] ?? 0,
    })),
    fields: board.fieldCells.map((index, f) => ({
      index,
      x: index % board.width,
      y: Math.floor(index / board.width),
      wetSteps: state.fieldWet[f] ?? 0,
    })),
  };
}

export function runSeason(
  def: MapDef,
  placements: readonly Placement[],
  options: RunOptions = {},
): SeasonResult {
  const state = createSimState(def, placements);
  const weeks = Math.max(0, Math.floor(def.weeks));
  const weekFrames: Uint8Array[] = [];
  const stepFrames: Uint8Array[] = [];
  for (let week = 0; week < weeks; week++) {
    for (let s = 0; s < STEPS_PER_WEEK; s++) {
      stepOnce(state);
      if (options.keepSteps) stepFrames.push(state.depths.slice());
    }
    weekFrames.push(state.depths.slice());
  }
  const result: SeasonResult = {
    width: state.ctx.board.width,
    height: state.ctx.board.height,
    weeks,
    weekFrames,
    metrics: collectMetrics(state),
  };
  if (options.keepSteps) result.stepFrames = stepFrames;
  return result;
}

export function hashSeason(result: SeasonResult): number {
  let hash = 2166136261;
  const mix = (value: number): void => {
    hash = Math.imul(hash ^ (value & 255), 16777619) >>> 0;
    hash = Math.imul(hash ^ ((value >>> 8) & 255), 16777619) >>> 0;
  };
  for (const frame of result.weekFrames) for (const depth of frame) mix(depth);
  for (const h of result.metrics.houses) {
    mix(h.index);
    mix(h.floodedSteps);
    mix(h.suppliedSteps);
  }
  for (const f of result.metrics.fields) {
    mix(f.index);
    mix(f.wetSteps);
  }
  return hash >>> 0;
}
