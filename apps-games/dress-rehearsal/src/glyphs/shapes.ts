import type { Category } from "@web-games/dress-rehearsal-core";

export type PaintRole = "main" | "shade" | "light" | "ink" | "paper" | "none";

export interface PathShape {
  readonly kind: "path";
  readonly d: string;
  readonly fill: PaintRole;
  readonly stroke?: PaintRole;
  readonly sw?: number;
}

export interface CircleShape {
  readonly kind: "circle";
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly fill: PaintRole;
  readonly stroke?: PaintRole;
  readonly sw?: number;
}

export type GlyphShape = PathShape | CircleShape;

const path = (d: string, fill: PaintRole, stroke?: PaintRole, sw?: number): PathShape => ({
  kind: "path",
  d,
  fill,
  ...(stroke === undefined ? {} : { stroke }),
  ...(sw === undefined ? {} : { sw }),
});

const circle = (
  cx: number,
  cy: number,
  r: number,
  fill: PaintRole,
  stroke?: PaintRole,
  sw?: number,
): CircleShape => ({
  kind: "circle",
  cx,
  cy,
  r,
  fill,
  ...(stroke === undefined ? {} : { stroke }),
  ...(sw === undefined ? {} : { sw }),
});

/**
 * One drawing per category in a 100 x 100 box, straight from above. Bounding boxes follow the
 * scale rules in `assets-index.md` and stay inside the 85 percent safe area.
 */
export const GLYPH_SHAPES: Readonly<Record<Category, readonly GlyphShape[]>> = {
  top: [
    path(
      "M 36 15 Q 50 26 64 15 L 90 30 L 80 48 L 70 42 L 70 85 L 30 85 L 30 42 L 20 48 L 10 30 Z",
      "main",
      "ink",
    ),
    path("M 36 15 Q 50 26 64 15 Q 50 21 36 15 Z", "shade", "ink", 2),
    path("M 30 42 L 70 42", "none", "shade", 2),
  ],
  bottom: [
    path("M 24 6 L 76 6 L 78 94 L 55 94 L 50 36 L 45 94 L 22 94 Z", "main", "ink"),
    path("M 24 6 L 76 6 L 76 15 L 24 15 Z", "shade", "ink", 2),
    path("M 50 15 L 50 36", "none", "ink", 2),
  ],
  dress: [
    path("M 38 4 L 44 4 Q 50 14 56 4 L 62 4 L 66 38 L 81 96 L 19 96 L 34 38 Z", "main", "ink"),
    path("M 34 38 L 66 38 L 67 45 L 33 45 Z", "shade", "ink", 2),
    path("M 44 4 Q 50 14 56 4", "none", "ink", 2),
  ],
  outer: [
    path("M 32 14 L 8 34 L 12 88 L 27 88 L 26 40 Z", "main", "ink"),
    path("M 68 14 L 92 34 L 88 88 L 73 88 L 74 40 Z", "main", "ink"),
    path("M 32 14 L 50 26 L 68 14 L 74 90 L 26 90 Z", "main", "ink"),
    path("M 32 14 L 50 26 L 42 34 L 28 22 Z", "shade", "ink", 2),
    path("M 68 14 L 50 26 L 58 34 L 72 22 Z", "shade", "ink", 2),
    path("M 50 26 L 50 90", "none", "ink", 2),
    circle(45, 52, 2, "light", "ink", 1.5),
    circle(45, 68, 2, "light", "ink", 1.5),
  ],
  shoes: [
    path("M 12 80 L 12 46 Q 12 21 26 20 Q 40 21 40 46 L 40 80 Z", "main", "ink"),
    path("M 60 80 L 60 46 Q 60 21 74 20 Q 88 21 88 46 L 88 80 Z", "main", "ink"),
    path("M 12 72 L 40 72 L 40 80 L 12 80 Z", "shade", "ink", 2),
    path("M 60 72 L 88 72 L 88 80 L 60 80 Z", "shade", "ink", 2),
    path("M 19 46 Q 26 38 33 46 Q 26 54 19 46 Z", "light", "ink", 2),
    path("M 67 46 Q 74 38 81 46 Q 74 54 67 46 Z", "light", "ink", 2),
  ],
  bag: [
    path("M 34 40 Q 34 19 50 19 Q 66 19 66 40", "none", "ink", 3.5),
    path(
      "M 24 40 L 76 40 Q 80 40 80 44 L 80 77 Q 80 81 76 81 L 24 81 Q 20 81 20 77 L 20 44 Q 20 40 24 40 Z",
      "main",
      "ink",
    ),
    path("M 20 44 L 80 44 L 80 56 Q 50 67 20 56 Z", "shade", "ink", 2),
    circle(50, 59, 3.5, "light", "ink", 2),
  ],
  hat: [
    path("M 11 62 Q 50 48 89 62 Q 89 79 50 81 Q 11 79 11 62 Z", "main", "ink"),
    path("M 30 62 Q 30 22 50 20 Q 70 22 70 62 Q 50 70 30 62 Z", "main", "ink"),
    path("M 30 55 Q 50 63 70 55 L 70 62 Q 50 70 30 62 Z", "shade", "ink", 2),
  ],
  accessory: [
    path(
      "M 26 30 Q 26 74 50 74 Q 74 74 74 30 L 64 30 Q 64 62 50 62 Q 36 62 36 30 Z",
      "main",
      "ink",
    ),
    circle(50, 74, 6, "light", "ink", 2.5),
    circle(31, 52, 3.5, "light", "ink", 1.5),
    circle(69, 52, 3.5, "light", "ink", 1.5),
    circle(30, 38, 3.5, "light", "ink", 1.5),
    circle(70, 38, 3.5, "light", "ink", 1.5),
  ],
};

export const DEFAULT_STROKE_WIDTH = 2.5;

export const GLYPH_BOUNDS: Readonly<
  Record<
    Category,
    { readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number }
  >
> = {
  top: { x0: 10, y0: 15, x1: 90, y1: 85 },
  bottom: { x0: 22, y0: 6, x1: 78, y1: 94 },
  dress: { x0: 19, y0: 4, x1: 81, y1: 96 },
  outer: { x0: 8, y0: 14, x1: 92, y1: 90 },
  shoes: { x0: 12, y0: 20, x1: 88, y1: 80 },
  bag: { x0: 20, y0: 19, x1: 80, y1: 81 },
  hat: { x0: 11, y0: 20, x1: 89, y1: 81 },
  accessory: { x0: 24, y0: 30, x1: 76, y1: 80 },
};
