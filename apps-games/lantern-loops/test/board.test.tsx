import { COLOURS, type Tiles } from "@web-games/lantern-loops-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSession } from "../src/state/session";
import {
  type BoardHandle,
  blankSession,
  campaignFixture,
  centre,
  dragThrough,
  key,
  mountBoard,
  pointer,
  puzzleFrom,
  SHOWCASE_CODE,
  tapAt,
} from "./helpers/board";

let handle: BoardHandle | null = null;
afterEach(() => {
  handle?.unmount();
  handle = null;
  vi.useRealTimers();
});

describe("board rendering", () => {
  it("draws every mechanic of the showcase fixture", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session);
    const root = handle.container;
    expect(root.querySelectorAll("[role='gridcell']")).toHaveLength(25);
    expect(root.querySelectorAll("[role='row']")).toHaveLength(5);

    const stones = Array.from(root.querySelectorAll(".ll-stone")).map((el) =>
      el.getAttribute("data-stone"),
    );
    expect(stones.sort()).toEqual(["0", "3", "4"]);
    expect(
      Array.from(root.querySelectorAll(".ll-stone-num"))
        .map((el) => el.textContent)
        .sort(),
    ).toEqual(["0", "3", "4"]);

    expect(root.querySelector(".ll-mirror[data-mirror='/']")).not.toBeNull();
    expect(root.querySelector(".ll-mirror[data-mirror='\\']")).not.toBeNull();

    const gate = root.querySelector(".ll-gate[data-colour='rose']");
    expect(gate).not.toBeNull();
    expect(gate?.querySelectorAll("path").length).toBeGreaterThanOrEqual(3);

    expect(root.querySelectorAll(".ll-tack")).toHaveLength(2);

    const lanternColours = Array.from(root.querySelectorAll(".ll-lantern")).map((el) =>
      el.getAttribute("data-colour"),
    );
    expect(new Set(lanternColours)).toEqual(new Set(COLOURS));
    for (const lantern of Array.from(root.querySelectorAll(".ll-lantern"))) {
      expect(lantern.querySelector("path")).not.toBeNull();
    }
  });

  it("labels each cell for screen readers", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session);
    const label = (index: number): string | null =>
      handle?.container.querySelector(`[data-cell='${index}']`)?.getAttribute("aria-label") ?? null;
    expect(label(0)).toBe("Row 1, column 1, amber lantern, empty, not lit");
    expect(label(2)).toBe("Row 1, column 3, stone 3");
    expect(label(3)).toBe("Row 1, column 4, mirror slash, empty");
    expect(label(5)).toBe("Row 2, column 1, rose gate, straight horizontal, pinned");
    expect(label(9)).toBe("Row 2, column 5, corner north east, pinned");
    expect(handle.svg.getAttribute("role")).toBe("grid");
    expect(handle.svg.getAttribute("aria-label")).toBe("Puzzle board, 5 by 5");
    expect(handle.svg.style.touchAction).toBe("none");
  });

  it("adds glyphs to tiles and thicker outlines in high contrast", async () => {
    const { puzzle, solution } = campaignFixture("harbor-01");
    const session = createSession({ puzzle, solution, brush: "straight" });
    for (let i = 0; i < solution.length; i++) {
      const mask = solution[i] ?? 0;
      if (mask === 0 || puzzle.cells[i]?.fixed !== undefined) continue;
      session.setBrush(mask === 10 || mask === 5 ? "straight" : "corner");
      const taps = mask === 10 ? 1 : mask === 5 ? 2 : [3, 6, 12, 9].indexOf(mask) + 1;
      for (let k = 0; k < taps; k++) session.tap(i);
    }
    handle = await mountBoard(session, { highContrast: true });
    const tiles = handle.container.querySelectorAll(".ll-tile");
    expect(tiles.length).toBeGreaterThan(5);
    for (const tile of Array.from(tiles)) {
      expect(tile.querySelector("path")?.getAttribute("stroke-width")).toBe("31");
    }
    const glyphs = handle.container.querySelectorAll(".ll-tile ~ path");
    expect(glyphs.length).toBeGreaterThan(0);
  });
});

