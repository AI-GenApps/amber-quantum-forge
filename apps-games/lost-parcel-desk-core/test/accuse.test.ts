import { describe, expect, it } from "vitest";
import { accuse, canAccuse, fitsCount } from "../src/accuse";
import {
  addElapsed,
  createCaseState,
  flipObject,
  inspectObject,
  linkClue,
  pinClue,
  tapHotspot,
} from "../src/state";
import type { CaseState } from "../src/types";
import { DIRECT_CASE } from "./fixtures/cases";
import { giveFits, must, pinAll, revealAll } from "./fixtures/helpers";

const def = DIRECT_CASE;
const CLUES = ["d-c1", "d-c2", "d-c3"];

function ready(): CaseState {
  return pinAll(revealAll(def, createCaseState(def)));
}

function accused(state: CaseState, personId: string) {
  const result = accuse(def, state, personId);
  if (!result.ok) throw new Error(`rejected ${result.reason}`);
  return result;
}

describe("canAccuse and fitsCount", () => {
  it("counts only fits links of that candidate", () => {
    let state = ready();
    state = must(linkClue(state, "d-c1", "p2", "fits"));
    state = must(linkClue(state, "d-c2", "p2", "rules-out"));
    state = must(linkClue(state, "d-c3", "p1", "fits"));
    expect(fitsCount(state, "p2")).toBe(1);
    expect(fitsCount(state, "p1")).toBe(1);
    expect(fitsCount(state, "p3")).toBe(0);
  });

  it("needs two fits: 0 and 1 are refused and say how many more", () => {
    let state = ready();
    expect(canAccuse(state, "p1")).toEqual({ ok: false, reason: "NEEDS_MORE_FITS", needed: 2 });
    state = giveFits(state, "p1", ["d-c1"]);
    expect(canAccuse(state, "p1")).toEqual({ ok: false, reason: "NEEDS_MORE_FITS", needed: 1 });
    state = giveFits(state, "p1", ["d-c2"]);
    expect(canAccuse(state, "p1")).toEqual({ ok: true, needed: 0 });
  });

  it("refuses non candidates and closed cases", () => {
    const state = giveFits(ready(), "p1", CLUES);
    expect(canAccuse(state, "p9")).toMatchObject({ ok: false, reason: "NOT_A_CANDIDATE" });
    expect(canAccuse({ ...state, closed: true }, "p1")).toMatchObject({
      ok: false,
      reason: "CASE_CLOSED",
    });
  });

  it("rejects an accusation with too few fits without changing the state", () => {
    const state = giveFits(ready(), "p1", ["d-c1"]);
    expect(accuse(def, state, "p1")).toEqual({
      ok: false,
      state,
      reason: "NEEDS_MORE_FITS",
      needed: 1,
    });
  });
});

describe("accuse", () => {
  it("a scripted perfect case ends with 3 stamps and no wrong accusation", () => {
    let state = createCaseState(def);
    state = must(inspectObject(def, state, "direct-o1"));
    state = must(tapHotspot(def, state, "d-c5"));
    state = must(inspectObject(def, state, "direct-o2"));
    state = must(flipObject(def, state, "direct-o2"));
    state = must(pinClue(state, "d-c1"));
    state = must(pinClue(state, "d-c2"));
    state = must(linkClue(state, "d-c1", "p1", "fits"));
    state = must(linkClue(state, "d-c2", "p1", "fits"));
    state = must(linkClue(state, "d-c1", "p3", "rules-out"));
    state = must(addElapsed(state, 240000));
    const result = accused(state, "p1");
    expect(result).toMatchObject({ correct: true, stamps: 3, closed: true, byElimination: false });
    expect(result.state).toMatchObject({
      closed: true,
      deliveredId: "p1",
      stamps: 3,
      wrongAccusations: 0,
      returnedIds: [],
      elapsedMs: 240000,
    });
  });

  it("one wrong accusation returns the candidate and leaves 2 stamps", () => {
    let state = giveFits(ready(), "p2", ["d-c1", "d-c2"]);
    const wrong = accused(state, "p2");
    expect(wrong).toMatchObject({ correct: false, stamps: 2, closed: false, byElimination: false });
    expect(wrong.state.returnedIds).toEqual(["p2"]);
    expect(wrong.state.wrongAccusations).toBe(1);
    expect(wrong.state.closed).toBe(false);
    state = giveFits(wrong.state, "p1", ["d-c1", "d-c2"]);
    const right = accused(state, "p1");
    expect(right).toMatchObject({ correct: true, stamps: 2, closed: true, byElimination: false });
    expect(right.state.stamps).toBe(2);
  });

  it("a returned candidate cannot be accused again", () => {
    const wrong = accused(giveFits(ready(), "p2", ["d-c1", "d-c2"]), "p2");
    expect(accuse(def, wrong.state, "p2")).toEqual({
      ok: false,
      state: wrong.state,
      reason: "ALREADY_RETURNED",
      needed: 0,
    });
  });

  it("two wrong accusations deliver the owner by elimination with 1 stamp", () => {
    let state = giveFits(ready(), "p2", ["d-c1", "d-c2"]);
    state = accused(state, "p2").state;
    state = giveFits(state, "p3", ["d-c1", "d-c2"]);
    const last = accused(state, "p3");
    expect(last).toMatchObject({ correct: false, stamps: 1, closed: true, byElimination: true });
    expect(last.state).toMatchObject({
      closed: true,
      deliveredId: "p1",
      stamps: 1,
      byElimination: true,
      wrongAccusations: 2,
      returnedIds: ["p2", "p3"],
    });
  });

  it("a closed case rejects every further accusation", () => {
    const done = accused(giveFits(ready(), "p1", ["d-c1", "d-c2"]), "p1").state;
    for (const personId of ["p1", "p2", "p3"]) {
      expect(accuse(def, done, personId)).toEqual({
        ok: false,
        state: done,
        reason: "CASE_CLOSED",
        needed: 0,
      });
    }
  });

  it("does not mutate the state it is given", () => {
    const state = giveFits(ready(), "p2", ["d-c1", "d-c2"]);
    const before = JSON.stringify(state);
    accused(state, "p2");
    expect(JSON.stringify(state)).toBe(before);
  });
});
