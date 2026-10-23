import { MAX_HEIGHT } from "../constants";
import type { Prng } from "../prng";
import type { CellKind } from "../types";
import { type Dims, neighborCells, pathField, traceBack } from "./grid";
import type { DailyTier } from "./tiers";

export interface Terrain extends Dims {
  kinds: CellKind[];
  heights: number[];
}

export interface Draft {
  terrain: Terrain;
  tree: number[];
}

const tuning = {
  noise: 1,
  scenery: 0.1,
  woods: 0.45,
  treeTop: 5,
  treeBottom: 0,
  bank: 0,
  houseMin: 6,
  fieldDip: 2,
  reliefMin: 3,
  reliefMax: 4,
  reliefTop: 5,
};

const NOISE_STEP = 3;
const BAY_ROWS = 3;

function valueNoise(rng: Prng, width: number, height: number): (x: number, y: number) => number {
  const cols = Math.ceil(width / NOISE_STEP) + 2;
  const rows = Math.ceil(height / NOISE_STEP) + 2;
  const lattice: number[] = [];
  for (let i = 0; i < cols * rows; i++) lattice.push(rng.next() * 2 - 1);
  const at = (cx: number, cy: number): number => lattice[cy * cols + cx] ?? 0;
  return (x, y) => {
    const fx = x / NOISE_STEP;
    const fy = y / NOISE_STEP;
    const cx = Math.floor(fx);
    const cy = Math.floor(fy);
    const tx = fx - cx;
    const ty = fy - cy;
    const top = at(cx, cy) * (1 - tx) + at(cx + 1, cy) * tx;
    const bottom = at(cx, cy + 1) * (1 - tx) + at(cx + 1, cy + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  };
}

function chebyshev(width: number, a: number, b: number): number {
  return Math.max(
    Math.abs((a % width) - (b % width)),
    Math.abs(Math.floor(a / width) - Math.floor(b / width)),
  );
}

function manhattan(width: number, a: number, b: number): number {
  return (
    Math.abs((a % width) - (b % width)) + Math.abs(Math.floor(a / width) - Math.floor(b / width))
  );
}

function placeInlets(rng: Prng, width: number, count: number): number[] {
  const span = Math.floor((width - 2) / count);
  const cells: number[] = [];
  for (let i = 0; i < count; i++) {
    cells.push(Math.min(1 + i * span + rng.int(Math.max(1, span)), width - 2));
  }
  return cells;
}

function placeTargets(
  rng: Prng,
  terrain: Terrain,
  tier: DailyTier,
  inlets: readonly number[],
): number[] | null {
  const { width, height, kinds } = terrain;
  const placed: number[] = [];
  const wanted: CellKind[] = [
    ...new Array<CellKind>(tier.houses).fill("house"),
    ...new Array<CellKind>(tier.fields).fill("field"),
  ];
  const lastRow = tier.tide ? height - 1 - BAY_ROWS : height - 1;
  for (const kind of rng.shuffle(wanted)) {
    const options: number[] = [];
    for (let y = 1; y <= lastRow; y++) {
      for (let x = 0; x < width; x++) {
        const cell = y * width + x;
        if (inlets.some((inlet) => chebyshev(width, cell, inlet) < 3)) continue;
        if (!inlets.some((inlet) => manhattan(width, cell, inlet) <= tier.reach)) continue;
        if (placed.some((other) => chebyshev(width, cell, other) < 2)) continue;
        const free = neighborCells(terrain, cell).filter((next) => kinds[next] === "land");
        if (free.length >= 3) options.push(cell);
      }
    }
    if (options.length === 0) return null;
    const cell = rng.pick(options);
    kinds[cell] = kind;
    placed.push(cell);
  }
  return placed;
}

function buildTree(
  rng: Prng,
  terrain: Terrain,
  inlets: readonly number[],
  targets: readonly number[],
): number[] {
  const { width, height, kinds } = terrain;
  const tree = new Set<number>();
  const flat = { width, height, heights: new Array<number>(width * height).fill(0) };
  const jitter = new Float64Array(width * height);
  for (let i = 0; i < jitter.length; i++) jitter[i] = rng.next() * 0.5;
  const order = [...targets].sort(
    (a, b) => nearestInlet(width, a, inlets) - nearestInlet(width, b, inlets),
  );
  for (const target of order) {
    const network = [...inlets, ...tree];
    const passable = (cell: number): boolean => kinds[cell] === "land" && !tree.has(cell);
    const sources: number[] = [];
    for (const cell of network) for (const next of neighborCells(flat, cell)) sources.push(next);
    const touching = neighborCells(flat, target).some((cell) => network.includes(cell));
    if (touching) continue;
    const field = pathField(flat, sources, passable, jitter);
    const ends = neighborCells(flat, target)
      .filter((cell) => Number.isFinite(field.dist[cell] ?? Number.POSITIVE_INFINITY))
      .sort((a, b) => (field.dist[a] ?? 0) - (field.dist[b] ?? 0));
    const end = ends[0];
    if (end === undefined) continue;
    for (const cell of traceBack(field, end)) tree.add(cell);
  }
  return [...tree];
}

function nearestInlet(width: number, cell: number, inlets: readonly number[]): number {
  return Math.min(...inlets.map((inlet) => chebyshev(width, cell, inlet)));
}

function treeDepths(
  terrain: Terrain,
  inlets: readonly number[],
  tree: readonly number[],
): Map<number, number> {
  const depth = new Map<number, number>();
  const members = new Set(tree);
  let frontier = [...inlets];
  for (const inlet of inlets) depth.set(inlet, 0);
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const cell of frontier) {
      for (const around of neighborCells(terrain, cell)) {
        if (!members.has(around) || depth.has(around)) continue;
        depth.set(around, (depth.get(cell) ?? 0) + 1);
        next.push(around);
      }
    }
    frontier = next;
  }
  return depth;
}

