export const ZOOM_STEPS = [1, 1.5, 2] as const;
export type ZoomStep = 0 | 1 | 2;

export const BOARD_PAD = 6 as const;
export const MIN_CELL = 8 as const;
export const FALLBACK_VIEWPORT: Viewport = { width: 320, height: 420 };

export interface Viewport {
  width: number;
  height: number;
}

export interface Pan {
  x: number;
  y: number;
}

export interface Geometry {
  cols: number;
  rows: number;
  cell: number;
  fitCell: number;
  originX: number;
  originY: number;
  viewport: Viewport;
  zoomStep: ZoomStep;
  pan: Pan;
}

export interface CellPos {
  x: number;
  y: number;
}

const clamp = (value: number, lo: number, hi: number): number => Math.min(Math.max(value, lo), hi);

export function fitCellSize(cols: number, rows: number, viewport: Viewport): number {
  const w = Math.max(1, viewport.width - BOARD_PAD * 2);
  const h = Math.max(1, viewport.height - BOARD_PAD * 2);
  return Math.max(MIN_CELL, Math.floor(Math.min(w / cols, h / rows)));
}

function axisOrigin(content: number, view: number, pan: number): number {
  if (content <= view) return (view - content) / 2;
  const centred = (view - content) / 2;
  return clamp(centred + pan, view - content - BOARD_PAD, BOARD_PAD);
}

export function makeGeometry(
  cols: number,
  rows: number,
  viewport: Viewport,
  zoomStep: ZoomStep = 0,
  pan: Pan = { x: 0, y: 0 },
): Geometry {
  const fitCell = fitCellSize(cols, rows, viewport);
  const cell = Math.round(fitCell * (ZOOM_STEPS[zoomStep] as number));
  return {
    cols,
    rows,
    cell,
    fitCell,
    originX: axisOrigin(cols * cell, viewport.width, pan.x),
    originY: axisOrigin(rows * cell, viewport.height, pan.y),
    viewport,
    zoomStep,
    pan,
  };
}

export function cellAt(geom: Geometry, px: number, py: number): CellPos | null {
  const x = Math.floor((px - geom.originX) / geom.cell);
  const y = Math.floor((py - geom.originY) / geom.cell);
  if (px < geom.originX || py < geom.originY) return null;
  if (x < 0 || y < 0 || x >= geom.cols || y >= geom.rows) return null;
  return { x, y };
}

export function cellCenter(geom: Geometry, x: number, y: number): { px: number; py: number } {
  return {
    px: geom.originX + (x + 0.5) * geom.cell,
    py: geom.originY + (y + 0.5) * geom.cell,
  };
}

export function cellOrigin(geom: Geometry, x: number, y: number): { px: number; py: number } {
  return { px: geom.originX + x * geom.cell, py: geom.originY + y * geom.cell };
}

export function nextZoom(step: ZoomStep): ZoomStep {
  return ((step + 1) % ZOOM_STEPS.length) as ZoomStep;
}

export function zoomLabel(step: ZoomStep): string {
  return step === 0 ? "Fit" : `${ZOOM_STEPS[step]}x`;
}

/** Pan that keeps the cell inside the viewport when zoomed in. */
export function panToReveal(geom: Geometry, x: number, y: number): Pan {
  let { x: panX, y: panY } = geom.pan;
  const { px, py } = cellOrigin(geom, x, y);
  const margin = geom.cell * 0.25;
  if (px < margin) panX += margin - px;
  else if (px + geom.cell > geom.viewport.width - margin) {
    panX -= px + geom.cell - (geom.viewport.width - margin);
  }
  if (py < margin) panY += margin - py;
  else if (py + geom.cell > geom.viewport.height - margin) {
    panY -= py + geom.cell - (geom.viewport.height - margin);
  }
  return { x: panX, y: panY };
}

/** Cells from `from` (exclusive) to `to` (inclusive) joined edge to edge, never diagonally. */
export function linePath(from: CellPos, to: CellPos): CellPos[] {
  const out: CellPos[] = [];
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  if (steps === 0) return [{ x: to.x, y: to.y }];
  let prev = { x: from.x, y: from.y };
  for (let i = 1; i <= steps; i++) {
    const next = {
      x: Math.round(from.x + ((to.x - from.x) * i) / steps),
      y: Math.round(from.y + ((to.y - from.y) * i) / steps),
    };
    if (next.x === prev.x && next.y === prev.y) continue;
    if (next.x !== prev.x && next.y !== prev.y) out.push({ x: next.x, y: prev.y });
    out.push(next);
    prev = next;
  }
  return out;
}
