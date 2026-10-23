import type { Category } from "@web-games/dress-rehearsal-core";
import type { Draw2D } from "../export/Draw2D";
import type { GarmentPaint } from "../theme/garment";
import { parsePath } from "./path";
import { DEFAULT_STROKE_WIDTH, GLYPH_SHAPES, type GlyphShape, type PaintRole } from "./shapes";

export function paintOf(role: PaintRole, paint: GarmentPaint, paperHex: string): string | null {
  switch (role) {
    case "main":
      return paint.main;
    case "shade":
      return paint.shade;
    case "light":
      return paint.light;
    case "ink":
      return paint.ink;
    case "paper":
      return paperHex;
    case "none":
      return null;
  }
}

function tracePath(draw: Draw2D, d: string): void {
  draw.beginPath();
  for (const command of parsePath(d)) {
    const [a = 0, b = 0, c = 0, e = 0, f = 0, g = 0] = command.args;
    switch (command.op) {
      case "M":
        draw.moveTo(a, b);
        break;
      case "L":
        draw.lineTo(a, b);
        break;
      case "Q":
        draw.quadraticCurveTo(a, b, c, e);
        break;
      case "C":
        draw.bezierCurveTo(a, b, c, e, f, g);
        break;
      case "Z":
        draw.closePath();
        break;
    }
  }
}

export function drawShape(
  draw: Draw2D,
  shape: GlyphShape,
  paint: GarmentPaint,
  paperHex: string,
  outline = 1,
): void {
  if (shape.kind === "path") tracePath(draw, shape.d);
  else {
    draw.beginPath();
    draw.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
  }
  const fill = paintOf(shape.fill, paint, paperHex);
  if (fill !== null) {
    draw.fillStyle = fill;
    draw.fill();
  }
  const strokeRole = shape.stroke;
  const stroke = strokeRole === undefined ? null : paintOf(strokeRole, paint, paperHex);
  if (stroke !== null) {
    draw.strokeStyle = stroke;
    draw.lineWidth = (shape.sw ?? DEFAULT_STROKE_WIDTH) * outline;
    draw.lineJoin = "round";
    draw.lineCap = "round";
    draw.stroke();
  }
}

/** Draws a garment into the square `size` at (x, y) on a canvas-like context. */
export function drawGarment(
  draw: Draw2D,
  category: Category,
  paint: GarmentPaint,
  paperHex: string,
  x: number,
  y: number,
  size: number,
  outline = 1,
): void {
  draw.save();
  draw.translate(x, y);
  draw.scale(size / 100, size / 100);
  for (const shape of GLYPH_SHAPES[category]) drawShape(draw, shape, paint, paperHex, outline);
  draw.restore();
}
