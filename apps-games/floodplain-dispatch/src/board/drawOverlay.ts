import type { Placement } from "@web-games/floodplain-dispatch-core";
import { PALETTE } from "../theme/tokens";
import type { Draw2D } from "./Draw2D";
import { type DrawOptions, lineScale } from "./draw";
import { drawPlacedPiece } from "./drawPieces";
import { type CellPos, cellOrigin, type Geometry } from "./geometry";
import type { Badge, BadgeKind, BoardView } from "./model";

export const BADGE_FILL: Readonly<Record<BadgeKind, string>> = {
  supplied: PALETTE.meadowDeep,
  irrigated: PALETTE.waterDeep,
  flooded: PALETTE.clay,
  dry: PALETTE.ochreDeep,
};

function drawGlyph(ctx: Draw2D, kind: BadgeKind, cx: number, cy: number, r: number): void {
  ctx.strokeStyle = PALETTE.paper;
  ctx.fillStyle = PALETTE.paper;
  ctx.lineWidth = Math.max(1.5, r * 0.28);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === "supplied") {
    ctx.moveTo(cx - r * 0.5, cy);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.4);
    ctx.lineTo(cx + r * 0.55, cy - r * 0.4);
    ctx.stroke();
  } else if (kind === "irrigated") {
    ctx.moveTo(cx, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.45, cy + r * 0.2);
    ctx.arc(cx, cy + r * 0.2, r * 0.45, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "flooded") {
    ctx.moveTo(cx - r * 0.6, cy - r * 0.15);
    ctx.lineTo(cx - r * 0.2, cy - r * 0.45);
    ctx.lineTo(cx + r * 0.2, cy - r * 0.15);
    ctx.lineTo(cx + r * 0.6, cy - r * 0.45);
    ctx.moveTo(cx - r * 0.6, cy + r * 0.35);
    ctx.lineTo(cx - r * 0.2, cy + r * 0.05);
    ctx.lineTo(cx + r * 0.2, cy + r * 0.35);
    ctx.lineTo(cx + r * 0.6, cy + r * 0.05);
    ctx.stroke();
  } else {
    ctx.moveTo(cx - r * 0.45, cy - r * 0.45);
    ctx.lineTo(cx + r * 0.45, cy + r * 0.45);
    ctx.moveTo(cx + r * 0.45, cy - r * 0.45);
    ctx.lineTo(cx - r * 0.45, cy + r * 0.45);
    ctx.stroke();
  }
}

export function drawBadge(ctx: Draw2D, badge: Badge, geom: Geometry, options: DrawOptions): void {
  const { px, py } = cellOrigin(geom, badge.x, badge.y);
  const r = Math.max(6, geom.cell * 0.26);
  const cx = px + geom.cell - r * 0.7;
  const cy = py + r * 0.7;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.ink;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = BADGE_FILL[badge.kind];
  ctx.fill();
  ctx.strokeStyle = PALETTE.paper;
  ctx.lineWidth = 1.5 * lineScale(options);
  ctx.stroke();
  drawGlyph(ctx, badge.kind, cx, cy, r);
}

export function drawBadges(
  ctx: Draw2D,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  for (const badge of view.badges) drawBadge(ctx, badge, geom, options);
}

export function drawGhost(
  ctx: Draw2D,
  ghost: Placement | null,
  view: BoardView,
  geom: Geometry,
  options: DrawOptions,
): void {
  if (!ghost) return;
  const { px, py } = cellOrigin(geom, ghost.x, ghost.y);
  ctx.globalAlpha = 0.55;
  if (ghost.kind === "canal") {
    ctx.fillStyle = PALETTE.waterLight;
    ctx.fillRect(px + geom.cell * 0.2, py + geom.cell * 0.2, geom.cell * 0.6, geom.cell * 0.6);
  } else {
    drawPlacedPiece(ctx, ghost, view.def.weeks, null, geom, options);
  }
  ctx.globalAlpha = 1;
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = PALETTE.paper;
  ctx.lineWidth = 2 * lineScale(options);
  ctx.strokeRect(px + 1, py + 1, geom.cell - 2, geom.cell - 2);
  ctx.setLineDash([]);
}

export function drawSelection(
  ctx: Draw2D,
  selected: CellPos | null,
  geom: Geometry,
  options: DrawOptions,
): void {
  if (!selected) return;
  const { px, py } = cellOrigin(geom, selected.x, selected.y);
  ctx.setLineDash([5, 3]);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4 * lineScale(options);
  ctx.strokeRect(px + 1, py + 1, geom.cell - 2, geom.cell - 2);
  ctx.strokeStyle = PALETTE.paper;
  ctx.lineWidth = 2 * lineScale(options);
  ctx.strokeRect(px + 1, py + 1, geom.cell - 2, geom.cell - 2);
  ctx.setLineDash([]);
}

export function drawCursor(
  ctx: Draw2D,
  cursor: CellPos | null,
  geom: Geometry,
  options: DrawOptions,
): void {
  if (!cursor) return;
  const { px, py } = cellOrigin(geom, cursor.x, cursor.y);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 5 * lineScale(options);
  ctx.strokeRect(px + 2, py + 2, geom.cell - 4, geom.cell - 4);
  ctx.strokeStyle = PALETTE.paper;
  ctx.lineWidth = 2.5 * lineScale(options);
  ctx.strokeRect(px + 2, py + 2, geom.cell - 4, geom.cell - 4);
}
