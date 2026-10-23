import type { GlyphKind } from "@web-games/lost-parcel-desk-core";
import type { PaletteToken } from "../theme/tokens";

export type Shape =
  | { k: "rect"; x: number; y: number; w: number; h: number; r?: number; c: PaletteToken }
  | { k: "circle"; x: number; y: number; r: number; c: PaletteToken }
  | { k: "ellipse"; x: number; y: number; rx: number; ry: number; c: PaletteToken }
  | { k: "poly"; pts: string; c: PaletteToken }
  | { k: "path"; d: string; c: PaletteToken }
  | { k: "line"; d: string; c: PaletteToken; sw: number };

const rect = (x: number, y: number, w: number, h: number, c: PaletteToken, r = 0): Shape => ({
  k: "rect",
  x,
  y,
  w,
  h,
  r,
  c,
});
const circle = (x: number, y: number, r: number, c: PaletteToken): Shape => ({
  k: "circle",
  x,
  y,
  r,
  c,
});
const ellipse = (x: number, y: number, rx: number, ry: number, c: PaletteToken): Shape => ({
  k: "ellipse",
  x,
  y,
  rx,
  ry,
  c,
});
const poly = (pts: string, c: PaletteToken): Shape => ({ k: "poly", pts, c });
const path = (d: string, c: PaletteToken): Shape => ({ k: "path", d, c });
const line = (d: string, c: PaletteToken, sw = 3): Shape => ({ k: "line", d, c, sw });

export interface GlyphDrawing {
  /** Colour of the offset second layer that imitates riso misregistration. */
  offset: PaletteToken;
  shapes: readonly Shape[];
}

export const GLYPH_DRAWINGS: Readonly<Record<GlyphKind, GlyphDrawing>> = {
  tin: {
    offset: "tealLight",
    shapes: [
      rect(24, 30, 52, 46, "mustard", 4),
      rect(20, 22, 60, 12, "mustardDeep", 3),
      rect(24, 46, 52, 14, "cream", 0),
      line("M32 53 H68", "ink", 2.5),
      line("M24 70 H76", "mustardDeep", 2),
    ],
  },
  cloth: {
    offset: "mustardLight",
    shapes: [
      poly("14,30 70,22 88,44 84,78 24,82 12,56", "cream2"),
      line("M20 40 L80 34", "teal", 3),
      line("M18 54 L84 50", "teal", 3),
      line("M22 68 L82 64", "teal", 3),
      poly("70,22 88,44 72,42", "line"),
    ],
  },
  paper: {
    offset: "mustardLight",
    shapes: [
      poly("22,14 66,14 80,28 80,86 22,86", "cream"),
      poly("66,14 80,28 66,28", "line"),
      line("M30 40 H72", "ink", 2),
      line("M30 52 H72", "ink", 2),
      line("M30 64 H60", "ink", 2),
    ],
  },
  card: {
    offset: "mustard",
    shapes: [
      rect(12, 26, 76, 48, "tealLight", 4),
      rect(66, 32, 16, 18, "brick", 2),
      line("M20 44 H54", "ink", 2.5),
      line("M20 56 H58", "ink", 2.5),
      line("M20 66 H46", "ink", 2.5),
    ],
  },
  key: {
    offset: "brick",
    shapes: [
      circle(30, 42, 18, "mustard"),
      circle(30, 42, 7, "cream"),
      rect(44, 38, 44, 9, "mustard", 3),
      rect(72, 46, 7, 14, "mustard", 1),
      rect(82, 46, 6, 10, "mustard", 1),
    ],
  },
  glove: {
    offset: "tealLight",
    shapes: [
      rect(30, 50, 40, 36, "line", 8),
      rect(28, 18, 11, 38, "line", 5),
      rect(40, 12, 11, 44, "line", 5),
      rect(52, 16, 11, 40, "line", 5),
      rect(64, 24, 10, 34, "line", 5),
      poly("30,64 12,52 18,44 36,56", "line"),
      line("M32 80 H68", "mustardDeep", 3),
    ],
  },
  bag: {
    offset: "mustardLight",
    shapes: [
      path("M30 38 C14 52 12 80 26 86 H74 C88 80 86 52 70 38 Z", "teal"),
      rect(30, 30, 40, 10, "tealDeep", 4),
      line("M30 34 C16 24 22 16 30 22", "brick", 3),
      line("M70 34 C84 24 78 16 70 22", "brick", 3),
      circle(50, 62, 6, "tealLight"),
    ],
  },
  box: {
    offset: "tealLight",
    shapes: [
      rect(16, 40, 68, 44, "cream2", 3),
      rect(12, 30, 76, 16, "mustard", 3),
      rect(44, 30, 12, 54, "brick", 0),
      poly("50,30 38,16 50,22 62,16", "brick"),
    ],
  },
  metal: {
    offset: "tealLight",
    shapes: [
      circle(50, 54, 34, "mustard"),
      circle(50, 54, 26, "cream"),
      poly("50,32 56,54 50,76 44,54", "brick"),
      rect(44, 12, 12, 10, "mustardDeep", 2),
      circle(50, 54, 4, "ink"),
    ],
  },
  wood: {
    offset: "mustardLight",
    shapes: [
      rect(14, 34, 64, 34, "mustardDeep", 6),
      ellipse(78, 51, 10, 17, "mustard"),
      ellipse(78, 51, 5, 9, "mustardDeep"),
      line("M22 44 H64", "line", 2.5),
      line("M22 58 H58", "line", 2.5),
    ],
  },
  lens: {
    offset: "brick",
    shapes: [
      circle(42, 42, 28, "ink"),
      circle(42, 42, 22, "tealLight"),
      line("M32 34 C36 28 44 26 50 30", "cream", 3),
      path("M62 62 L86 86 L80 92 L56 68 Z", "ink"),
    ],
  },
  lamp: {
    offset: "tealLight",
    shapes: [
      rect(34, 14, 32, 10, "ink", 3),
      poly("30,28 70,28 76,76 24,76", "mustardLight"),
      rect(26, 76, 48, 12, "ink", 3),
      line("M50 30 V74", "mustardDeep", 2.5),
      line("M36 14 C38 4 62 4 64 14", "ink", 3),
    ],
  },
  ticket: {
    offset: "mustard",
    shapes: [
      path("M10 30 H90 V44 A6 6 0 0 0 90 56 V70 H10 V56 A6 6 0 0 0 10 44 Z", "brick"),
      line("M66 32 V68", "cream", 2.5),
      line("M20 46 H54", "cream", 3),
      line("M20 58 H46", "cream", 3),
    ],
  },
  hat: {
    offset: "tealLight",
    shapes: [
      ellipse(50, 66, 42, 12, "ink"),
      path("M26 66 C26 28 74 28 74 66 Z", "ink"),
      rect(26, 52, 48, 8, "brick", 0),
      line("M30 42 C38 34 50 33 60 36", "line", 2.5),
    ],
  },
};