function assignHeights(
  rng: Prng,
  terrain: Terrain,
  inlets: readonly number[],
  tree: readonly number[],
): void {
  const { width, height, heights } = terrain;
  const peak = 7;
  const depths = treeDepths(terrain, inlets, tree);
  const maxDepth = Math.max(1, ...depths.values());
  const top = tuning.treeTop;
  const bottom = tuning.treeBottom;
  const source = new Int32Array(width * height).fill(-1);
  const distance = new Int32Array(width * height).fill(-1);
  let frontier: number[] = [];
  for (const [cell, d] of depths) {
    heights[cell] = Math.round(top - (d * (top - bottom)) / maxDepth);
    source[cell] = cell;
    distance[cell] = 0;
    frontier.push(cell);
  }
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const cell of frontier) {
      for (const around of neighborCells(terrain, cell)) {
        if (distance[around] !== -1) continue;
        distance[around] = (distance[cell] ?? 0) + 1;
        source[around] = source[cell] ?? -1;
        next.push(around);
      }
    }
    frontier = next;
  }
  const noise = valueNoise(rng, width, height);
  for (let cell = 0; cell < width * height; cell++) {
    if (depths.has(cell)) continue;
    const base = heights[source[cell] ?? 0] ?? 0;
    const bank = Math.min(distance[cell] ?? 0, 1) * tuning.bank;
    const wobble = Math.round(noise(cell % width, Math.floor(cell / width)) * tuning.noise);
    heights[cell] = Math.max(0, Math.min(MAX_HEIGHT - 1, base + bank + wobble));
  }
  for (const inlet of inlets) heights[inlet] = peak;
  settleTargets(rng, terrain, depths);
}

function settleTargets(rng: Prng, terrain: Terrain, depths: ReadonlyMap<number, number>): void {
  const { kinds, heights } = terrain;
  for (let cell = 0; cell < kinds.length; cell++) {
    const kind = kinds[cell];
    if (kind !== "house" && kind !== "field") continue;
    const beside = neighborCells(terrain, cell)
      .filter((next) => depths.has(next))
      .map((next) => heights[next] ?? 0);
    if (beside.length === 0) continue;
    if (kind === "house") {
      heights[cell] = Math.min(
        MAX_HEIGHT,
        tuning.houseMin + rng.int(MAX_HEIGHT - tuning.houseMin + 1),
      );
    } else {
      heights[cell] = Math.max(0, Math.min(...beside) - tuning.fieldDip + rng.int(2));
    }
  }
}

