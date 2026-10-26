import type { CaseDef, Clue, ClueFace, EvidenceObject } from "../../src/types";

function objects(count: number, prefix: string): EvidenceObject[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-o${index + 1}`,
    name: `Object ${index + 1}`,
    caption: `Caption ${index + 1}`,
  }));
}

function clue(
  id: string,
  objectId: string,
  face: ClueFace,
  tag: string,
  flavour = false,
): Clue {
  const base: Clue = { id, objectId, face, tag, text: `Text for ${tag}` };
  return flavour ? { ...base, flavour: true } : base;
}

export const DIRECT_CASE: CaseDef = {
  id: "direct",
  ownerId: "p1",
  candidateIds: ["p1", "p2", "p3"],
  objects: objects(4, "direct"),
  clues: [
    clue("d-c1", "direct-o1", "front", "river grit"),
    clue("d-c2", "direct-o2", "back", "hooks and weights"),
    clue("d-c3", "direct-o3", "front", "faded postcard", true),
    clue("d-c4", "direct-o4", "front", "brass button", true),
    clue("d-c5", "direct-o1", "zoom", "pencilled date", true),
    clue("d-c6", "direct-o4", "back", "folded corner", true),
  ],
  deductions: [
    {
      id: "d-D1",
      facet: "street",
      polarity: "is",
      value: "Quay Road",
      kind: "direct",
      clueIds: ["d-c1"],
    },
    {
      id: "d-D2",
      facet: "pastime",
      polarity: "is",
      value: "angling",
      kind: "direct",
      clueIds: ["d-c2"],
    },
  ],
};

export const PAIR_CASE: CaseDef = {
  id: "pair",
  ownerId: "p4",
  candidateIds: ["p4", "p1", "p2"],
  objects: objects(4, "pair"),
  clues: [
    clue("p-c1", "pair-o1", "front", "copper hair strand"),
    clue("p-c2", "pair-o2", "zoom", "hair-colour note"),
    clue("p-c3", "pair-o3", "back", "paw prints"),
    clue("p-c4", "pair-o4", "front", "plain string", true),
    clue("p-c5", "pair-o2", "front", "creased wrapper", true),
  ],
  deductions: [
    {
      id: "p-D1",
      facet: "look",
      polarity: "is",
      value: "red hair",
      kind: "pair",
      clueIds: ["p-c1", "p-c2"],
    },
    {
      id: "p-D2",
      facet: "pet",
      polarity: "is",
      value: "dog",
      kind: "direct",
      clueIds: ["p-c3"],
    },
  ],
};

export const RULE_OUT_CASE: CaseDef = {
  id: "ruleout",
  ownerId: "p3",
  candidateIds: ["p3", "p2", "p6"],
  objects: objects(4, "ruleout"),
  clues: [
    clue("r-c1", "ruleout-o1", "front", "lens cloth"),
    clue("r-c2", "ruleout-o2", "back", "spotless paper"),
    clue("r-c3", "ruleout-o3", "front", "ticket stub", true),
    clue("r-c4", "ruleout-o4", "front", "shoe polish", true),
    clue("r-c5", "ruleout-o3", "zoom", "tiny tick", true),
  ],
  deductions: [
    {
      id: "r-D1",
      facet: "look",
      polarity: "is",
      value: "spectacles",
      kind: "direct",
      clueIds: ["r-c1"],
    },
    {
      id: "r-D2",
      facet: "pet",
      polarity: "isnot",
      value: "dog",
      kind: "rule-out",
      clueIds: ["r-c2"],
    },
  ],
};

export const AMBIGUOUS_CASE: CaseDef = {
  id: "ambiguous",
  ownerId: "p1",
  candidateIds: ["p1", "p2", "p3"],
  objects: objects(3, "ambiguous"),
  clues: [
    clue("a-c1", "ambiguous-o1", "front", "river grit"),
    clue("a-c2", "ambiguous-o2", "front", "no tall hems"),
    clue("a-c3", "ambiguous-o3", "front", "loose thread", true),
  ],
  deductions: [
    {
      id: "a-D1",
      facet: "street",
      polarity: "is",
      value: "Quay Road",
      kind: "direct",
      clueIds: ["a-c1"],
    },
    {
      id: "a-D2",
      facet: "look",
      polarity: "isnot",
      value: "tall",
      kind: "rule-out",
      clueIds: ["a-c2"],
    },
  ],
};

export const REDUNDANT_CASE: CaseDef = {
  id: "redundant",
  ownerId: "p1",
  candidateIds: ["p1", "p2", "p3"],
  objects: objects(3, "redundant"),
  clues: [
    clue("x-c1", "redundant-o1", "front", "river grit"),
    clue("x-c2", "redundant-o2", "front", "copper hairs"),
    clue("x-c3", "redundant-o3", "front", "loose thread", true),
  ],
  deductions: [
    {
      id: "x-D1",
      facet: "street",
      polarity: "is",
      value: "Quay Road",
      kind: "direct",
      clueIds: ["x-c1"],
    },
    {
      id: "x-D2",
      facet: "look",
      polarity: "is",
      value: "red hair",
      kind: "direct",
      clueIds: ["x-c2"],
    },
  ],
};

export const GOOD_CASES: CaseDef[] = [DIRECT_CASE, PAIR_CASE, RULE_OUT_CASE];

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value)) deepFreeze(inner);
  }
  return value;
}
