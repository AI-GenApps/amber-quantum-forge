import { type Draw2D, roundRectPath } from "../board/Draw2D";
import type { RoleColors, Shape } from "./shapes";

function paint(ctx: Draw2D, shape: Shape, colors: RoleColors, scale: number): void {
  ctx.globalAlpha = shape.a ?? 1;
  if (shape.fill) {
    ctx.fillStyle = colors[shape.fill];
    ctx.fill();
  }
  if (shape.stroke) {
    ctx.strokeStyle = colors[shape.stroke];
    ctx.lineWidth = Math.max(1, (shape.sw ?? 2.5) * scale);
    ctx.lineJoin = "round";
    ctx.stroke();
  }
}

export function drawShapes(
  ctx: Draw2D,
  shapes: readonly Shape[],
  x: number,
  y: number,
  size: number,
  colors: RoleColors,
): void {
  const scale = size / 100;
  ctx.save();
  ctx.translate(x, y);
  for (const shape of shapes) {
    ctx.beginPath();
    if (shape.k === "rect") {
      if (shape.r)
        roundRectPath(
          ctx,
          shape.x * scale,
          shape.y * scale,
          shape.w * scale,
          shape.h * scale,
          shape.r * scale,
        );
      else ctx.rect(shape.x * scale, shape.y * scale, shape.w * scale, shape.h * scale);
    } else if (shape.k === "circle") {
      ctx.arc(shape.x * scale, shape.y * scale, shape.r * scale, 0, Math.PI * 2);
    } else {
      for (let i = 0; i + 1 < shape.pts.length; i += 2) {
        const px = (shape.pts[i] as number) * scale;
        const py = (shape.pts[i + 1] as number) * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      if (!shape.open) ctx.closePath();
    }
    paint(ctx, shape, colors, scale);
  }
  ctx.restore();
}
