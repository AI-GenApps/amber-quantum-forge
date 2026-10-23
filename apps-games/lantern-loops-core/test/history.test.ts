import { describe, expect, it } from "vitest";
import { type Tiles, withTile } from "../src/board";
import { createHistory, MAX_HISTORY_STEPS } from "../src/history";

const blank = (): Tiles => new Uint8Array(25);

describe("history", () => {
  it("undoes and redoes in order", () => {
    const h = createHistory(blank());
    const a = withTile(blank(), 0, 10);
    const b = withTile(a, 1, 5);
    const c = withTile(b, 2, 3);
    expect([h.push(a), h.push(b), h.push(c)]).toEqual([true, true, true]);
    expect(h.steps()).toBe(3);
    expect(h.undo()).toEqual(b);
    expect(h.undo()).toEqual(a);
    expect(h.undo()).toEqual(blank());
    expect(h.undo()).toBeNull();
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(true);
    expect(h.redo()).toEqual(a);
    expect(h.redo()).toEqual(b);
    expect(h.redo()).toEqual(c);
    expect(h.redo()).toBeNull();
    expect(h.current()).toEqual(c);
  });

  it("groups one drag into a single step", () => {
    const h = createHistory(blank());
    h.beginGroup();
    let tiles = blank();
    for (let i = 0; i < 6; i++) {
      tiles = withTile(tiles, i, 10);
      expect(h.push(tiles)).toBe(true);
    }
    h.endGroup();
    expect(h.steps()).toBe(1);
    expect(h.current()).toEqual(tiles);
    expect(h.undo()).toEqual(blank());
    expect(h.redo()).toEqual(tiles);
    h.push(withTile(tiles, 20, 5));
    expect(h.steps()).toBe(2);
  });

  it("drops a group that ends where it began", () => {
    const h = createHistory(blank());
    h.beginGroup();
    h.push(withTile(blank(), 3, 10));
    h.push(blank());
    h.endGroup();
    expect(h.steps()).toBe(0);
    expect(h.canUndo()).toBe(false);
  });

  it("clears redo after a new edit", () => {
    const h = createHistory(blank());
    const a = withTile(blank(), 0, 10);
    h.push(a);
    h.push(withTile(a, 1, 10));
    h.undo();
    expect(h.canRedo()).toBe(true);
    h.push(withTile(a, 7, 5));
    expect(h.canRedo()).toBe(false);
    expect(h.redo()).toBeNull();
    expect(h.steps()).toBe(2);
  });

  it("does not record no-op edits", () => {
    const h = createHistory(blank());
    expect(h.push(blank())).toBe(false);
    const a = withTile(blank(), 4, 10);
    expect(h.push(a)).toBe(true);
    expect(h.push(a.slice())).toBe(false);
    expect(h.steps()).toBe(1);
  });

  it("caps the history at 2,000 steps and drops the oldest", () => {
    const h = createHistory(blank());
    expect(MAX_HISTORY_STEPS).toBe(2000);
    for (let i = 1; i <= 2100; i++) {
      const tiles = blank();
      tiles[0] = i % 2 === 0 ? 10 : 5;
      tiles[1] = (i >> 1) % 7;
      tiles[2] = i % 13;
      tiles[3] = i % 11;
      tiles[4] = (i >> 3) & 3;
      tiles[5] = i & 3;
      tiles[6] = (i >> 8) & 15;
      h.push(tiles);
    }
    expect(h.steps()).toBe(2000);
    let undone = 0;
    while (h.undo()) undone += 1;
    expect(undone).toBe(2000);
    expect(h.canUndo()).toBe(false);
    expect(h.current()).not.toEqual(blank());
  });

  it("returns copies so callers cannot corrupt the stack", () => {
    const h = createHistory(blank());
    h.push(withTile(blank(), 0, 10));
    const view = h.current();
    view[0] = 99;
    expect(h.current()[0]).toBe(10);
  });

  it("resets to a new initial board", () => {
    const h = createHistory(blank());
    h.push(withTile(blank(), 0, 10));
    h.reset(withTile(blank(), 9, 5));
    expect(h.steps()).toBe(0);
    expect(h.canRedo()).toBe(false);
    expect(h.current()[9]).toBe(5);
  });
});