describe("board input", () => {
  it("turns a drag across cells into path tiles", async () => {
    const puzzle = puzzleFrom(SHOWCASE_CODE);
    const session = blankSession(puzzle);
    handle = await mountBoard(session);
    await dragThrough(handle.svg, 5, [10, 11, 12, 13]);
    const tiles = session.state().tiles;
    expect([tiles[10], tiles[11], tiles[12], tiles[13]]).toEqual([10, 10, 10, 10]);
    expect(session.state().moves).toBe(1);
    await dragThrough(handle.svg, 5, [15, 16, 17, 12]);
    const next = session.state().tiles;
    expect([next[15], next[16], next[17], next[12]]).toEqual([10, 10, 9, 5]);
    expect(session.undo()).toBe(true);
    expect(session.state().tiles[15]).toBe(0);
    expect(session.state().tiles[10]).toBe(10);
  });

  it("cycles taps by brush", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session);
    const svg = handle.svg;
    await tapAt(svg, 5, 16);
    expect(session.state().tiles[16]).toBe(10);
    await tapAt(svg, 5, 16);
    expect(session.state().tiles[16]).toBe(5);
    await tapAt(svg, 5, 16);
    expect(session.state().tiles[16]).toBe(0);
    session.setBrush("corner");
    for (const expected of [3, 6, 12, 9, 0]) {
      await tapAt(svg, 5, 16);
      expect(session.state().tiles[16]).toBe(expected);
    }
  });

  it("erases on a 500 ms long press and not on a shorter hold", async () => {
    vi.useFakeTimers();
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session);
    const svg = handle.svg;
    await tapAt(svg, 5, 16);
    expect(session.state().tiles[16]).toBe(10);
    const { x, y } = centre(5, 16);
    await pointer(svg, "pointerdown", x, y);
    await vi.advanceTimersByTimeAsync(300);
    await pointer(svg, "pointerup", x, y);
    expect(session.state().tiles[16]).toBe(5);
    await pointer(svg, "pointerdown", x, y);
    await vi.advanceTimersByTimeAsync(500);
    expect(session.state().tiles[16]).toBe(0);
    await pointer(svg, "pointerup", x, y);
    expect(session.state().tiles[16]).toBe(0);
  });

  it("erases cells with the erase brush while dragging", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session);
    await dragThrough(handle.svg, 5, [10, 11, 12, 13]);
    session.setBrush("erase");
    await dragThrough(handle.svg, 5, [11, 12]);
    const tiles = session.state().tiles;
    expect([tiles[10], tiles[11], tiles[12], tiles[13]]).toEqual([10, 0, 0, 10]);
  });

  it("ignores stones, anchors and hint-locked cells", async () => {
    const puzzle = puzzleFrom(SHOWCASE_CODE);
    const session = blankSession(puzzle);
    handle = await mountBoard(session);
    const svg = handle.svg;
    await tapAt(svg, 5, 2);
    await tapAt(svg, 5, 5);
    await tapAt(svg, 5, 9);
    await dragThrough(svg, 5, [16, 17, 18, 19]);
    const tiles = session.state().tiles;
    expect(tiles[2]).toBe(0);
    expect(tiles[5]).toBe(10);
    expect(tiles[9]).toBe(3);
    expect([tiles[16], tiles[17]]).toEqual([10, 10]);
    expect([tiles[18], tiles[19]]).toEqual([0, 0]);
    session.placeHint({ cell: 12, mask: 5 });
    await tapAt(svg, 5, 12);
    expect(session.state().tiles[12]).toBe(5);
    expect(session.state().hintCells).toEqual([12]);
  });

  it("treats a cancelled drag as no move", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session);
    const svg = handle.svg;
    const a = centre(5, 15);
    const b = centre(5, 16);
    await pointer(svg, "pointerdown", a.x, a.y);
    await pointer(svg, "pointermove", b.x, b.y);
    expect(session.state().tiles[15]).toBe(10);
    await pointer(svg, "pointercancel", b.x, b.y);
    expect(session.state().tiles[15]).toBe(0);
    expect(session.state().moves).toBe(0);
  });

  it("ignores input when the board is disabled", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session, { disabled: true });
    await tapAt(handle.svg, 5, 16);
    expect(session.state().tiles[16]).toBe(0);
  });
});

function keyboardSolve(
  session: ReturnType<typeof createSession>,
  svg: Element,
  solution: Tiles,
): Promise<void> {
  const size = session.puzzle.size;
  const run = async (): Promise<void> => {
    let focus = 0;
    await key(svg, "ArrowRight");
    await key(svg, "ArrowLeft");
    for (let i = 0; i < solution.length; i++) {
      const mask = solution[i] ?? 0;
      if (mask === 0 || session.puzzle.cells[i]?.fixed !== undefined) continue;
      while (focus % size < i % size) {
        await key(svg, "ArrowRight");
        focus += 1;
      }
      while (focus % size > i % size) {
        await key(svg, "ArrowLeft");
        focus -= 1;
      }
      while (Math.floor(focus / size) < Math.floor(i / size)) {
        await key(svg, "ArrowDown");
        focus += size;
      }
      const straight = mask === 10 || mask === 5;
      await key(svg, straight ? "s" : "c");
      const taps = mask === 10 ? 1 : mask === 5 ? 2 : [3, 6, 12, 9].indexOf(mask) + 1;
      for (let k = 0; k < taps; k++) await key(svg, " ");
    }
  };
  return run();
}

