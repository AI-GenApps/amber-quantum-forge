import { describe, expect, it } from "vitest";
import { accuse } from "../src/accuse";
import { explainWrong, summarizeBoard } from "../src/feedback";
import { createCaseState, flipObject, inspectObject, linkClue } from "../src/state";
import { DIRECT_CASE, PAIR_CASE } from "./fixtures/cases";
import { MINI_CAST } from "./fixtures/cast";
import { giveFits, must, pinAll, revealAll } from "./fixtures/helpers";

describe("explainWrong", () => {
  it("names a found lead clue that rules the candidate out", () => {
    const state = must(inspectObject(DIRECT_CASE, createCaseState(DIRECT_CASE), "direct-o1"));
    expect(explainWrong(DIRECT_CASE, MINI_CAST, state, "p3")).toEqual({
      kind: "clue",
      personId: "p3",
      deductionId: "d-D1",
      clueId: "d-c1",
      clueIds: ["d-c1"],
      facet: "street",
      polarity: "is",
      expected: "Quay Road",
      actual: "Mill Lane",
    });
  });

  it("skips a ruling deduction whose clue is unseen when another one was found", () => {
    const def = { ...DIRECT_CASE, candidateIds: ["p1", "p5", "p3"] };
    let state = must(inspectObject(def, createCaseState(def), "direct-o2"));
    state = must(flipObject(def, state, "direct-o2"));
    expect(explainWrong(def, MINI_CAST, state, "p5")).toMatchObject({
      kind: "clue",
      deductionId: "d-D2",
      clueId: "d-c2",
      expected: "angling",
      actual: "chess",
    });
    expect(explainWrong(def, MINI_CAST, createCaseState(def), "p5")).toMatchObject({
      kind: "unseen",
      deductionId: "d-D1",
    });
  });

  it("falls back to the unseen case when no ruling clue was found", () => {
    const state = createCaseState(DIRECT_CASE);
    expect(explainWrong(DIRECT_CASE, MINI_CAST, state, "p3")).toEqual({
      kind: "unseen",
      personId: "p3",
      deductionId: "d-D1",
      clueId: null,
      clueIds: ["d-c1"],
      facet: "street",
      polarity: "is",
      expected: "Quay Road",
      actual: "Mill Lane",
    });
  });

  it("needs both clues of a pair before it points at them", () => {
    let state = must(inspectObject(PAIR_CASE, createCaseState(PAIR_CASE), "pair-o1"));
    expect(explainWrong(PAIR_CASE, MINI_CAST, state, "p2")).toMatchObject({
      kind: "unseen",
      deductionId: "p-D1",
    });
    state = revealAll(PAIR_CASE, state);
    expect(explainWrong(PAIR_CASE, MINI_CAST, state, "p2")).toMatchObject({
      kind: "clue",
      deductionId: "p-D1",
      clueId: "p-c1",
      clueIds: ["p-c1", "p-c2"],
    });
  });

  it("returns null for the owner and unknown people", () => {
    const state = createCaseState(DIRECT_CASE);
    expect(explainWrong(DIRECT_CASE, MINI_CAST, state, "p1")).toBeNull();
    expect(explainWrong(DIRECT_CASE, MINI_CAST, state, "nobody")).toBeNull();
  });
});

describe("summarizeBoard", () => {
  it("counts fits and rule-outs per candidate in candidate order", () => {
    let state = pinAll(revealAll(DIRECT_CASE, createCaseState(DIRECT_CASE)));
    state = giveFits(state, "p1", ["d-c1", "d-c2"]);
    state = must(linkClue(state, "d-c1", "p3", "rules-out"));
    state = must(linkClue(state, "d-c2", "p2", "rules-out"));
    state = must(linkClue(state, "d-c3", "p2", "rules-out"));
    expect(summarizeBoard(DIRECT_CASE, state)).toEqual([
      { personId: "p1", fits: 2, rulesOut: 0, returned: false },
      { personId: "p2", fits: 0, rulesOut: 2, returned: false },
      { personId: "p3", fits: 0, rulesOut: 1, returned: false },
    ]);
  });

  it("marks returned candidates", () => {
    let state = pinAll(revealAll(DIRECT_CASE, createCaseState(DIRECT_CASE)));
    state = giveFits(state, "p3", ["d-c1", "d-c2"]);
    const result = accuse(DIRECT_CASE, state, "p3");
    if (!result.ok) throw new Error("rejected");
    expect(summarizeBoard(DIRECT_CASE, result.state)[2]).toEqual({
      personId: "p3",
      fits: 2,
      rulesOut: 0,
      returned: true,
    });
  });
});
