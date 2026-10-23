import {
  CREST_BARRIER,
  CREST_CANAL,
  CREST_RESERVOIR,
  ENGINE_MAX_HEIGHT,
  ENGINE_MAX_WIDTH,
  ENGINE_MIN_HEIGHT,
  ENGINE_MIN_WIDTH,
} from "./constants";
import { parseLayout } from "./layout";
import type { Board, CellKind, Direction, MapDef, PieceKind } from "./types";

export const DIRECTIONS: readonly Direction[] = ["N", "E", "S", "W"];

export const DIRECTION_DELTAS: Readonly<Record<Direction, readonly [number, number]>> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};

const boardCache = new WeakMap<MapDef, Board>();

export function createBoard(def: MapDef): Board {
  const cached = boardCache.get(def);
  if (cached) return cached;
  const parsed = parseLayout(def.layout);
  if (!parsed.ok) {
    const { code, row, column } = parsed.error;
    throw new Error(`Invalid layout: ${code} at row ${row}, column ${column}`);
  }
  const { width, height, kinds, heights } = parsed.layout;
  if (
    width < ENGINE_MIN_WIDTH ||
    height < ENGINE_MIN_HEIGHT ||
    width > ENGINE_MAX_WIDTH ||
    height > ENGINE_MAX_HEIGHT
  ) {
    throw new Error(`Unsupported board size ${width} x ${height}`);
  }
  const collect = (kind: CellKind): number[] => {
    const out: number[] = [];
    for (let i = 0; i < kinds.length; i++) if (kinds[i] === kind) out.push(i);
    return out;
  };
  const board: Board = {
    width,
    height,
    kinds,
    heights: Uint8Array.from(heights),
    houseCells: collect("house"),
    fieldCells: collect("field"),
    inletCells: collect("inlet"),
    seaCells: collect("sea"),
  };
  boardCache.set(def, board);
  return board;
}

export function inBounds(board: Board, x: number, y: number): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x < board.width &&
    y < board.height
  );
}

export function cellIndex(board: Board, x: number, y: number): number {
  return y * board.width + x;
}

export function neighbors(board: Board, x: number, y: number): (number | null)[] {
  return DIRECTIONS.map((dir) => {
    const [dx, dy] = DIRECTION_DELTAS[dir];
    const nx = x + dx;
    const ny = y + dy;
    return inBounds(board, nx, ny) ? cellIndex(board, nx, ny) : null;
  });
}

export function isBuildable(board: Board, x: number, y: number): boolean {
  return inBounds(board, x, y) && board.kinds[cellIndex(board, x, y)] === "land";
}

export function baseHeight(board: Board, index: number): number {
  return board.heights[index] ?? 0;
}

export function effectiveCrest(height: number, piece: PieceKind | null): number {
  switch (piece) {
    case "canal":
    case "gate":
      return Math.max(0, height + CREST_CANAL);
    case "reservoir":
      return Math.max(0, height + CREST_RESERVOIR);
    case "barrier":
      return height + CREST_BARRIER;
    default:
      return height;
  }
}

export function isCanalType(kind: CellKind, piece: PieceKind | null, gateOpen = true): boolean {
  if (kind === "inlet" || kind === "sea") return true;
  if (piece === "gate") return gateOpen;
  return piece === "canal" || piece === "reservoir";
}
