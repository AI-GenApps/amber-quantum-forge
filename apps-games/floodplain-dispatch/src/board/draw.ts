import {
  DIRECTION_DELTAS,
  DIRECTIONS,
  type Direction,
  type PieceKind,
} from "@web-games/floodplain-dispatch-core";
import { landColor, type MapTheme, waterColor } from "../theme/mapThemes";
import { PALETTE } from "../theme/tokens";
import type { Draw2D } from "./Draw2D";
import { cellOrigin, type Geometry } from "./geometry";
import type { BoardView } from "./model";

export interface DrawOptions {
  theme: MapTheme;
  highContrast: boolean;
  reducedMotion: boolean;
  time: number;
  images?: Readonly<Record<string, unknown>>;
  /** A region backdrop shows behind the canvas, so the margin colour is laid over it translucent. */
  backdrop?: boolean;
}

export const BACKDROP_MARGIN_ALPHA = 0.6 as const;

export const LABEL_FONT = '"Atkinson Hyperlegible", sans-serif' as const;

const CANAL_TYPES: ReadonlySet<PieceKind> = new Set(["canal", "gate", "reservoir"]);

export function lineScale(options: DrawOptions): number {
  return options.highContrast ? 1.8 : 1;
}

export function isWaterCell(view: BoardView, index: number): boolean {
  const kind = view.board.kinds[index];
  return kind === "sea" || kind === "inlet" || (view.depths[index] ?? 0) > 0;
}

function neighbour(view: BoardView, x: number, y: number, dir: Direction): number | null {
  const [dx, dy] = DIRECTION_DELTAS[dir];
  const nx = x + dx;
  const ny = y + dy;
  if (nx < 0 || ny < 0 || nx >= view.board.width || ny >= view.board.height) return null;
  return ny * view.board.width + nx;
}

export function drawBackground(ctx: Draw2D, geom: Geometry, options: DrawOptions): void {
  ctx.clearRect(0, 0, geom.viewport.width, geom.viewport.height);
  ctx.fillStyle = options.theme.background;
  if (options.backdrop) {
    ctx.globalAlpha = BACKDROP_MARGIN_ALPHA;
    ctx.fillRect(0, 0, geom.viewport.width, geom.viewport.height);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillRect(0, 0, geom.viewport.width, geom.viewport.height);
}

export function drawTerrain(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  const { board } = view;
  const edge = Math.max(2, Math.round(geom.cell * 0.1));
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const index = y * board.width + x;
      const height = board.heights[index] ?? 0;
      const { px, py } = cellOrigin(geom, x, y);
      ctx.fillStyle = landColor(options.theme, height);
      ctx.fillRect(px, py, geom.cell, geom.cell);
      ctx.globalAlpha = 0.35;
      const lower = (dir: Direction): boolean => {
        const n = neighbour(view, x, y, dir);
        return n !== null && (board.heights[n] ?? 0) < height;
      };
      ctx.fillStyle = options.theme.lightHighlight;
      if (lower("W")) ctx.fillRect(px, py, edge, geom.cell);
      if (lower("N")) ctx.fillRect(px, py, geom.cell, edge);
      ctx.fillStyle = options.theme.lightShadow;
      if (lower("E")) ctx.fillRect(px + geom.cell - edge, py, edge, geom.cell);
      if (lower("S")) ctx.fillRect(px, py + geom.cell - edge, geom.cell, edge);
      ctx.globalAlpha = 1;
    }
  }
}

export function drawFields(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  const rows = 4;
  for (const index of view.board.fieldCells) {
    const x = index % view.board.width;
    const y = Math.floor(index / view.board.width);
    const { px, py } = cellOrigin(geom, x, y);
    ctx.fillStyle = options.theme.fieldBase;
    ctx.fillRect(px, py, geom.cell, geom.cell);
    ctx.strokeStyle = options.theme.fieldRow;
    ctx.lineWidth = Math.max(1, geom.cell * 0.07) * lineScale(options);
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      const ly = py + ((r + 0.5) * geom.cell) / rows;
      ctx.moveTo(px + geom.cell * 0.1, ly);
      ctx.lineTo(px + geom.cell * 0.9, ly);
    }
    ctx.stroke();
  }
}

