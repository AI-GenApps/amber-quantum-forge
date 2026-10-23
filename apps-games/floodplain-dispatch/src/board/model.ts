import {
  type Board,
  createBoard,
  type MapDef,
  type Placement,
  type RegionId,
} from "@web-games/floodplain-dispatch-core";
import type { CellPos } from "./geometry";

export type BadgeKind = "supplied" | "dry" | "flooded" | "irrigated";

export interface Badge {
  x: number;
  y: number;
  kind: BadgeKind;
  target: "house" | "field";
}

export type SceneryKind = "tree-oak" | "tree-poplar" | "tree-willow" | "windmill" | "rock";

export type SceneryRegion = RegionId | "daily";

export interface BoardView {
  def: MapDef;
  board: Board;
  placements: readonly Placement[];
  pieceAt: ReadonlyMap<number, Placement>;
  depths: Uint8Array;
  week: number | null;
  houseKinds: ReadonlyMap<number, string>;
  scenery: ReadonlyMap<number, SceneryKind>;
  badges: readonly Badge[];
  ghost: Placement | null;
  cursor: CellPos | null;
  selected: CellPos | null;
}

export interface ViewInput {
  def: MapDef;
  region?: SceneryRegion;
  placements: readonly Placement[];
  depths?: Uint8Array | undefined;
  week?: number | null;
  badges?: readonly Badge[];
  ghost?: Placement | null;
  cursor?: CellPos | null;
  selected?: CellPos | null;
}

const TREES: Readonly<Record<SceneryRegion, readonly SceneryKind[]>> = {
  valley: ["tree-oak", "tree-poplar", "tree-willow"],
  delta: ["tree-poplar", "tree-willow"],
  highland: ["tree-oak", "rock", "rock"],
  estuary: ["tree-willow", "tree-willow", "tree-poplar"],
  daily: ["tree-oak", "tree-poplar", "tree-willow"],
};

const WINDMILL_REGIONS: ReadonlySet<SceneryRegion> = new Set(["delta", "estuary"]);

export function cellHash(x: number, y: number): number {
  return (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0;
}

export function assignScenery(board: Board, region: SceneryRegion): Map<number, SceneryKind> {
  const out = new Map<number, SceneryKind>();
  const trees = TREES[region];
  let windmill = -1;
  let best = -1;
  board.kinds.forEach((kind, index) => {
    if (kind !== "scenery") return;
    const x = index % board.width;
    const y = Math.floor(index / board.width);
    const hash = cellHash(x, y);
    out.set(index, trees[hash % trees.length] as SceneryKind);
    if (WINDMILL_REGIONS.has(region) && hash > best) {
      best = hash;
      windmill = index;
    }
  });
  if (windmill >= 0) out.set(windmill, "windmill");
  return out;
}

export function buildView(input: ViewInput): BoardView {
  const board = createBoard(input.def);
  const pieceAt = new Map<number, Placement>();
  for (const piece of input.placements) pieceAt.set(piece.y * board.width + piece.x, piece);
  const houseKinds = new Map<number, string>();
  board.houseCells.forEach((cell, i) => {
    houseKinds.set(cell, input.def.houseKinds[i] ?? "cottage");
  });
  return {
    def: input.def,
    board,
    placements: input.placements,
    pieceAt,
    depths: input.depths ?? new Uint8Array(board.width * board.height),
    week: input.week ?? null,
    houseKinds,
    scenery: assignScenery(board, input.region ?? "daily"),
    badges: input.badges ?? [],
    ghost: input.ghost ?? null,
    cursor: input.cursor ?? null,
    selected: input.selected ?? null,
  };
}

export function cellIndexOf(view: BoardView, x: number, y: number): number {
  return y * view.board.width + x;
}

export function houseCellList(board: Board): { x: number; y: number }[] {
  return board.houseCells.map((i) => ({ x: i % board.width, y: Math.floor(i / board.width) }));
}

export function fieldCellList(board: Board): { x: number; y: number }[] {
  return board.fieldCells.map((i) => ({ x: i % board.width, y: Math.floor(i / board.width) }));
}
