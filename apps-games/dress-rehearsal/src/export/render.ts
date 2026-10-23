import { PIECE_BY_ID } from "@web-games/dress-rehearsal-core";
import { layoutFromSlots } from "../board/layout";
import { drawGarment } from "../glyphs/draw";
import { garmentPaint } from "../theme/garment";
import { PALETTE } from "../theme/tokens";
import { type Draw2D, roundRectPath } from "./Draw2D";
import { drawFrameBack, drawFrameFront, frameLayout } from "./frames";
import { bodyFont, displayFont, fitSize } from "./text";
import { EXPORT_SIZE, type ExportInput, type Rect, type Size } from "./types";

const GRAIN_LINES = 46;

function grainSeed(input: ExportInput): number {
  let hash = 17;
  for (const char of `${input.backdropSlot}:${input.title}`) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 2147483647;
  }
  return hash;
}

export function drawSurface(draw: Draw2D, rect: Rect, input: ExportInput): void {
  draw.fillStyle = PALETTE.linen;
  draw.fillRect(rect.x, rect.y, rect.w, rect.h);
  const backdrop = input.images?.[input.backdropSlot];
  if (backdrop !== undefined) {
    draw.drawImage(backdrop, rect.x, rect.y, rect.w, rect.h);
  } else {
    draw.globalAlpha = 0.12;
    draw.fillStyle = input.accent;
    draw.fillRect(rect.x, rect.y, rect.w, rect.h);
    draw.globalAlpha = 1;
  }
  draw.strokeStyle = PALETTE.hairline;
  draw.lineWidth = 1.5;
  draw.globalAlpha = 0.28;
  let state = grainSeed(input);
  draw.beginPath();
  for (let i = 0; i < GRAIN_LINES; i += 1) {
    state = (state * 1103515245 + 12345) % 2147483648;
    const x = rect.x + ((state % 1000) / 1000) * (rect.w - 120);
    state = (state * 1103515245 + 12345) % 2147483648;
    const y = rect.y + ((state % 1000) / 1000) * rect.h;
    draw.moveTo(x, y);
    draw.lineTo(x + 70 + (state % 50), y);
  }
  draw.stroke();
  draw.globalAlpha = 1;
}

function drawSlots(draw: Draw2D, rect: Rect, input: ExportInput): void {
  const layout = layoutFromSlots(input.slots);
  const pad = 40;
  const gap = 24;
  const cellW = Math.min(
    (rect.w - pad * 2 - gap * 2) / 3,
    (rect.h - pad * 2 - gap * (layout.rows - 1)) / layout.rows,
  );
  const gridW = cellW * 3 + gap * 2;
  const gridH = cellW * layout.rows + gap * (layout.rows - 1);
  const originX = rect.x + (rect.w - gridW) / 2;
  const originY = rect.y + (rect.h - gridH) / 2;
  for (const cell of layout.cells) {
    const x = originX + (cell.col - 1) * (cellW + gap);
    const y = originY + (cell.row - 1) * (cellW + gap);
    const h = cellW * cell.rowSpan + gap * (cell.rowSpan - 1);
    const id = input.look[cell.slot];
    const piece = id === undefined ? undefined : PIECE_BY_ID.get(id);
    draw.strokeStyle = PALETTE.hairline;
    draw.lineWidth = 2;
    draw.setLineDash(piece ? [] : [12, 10]);
    roundRectPath(draw, x, y, cellW, h, 16);
    draw.stroke();
    draw.setLineDash([]);
    if (!piece) continue;
    const art = Math.min(cellW, h - 44) * 0.92;
    const artX = x + (cellW - art) / 2;
    const artY = y + (h - 44 - art) / 2 + 6;
    const image = input.images?.[piece.id];
    if (image !== undefined) draw.drawImage(image, artX, artY, art, art);
    else
      drawGarment(draw, piece.category, garmentPaint(piece.colour), PALETTE.paper, artX, artY, art);
    draw.fillStyle = PALETTE.ink;
    draw.textAlign = "center";
    draw.textBaseline = "middle";
    draw.font = bodyFont(fitSize(piece.name.length, 24, cellW - 16, 16), 600);
    draw.fillText(piece.name, x + cellW / 2, y + h - 22);
  }
}

export function drawStar(
  draw: Draw2D,
  cx: number,
  cy: number,
  radius: number,
  filled: boolean,
): void {
  draw.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) draw.moveTo(px, py);
    else draw.lineTo(px, py);
  }
  draw.closePath();
  if (filled) {
    draw.fillStyle = PALETTE.star;
    draw.fill();
  }
  draw.strokeStyle = PALETTE.ink;
  draw.lineWidth = 3;
  draw.lineJoin = "round";
  draw.stroke();
}

function drawFooter(draw: Draw2D, rect: Rect, input: ExportInput, size: Size): void {
  const cx = rect.x + rect.w / 2;
  const at = (fraction: number): number => rect.y + rect.h * fraction;
  draw.textAlign = "center";
  draw.textBaseline = "middle";
  draw.fillStyle = PALETTE.ink;
  draw.font = displayFont(fitSize(input.title.length, 44, rect.w - 40, 26), 700);
  draw.fillText(input.title, cx, at(0.18));
  draw.fillStyle = PALETTE.inkSoft;
  draw.font = bodyFont(28, 500);
  draw.fillText(input.subtitle, cx, at(0.38));
  const styled = input.clientName ? `Styled for ${input.clientName}  -  ` : "";
  draw.fillText(`${styled}Harmony ${input.harmony}`, cx, at(0.56));
  for (let i = 0; i < 3; i += 1) drawStar(draw, cx + (i - 1) * 56, at(0.78), 18, i < input.stars);
  if (input.frame !== "magazine") {
    draw.fillStyle = input.accent;
    draw.font = displayFont(22, 600);
    draw.fillText(input.gameTitle, cx, Math.min(at(0.95), size.height - 22));
  }
}

/** Draws the whole export image onto a canvas-like context; pure apart from the context calls. */
export function renderBoard(draw: Draw2D, input: ExportInput, size: Size = EXPORT_SIZE): void {
  const layout = frameLayout(input.frame, size);
  draw.save();
  drawFrameBack(draw, input.frame, size, input);
  drawSurface(draw, layout.board, input);
  drawSlots(draw, layout.board, input);
  drawFrameFront(draw, input.frame, size);
  drawFooter(draw, layout.footer, input, size);
  draw.restore();
}
