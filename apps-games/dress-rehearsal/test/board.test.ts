import {
  getChallenge,
  isComplete,
  livePreview,
  openSlots,
  PIECE_BY_ID,
  SLOT_SET_IDS,
  type SlotSetId,
} from "@web-games/dress-rehearsal-core";
import { describe, expect, it } from "vitest";
import { announceHistory, announcePlaced, ruleChanges, summary } from "../src/board/a11y";
import {
  canRedo,
  canUndo,
  commit,
  HISTORY_LIMIT,
  redo,
  sameLook,
  startHistory,
  undo,
} from "../src/board/history";
import { keyIntent } from "../src/board/keyboard";
import { FLOW_ORDER, GRID_COLUMNS, layoutFor, layoutFromSlots } from "../src/board/layout";
import { buildView, pieceOf, spendOf, trayPieces } from "../src/board/model";
import { initialBoard, lookOf, reduceBoard } from "../src/board/state";

const RIV01 = getChallenge("riv-01");
const RIV03 = getChallenge("riv-03");
if (!RIV01 || !RIV03) throw new Error("fixtures missing");
const CTX = (set: SlotSetId) => ({ set, pieces: PIECE_BY_ID });

describe("layout", () => {
  it("places every open slot of every set once inside three columns", () => {
    for (const set of SLOT_SET_IDS) {
      const layout = layoutFor(set);
      expect(layout.cells.map((cell) => cell.slot).sort()).toEqual([...openSlots(set)].sort());
      const taken = new Set<string>();
      for (const cell of layout.cells) {
        expect(cell.col).toBeGreaterThanOrEqual(1);
        expect(cell.col).toBeLessThanOrEqual(GRID_COLUMNS);
        for (let i = 0; i < cell.rowSpan; i++) {
          const key = `${cell.col}:${cell.row + i}`;
          expect(taken.has(key), `${set} ${key}`).toBe(false);
          taken.add(key);
        }
      }
    }
  });

  it("makes the dress two rows tall next to top and bottom in the full set", () => {
    const layout = layoutFor("G");
    const dress = layout.cells.find((cell) => cell.slot === "dress");
    const top = layout.cells.find((cell) => cell.slot === "top");
    const bottom = layout.cells.find((cell) => cell.slot === "bottom");
    expect(dress?.rowSpan).toBe(2);
    expect(dress?.row).toBe(top?.row);
    expect((dress?.row ?? 0) + 1).toBe(bottom?.row);
    expect(layout.rows).toBe(3);
  });

  it("keeps the flow order and a 2 row board for set A", () => {
    expect(FLOW_ORDER).toHaveLength(8);
    expect(layoutFor("A").rows).toBe(2);
    expect(layoutFromSlots(["hat"]).cells).toEqual([{ slot: "hat", col: 1, row: 1, rowSpan: 1 }]);
  });
});

describe("history", () => {
  it("commits, undoes and redoes, dropping the future on a new edit", () => {
    let h = startHistory();
    h = commit(h, { top: "item-riviera-1" });
    h = commit(h, { top: "item-riviera-1", hat: "item-riviera-7" });
    expect(canUndo(h)).toBe(true);
    h = undo(h);
    expect(h.present).toEqual({ top: "item-riviera-1" });
    expect(canRedo(h)).toBe(true);
    h = redo(h);
    expect(h.present.hat).toBe("item-riviera-7");
    h = undo(undo(h));
    expect(h.present).toEqual({});
    h = commit(h, { bag: "item-riviera-6" });
    expect(canRedo(h)).toBe(false);
  });

  it("ignores identical looks and bounds the stack", () => {
    const h = startHistory({ top: "item-riviera-1" });
    expect(commit(h, { top: "item-riviera-1" })).toBe(h);
    expect(sameLook({ top: "a" }, { top: "a" })).toBe(true);
    expect(sameLook({ top: "a" }, {})).toBe(false);
    let big = startHistory();
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) {
      big = commit(big, i % 2 === 0 ? { top: "item-riviera-1" } : { bottom: "item-riviera-3" });
    }
    expect(big.past.length).toBe(HISTORY_LIMIT);
    expect(undo(startHistory())).toEqual(startHistory());
    expect(redo(startHistory())).toEqual(startHistory());
  });
});

