import { createBoard, DIRECTIONS, inBounds, isBuildable } from "./board";
import { PIECE_COSTS } from "./constants";
import type { Direction, MapDef, Placement } from "./types";

export type PlacementError =
  | "OUT_OF_BOUNDS"
  | "NOT_BUILDABLE"
  | "PIECE_UNAVAILABLE"
  | "OCCUPIED"
  | "OVER_BUDGET"
  | "BAD_DIRECTION"
  | "BAD_GATE_WEEKS";

export function placementCost(placement: Placement): number {
  return PIECE_COSTS[placement.kind];
}

export function totalCost(placements: readonly Placement[]): number {
  let total = 0;
  for (const placement of placements) total += placementCost(placement);
  return total;
}

export function budgetLeft(def: MapDef, placements: readonly Placement[]): number {
  return def.budget - totalCost(placements);
}

export function findPlacement(
  placements: readonly Placement[],
  x: number,
  y: number,
): Placement | undefined {
  return placements.find((p) => p.x === x && p.y === y);
}

function directionError(candidate: Placement): boolean {
  if (candidate.kind === "pump") return !DIRECTIONS.includes(candidate.dir as Direction);
  return candidate.dir !== undefined;
}

function gateWeeksError(def: MapDef, candidate: Placement): boolean {
  const { opensWeek, closesWeek } = candidate;
  if (candidate.kind !== "gate") return opensWeek !== undefined || closesWeek !== undefined;
  const opens = opensWeek ?? 0;
  const closes = closesWeek ?? def.weeks;
  return (
    !Number.isInteger(opens) ||
    !Number.isInteger(closes) ||
    opens < 0 ||
    closes > def.weeks ||
    opens >= closes
  );
}

export function checkPlacement(
  def: MapDef,
  placements: readonly Placement[],
  candidate: Placement,
): PlacementError | null {
  const board = createBoard(def);
  if (!inBounds(board, candidate.x, candidate.y)) return "OUT_OF_BOUNDS";
  if (!isBuildable(board, candidate.x, candidate.y)) return "NOT_BUILDABLE";
  if (!def.pieces.includes(candidate.kind)) return "PIECE_UNAVAILABLE";
  if (directionError(candidate)) return "BAD_DIRECTION";
  if (gateWeeksError(def, candidate)) return "BAD_GATE_WEEKS";
  if (findPlacement(placements, candidate.x, candidate.y)) return "OCCUPIED";
  if (totalCost(placements) + placementCost(candidate) > def.budget) return "OVER_BUDGET";
  return null;
}

export function addPlacement(placements: readonly Placement[], candidate: Placement): Placement[] {
  return [...placements, { ...candidate }];
}

export function removePlacement(
  placements: readonly Placement[],
  x: number,
  y: number,
): Placement[] {
  return placements.filter((p) => p.x !== x || p.y !== y);
}

export function rotatePump(placements: readonly Placement[], x: number, y: number): Placement[] {
  return placements.map((p) => {
    if (p.x !== x || p.y !== y || p.kind !== "pump") return { ...p };
    const at = DIRECTIONS.indexOf(p.dir as Direction);
    return { ...p, dir: DIRECTIONS[(at + 1) % DIRECTIONS.length] as Direction };
  });
}

export function setGateWeeks(
  placements: readonly Placement[],
  x: number,
  y: number,
  opensWeek: number,
  closesWeek: number,
): Placement[] {
  return placements.map((p) =>
    p.x === x && p.y === y && p.kind === "gate" ? { ...p, opensWeek, closesWeek } : { ...p },
  );
}
