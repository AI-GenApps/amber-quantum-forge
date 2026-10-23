import { type Puzzle, pickHint, type Tiles } from "@web-games/lantern-loops-core";
import { describe, expect, it } from "vitest";
import { deriveEvents, finishEvents, winEvent } from "../../src/feedback/derive";
import type { FeedbackEvent } from "../../src/feedback/events";
import type { WinSummary } from "../../src/state/finish";
import { createSession, type Session } from "../../src/state/session";
import { campaignFixture, puzzleFrom } from "../helpers/board";

const LOOP_BOARD = puzzleFrom("La...La|.....|.....|.....|.....");
const STONE_BOARD = puzzleFrom("S0La...|.....|.....|.....|.....");

function fresh(
  puzzle: Puzzle,
  solution: Tiles = new Uint8Array(puzzle.size * puzzle.size),
): Session {
  return createSession({ puzzle, solution, brush: "straight" });
}

/** Runs one session action and returns the events it produces. */
function events(session: Session, action: () => void, showConflicts = true): FeedbackEvent[] {
  const before = session.state();
  action();
  return deriveEvents(session.puzzle, before, session.state(), { showConflicts });
}

const ids = (list: FeedbackEvent[]): string[] => list.map((event) => event.id);

function taps(session: Session, cell: number, count: number): void {
  for (let i = 0; i < count; i++) session.tap(cell);
}

describe("deriveEvents: tiles", () => {
  it("places a tile on an empty cell", () => {
    const session = fresh(LOOP_BOARD);
    const list = events(session, () => session.tap(12));
    expect(list).toEqual([{ id: "tile-place", cells: [12] }]);
  });

  it("rotates a placed tile", () => {
    const session = fresh(LOOP_BOARD);
    session.setBrush("corner");
    session.tap(12);
    expect(ids(events(session, () => session.tap(12)))).toEqual(["tile-rotate"]);
  });

  it("erases with a long press", () => {
    const session = fresh(LOOP_BOARD);
    session.tap(12);
    expect(events(session, () => session.erase(12))).toEqual([{ id: "tile-erase", cells: [12] }]);
  });

  it("reports one place event for a drag update and nothing at its end", () => {
    const session = fresh(LOOP_BOARD);
    session.beginDrag();
    expect(ids(events(session, () => session.updateDrag([10, 11, 12])))).toEqual(["tile-place"]);
    expect(events(session, () => session.endDrag())).toEqual([]);
  });

  it("is silent for a brush change and for a cancelled drag", () => {
    const session = fresh(LOOP_BOARD);
    expect(events(session, () => session.setBrush("corner"))).toEqual([]);
    session.beginDrag();
    session.updateDrag([10, 11]);
    expect(events(session, () => session.cancelDrag())).toEqual([]);
  });

  it("maps undo and redo to the undo sound and restart to erase", () => {
    const session = fresh(LOOP_BOARD);
    session.tap(12);
    expect(ids(events(session, () => session.undo()))).toEqual(["undo"]);
    expect(ids(events(session, () => session.redo()))).toEqual(["undo"]);
    expect(ids(events(session, () => session.restart()))).toEqual(["tile-erase"]);
  });
});

describe("deriveEvents: loops and lanterns", () => {
  it("closes a loop, lights the lantern, and does not repeat on later edits", () => {
    const session = fresh(LOOP_BOARD);
    session.setBrush("corner");
    taps(session, 0, 2);
    taps(session, 1, 3);
    taps(session, 5, 1);
    const closing = events(session, () => taps(session, 6, 4));
    expect(ids(closing)).toEqual(["tile-place", "loop-close", "lantern-lit"]);
    const closed = closing.find((event) => event.id === "loop-close");
    expect(closed?.loops?.[0]).toHaveLength(4);
    expect(closing.find((event) => event.id === "lantern-lit")?.cells).toEqual([0]);
    expect(ids(events(session, () => session.tap(24)))).toEqual(["tile-place"]);
  });

  it("does not light anything for a loop without a lantern", () => {
    const dark = puzzleFrom(".....|.....|.....|.....|.....");
    const session = fresh(dark);
    session.setBrush("corner");
    taps(session, 0, 2);
    taps(session, 1, 3);
    taps(session, 5, 1);
    const closing = events(session, () => taps(session, 6, 4));
    expect(ids(closing)).not.toContain("loop-close");
    expect(ids(closing)).not.toContain("lantern-lit");
  });
});

describe("deriveEvents: conflicts", () => {
  it("announces a new conflict once and only when conflicts are shown", () => {
    const session = fresh(STONE_BOARD);
    const first = events(session, () => session.tap(5));
    expect(ids(first)).toContain("conflict");
    expect(ids(events(session, () => session.tap(24)))).not.toContain("conflict");
    const quiet = fresh(STONE_BOARD);
    expect(ids(events(quiet, () => quiet.tap(5), false))).not.toContain("conflict");
  });
});

describe("deriveEvents: hints", () => {
  it("a placed hint is one hint event", () => {
    const { puzzle, solution } = campaignFixture("harbor-01");
    const session = fresh(puzzle, solution);
    const hint = pickHint(puzzle, session.state().tiles, solution, session.state().locked);
    if (hint === null) throw new Error("no hint");
    const list = events(session, () => session.placeHint(hint));
    expect(ids(list)[0]).toBe("hint");
    expect(ids(list)).not.toContain("tile-place");
  });
});

const baseSummary: WinSummary = {
  kind: "campaign",
  stars: 3,
  seconds: 30,
  hints: 0,
  tokensGranted: 0,
  tokensCapped: false,
  newBestTime: false,
  streak: null,
  events: [],
  chaptersUnlocked: [],
  chaptersCleared: [],
  nextId: null,
  shareText: null,
};

describe("win and finish events", () => {
  it("maps hints used to win-3, win-2 and win-1", () => {
    expect(winEvent(0).id).toBe("win-3");
    expect(winEvent(1).id).toBe("win-2");
    expect(winEvent(2).id).toBe("win-1");
    expect(winEvent(9).id).toBe("win-1");
  });

  it("adds daily-done, freeze-used and chapter-unlock when they happened", () => {
    expect(finishEvents(baseSummary)).toEqual([]);
    expect(ids(finishEvents({ ...baseSummary, kind: "daily" }))).toEqual(["daily-done"]);
    expect(ids(finishEvents({ ...baseSummary, kind: "archive" }))).toEqual([]);
    const all = finishEvents({
      ...baseSummary,
      kind: "daily",
      events: [{ kind: "freeze-used" } as WinSummary["events"][number]],
      chaptersUnlocked: ["garden"],
    });
    expect(ids(all)).toEqual(["daily-done", "freeze-used", "chapter-unlock"]);
  });
});
