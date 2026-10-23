import { describe, expect, it } from "vitest";
import { interpretKey } from "../src/board/keys";
import { CELL_CAP, CELL_FLOOR, cellAtPoint, connectCells, layoutBoard } from "../src/board/layout";

const VIEWPORTS: ReadonlyArray<[number, number]> = [
  [340, 640],
  [360, 740],
  [390, 844],
];

describe("layoutBoard", () => {
  it("keeps at least 36 px per cell for n = 5..9 on common phones", () => {
    for (const [w, h] of VIEWPORTS) {
      for (let n = 5; n <= 9; n++) {
        const layout = layoutBoard(w, h, n);
        expect(layout.cell, `${w}x${h} n=${n}`).toBeGreaterThanOrEqual(CELL_FLOOR);
        expect(layout.side).toBe(layout.cell * n);
        expect(layout.fits, `${w}x${h} n=${n} fits`).toBe(true);
      }
    }
  });

  it("fits a 9 x 9 board in a 340 px wide viewport", () => {
    const layout = layoutBoard(340, 640, 9);
    expect(layout.side).toBeLessThanOrEqual(340);
    expect(layout.cell).toBe(36);
  });

  it("gives at least 44 px per cell up to 7 x 7 at 390 px wide", () => {
    for (const h of [740, 844]) {
      for (let n = 5; n <= 7; n++) {
        expect(layoutBoard(390, h, n).cell, `n=${n} h=${h}`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  it("caps cells on large screens and floors them on tiny ones", () => {
    expect(layoutBoard(1200, 1200, 5).cell).toBe(CELL_CAP);
    const tiny = layoutBoard(200, 300, 9);
    expect(tiny.cell).toBe(CELL_FLOOR);
    expect(tiny.fits).toBe(false);
  });
});

describe("pointer geometry", () => {
  const rect = { left: 10, top: 20, width: 500, height: 500 };

  it("maps points to cells and rejects points outside", () => {
    expect(cellAtPoint(rect, 5, 11, 21)).toBe(0);
    expect(cellAtPoint(rect, 5, 509, 519)).toBe(24);
    expect(cellAtPoint(rect, 5, 260, 270)).toBe(12);
    expect(cellAtPoint(rect, 5, 9, 100)).toBe(-1);
    expect(cellAtPoint(rect, 5, 100, 521)).toBe(-1);
    expect(cellAtPoint({ ...rect, width: 0 }, 5, 11, 21)).toBe(-1);
  });

  it("connects far apart cells through orthogonal steps", () => {
    expect(connectCells(5, 0, 2)).toEqual([1, 2]);
    const path = [0, ...connectCells(5, 0, 12)];
    for (let k = 1; k < path.length; k++) {
      const a = path[k - 1] as number;
      const b = path[k] as number;
      expect(Math.abs(Math.floor(a / 5) - Math.floor(b / 5)) + Math.abs((a % 5) - (b % 5))).toBe(1);
    }
    expect(path[path.length - 1]).toBe(12);
  });
});

describe("keyboard map", () => {
  it("moves the focus ring inside the board", () => {
    expect(interpretKey("ArrowRight", 0, 5)).toEqual({ type: "move", cell: 1 });
    expect(interpretKey("ArrowLeft", 0, 5)).toEqual({ type: "move", cell: 0 });
    expect(interpretKey("ArrowDown", 22, 5)).toEqual({ type: "move", cell: 22 });
    expect(interpretKey("ArrowDown", 2, 5)).toEqual({ type: "move", cell: 7 });
    expect(interpretKey("ArrowUp", 7, 5)).toEqual({ type: "move", cell: 2 });
  });

  it("maps the documented keys", () => {
    expect(interpretKey(" ", 3, 5)).toEqual({ type: "apply" });
    expect(interpretKey("Enter", 3, 5)).toEqual({ type: "apply" });
    expect(interpretKey("s", 0, 5)).toEqual({ type: "brush", brush: "straight" });
    expect(interpretKey("C", 0, 5)).toEqual({ type: "brush", brush: "corner" });
    expect(interpretKey("e", 0, 5)).toEqual({ type: "brush", brush: "erase" });
    expect(interpretKey("z", 0, 5)).toEqual({ type: "undo" });
    expect(interpretKey("y", 0, 5)).toEqual({ type: "redo" });
    expect(interpretKey("h", 0, 5)).toEqual({ type: "hint" });
    expect(interpretKey("Escape", 0, 5)).toEqual({ type: "pause" });
    expect(interpretKey("q", 0, 5)).toBeNull();
  });
});
