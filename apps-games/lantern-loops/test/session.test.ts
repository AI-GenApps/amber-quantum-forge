import {
  decodePuzzle,
  decodeTiles,
  emptyTiles,
  getPuzzle,
  type Puzzle,
  pickHint,
  type Tiles,
} from "@web-games/lantern-loops-core";
import { describe, expect, it } from "vitest";
import { createSession } from "../src/state/session";

function load(id: string): { puzzle: Puzzle; solution: Tiles } {
  const record = getPuzzle(id);
  if (!record) throw new Error(`missing ${id}`);
  const puzzle = decodePuzzle(record.code, record.id);
  const solution = decodeTiles(record.solution, record.size);
  if (!puzzle.ok || !solution.ok) throw new Error("bad record");
  return { puzzle: puzzle.value, solution: solution.value };
}

describe("session", () => {
  const { puzzle, solution } = load("harbor-01");
  const free = (): number => {
    const state = createSession({ puzzle, solution, brush: "straight" }).state();
    return state.tiles.findIndex(
      (tile, i) =>
        tile === 0 && puzzle.cells[i]?.kind === "open" && puzzle.cells[i]?.fixed === undefined,
    );
  };

  it("starts with only the anchors placed", () => {
    const state = createSession({ puzzle, solution, brush: "straight" }).state();
    expect(state.tiles).toEqual(emptyTiles(puzzle));
    expect(state.solved).toBe(false);
    expect(state.canUndo).toBe(false);
    expect(state.clearable).toBe(0);
  });

  it("cycles taps by brush and records undo steps", () => {
    const session = createSession({ puzzle, solution, brush: "straight" });
    const cell = free();
    session.tap(cell);
    expect(session.state().tiles[cell]).toBe(10);
    session.tap(cell);
    expect(session.state().tiles[cell]).toBe(5);
    session.tap(cell);
    expect(session.state().tiles[cell]).toBe(0);
    session.setBrush("corner");
    session.tap(cell);
    expect(session.state().tiles[cell]).toBe(3);
    expect(session.state().moves).toBe(4);
    expect(session.undo()).toBe(true);
    expect(session.state().tiles[cell]).toBe(0);
    expect(session.redo()).toBe(true);
    expect(session.state().tiles[cell]).toBe(3);
  });

  it("makes one drag a single undo step and previews while dragging", () => {
    const session = createSession({ puzzle, solution, brush: "straight" });
    const a = free();
    session.beginDrag();
    session.updateDrag([a, a + 1]);
    expect(session.state().tiles[a]).toBe(10);
    session.updateDrag([a, a + 1, a + 2]);
    expect(session.endDrag()).toBe(true);
    expect(session.state().moves).toBe(1);
    session.undo();
    expect(session.state().tiles[a]).toBe(0);
    expect(session.state().tiles[a + 1]).toBe(0);
  });

  it("cancels a drag without a trace", () => {
    const session = createSession({ puzzle, solution, brush: "straight" });
    const a = free();
    session.beginDrag();
    session.updateDrag([a, a + 1]);
    session.cancelDrag();
    expect(session.state().tiles[a]).toBe(0);
    expect(session.state().moves).toBe(0);
  });

  it("ignores edits to anchors and hint-locked cells", () => {
    const session = createSession({ puzzle, solution, brush: "straight" });
    const anchor = puzzle.cells.findIndex((cell) => cell.fixed !== undefined);
    if (anchor >= 0) {
      const before = session.state().tiles[anchor];
      expect(session.tap(anchor)).toBe(false);
      expect(session.state().tiles[anchor]).toBe(before);
    }
    const hint = pickHint(puzzle, session.state().tiles, solution, session.state().locked);
    if (!hint) throw new Error("expected a hint");
    session.placeHint(hint);
    expect(session.state().hintCount).toBe(1);
    expect(session.tap(hint.cell)).toBe(false);
    expect(session.erase(hint.cell)).toBe(false);
    expect(session.state().tiles[hint.cell]).toBe(hint.mask);
  });

  it("keeps hint tiles through undo and restart", () => {
    const session = createSession({ puzzle, solution, brush: "straight" });
    const hint = pickHint(puzzle, session.state().tiles, solution, session.state().locked);
    if (!hint) throw new Error("expected a hint");
    session.placeHint(hint);
    const other = session
      .state()
      .tiles.findIndex(
        (tile, i) =>
          tile === 0 &&
          i !== hint.cell &&
          puzzle.cells[i]?.fixed === undefined &&
          puzzle.cells[i]?.kind === "open",
      );
    session.tap(other);
    session.undo();
    session.undo();
    expect(session.state().tiles[hint.cell]).toBe(hint.mask);
    session.tap(other);
    expect(session.state().clearable).toBe(1);
    expect(session.restart()).toBe(true);
    expect(session.state().tiles[other]).toBe(0);
    expect(session.state().tiles[hint.cell]).toBe(hint.mask);
    expect(session.restart()).toBe(false);
  });

  it("detects the solution and freezes the board", () => {
    const session = createSession({ puzzle, solution, brush: "straight" });
    const cells = Array.from(solution, (mask, i) => ({ mask, i })).filter(
      (x) => x.mask !== 0 && puzzle.cells[x.i]?.fixed === undefined,
    );
    for (const { i, mask } of cells) {
      session.setBrush(mask === 10 || mask === 5 ? "straight" : "corner");
      const seq = mask === 10 ? 1 : mask === 5 ? 2 : [3, 6, 12, 9].indexOf(mask) + 1;
      for (let k = 0; k < seq; k++) session.tap(i);
    }
    expect(session.state().solved).toBe(true);
    const frozen = session.state().tiles.slice();
    expect(session.tap(free() === -1 ? 0 : free())).toBe(false);
    expect(session.state().tiles).toEqual(frozen);
    expect(session.undo()).toBe(false);
  });

  it("round-trips through a saved run", () => {
    const first = createSession({ puzzle, solution, brush: "straight" });
    const cell = free();
    first.tap(cell);
    first.tick(4500);
    const saved = { ...first.toRun("harbor-01") };
    const second = createSession({ puzzle, solution, brush: "corner", saved });
    expect(second.state().tiles[cell]).toBe(10);
    expect(second.state().elapsedMs).toBe(4500);
    expect(second.state().moves).toBe(1);
    expect(second.state().brush).toBe("corner");
  });

  it("notifies subscribers and stops after unsubscribe", () => {
    const session = createSession({ puzzle, solution, brush: "straight" });
    let calls = 0;
    const stop = session.subscribe(() => {
      calls += 1;
    });
    session.tap(free());
    expect(calls).toBe(1);
    stop();
    session.setBrush("erase");
    expect(calls).toBe(1);
  });
});