function connected(view: BoardView, x: number, y: number, dir: Direction): boolean {
  const n = neighbour(view, x, y, dir);
  if (n === null) return false;
  const kind = view.board.kinds[n];
  if (kind === "sea" || kind === "inlet") return true;
  const piece = view.pieceAt.get(n);
  return piece !== undefined && CANAL_TYPES.has(piece.kind);
}

export function drawCanals(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  const width = geom.cell * 0.44;
  const inset = (geom.cell - width) / 2;
  for (const piece of view.placements) {
    if (piece.kind !== "canal") continue;
    const index = piece.y * view.board.width + piece.x;
    const { px, py } = cellOrigin(geom, piece.x, piece.y);
    ctx.fillStyle = options.theme.shore;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(px + inset, py + inset, width, width);
    for (const dir of DIRECTIONS) {
      if (!connected(view, piece.x, piece.y, dir)) continue;
      if (dir === "N") ctx.fillRect(px + inset, py, width, inset);
      if (dir === "S") ctx.fillRect(px + inset, py + inset + width, width, inset);
      if (dir === "W") ctx.fillRect(px, py + inset, inset, width);
      if (dir === "E") ctx.fillRect(px + inset + width, py + inset, inset, width);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = landColor(options.theme, (view.board.heights[index] ?? 0) - 2);
    const bed = Math.max(1, width - 4 * lineScale(options));
    ctx.fillRect(px + (geom.cell - bed) / 2, py + (geom.cell - bed) / 2, bed, bed);
    for (const dir of DIRECTIONS) {
      if (!connected(view, piece.x, piece.y, dir)) continue;
      const half = (geom.cell - bed) / 2;
      if (dir === "N") ctx.fillRect(px + half, py, bed, half);
      if (dir === "S") ctx.fillRect(px + half, py + half + bed, bed, half);
      if (dir === "W") ctx.fillRect(px, py + half, half, bed);
      if (dir === "E") ctx.fillRect(px + half + bed, py + half, half, bed);
    }
  }
}

function hatch(
  ctx: Draw2D,
  px: number,
  py: number,
  size: number,
  depth: number,
  color: string,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, size, size);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const gap = depth <= 2 ? size / 2 : depth <= 4 ? size / 3 : size / 5;
  ctx.beginPath();
  for (let d = -size; d < size * 2; d += gap) {
    ctx.moveTo(px + d, py + size);
    ctx.lineTo(px + d + size, py);
  }
  if (depth > 2) {
    for (let d = -size; d < size * 2; d += gap) {
      ctx.moveTo(px + d, py);
      ctx.lineTo(px + d + size, py + size);
    }
  }
  ctx.stroke();
  ctx.restore();
}

export function drawWater(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  const { board } = view;
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const index = y * board.width + x;
      const kind = board.kinds[index];
      const depth = view.depths[index] ?? 0;
      const { px, py } = cellOrigin(geom, x, y);
      if (kind === "sea") {
        ctx.fillStyle = options.theme.sea;
        ctx.fillRect(px, py, geom.cell, geom.cell);
        drawWaves(ctx, px, py, geom.cell, options);
        continue;
      }
      if (kind === "inlet") {
        ctx.fillStyle = options.theme.waterMid;
        ctx.fillRect(px, py, geom.cell, geom.cell);
        drawSpring(ctx, px, py, geom.cell, options);
        continue;
      }
      if (depth <= 0) continue;
      ctx.globalAlpha = 0.94;
      ctx.fillStyle = waterColor(options.theme, depth);
      ctx.fillRect(px, py, geom.cell, geom.cell);
      ctx.globalAlpha = 1;
      if (options.highContrast) hatch(ctx, px, py, geom.cell, depth, options.theme.shore);
    }
  }
}