describe("board reducer", () => {
  const ctx = CTX(RIV01.slotSet);

  it("places a piece in its own slot and refuses another slot", () => {
    const start = initialBoard();
    const ok = reduceBoard(ctx, start, { type: "place", pieceId: "item-riviera-7" });
    expect(ok.event.type).toBe("placed");
    expect(lookOf(ok.state).hat).toBe("item-riviera-7");
    const refused = reduceBoard(ctx, start, {
      type: "place",
      pieceId: "item-riviera-7",
      slot: "top",
    });
    expect(refused.event).toMatchObject({ type: "refused", reason: "WRONG_CATEGORY" });
    expect(lookOf(refused.state)).toEqual({});
    const closed = reduceBoard(ctx, start, { type: "place", pieceId: "item-rainy-city-1" });
    expect(closed.event).toMatchObject({ type: "refused", reason: "SLOT_CLOSED" });
  });

  it("swaps on an occupied slot and reports the replaced piece", () => {
    let state = reduceBoard(ctx, initialBoard(), {
      type: "place",
      pieceId: "item-riviera-1",
    }).state;
    const swap = reduceBoard(ctx, state, { type: "place", pieceId: "item-rainy-city-3" });
    expect(swap.event).toMatchObject({ type: "placed", replaced: "item-riviera-1" });
    state = swap.state;
    expect(lookOf(state).top).toBe("item-rainy-city-3");
  });

  it("selects a piece then places it by tapping the slot, and keeps the selection on a wrong tap", () => {
    const picked = reduceBoard(ctx, initialBoard(), {
      type: "select-piece",
      pieceId: "item-riviera-7",
    });
    expect(picked.state.selected).toEqual({ kind: "piece", pieceId: "item-riviera-7" });
    expect(picked.state.tab).toBe("hat");
    const wrong = reduceBoard(ctx, picked.state, { type: "tap-slot", slot: "top" });
    expect(wrong.event.type).toBe("refused");
    expect(wrong.state.selected).not.toBeNull();
    const right = reduceBoard(ctx, picked.state, { type: "tap-slot", slot: "hat" });
    expect(right.event.type).toBe("placed");
    expect(right.state.selected).toBeNull();
    const again = reduceBoard(ctx, picked.state, {
      type: "select-piece",
      pieceId: "item-riviera-7",
    });
    expect(again.event.type).toBe("deselected");
  });

  it("opens the tab of an empty slot and selects then removes a placed piece", () => {
    const empty = reduceBoard(ctx, initialBoard(), { type: "tap-slot", slot: "bag" });
    expect(empty.event).toMatchObject({ type: "tab-opened", slot: "bag" });
    expect(empty.state.tab).toBe("bag");
    const placed = reduceBoard(ctx, initialBoard(), {
      type: "place",
      pieceId: "item-riviera-6",
    }).state;
    const selected = reduceBoard(ctx, placed, { type: "tap-slot", slot: "bag" });
    expect(selected.state.selected).toEqual({ kind: "slot", slot: "bag" });
    const toggled = reduceBoard(ctx, selected.state, { type: "tap-slot", slot: "bag" });
    expect(toggled.event.type).toBe("deselected");
    const removed = reduceBoard(ctx, selected.state, { type: "remove-selected" });
    expect(removed.event.type).toBe("removed");
    expect(lookOf(removed.state)).toEqual({});
    expect(reduceBoard(ctx, initialBoard(), { type: "remove", slot: "bag" }).event.type).toBe(
      "none",
    );
    expect(reduceBoard(ctx, initialBoard(), { type: "remove-selected" }).event.type).toBe("none");
  });

  it("supports undo, redo and clear with events", () => {
    let state = initialBoard();
    state = reduceBoard(ctx, state, { type: "place", pieceId: "item-riviera-1" }).state;
    state = reduceBoard(ctx, state, { type: "place", pieceId: "item-riviera-7" }).state;
    const undone = reduceBoard(ctx, state, { type: "undo" });
    expect(undone.event).toMatchObject({ type: "history", action: "undo" });
    expect(lookOf(undone.state).hat).toBeUndefined();
    const redone = reduceBoard(ctx, undone.state, { type: "redo" });
    expect(lookOf(redone.state).hat).toBe("item-riviera-7");
    const cleared = reduceBoard(ctx, redone.state, { type: "clear" });
    expect(lookOf(cleared.state)).toEqual({});
    expect(reduceBoard(ctx, cleared.state, { type: "clear" }).event.type).toBe("none");
    expect(reduceBoard(ctx, initialBoard(), { type: "undo" }).event.type).toBe("none");
    expect(reduceBoard(ctx, initialBoard(), { type: "redo" }).event.type).toBe("none");
    const back = reduceBoard(ctx, cleared.state, { type: "undo" });
    expect(Object.keys(lookOf(back.state))).toHaveLength(2);
  });

  it("clears a hint when the look changes and resets the board", () => {
    let state = reduceBoard(ctx, initialBoard(), {
      type: "set-hint",
      hint: { pieceId: "item-riviera-7", slot: "hat" },
    }).state;
    expect(state.hint?.slot).toBe("hat");
    state = reduceBoard(ctx, state, { type: "place", pieceId: "item-riviera-1" }).state;
    expect(state.hint).toBeNull();
    state = reduceBoard(ctx, state, { type: "set-tab", tab: "shoes" }).state;
    expect(state.tab).toBe("shoes");
    const reset = reduceBoard(ctx, state, { type: "reset" }).state;
    expect(lookOf(reset)).toEqual({});
    expect(reset.history.past).toHaveLength(0);
    expect(reduceBoard(ctx, state, { type: "deselect" }).event.type).toBe("none");
  });

  it("applies the one-piece rule when a dress and top and bottom are all open", () => {
    const set = RIV03.slotSet;
    const c = CTX(set);
    let state = initialBoard();
    state = reduceBoard(c, state, { type: "place", pieceId: "item-riviera-1" }).state;
    state = reduceBoard(c, state, { type: "place", pieceId: "item-riviera-3" }).state;
    const dress = reduceBoard(c, state, { type: "place", pieceId: "item-rainy-city-7" });
    expect(lookOf(dress.state)).toEqual({ dress: "item-rainy-city-7" });
    expect(dress.event).toMatchObject({ type: "placed" });
    if (dress.event.type === "placed")
      expect([...dress.event.displaced].sort()).toEqual(["item-riviera-1", "item-riviera-3"]);
    const top = reduceBoard(c, dress.state, { type: "place", pieceId: "item-riviera-1" });
    expect(lookOf(top.state)).toEqual({ top: "item-riviera-1" });
  });
});

