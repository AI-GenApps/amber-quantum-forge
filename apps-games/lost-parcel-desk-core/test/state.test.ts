import { describe, expect, it } from "vitest";
import {
  addElapsed,
  createCaseState,
  flipObject,
  inspectObject,
  linkClue,
  pinClue,
  tapHotspot,
  unlinkClue,
  unpinClue,
} from "../src/state";
import { DIRECT_CASE } from "./fixtures/cases";
import { must } from "./fixtures/helpers";

const def = DIRECT_CASE;

describe("createCaseState", () => {
  it("starts open and empty", () => {
    expect(createCaseState(def)).toEqual({
      caseId: "direct",
      candidateIds: ["p1", "p2", "p3"],
      seenObjectIds: [],
      foundClueIds: [],
      pinnedClueIds: [],
      links: [],
      returnedIds: [],
      wrongAccusations: 0,
      hintsUsed: 0,
      elapsedMs: 0,
      closed: false,
      deliveredId: null,
      stamps: null,
      byElimination: false,
    });
  });
});

describe("finding clues", () => {
  it("inspect finds the front clues and marks the object seen", () => {
    const next = must(inspectObject(def, createCaseState(def), "direct-o1"));
    expect(next.seenObjectIds).toEqual(["direct-o1"]);
    expect(next.foundClueIds).toEqual(["d-c1"]);
  });

  it("inspect never finds back or zoom clues", () => {
    const next = must(inspectObject(def, createCaseState(def), "direct-o2"));
    expect(next.seenObjectIds).toEqual(["direct-o2"]);
    expect(next.foundClueIds).toEqual([]);
  });

  it("flip finds the back clues of an open object", () => {
    let state = must(inspectObject(def, createCaseState(def), "direct-o2"));
    state = must(flipObject(def, state, "direct-o2"));
    expect(state.foundClueIds).toEqual(["d-c2"]);
  });

  it("flip needs the object to be open", () => {
    const state = createCaseState(def);
    const result = flipObject(def, state, "direct-o2");
    expect(result).toEqual({ ok: false, state, reason: "OBJECT_NOT_OPEN" });
  });

  it("a zoom hotspot needs its object open", () => {
    const state = createCaseState(def);
    expect(tapHotspot(def, state, "d-c5")).toEqual({
      ok: false,
      state,
      reason: "OBJECT_NOT_OPEN",
    });
    const opened = must(inspectObject(def, state, "direct-o1"));
    expect(must(tapHotspot(def, opened, "d-c5")).foundClueIds).toEqual(["d-c1", "d-c5"]);
  });

  it("tapHotspot rejects clues that are not zoom clues and unknown ones", () => {
    const state = must(inspectObject(def, createCaseState(def), "direct-o1"));
    expect(tapHotspot(def, state, "d-c1")).toMatchObject({ ok: false, reason: "NOT_A_ZOOM_CLUE" });
    expect(tapHotspot(def, state, "zzz")).toMatchObject({ ok: false, reason: "UNKNOWN_CLUE" });
  });

  it("rejects unknown objects", () => {
    const state = createCaseState(def);
    expect(inspectObject(def, state, "zzz")).toEqual({
      ok: false,
      state,
      reason: "UNKNOWN_OBJECT",
    });
    expect(flipObject(def, state, "zzz")).toEqual({ ok: false, state, reason: "UNKNOWN_OBJECT" });
  });

  it("repeating a reveal changes nothing and keeps the same state object", () => {
    const first = must(inspectObject(def, createCaseState(def), "direct-o1"));
    expect(must(inspectObject(def, first, "direct-o1"))).toBe(first);
    const flipped = must(flipObject(def, first, "direct-o1"));
    expect(must(flipObject(def, flipped, "direct-o1"))).toBe(flipped);
  });

  it("keeps clues in the order they were found", () => {
    let state = createCaseState(def);
    state = must(inspectObject(def, state, "direct-o3"));
    state = must(inspectObject(def, state, "direct-o1"));
    expect(state.foundClueIds).toEqual(["d-c3", "d-c1"]);
  });
});

