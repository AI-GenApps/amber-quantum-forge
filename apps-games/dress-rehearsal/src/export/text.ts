import { FONT_BODY, FONT_DISPLAY } from "../theme/tokens";

export function displayFont(size: number, weight = 700): string {
  return `${weight} ${Math.round(size)}px ${FONT_DISPLAY}`;
}

export function bodyFont(size: number, weight = 500): string {
  return `${weight} ${Math.round(size)}px ${FONT_BODY}`;
}

/** Shrinks a font size so a line of `length` characters fits `maxWidth` (average glyph 0.52 em). */
export function fitSize(length: number, base: number, maxWidth: number, floor = 22): number {
  if (length <= 0) return base;
  return Math.max(floor, Math.min(base, Math.floor(maxWidth / (length * 0.52))));
}
