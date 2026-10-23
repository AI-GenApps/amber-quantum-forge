import { checkPlacement } from "../src/placement";
import { createPrng, type Prng } from "../src/prng";
import { collectMetrics, createSimState, type SimState, stepOnce } from "../src/simulate";
import type {
  Direction,
  MapDef,
  PieceKind,
  Placement,
  SeasonEvent,
  SeasonResult,
} from "../src/types";

export const ALL_PIECES: readonly PieceKind[] = ["canal", "barrier", "pump", "gate", "reservoir"];

export function makeDef(layout: string[], overrides: Partial<MapDef> = {}): MapDef {
  return {
    layout,
    inlets: [],
    houseKinds: [],
    events: [],
    tide: null,
    weeks: 4,
    pieces: ALL_PIECES,
    par: 10,
    budget: 30,
    ...overrides,
  };
}

export function stateFor(
  def: MapDef,
  placements: Placement[] = [],
  depths: ReadonlyArray<readonly [number, number, number]> = [],
): SimState {
  const state = createSimState(def, placements);
  const width = state.ctx.board.width;
  for (const [x, y, depth] of depths) state.depths[y * width + x] = depth;
  return state;
}

export function depthAt(state: SimState, x: number, y: number): number {
  return state.depths[y * state.ctx.board.width + x] ?? -1;
}

export function frameAt(frame: Uint8Array, width: number, x: number, y: number): number {
  return frame[y * width + x] ?? -1;
}

export function resultOf(state: SimState): SeasonResult {
  return {
    width: state.ctx.board.width,
    height: state.ctx.board.height,
    weeks: 0,
    weekFrames: [],
    metrics: collectMetrics(state),
  };
}

export function placement(
  kind: PieceKind,
  x: number,
  y: number,
  extra: Partial<Placement> = {},
): Placement {
  return { x, y, kind, ...extra };
}

const DIRS: readonly Direction[] = ["N", "E", "S", "W"];

function weighted(rng: Prng): string {
  const roll = rng.int(100);
  if (roll < 58) return ".";
  if (roll < 67) return "H";
  if (roll < 76) return "F";
  if (roll < 82) return "T";
  if (roll < 91) return "I";
  return "S";
}

function randomEvents(rng: Prng, weeks: number, hasTide: boolean): SeasonEvent[] {
  const events: SeasonEvent[] = [];
  const count = rng.int(4);
  for (let i = 0; i < count; i++) {
    const types = hasTide ? ["surge", "drought", "storm-tide"] : ["surge", "drought"];
    const type = rng.pick(types) as SeasonEvent["type"];
    events.push({ type, week: rng.int(weeks), weeks: 1 + rng.int(4), delta: 1 + rng.int(3) });
  }
  return events;
}

export interface Scenario {
  def: MapDef;
  placements: Placement[];
}

export interface ScenarioOptions {
  width?: number;
  height?: number;
  weeks?: number;
  attempts?: number;
}

export function randomScenario(seed: number, options: ScenarioOptions = {}): Scenario {
  const rng = createPrng(seed);
  const width = options.width ?? 2 + rng.int(8);
  const height = options.height ?? 2 + rng.int(8);
  const weeks = options.weeks ?? 3 + rng.int(8);
  const layout: string[] = [];
  let inletCount = 0;
  let houses = 0;
  for (let y = 0; y < height; y++) {
    const tokens: string[] = [];
    for (let x = 0; x < width; x++) {
      const kind = weighted(rng);
      if (kind === "I") inletCount++;
      if (kind === "H") houses++;
      tokens.push(`${kind}${rng.int(8)}`);
    }
    layout.push(tokens.join(" "));
  }
  const tide = rng.int(2) === 0 ? null : { period: rng.pick([6, 8, 10]), amp: 1 + rng.int(3) };
  const inlets = Array.from({ length: inletCount }, () => 1 + rng.int(4));
  const def = makeDef(layout, {
    inlets,
    houseKinds: Array.from({ length: houses }, () => "cottage"),
    events: randomEvents(rng, weeks, tide !== null),
    tide,
    weeks,
    budget: 8 + rng.int(20),
  });
  const placements: Placement[] = [];
  const attempts = options.attempts ?? 40;
  for (let i = 0; i < attempts; i++) {
    const kind = rng.pick(ALL_PIECES);
    const candidate: Placement = { x: rng.int(width), y: rng.int(height), kind };
    if (kind === "pump") candidate.dir = rng.pick(DIRS);
    if (kind === "gate") {
      const opens = rng.int(weeks);
      candidate.opensWeek = opens;
      candidate.closesWeek = opens + 1 + rng.int(weeks - opens);
    }
    if (checkPlacement(def, placements, candidate) === null) placements.push(candidate);
  }
  return { def, placements };
}

export function stepN(state: SimState, count: number): void {
  for (let i = 0; i < count; i++) stepOnce(state);
}

export function cellsOf(
  state: SimState,
  cells: ReadonlyArray<readonly [number, number]>,
): number[] {
  return cells.map(([x, y]) => depthAt(state, x, y));
}

export function total(state: SimState): number {
  let sum = 0;
  for (const depth of state.depths) sum += depth;
  return sum;
}