describe("keyboard play", () => {
  it("solves a 5x5 fixture without a pointer", async () => {
    const { puzzle, solution } = campaignFixture("harbor-01");
    expect(puzzle.size).toBe(5);
    const session = createSession({ puzzle, solution, brush: "straight" });
    handle = await mountBoard(session);
    await keyboardSolve(session, handle.svg, solution);
    expect(session.state().solved).toBe(true);
    expect(handle.container.querySelector("[data-live-region]")?.textContent).toBe(
      "Solved. Every lantern is lit.",
    );
  });

  it("supports undo, redo and brush keys", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session);
    const svg = handle.svg;
    for (let i = 0; i < 16; i++) await key(svg, i % 5 === 4 ? "ArrowDown" : "ArrowRight");
    await key(svg, "c");
    expect(session.state().brush).toBe("corner");
    const before = Array.from(session.state().tiles);
    await key(svg, " ");
    const placed = Array.from(session.state().tiles).findIndex((tile, i) => tile !== before[i]);
    expect(placed).toBeGreaterThanOrEqual(0);
    expect(session.state().tiles[placed]).toBe(3);
    await key(svg, "z");
    expect(session.state().tiles[placed]).toBe(0);
    await key(svg, "y");
    expect(session.state().tiles[placed]).toBe(3);
    await key(svg, "e");
    expect(session.state().brush).toBe("erase");
  });

  it("forwards hint and pause keys as commands", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    const commands: string[] = [];
    handle = await mountBoard(session, { onCommand: (command) => commands.push(command) });
    await key(handle.svg, "h");
    await key(handle.svg, "Escape");
    expect(commands).toEqual(["hint", "pause"]);
  });
});

describe("live feedback", () => {
  it("rings a stone that can no longer be met and clears it again", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session);
    const stone = (): Element | null =>
      handle?.container.querySelector(".ll-stone[data-stone='0']") ?? null;
    expect(stone()?.getAttribute("data-conflict")).toBe("false");
    await tapAt(handle.svg, 5, 17);
    expect(stone()?.getAttribute("data-conflict")).toBe("true");
    expect(handle.container.querySelector("[data-live-region]")?.textContent).toBe(
      "1 conflict on the board",
    );
    await tapAt(handle.svg, 5, 17);
    await tapAt(handle.svg, 5, 17);
    expect(stone()?.getAttribute("data-conflict")).toBe("false");
    expect(handle.container.querySelector("[data-live-region]")?.textContent).toBe("No conflicts");
  });

  it("draws open ribbon ends and marks mismatches", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session);
    await tapAt(handle.svg, 5, 12);
    const ends = handle.container.querySelectorAll("[data-cell='12'] .ll-open-end");
    expect(ends).toHaveLength(2);
    expect(Array.from(ends).every((el) => el.getAttribute("data-facing") === "empty")).toBe(true);
    await tapAt(handle.svg, 5, 13);
    await tapAt(handle.svg, 5, 13);
    expect(
      handle.container.querySelector("[data-cell='12'] .ll-open-end[data-facing='mismatch']"),
    ).not.toBeNull();
  });

  it("dims a closed loop without a lantern", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session);
    session.setBrush("corner");
    await dragThrough(handle.svg, 5, [11, 12, 17, 16, 11]);
    const dimmed = Array.from(handle.container.querySelectorAll(".ll-tile")).filter(
      (tile) => tile.getAttribute("opacity") === "0.45",
    );
    expect(dimmed.length).toBeGreaterThanOrEqual(4);
  });

  it("shows no feedback when conflicts are switched off", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session, { showConflicts: false });
    await tapAt(handle.svg, 5, 17);
    expect(
      handle.container.querySelector(".ll-stone[data-stone='0']")?.getAttribute("data-conflict"),
    ).toBe("false");
    expect(handle.container.querySelectorAll(".ll-open-end")).toHaveLength(0);
  });

  it("shows a highlighted tutorial target", async () => {
    const session = blankSession(puzzleFrom(SHOWCASE_CODE));
    handle = await mountBoard(session, { highlight: [0] });
    expect(handle.container.querySelectorAll(".ll-target")).toHaveLength(1);
    expect(handle.container.querySelector("[data-cell='0'] .ll-target")).not.toBeNull();
  });
});
