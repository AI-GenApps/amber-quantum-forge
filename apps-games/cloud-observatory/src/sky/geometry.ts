import type { Point } from "@web-games/cloud-observatory-core";

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 1400;
export const MIN_HIT_CSS_PX = 24;
const FALLBACK_WIDTH_PX = 360;

/** Hit radius in map units so that it is at least `minCssPx` CSS pixels at the rendered width. */
export function hitRadiusUnits(renderedWidthPx: number, minCssPx: number = MIN_HIT_CSS_PX): number {
  const width =
    Number.isFinite(renderedWidthPx) && renderedWidthPx > 0 ? renderedWidthPx : FALLBACK_WIDTH_PX;
  return minCssPx / (width / MAP_WIDTH);
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Square viewBox around the stars with padding, used by small static figures. */
export function figureBox(stars: readonly Point[], padding = 70): Box {
  if (stars.length === 0) return { x: 0, y: 0, width: MAP_WIDTH, height: MAP_WIDTH };
  const xs = stars.map((star) => star.x);
  const ys = stars.map((star) => star.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const side = Math.max(maxX - minX, maxY - minY) + padding * 2;
  return {
    x: (minX + maxX) / 2 - side / 2,
    y: (minY + maxY) / 2 - side / 2,
    width: side,
    height: side,
  };
}

export function pathFor(stars: readonly Point[], closed: boolean): string {
  if (stars.length === 0) return "";
  const body = stars.map((star, index) => `${index === 0 ? "M" : "L"}${star.x} ${star.y}`);
  return `${body.join(" ")}${closed && stars.length > 2 ? " Z" : ""}`;
}

/** Deterministic backdrop stars so the sky is stable between renders. */
export function backdropStars(
  count: number,
  seed = 7,
): Array<Point & { r: number; twinkle: boolean }> {
  let state = seed >>> 0;
  const next = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return Array.from({ length: count }, (_, index) => ({
    x: Math.round(next() * MAP_WIDTH),
    y: Math.round(next() * MAP_HEIGHT),
    r: 1.2 + next() * 2.4,
    twinkle: index % 5 === 0,
  }));
}

export interface RectLike {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Map scale (CSS px per map unit) of an svg that fits the map with `meet`. */
export function mapScale(rect: RectLike): number {
  const sx = rect.width / MAP_WIDTH;
  const sy = rect.height / MAP_HEIGHT;
  const scale = rect.height > 0 ? Math.min(sx, sy) : sx;
  return Number.isFinite(scale) && scale > 0 ? scale : FALLBACK_WIDTH_PX / MAP_WIDTH;
}

/** Converts a client-space tap into map units, honouring the letterbox of a `meet` fit. */
export function clientToMap(rect: RectLike, clientX: number, clientY: number): Point {
  const scale = mapScale(rect);
  const offsetX = (rect.width - MAP_WIDTH * scale) / 2;
  const offsetY = rect.height > 0 ? (rect.height - MAP_HEIGHT * scale) / 2 : 0;
  return { x: (clientX - rect.left - offsetX) / scale, y: (clientY - rect.top - offsetY) / scale };
}