describe("view model", () => {
  it("builds slots, spend and live rules from a look", () => {
    const look = { top: "item-riviera-1", hat: "item-riviera-7" };
    const view = buildView(RIV01, look);
    expect(view.slots.map((slot) => slot.slot).sort()).toEqual(
      [...openSlots(RIV01.slotSet)].sort(),
    );
    expect(view.slots.find((slot) => slot.slot === "hat")?.piece?.name).toBe("Wide-Brim Sun Hat");
    expect(view.spend).toBe(38 + 46);
    expect(spendOf(look)).toBe(84);
    expect(view.preview.complete).toBe(false);
    expect(view.preview.missing).toContain("bottom");
    expect(pieceOf("nope")).toBeNull();
    expect(pieceOf(undefined)).toBeNull();
    expect(
      trayPieces([...PIECE_BY_ID.values()].slice(0, 16), "top").every((p) => p.category === "top"),
    ).toBe(true);
  });

  it("scores the reference look as complete", () => {
    expect(isComplete(RIV01.slotSet, RIV01.reference)).toBe(true);
    const preview = livePreview(RIV01, PIECE_BY_ID, RIV01.reference);
    expect(preview.complete).toBe(true);
    expect(preview.metCount).toBe(RIV01.rules.length);
  });
});

describe("keyboard intents", () => {
  const key = (
    k: string,
    init: Partial<{ ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }> = {},
  ) => ({
    key: k,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...init,
  });
  it("maps undo and redo shortcuts everywhere", () => {
    expect(keyIntent(key("z", { ctrlKey: true }), {})).toEqual({ type: "undo" });
    expect(keyIntent(key("Z", { metaKey: true }), {})).toEqual({ type: "undo" });
    expect(keyIntent(key("y", { ctrlKey: true }), {})).toEqual({ type: "redo" });
    expect(keyIntent(key("z", { ctrlKey: true, shiftKey: true }), {})).toEqual({ type: "redo" });
    expect(keyIntent(key("x", { ctrlKey: true }), {})).toBeNull();
  });
  it("maps tray keys to place and move", () => {
    const target = { pieceId: "item-riviera-1" };
    expect(keyIntent(key("Enter"), target)).toEqual({
      type: "place-piece",
      pieceId: "item-riviera-1",
    });
    expect(keyIntent(key("ArrowRight"), target)).toEqual({ type: "move", delta: 1 });
    expect(keyIntent(key("ArrowUp"), target)).toEqual({ type: "move", delta: -1 });
    expect(keyIntent(key("Home"), target)).toEqual({ type: "move", delta: "first" });
    expect(keyIntent(key("End"), target)).toEqual({ type: "move", delta: "last" });
    expect(keyIntent(key("a"), target)).toBeNull();
  });
  it("maps slot keys to select and clear", () => {
    expect(keyIntent(key("Enter"), { slot: "hat" })).toEqual({ type: "tap-slot", slot: "hat" });
    expect(keyIntent(key("Backspace"), { slot: "hat" })).toEqual({
      type: "remove-slot",
      slot: "hat",
    });
    expect(keyIntent(key("Delete"), { slot: "hat" })).toEqual({ type: "remove-slot", slot: "hat" });
    expect(keyIntent(key("Enter"), {})).toBeNull();
    expect(keyIntent(key(" "), { slot: "hat" })).toBeNull();
  });
});

describe("announcements", () => {
  it("describes a placement with the rule count and harmony", () => {
    const empty = livePreview(RIV01, PIECE_BY_ID, {});
    const after = livePreview(RIV01, PIECE_BY_ID, { hat: "item-riviera-7" });
    const hat = PIECE_BY_ID.get("item-riviera-7");
    if (!hat) throw new Error("missing piece");
    const message = announcePlaced(hat, "hat", null, empty, after);
    expect(message).toContain("Hat: Wide-Brim Sun Hat placed.");
    expect(message).toContain(`Rules met ${after.metCount} of 2.`);
    expect(message).toContain(`Harmony ${after.harmony.total}.`);
    expect(message).toContain("Now met:");
    expect(summary(after)).toMatch(/^Rules met \d of 2\. Harmony \d+\.$/);
    expect(ruleChanges(after, empty)).toContain("No longer met:");
    expect(announceHistory("undo", after, empty)).toContain("Undone.");
    expect(announceHistory("redo", empty, after)).toContain("Redone.");
    expect(announceHistory("clear", after, empty)).toContain("Board cleared.");
  });
});
