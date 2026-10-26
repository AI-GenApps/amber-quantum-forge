import { describe, expect, it } from "vitest";
import { analyseCase } from "../src/analyse";
import type { CaseDef, CaseIssueCode } from "../src/types";
import {
  AMBIGUOUS_CASE,
  clone,
  DIRECT_CASE,
  GOOD_CASES,
  PAIR_CASE,
  REDUNDANT_CASE,
  RULE_OUT_CASE,
} from "./fixtures/cases";
import { MINI_CAST } from "./fixtures/cast";

function codes(def: CaseDef): CaseIssueCode[] {
  return analyseCase(def, MINI_CAST).map((issue) => issue.code);
}

describe("analyseCase on fixtures", () => {
  for (const def of GOOD_CASES) {
    it(`accepts the good fixture ${def.id}`, () => {
      expect(analyseCase(def, MINI_CAST)).toEqual([]);
    });
  }

  it("reports NO_UNIQUE_OWNER for the ambiguous fixture", () => {
    expect(analyseCase(AMBIGUOUS_CASE, MINI_CAST)).toEqual([
      { code: "NO_UNIQUE_OWNER", caseId: "ambiguous", subjectId: "ambiguous" },
    ]);
  });

  it("reports DEDUCTION_NOT_NECESSARY for the redundant fixture", () => {
    expect(analyseCase(REDUNDANT_CASE, MINI_CAST)).toEqual([
      { code: "DEDUCTION_NOT_NECESSARY", caseId: "redundant", subjectId: "x-D1" },
    ]);
  });
});

interface Mutation {
  name: string;
  expected: CaseIssueCode;
  subject: string;
  apply: () => CaseDef;
}

function mutations(): Mutation[] {
  return [
    {
      name: "swap the owner",
      expected: "WRONG_OWNER",
      subject: "p2",
      apply: () => ({ ...clone(DIRECT_CASE), ownerId: "p2" }),
    },
    {
      name: "drop a deduction",
      expected: "TOO_FEW_DEDUCTIONS",
      subject: "direct",
      apply: () => {
        const def = clone(DIRECT_CASE);
        def.deductions = def.deductions.slice(0, 1);
        const orphan = def.clues.find((clue) => clue.id === "d-c2");
        if (orphan) orphan.flavour = true;
        return def;
      },
    },
    {
      name: "duplicate a candidate",
      expected: "DUPLICATE_CANDIDATE",
      subject: "p1",
      apply: () => ({ ...clone(DIRECT_CASE), candidateIds: ["p1", "p1", "p3"] }),
    },
    {
      name: "make a deduction redundant",
      expected: "DEDUCTION_NOT_NECESSARY",
      subject: "r-D2",
      apply: () => {
        const def = clone(RULE_OUT_CASE);
        const first = def.deductions[0];
        if (first) {
          first.facet = "street";
          first.value = "Mill Lane";
        }
        return def;
      },
    },
    {
      name: "put a lead clue in two deductions",
      expected: "CLUE_IN_TWO_DEDUCTIONS",
      subject: "p-c3",
      apply: () => {
        const def = clone(PAIR_CASE);
        const first = def.deductions[0];
        if (first) first.clueIds = ["p-c1", "p-c3"];
        const displaced = def.clues.find((clue) => clue.id === "p-c2");
        if (displaced) displaced.flavour = true;
        return def;
      },
    },
    {
      name: "flag a lead clue as flavour",
      expected: "LEAD_CLUE_FLAGGED_FLAVOUR",
      subject: "d-c1",
      apply: () => {
        const def = clone(DIRECT_CASE);
        const lead = def.clues.find((clue) => clue.id === "d-c1");
        if (lead) lead.flavour = true;
        return def;
      },
    },
    {
      name: "duplicate a face",
      expected: "DUPLICATE_FACE",
      subject: "d-c5",
      apply: () => {
        const def = clone(DIRECT_CASE);
        const extra = def.clues.find((clue) => clue.id === "d-c5");
        if (extra) extra.face = "front";
        return def;
      },
    },
    {
      name: "leave an object clueless",
      expected: "OBJECT_WITHOUT_CLUE",
      subject: "direct-o5",
      apply: () => {
        const def = clone(DIRECT_CASE);
        def.objects.push({ id: "direct-o5", name: "Empty", caption: "Nothing here" });
        return def;
      },
    },
    {
      name: "make a pair single",
      expected: "PAIR_NEEDS_TWO_CLUES",
      subject: "p-D1",
      apply: () => {
        const def = clone(PAIR_CASE);
        const first = def.deductions[0];
        if (first) first.clueIds = ["p-c1"];
        const orphan = def.clues.find((clue) => clue.id === "p-c2");
        if (orphan) orphan.flavour = true;
        return def;
      },
    },
    {
      name: "flip a polarity",
      expected: "POLARITY_KIND_MISMATCH",
      subject: "d-D1",
      apply: () => {
        const def = clone(DIRECT_CASE);
        const first = def.deductions[0];
        if (first) first.polarity = "isnot";
        return def;
      },
    },
  ];
}