function placeDrains(
  rng: Prng,
  terrain: Terrain,
  inlets: readonly number[],
  tree: ReadonlySet<number>,
): void {
  const { width, height, kinds, heights } = terrain;
  const guarded = new Set<number>();
  for (let cell = 0; cell < kinds.length; cell++) {
    if (kinds[cell] === "house" || kinds[cell] === "field") {
      guarded.add(cell);
      for (const next of neighborCells(terrain, cell)) guarded.add(next);
    }
  }
  const flat = { width, height, heights: new Array<number>(width * height).fill(0) };
  const free = (cell: number): boolean =>
    kinds[cell] === "land" && !tree.has(cell) && !guarded.has(cell);
  const jitter = new Float64Array(width * height);
  for (let i = 0; i < jitter.length; i++) jitter[i] = rng.next() * 0.4;
  for (const inlet of inlets) {
    const field = pathField(flat, neighborCells(flat, inlet), free, jitter);
    const options: number[] = [];
    for (let cell = 0; cell < kinds.length; cell++) {
      const hops = field.dist[cell] ?? Number.POSITIVE_INFINITY;
      if (hops < tuning.reliefMin || hops > tuning.reliefMax) continue;
      if (neighborCells(flat, cell).some((next) => kinds[next] !== "land")) continue;
      options.push(cell);
    }
    if (options.length === 0) continue;
    const drain = rng.pick(options);
    const path = traceBack(field, drain).reverse();
    const last = path.length - 2;
    path.slice(0, -1).forEach((cell, at) => {
      heights[cell] =
        last <= 0 ? 3 : Math.round(tuning.reliefTop - ((tuning.reliefTop - 1) * at) / last);
    });
    kinds[drain] = "sea";
    heights[drain] = 0;
  }
}

function carveBay(rng: Prng, terrain: Terrain): void {
  const { width, height, kinds, heights } = terrain;
  const span = 3 + rng.int(3);
  const start = 1 + rng.int(Math.max(1, width - span - 2));
  for (let x = start; x < start + span; x++) {
    kinds[(height - 1) * width + x] = "sea";
    heights[(height - 1) * width + x] = 0;
    if (x > start && x < start + span - 1) {
      kinds[(height - 2) * width + x] = "sea";
      heights[(height - 2) * width + x] = 0;
    }
  }
  for (let x = 0; x < width; x++) {
    for (let row = height - BAY_ROWS; row < height; row++) {
      const cell = row * width + x;
      if (kinds[cell] === "land") heights[cell] = Math.min(heights[cell] ?? 0, 1 + (x % 2));
    }
  }
}

export function scatterScenery(rng: Prng, terrain: Terrain, near: ReadonlySet<number>): void {
  const { width, height, kinds } = terrain;
  for (let cell = 0; cell < width * height; cell++) {
    if (kinds[cell] !== "land") continue;
    const around = neighborCells(terrain, cell);
    const touches = around.some(
      (next) => kinds[next] === "house" || kinds[next] === "field" || near.has(next),
    );
    if (touches || near.has(cell)) continue;
    const crowded = around.some((next) => kinds[next] === "scenery");
    const density = crowded ? tuning.woods : tuning.scenery;
    if (rng.next() < density) kinds[cell] = "scenery";
  }
}

export function buildDraft(rng: Prng, tier: DailyTier): Draft | null {
  const { width, height } = tier;
  const terrain: Terrain = {
    width,
    height,
    kinds: new Array<CellKind>(width * height).fill("land"),
    heights: new Array<number>(width * height).fill(0),
  };
  const inlets = placeInlets(rng, width, tier.inlets);
  for (const inlet of inlets) terrain.kinds[inlet] = "inlet";
  const targets = placeTargets(rng, terrain, tier, inlets);
  if (!targets) return null;
  const tree = buildTree(rng, terrain, inlets, targets);
  assignHeights(rng, terrain, inlets, tree);
  placeDrains(rng, terrain, inlets, new Set(tree));
  if (tier.tide) carveBay(rng, terrain);
  scatterScenery(rng, terrain, new Set(tree));
  return { terrain, tree };
}

const CHAR_BY_KIND: Readonly<Record<CellKind, string>> = {
  land: ".",
  house: "H",
  field: "F",
  scenery: "T",
  inlet: "I",
  sea: "S",
};

export function terrainLayout(terrain: Terrain): string[] {
  const rows: string[] = [];
  for (let y = 0; y < terrain.height; y++) {
    const tokens: string[] = [];
    for (let x = 0; x < terrain.width; x++) {
      const i = y * terrain.width + x;
      tokens.push(`${CHAR_BY_KIND[terrain.kinds[i] as CellKind]}${terrain.heights[i]}`);
    }
    rows.push(tokens.join(" "));
  }
  return rows;
}
