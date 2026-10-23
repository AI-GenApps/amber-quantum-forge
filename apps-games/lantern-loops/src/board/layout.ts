export const CELL_FLOOR = 36;
export const CELL_CAP = 72;
export const BOARD_PAD = 16;
export const HUD_HEIGHT = 300;
/** Side length of one cell in the SVG coordinate system. */
export const UNIT = 100;

export interface BoardLayout {
  /** Cell size in css pixels, never below the floor. */
  cell: number;
  /** Board side in css pixels. */
  side: number;
  /** False when the viewport is too small for the floor and the board overflows. */
  fits: boolean;
}

/**
 * Cell size for an n by n board: as large as the viewport allows (width minus padding, height
 * minus the HUD), capped, with a floor of 36 css pixels.
 */
export function layoutBoard(viewportW: number, viewportH: number, n: number): BoardLayout {
  const count = Math.max(1, Math.floor(n));
  const byWidth = (viewportW - BOARD_PAD) / count;
  const byHeight = (viewportH - HUD_HEIGHT) / count;
  const raw = Math.floor(Math.min(byWidth, byHeight, CELL_CAP));
  const cell = Math.max(CELL_FLOOR, raw);
  return { cell, side: cell * count, fits: raw >= CELL_FLOOR && cell * count <= viewportW };
}

/** Cell index under a point given the board rectangle, or -1 outside it. */
export function cellAtPoint(
  rect: { left: number; top: number; width: number; height: number },
  size: number,
  clientX: number,
  clientY: number,
): number {
  if (rect.width <= 0 || rect.height <= 0) return -1;
  const col = Math.floor(((clientX - rect.left) / rect.width) * size);
  const row = Math.floor(((clientY - rect.top) / rect.height) * size);
  if (col < 0 || row < 0 || col >= size || row >= size) return -1;
  return row * size + col;
}

/** Cells to insert so that consecutive cells of a pointer path are always orthogonal neighbours. */
export function connectCells(size: number, from: number, to: number): number[] {
  const out: number[] = [];
  let row = Math.floor(from / size);
  let col = from % size;
  const toRow = Math.floor(to / size);
  const toCol = to % size;
  while (row !== toRow || col !== toCol) {
    if (Math.abs(toCol - col) >= Math.abs(toRow - row)) col += Math.sign(toCol - col);
    else row += Math.sign(toRow - row);
    out.push(row * size + col);
  }
  return out;
}
