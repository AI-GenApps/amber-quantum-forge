import { describe, expect, it } from "vitest";
import {
  canonicalLink,
  consistentCandidates,
  deductionOfClue,
  eliminatedBy,
  leadClueIds,
  satisfies,
} from "../src/logic";
import type { Deduction } from "../src/types";
import { DIRECT_CASE, PAIR_CASE, RULE_OUT_CASE } from "./fixtures/cases";
import { MINI_CAST } from "./fixtures/cast";
import { at } from "./fixtures/helpers";

const ada = at(MINI_CAST, 0);
const ben = at(MINI_CAST, 1);
const cleo = at(MINI_CAST, 2);
const dev = at(MINI_CAST, 3);
const esme = at(MINI_CAST, 4);

function deduction(
  facet: Deduction["facet"],
  polarity: Deduction["polarity"],
  value: string,
): Deduction {
  return { id: "x", facet, polarity, value, kind: "direct", clueIds: [] };
}

describe("satisfies", () => {
  it("is polarity holds the value on every facet", () => {
    expect(satisfies(ada, deduction("street", "is", "Quay Road"))).toBe(true);
    expect(satisfies(ada, deduction("pastime", "is", "angling"))).toBe(true);
    expect(satisfies(ada, deduction("look", "is", "red hair"))).toBe(true);
    expect(satisfies(ada, deduction("pet", "is", "cat"))).toBe(true);
    expect(satisfies(ben, deduction("street", "is", "Mill Lane"))).toBe(false);
    expect(satisfies(ben, deduction("pastime", "is", "angling"))).toBe(false);
    expect(satisfies(ben, deduction("look", "is", "tall"))).toBe(false);
    expect(satisfies(ben, deduction("pet", "is", "cat"))).toBe(false);
  });

  it("isnot polarity is the exact opposite on every facet", () => {
    expect(satisfies(cleo, deduction("street", "isnot", "Mill Lane"))).toBe(false);
    expect(satisfies(cleo, deduction("pastime", "isnot", "angling"))).toBe(false);
    expect(satisfies(cleo, deduction("look", "isnot", "spectacles"))).toBe(false);
    expect(satisfies(cleo, deduction("pet", "isnot", "canary"))).toBe(false);
    expect(satisfies(dev, deduction("street", "isnot", "Quay Road"))).toBe(true);
    expect(satisfies(dev, deduction("pastime", "isnot", "angling"))).toBe(true);
    expect(satisfies(esme, deduction("look", "isnot", "red hair"))).toBe(true);
    expect(satisfies(esme, deduction("pet", "isnot", "dog"))).toBe(true);
  });
});

describe("consistentCandidates and eliminatedBy", () => {
  it("finds exactly the owner on each good fixture", () => {
    expect(consistentCandidates(DIRECT_CASE, MINI_CAST)).toEqual(["p1"]);
    expect(consistentCandidates(PAIR_CASE, MINI_CAST)).toEqual(["p4"]);
    expect(consistentCandidates(RULE_OUT_CASE, MINI_CAST)).toEqual(["p3"]);
  });

  it("keeps two candidates when one deduction is removed", () => {
    expect(consistentCandidates(DIRECT_CASE, MINI_CAST, ["d-D1"])).toEqual(["p1", "p2"]);
    expect(consistentCandidates(DIRECT_CASE, MINI_CAST, ["d-D2"])).toEqual(["p1", "p3"]);
    expect(consistentCandidates(PAIR_CASE, MINI_CAST, ["p-D1"])).toEqual(["p4", "p1"]);
    expect(consistentCandidates(PAIR_CASE, MINI_CAST, ["p-D2"])).toEqual(["p4", "p2"]);
    expect(consistentCandidates(RULE_OUT_CASE, MINI_CAST, ["r-D1"])).toEqual(["p3", "p2"]);
    expect(consistentCandidates(RULE_OUT_CASE, MINI_CAST, ["r-D2"])).toEqual(["p3", "p6"]);
  });

  it("returns every candidate when no deduction is active", () => {
    expect(consistentCandidates(DIRECT_CASE, MINI_CAST, [])).toEqual(["p1", "p2", "p3"]);
  });

  it("lists the candidates a single deduction rules out", () => {
    const d1 = at(DIRECT_CASE.deductions, 0);
    const d2 = at(DIRECT_CASE.deductions, 1);
    expect(eliminatedBy(DIRECT_CASE, MINI_CAST, d1)).toEqual(["p3"]);
    expect(eliminatedBy(DIRECT_CASE, MINI_CAST, d2)).toEqual(["p2"]);
    const [pairDeduction, petDeduction] = [
      at(PAIR_CASE.deductions, 0),
      at(PAIR_CASE.deductions, 1),
    ];
    expect(eliminatedBy(PAIR_CASE, MINI_CAST, pairDeduction)).toEqual(["p2"]);
    expect(eliminatedBy(PAIR_CASE, MINI_CAST, petDeduction)).toEqual(["p1"]);
    const [lookDeduction, noDog] = [
      at(RULE_OUT_CASE.deductions, 0),
      at(RULE_OUT_CASE.deductions, 1),
    ];
    expect(eliminatedBy(RULE_OUT_CASE, MINI_CAST, lookDeduction)).toEqual(["p6"]);
    expect(eliminatedBy(RULE_OUT_CASE, MINI_CAST, noDog)).toEqual(["p2"]);
  });
});

describe("canonicalLink and lead clues", () => {
  it("is fits for a candidate that satisfies the clue deduction", () => {
    expect(canonicalLink(DIRECT_CASE, MINI_CAST, "d-c1", "p1")).toBe("fits");
    expect(canonicalLink(DIRECT_CASE, MINI_CAST, "d-c1", "p2")).toBe("fits");
  });

  it("is rules-out for a candidate that does not", () => {
    expect(canonicalLink(DIRECT_CASE, MINI_CAST, "d-c1", "p3")).toBe("rules-out");
    expect(canonicalLink(RULE_OUT_CASE, MINI_CAST, "r-c2", "p2")).toBe("rules-out");
    expect(canonicalLink(RULE_OUT_CASE, MINI_CAST, "r-c2", "p6")).toBe("fits");
  });

  it("gives both clues of a pair the same link", () => {
    for (const personId of ["p4", "p1", "p2"]) {
      expect(canonicalLink(PAIR_CASE, MINI_CAST, "p-c1", personId)).toBe(
        canonicalLink(PAIR_CASE, MINI_CAST, "p-c2", personId),
      );
    }
    expect(canonicalLink(PAIR_CASE, MINI_CAST, "p-c2", "p2")).toBe("rules-out");
  });

  it("is null for flavour clues and unknown ids", () => {
    expect(canonicalLink(DIRECT_CASE, MINI_CAST, "d-c3", "p1")).toBeNull();
    expect(canonicalLink(DIRECT_CASE, MINI_CAST, "missing", "p1")).toBeNull();
    expect(canonicalLink(DIRECT_CASE, MINI_CAST, "d-c1", "nobody")).toBeNull();
  });

  it("lists lead clues in deduction order without repeats", () => {
    expect(leadClueIds(DIRECT_CASE)).toEqual(["d-c1", "d-c2"]);
    expect(leadClueIds(PAIR_CASE)).toEqual(["p-c1", "p-c2", "p-c3"]);
    expect(deductionOfClue(PAIR_CASE, "p-c2")?.id).toBe("p-D1");
    expect(deductionOfClue(PAIR_CASE, "p-c4")).toBeUndefined();
  });
});