describe("analyseCase on generated mutations", () => {
  for (const mutation of mutations()) {
    it(`${mutation.name} reports exactly ${mutation.expected}`, () => {
      const def = mutation.apply();
      const issues = analyseCase(def, MINI_CAST);
      expect(issues).toEqual([
        { code: mutation.expected, caseId: def.id, subjectId: mutation.subject },
      ]);
    });
  }
});

describe("analyseCase remaining codes", () => {
  it("reports BAD_CANDIDATE_COUNT", () => {
    expect(codes({ ...clone(DIRECT_CASE), candidateIds: ["p1", "p2"] })).toEqual([
      "BAD_CANDIDATE_COUNT",
    ]);
  });

  it("reports OWNER_NOT_CANDIDATE", () => {
    expect(codes({ ...clone(DIRECT_CASE), ownerId: "p5" })).toEqual(["OWNER_NOT_CANDIDATE"]);
  });

  it("reports UNKNOWN_PERSON", () => {
    expect(codes({ ...clone(DIRECT_CASE), candidateIds: ["p1", "p2", "ghost"] })).toEqual([
      "UNKNOWN_PERSON",
    ]);
  });

  it("reports TOO_MANY_DEDUCTIONS", () => {
    const def = clone(DIRECT_CASE);
    def.deductions.push({
      id: "d-D3",
      facet: "pet",
      polarity: "is",
      value: "cat",
      kind: "direct",
      clueIds: ["d-c3"],
    });
    const lead = def.clues.find((clue) => clue.id === "d-c3");
    if (lead) delete lead.flavour;
    expect(codes(def)).toEqual(["TOO_MANY_DEDUCTIONS"]);
  });

  it("reports SINGLE_NEEDS_ONE_CLUE for a direct deduction with two clues", () => {
    const def = clone(DIRECT_CASE);
    const first = def.deductions[0];
    if (first) first.clueIds = ["d-c1", "d-c5"];
    const second = def.clues.find((clue) => clue.id === "d-c5");
    if (second) delete second.flavour;
    expect(codes(def)).toEqual(["SINGLE_NEEDS_ONE_CLUE"]);
  });

  it("counts a clue repeated inside one pair as a single clue", () => {
    const def = clone(PAIR_CASE);
    const first = def.deductions[0];
    if (first) first.clueIds = ["p-c1", "p-c1"];
    const orphan = def.clues.find((clue) => clue.id === "p-c2");
    if (orphan) orphan.flavour = true;
    expect(codes(def)).toEqual(["PAIR_NEEDS_TWO_CLUES"]);
  });

  it("reports UNKNOWN_CLUE", () => {
    const def = clone(DIRECT_CASE);
    const first = def.deductions[0];
    if (first) first.clueIds = ["nope"];
    const orphan = def.clues.find((clue) => clue.id === "d-c1");
    if (orphan) orphan.flavour = true;
    expect(codes(def)).toEqual(["UNKNOWN_CLUE"]);
  });

  it("reports UNKNOWN_OBJECT", () => {
    const def = clone(DIRECT_CASE);
    const stray = def.clues.find((clue) => clue.id === "d-c6");
    if (stray) stray.objectId = "nowhere";
    expect(codes(def)).toEqual(["UNKNOWN_OBJECT"]);
  });

  it("reports an unmarked clue that no deduction uses", () => {
    const def = clone(DIRECT_CASE);
    const stray = def.clues.find((clue) => clue.id === "d-c6");
    if (stray) delete stray.flavour;
    expect(analyseCase(def, MINI_CAST)).toEqual([
      { code: "FLAVOUR_CLUE_IN_DEDUCTION", caseId: "direct", subjectId: "d-c6" },
    ]);
  });

  it("reports a rule-out deduction written with the is polarity", () => {
    const def = clone(RULE_OUT_CASE);
    const second = def.deductions[1];
    if (second) second.polarity = "is";
    expect(codes(def)).toEqual(["POLARITY_KIND_MISMATCH"]);
  });

  it("never lets later stages run when candidates are broken", () => {
    const def = { ...clone(DIRECT_CASE), candidateIds: ["p1", "p1", "p3"], deductions: [] };
    expect(codes(def)).toEqual(["DUPLICATE_CANDIDATE"]);
  });
});