describe("pins", () => {
  it("only found clues can be pinned", () => {
    const state = createCaseState(def);
    expect(pinClue(state, "d-c1")).toEqual({ ok: false, state, reason: "CLUE_NOT_FOUND" });
  });

  it("pins a found clue once", () => {
    const found = must(inspectObject(def, createCaseState(def), "direct-o1"));
    const pinned = must(pinClue(found, "d-c1"));
    expect(pinned.pinnedClueIds).toEqual(["d-c1"]);
    expect(must(pinClue(pinned, "d-c1"))).toBe(pinned);
  });

  it("unpin removes the pin and every link of that clue", () => {
    let state = must(inspectObject(def, createCaseState(def), "direct-o1"));
    state = must(inspectObject(def, state, "direct-o3"));
    state = must(pinClue(state, "d-c1"));
    state = must(pinClue(state, "d-c3"));
    state = must(linkClue(state, "d-c1", "p1", "fits"));
    state = must(linkClue(state, "d-c1", "p3", "rules-out"));
    state = must(linkClue(state, "d-c3", "p1", "fits"));
    const next = must(unpinClue(state, "d-c1"));
    expect(next.pinnedClueIds).toEqual(["d-c3"]);
    expect(next.links).toEqual([{ clueId: "d-c3", personId: "p1", kind: "fits" }]);
  });

  it("unpin rejects a clue that is not pinned", () => {
    const state = createCaseState(def);
    expect(unpinClue(state, "d-c1")).toEqual({ ok: false, state, reason: "CLUE_NOT_PINNED" });
  });
});

describe("links", () => {
  function pinnedState() {
    let state = must(inspectObject(def, createCaseState(def), "direct-o1"));
    state = must(pinClue(state, "d-c1"));
    return state;
  }

  it("needs a pinned clue", () => {
    const state = must(inspectObject(def, createCaseState(def), "direct-o1"));
    expect(linkClue(state, "d-c1", "p1", "fits")).toEqual({
      ok: false,
      state,
      reason: "CLUE_NOT_PINNED",
    });
  });

  it("needs a candidate of the case", () => {
    const state = pinnedState();
    expect(linkClue(state, "d-c1", "p5", "fits")).toEqual({
      ok: false,
      state,
      reason: "NOT_A_CANDIDATE",
    });
  });

  it("allows one link per clue and candidate, up to all three candidates", () => {
    let state = pinnedState();
    state = must(linkClue(state, "d-c1", "p1", "fits"));
    state = must(linkClue(state, "d-c1", "p2", "fits"));
    state = must(linkClue(state, "d-c1", "p3", "rules-out"));
    expect(state.links).toHaveLength(3);
  });

  it("replaces the kind in place", () => {
    let state = pinnedState();
    state = must(linkClue(state, "d-c1", "p1", "fits"));
    state = must(linkClue(state, "d-c1", "p2", "fits"));
    state = must(linkClue(state, "d-c1", "p1", "rules-out"));
    expect(state.links).toEqual([
      { clueId: "d-c1", personId: "p1", kind: "rules-out" },
      { clueId: "d-c1", personId: "p2", kind: "fits" },
    ]);
  });

  it("linking the same kind again keeps the same state", () => {
    const state = must(linkClue(pinnedState(), "d-c1", "p1", "fits"));
    expect(must(linkClue(state, "d-c1", "p1", "fits"))).toBe(state);
  });

  it("unlink removes one link and rejects a missing one", () => {
    let state = must(linkClue(pinnedState(), "d-c1", "p1", "fits"));
    state = must(linkClue(state, "d-c1", "p2", "fits"));
    const next = must(unlinkClue(state, "d-c1", "p1"));
    expect(next.links).toEqual([{ clueId: "d-c1", personId: "p2", kind: "fits" }]);
    expect(unlinkClue(next, "d-c1", "p1")).toEqual({ ok: false, state: next, reason: "NO_LINK" });
  });
});

describe("elapsed time", () => {
  it("adds milliseconds", () => {
    let state = createCaseState(def);
    state = must(addElapsed(state, 1500));
    state = must(addElapsed(state, 500));
    expect(state.elapsedMs).toBe(2000);
  });

  it("rejects negative, infinite and NaN durations", () => {
    const state = createCaseState(def);
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(addElapsed(state, bad)).toEqual({ ok: false, state, reason: "BAD_DURATION" });
    }
  });
});

describe("closed cases", () => {
  it("reject every action with the same state object", () => {
    const closed = { ...createCaseState(def), closed: true };
    const results = [
      inspectObject(def, closed, "direct-o1"),
      flipObject(def, closed, "direct-o1"),
      tapHotspot(def, closed, "d-c5"),
      pinClue(closed, "d-c1"),
      unpinClue(closed, "d-c1"),
      linkClue(closed, "d-c1", "p1", "fits"),
      unlinkClue(closed, "d-c1", "p1"),
      addElapsed(closed, 10),
    ];
    for (const result of results) {
      expect(result).toEqual({ ok: false, state: closed, reason: "CASE_CLOSED" });
      expect(result.state).toBe(closed);
    }
  });
});