function drawWaves(ctx: Draw2D, px: number, py: number, size: number, options: DrawOptions): void {
  const shift = options.reducedMotion ? 0 : ((options.time / 600) % 1) * size * 0.25;
  ctx.strokeStyle = PALETTE.paper;
  ctx.lineWidth = Math.max(1, size * 0.06) * lineScale(options);
  ctx.beginPath();
  for (const row of [0.3, 0.65]) {
    const y = py + size * row;
    ctx.moveTo(px + size * 0.1 + shift, y);
    ctx.lineTo(px + size * 0.35 + shift, y - size * 0.08);
    ctx.lineTo(px + size * 0.6 + shift, y);
    ctx.lineTo(px + size * 0.85, y - size * 0.08);
  }
  ctx.stroke();
}

function drawSpring(ctx: Draw2D, px: number, py: number, size: number, options: DrawOptions): void {
  ctx.strokeStyle = PALETTE.paper;
  ctx.lineWidth = Math.max(1, size * 0.07) * lineScale(options);
  const pulse = options.reducedMotion ? 0 : ((options.time / 900) % 1) * size * 0.1;
  for (const radius of [0.18, 0.32]) {
    ctx.beginPath();
    ctx.arc(px + size / 2, py + size / 2, size * radius + pulse, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.paper;
  ctx.beginPath();
  ctx.arc(px + size / 2, py + size / 2, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

export function drawShore(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  const { board } = view;
  ctx.strokeStyle = options.theme.shore;
  ctx.lineWidth = 2 * lineScale(options);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const index = y * board.width + x;
      if (!isWaterCell(view, index)) continue;
      const { px, py } = cellOrigin(geom, x, y);
      for (const dir of DIRECTIONS) {
        const n = neighbour(view, x, y, dir);
        if (n === null || isWaterCell(view, n)) continue;
        if (dir === "N") {
          ctx.moveTo(px, py);
          ctx.lineTo(px + geom.cell, py);
        } else if (dir === "S") {
          ctx.moveTo(px, py + geom.cell);
          ctx.lineTo(px + geom.cell, py + geom.cell);
        } else if (dir === "W") {
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + geom.cell);
        } else {
          ctx.moveTo(px + geom.cell, py);
          ctx.lineTo(px + geom.cell, py + geom.cell);
        }
      }
    }
  }
  ctx.stroke();
}

export function drawHaze(ctx: Draw2D, view: BoardView, geom: Geometry, options: DrawOptions): void {
  const haze = options.theme.haze;
  if (!haze) return;
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = haze;
  ctx.fillRect(
    geom.originX,
    geom.originY,
    view.board.width * geom.cell,
    view.board.height * geom.cell,
  );
  ctx.globalAlpha = 1;
}

export function drawDepthLabels(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  if (!options.highContrast) return;
  const size = Math.max(9, Math.round(geom.cell * 0.4));
  ctx.font = `700 ${size}px ${LABEL_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let y = 0; y < view.board.height; y++) {
    for (let x = 0; x < view.board.width; x++) {
      const index = y * view.board.width + x;
      const depth = view.depths[index] ?? 0;
      if (depth <= 0 || view.board.kinds[index] === "sea" || view.board.kinds[index] === "inlet")
        continue;
      const { px, py } = cellOrigin(geom, x, y);
      const chip = geom.cell * 0.56;
      ctx.fillStyle = PALETTE.paper;
      ctx.fillRect(px + (geom.cell - chip) / 2, py + (geom.cell - chip) / 2, chip, chip);
      ctx.fillStyle = PALETTE.ink;
      ctx.fillText(String(depth), px + geom.cell / 2, py + geom.cell / 2);
    }
  }
}
