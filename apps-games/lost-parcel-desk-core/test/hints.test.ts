import { describe, expect, it } from "vitest";
import { nextUnresolvedDeduction, requestHint } from "../src/hints";
import { createCaseState, inspectObject, linkClue, pinClue, unpinClue } from "../src/state";
import type { CaseDef, CaseState, HintResult } from "../src/types";
import { DIRECT_CASE, PAIR_CASE } from "./fixtures/cases";
import { MINI_CAST } from "./fixtures/cast";
import { must } from "./fixtures/helpers";

function hinted(def: CaseDef, state: CaseState) {
  const result: HintResult = requestHint(def, MINI_CAST, state);
  if (!result.ok) throw new Error(`rejected ${result.reason}`);
  return result;
}

describe("requestHint", () => {
  it("resolves the first deduction first with canonical links to all three candidates", () => {
    const result = hinted(DIRECT_CASE, createCaseState(DIRECT_CASE));
    expect(result.deductionId).toBe("d-D1");
    expect(result.clueIds).toEqual(["d-c1"]);
    expect(result.links).toEqual([
      { clueId: "d-c1", personId: "p1", kind: "fits" },
      { clueId: "d-c1", personId: "p2", kind: "fits" },
      { clueId: "d-c1", personId: "p3", kind: "rules-out" },
    ]);
    expect(result.state.foundClueIds).toEqual(["d-c1"]);
    expect(result.state.pinnedClueIds).toEqual(["d-c1"]);
    expect(result.state.links).toEqual(result.links);
    expect(result.state.hintsUsed).toBe(1);
    expect(result.explanation).toBe(
      "The owner's street is Quay Road. Fits: Ada, Ben. Rules out: Cleo.",
    );
  });

  it("takes the second deduction on the next hint", () => {
    const first = hinted(DIRECT_CASE, createCaseState(DIRECT_CASE));
    const second = hinted(DIRECT_CASE, first.state);
    expect(second.deductionId).toBe("d-D2");
    expect(second.links).toEqual([
      { clueId: "d-c2", personId: "p1", kind: "fits" },
      { clueId: "d-c2", personId: "p2", kind: "rules-out" },
      { clueId: "d-c2", personId: "p3", kind: "fits" },
    ]);
    expect(second.state.hintsUsed).toBe(2);
    expect(second.state.links).toHaveLength(6);
  });

  it("pins both clues of a pair deduction and links each to all candidates", () => {
    const result = hinted(PAIR_CASE, createCaseState(PAIR_CASE));
    expect(result.deductionId).toBe("p-D1");
    expect(result.clueIds).toEqual(["p-c1", "p-c2"]);
    expect(result.state.pinnedClueIds).toEqual(["p-c1", "p-c2"]);
    expect(result.links).toHaveLength(6);
    expect(result.links.filter((link) => link.kind === "rules-out")).toEqual([
      { clueId: "p-c1", personId: "p2", kind: "rules-out" },
      { clueId: "p-c2", personId: "p2", kind: "rules-out" },
    ]);
  });

  it("skips a deduction the player already linked correctly", () => {
    let state = must(inspectObject(DIRECT_CASE, createCaseState(DIRECT_CASE), "direct-o1"));
    state = must(pinClue(state, "d-c1"));
    state = must(linkClue(state, "d-c1", "p1", "fits"));
    state = must(linkClue(state, "d-c1", "p2", "fits"));
    state = must(linkClue(state, "d-c1", "p3", "rules-out"));
    expect(nextUnresolvedDeduction(DIRECT_CASE, MINI_CAST, state)?.id).toBe("d-D2");
    const result = hinted(DIRECT_CASE, state);
    expect(result.deductionId).toBe("d-D2");
    expect(result.state.hintsUsed).toBe(1);
  });

  it("still hints a deduction whose links are partly wrong and corrects them", () => {
    let state = must(inspectObject(DIRECT_CASE, createCaseState(DIRECT_CASE), "direct-o1"));
    state = must(pinClue(state, "d-c1"));
    state = must(linkClue(state, "d-c1", "p1", "fits"));
    state = must(linkClue(state, "d-c1", "p3", "fits"));
    const result = hinted(DIRECT_CASE, state);
    expect(result.deductionId).toBe("d-D1");
    expect(result.state.links.find((link) => link.personId === "p3")?.kind).toBe("rules-out");
  });

  it("answers NOTHING_TO_HINT when both deductions are resolved", () => {
    let state = createCaseState(DIRECT_CASE);
    state = hinted(DIRECT_CASE, state).state;
    state = hinted(DIRECT_CASE, state).state;
    expect(nextUnresolvedDeduction(DIRECT_CASE, MINI_CAST, state)).toBeNull();
    expect(requestHint(DIRECT_CASE, MINI_CAST, state)).toEqual({
      ok: false,
      state,
      reason: "NOTHING_TO_HINT",
    });
  });

  it("answers HINT_LIMIT after two hints even if a deduction was undone", () => {
    let state = createCaseState(DIRECT_CASE);
    state = hinted(DIRECT_CASE, state).state;
    state = hinted(DIRECT_CASE, state).state;
    state = must(unpinClue(state, "d-c1"));
    expect(requestHint(DIRECT_CASE, MINI_CAST, state)).toEqual({
      ok: false,
      state,
      reason: "HINT_LIMIT",
    });
  });

  it("answers CASE_CLOSED on a closed case", () => {
    const state = { ...createCaseState(DIRECT_CASE), closed: true };
    expect(requestHint(DIRECT_CASE, MINI_CAST, state)).toEqual({
      ok: false,
      state,
      reason: "CASE_CLOSED",
    });
  });

  it("never mutates its input", () => {
    const state = createCaseState(DIRECT_CASE);
    const before = JSON.stringify(state);
    hinted(DIRECT_CASE, state);
    expect(JSON.stringify(state)).toBe(before);
  });
});
