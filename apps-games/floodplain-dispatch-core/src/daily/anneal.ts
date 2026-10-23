import { MAX_HEIGHT } from "../constants";
import type { Prng } from "../prng";
import { runSeason } from "../simulate";
import type { CellKind, MapDef, Placement } from "../types";
import { neighborCells } from "./grid";
import { shortfall } from "./penalty";
import type { Terrain } from "./terrain";
import { terrainLayout } from "./terrain";

const MAX_STEP = 3;
const START_TEMPERATURE = 0.5;
const END_TEMPERATURE = 0.05;

export interface ShapeResult {
  ok: boolean;
  sims: number;
  penalty: number;
}

function withLayout(def: MapDef, terrain: Terrain): MapDef {
  return { ...def, layout: terrainLayout(terrain) };
}

function steepAt(terrain: Terrain, cell: number): boolean {
  const here = terrain.heights[cell] ?? 0;
  return neighborCells(terrain, cell).some(
    (next) => Math.abs((terrain.heights[next] ?? 0) - here) > MAX_STEP,
  );
}

function editable(kind: CellKind | undefined): boolean {
  return kind === "land" || kind === "house" || kind === "field" || kind === "scenery";
}

function acceptance(x: number): number {
  return 1 / (1 + x + (x * x) / 2 + (x * x * x) / 6);
}

export function shapeTerrain(
  rng: Prng,
  terrain: Terrain,
  def: MapDef,
  tree: readonly Placement[],
  maxSims: number,
): ShapeResult {
  const { width } = terrain;
  const focus = new Set<number>();
  for (const piece of tree) {
    const cell = piece.y * width + piece.x;
    focus.add(cell);
    for (const next of neighborCells(terrain, cell)) focus.add(next);
  }
  const focusList = [...focus].filter((cell) => editable(terrain.kinds[cell]));
  const everywhere: number[] = [];
  for (let cell = 0; cell < terrain.kinds.length; cell++) {
    if (editable(terrain.kinds[cell])) everywhere.push(cell);
  }
  const evaluate = (): number =>
    shortfall(runSeason(withLayout(def, terrain), tree).metrics).penalty;
  let current = evaluate();
  let sims = 1;
  while (current > 0 && sims < maxSims) {
    const temperature =
      START_TEMPERATURE + ((END_TEMPERATURE - START_TEMPERATURE) * sims) / maxSims;
    const pool = rng.int(10) < 7 && focusList.length > 0 ? focusList : everywhere;
    const cell = rng.pick(pool);
    const before = terrain.heights[cell] ?? 0;
    const after = Math.max(0, Math.min(MAX_HEIGHT - 1, before + (rng.int(2) === 0 ? -1 : 1)));
    if (after === before) continue;
    terrain.heights[cell] = after;
    if (steepAt(terrain, cell)) {
      terrain.heights[cell] = before;
      continue;
    }
    const next = evaluate();
    sims++;
    if (next <= current || rng.next() < acceptance((next - current) / temperature)) {
      current = next;
    } else {
      terrain.heights[cell] = before;
    }
  }
  return { ok: current === 0, sims, penalty: current };
}
