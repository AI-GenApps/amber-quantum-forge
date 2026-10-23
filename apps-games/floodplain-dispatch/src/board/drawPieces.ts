import type { Direction, Placement } from "@web-games/floodplain-dispatch-core";
import { drawShapes } from "../art/drawShapes";
import { FALLBACKS } from "../art/fallbacks";
import { circle, poly, type Role, type RoleColors, type Shape } from "../art/shapes";
import { HOUSE_SLOT, PIECE_SLOT, type SlotId } from "../art/slots";
import type { MapTheme } from "../theme/mapThemes";
import { PALETTE } from "../theme/tokens";
import type { Draw2D } from "./Draw2D";
import { type DrawOptions, lineScale } from "./draw";
import { cellOrigin, type Geometry } from "./geometry";
import type { BoardView, SceneryKind } from "./model";

const ROCK_SHAPES: readonly Shape[] = [
  circle(52, 88, 32, "ink", { a: 0.18 }),
  poly([14, 80, 24, 44, 46, 30, 72, 38, 88, 66, 84, 82], "rock", { stroke: "ink", sw: 3 }),
  poly([34, 70, 44, 46, 62, 42], undefined, { stroke: "paper", sw: 2.5, open: true, a: 0.6 }),
];

export function roleColors(theme: MapTheme): RoleColors {
  return {
    ...PALETTE,
    rock: theme.rock,
    ink: theme.shore === PALETTE.paper ? PALETTE.ink : theme.shore,
    wall: theme.wall,
    roof: theme.roof,
    leaf: theme.leaf,
    leafDark: theme.leafDark,
    trunk: theme.trunk,
  } satisfies Record<Role, string>;
}

export function drawSprite(
  ctx: Draw2D,
  slot: SlotId,
  x: number,
  y: number,
  size: number,
  options: DrawOptions,
  shapesOverride?: readonly Shape[],
): void {
  const image = options.images?.[slot];
  if (image !== undefined && !shapesOverride) {
    ctx.drawImage(image, x, y, size, size);
    return;
  }
  const shapes = shapesOverride ?? FALLBACKS[slot].shapes;
  drawShapes(ctx, shapes, x, y, size, roleColors(options.theme));
}

function sceneryShapes(kind: SceneryKind): { slot: SlotId | null; shapes?: readonly Shape[] } {
  if (kind === "rock") return { slot: null, shapes: ROCK_SHAPES };
  return { slot: kind };
}

export function drawScenery(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  for (const [index, kind] of view.scenery) {
    const x = index % view.board.width;
    const y = Math.floor(index / view.board.width);
    const { px, py } = cellOrigin(geom, x, y);
    const entry = sceneryShapes(kind);
    const size = geom.cell * 1.02;
    if (entry.slot) drawSprite(ctx, entry.slot, px, py, size, options);
    else drawShapes(ctx, entry.shapes ?? [], px, py, size, roleColors(options.theme));
  }
}

function drawWindowLights(ctx: Draw2D, px: number, py: number, size: number, color: string): void {
  ctx.fillStyle = color;
  for (const [fx, fy] of [
    [0.32, 0.6],
    [0.64, 0.6],
  ] as const) {
    ctx.beginPath();
    ctx.arc(px + size * fx, py + size * fy, Math.max(1.5, size * 0.07), 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawHouses(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  for (const [index, kind] of view.houseKinds) {
    const x = index % view.board.width;
    const y = Math.floor(index / view.board.width);
    const { px, py } = cellOrigin(geom, x, y);
    const slot = HOUSE_SLOT[kind] ?? "house-cottage";
    drawSprite(ctx, slot, px, py, geom.cell * 1.02, options);
    if (options.theme.windowLight)
      drawWindowLights(ctx, px, py, geom.cell, options.theme.windowLight);
  }
}

const ARROW_ANGLE: Readonly<Record<Direction, number>> = {
  N: 0,
  E: Math.PI / 2,
  S: Math.PI,
  W: -Math.PI / 2,
};

export function drawPumpArrow(
  ctx: Draw2D,
  px: number,
  py: number,
  size: number,
  dir: Direction,
  options: DrawOptions,
): void {
  ctx.save();
  ctx.translate(px + size / 2, py + size / 2);
  ctx.rotate(ARROW_ANGLE[dir]);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.46);
  ctx.lineTo(size * 0.22, -size * 0.12);
  ctx.lineTo(size * 0.08, -size * 0.12);
  ctx.lineTo(size * 0.08, size * 0.04);
  ctx.lineTo(-size * 0.08, size * 0.04);
  ctx.lineTo(-size * 0.08, -size * 0.12);
  ctx.lineTo(-size * 0.22, -size * 0.12);
  ctx.closePath();
  ctx.fillStyle = PALETTE.paper;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = Math.max(1.5, size * 0.05) * lineScale(options);
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

export function gateIsOpen(piece: Placement, weeks: number, week: number | null): boolean {
  if (week === null) return true;
  return week >= (piece.opensWeek ?? 0) && week < (piece.closesWeek ?? weeks);
}

export function drawGateState(
  ctx: Draw2D,
  px: number,
  py: number,
  size: number,
  open: boolean,
  options: DrawOptions,
): void {
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = Math.max(2, size * 0.1) * lineScale(options);
  ctx.lineCap = "round";
  ctx.beginPath();
  if (open) {
    ctx.moveTo(px + size * 0.3, py + size * 0.18);
    ctx.lineTo(px + size * 0.3, py + size * 0.82);
    ctx.moveTo(px + size * 0.7, py + size * 0.18);
    ctx.lineTo(px + size * 0.7, py + size * 0.82);
  } else {
    ctx.moveTo(px + size * 0.2, py + size * 0.5);
    ctx.lineTo(px + size * 0.8, py + size * 0.5);
    ctx.moveTo(px + size * 0.2, py + size * 0.3);
    ctx.lineTo(px + size * 0.8, py + size * 0.3);
    ctx.moveTo(px + size * 0.2, py + size * 0.7);
    ctx.lineTo(px + size * 0.8, py + size * 0.7);
  }
  ctx.stroke();
}

export function drawPlacedPiece(
  ctx: Draw2D,
  piece: Placement,
  weeks: number,
  week: number | null,
  geom: Geometry,
  options: DrawOptions,
): void {
  if (piece.kind === "canal") return;
  const { px, py } = cellOrigin(geom, piece.x, piece.y);
  const slot = PIECE_SLOT[piece.kind];
  if (slot) drawSprite(ctx, slot, px, py, geom.cell, options);
  if (piece.kind === "pump" && piece.dir) drawPumpArrow(ctx, px, py, geom.cell, piece.dir, options);
  if (piece.kind === "gate")
    drawGateState(ctx, px, py, geom.cell, gateIsOpen(piece, weeks, week), options);
}

export function drawPieces(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  for (const piece of view.placements) {
    drawPlacedPiece(ctx, piece, view.def.weeks, view.week, geom, options);
  }
}
