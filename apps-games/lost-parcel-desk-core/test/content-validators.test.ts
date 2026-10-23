import { describe, expect, it } from "vitest";
import type { CaseContent, ContentIssue, ContentSet, GlyphKind, PersonContent } from "../src";
import { CASE_BY_ID, PEOPLE, SHIPPED_CONTENT, validateCase, validateContent } from "../src";

function copyCase(id: string): CaseContent {
  const found = CASE_BY_ID[id];
  if (found === undefined) throw new Error(`no case ${id}`);
  return structuredClone(found) as CaseContent;
}

function codes(issues: ContentIssue[]): string[] {
  return issues.map((issue) => `${issue.code}:${issue.subjectId}`);
}

function withCases(cases: CaseContent[]): ContentSet {
  return { ...SHIPPED_CONTENT, cases };
}

function replaceCase(replacement: CaseContent): CaseContent[] {
  return SHIPPED_CONTENT.cases.map((item) => (item.id === replacement.id ? replacement : item));
}

function mutateClue(item: CaseContent, clueId: string, patch: Record<string, unknown>) {
  const clue = item.clues.find((entry) => entry.id === clueId);
  if (clue === undefined) throw new Error(`no clue ${clueId}`);
  Object.assign(clue, patch);
}

describe("the shipped content", () => {
  it("passes validateContent with no issues", () => {
    expect(validateContent()).toEqual([]);
  });

  it("passes validateCase for each case", () => {
    for (const item of SHIPPED_CONTENT.cases) expect(validateCase(item, PEOPLE)).toEqual([]);
  });
});

describe("validateCase catches broken copies", () => {
  it("a flavour clue that names a separating keyword", () => {
    const item = copyCase("01");
    mutateClue(item, "01-c3", {
      text: "Two tiny drawn hooks sit under a note that says wish you were here.",
    });
    expect(codes(validateCase(item, PEOPLE))).toEqual(["FLAVOUR_KEYWORD_LEAK:01-c3"]);
  });

  it("a flavour tag that names a separating keyword", () => {
    const item = copyCase("01");
    mutateClue(item, "01-c4", { tag: "hand-knitted label, copper hairs on wool and collars" });
    expect(codes(validateCase(item, PEOPLE))).toEqual(["FLAVOUR_KEYWORD_LEAK:01-c4"]);
  });

  it("a flavour-only object name that names a separating keyword", () => {
    const item = copyCase("01");
    const target = item.objects.find((entry) => entry.id === "01-4");
    if (target === undefined) throw new Error("no object");
    target.name = "Pocket compass with hooks";
    expect(codes(validateCase(item, PEOPLE))).toEqual(["OBJECT_KEYWORD_LEAK:01-4"]);
  });

  it("a trade word in a caption", () => {
    const item = copyCase("01");
    const target = item.objects.find((entry) => entry.id === "01-1");
    if (target === undefined) throw new Error("no object");
    target.caption = "A faded seaside view, sent by the ferry company but never posted.";
    expect(codes(validateCase(item, PEOPLE))).toEqual(["TRADE_WORD:01-1"]);
  });

  it("a trade word in a clue text", () => {
    const item = copyCase("02");
    mutateClue(item, "02-c4", {
      text: "The tin of lozenges is half eaten, a baker's habit perhaps.",
    });
    expect(codes(validateCase(item, PEOPLE))).toEqual(["TRADE_WORD:02-c4"]);
  });

  it("a hotspot outside the safe box", () => {
    const item = copyCase("01");
    mutateClue(item, "01-c1", { hotspot: { x: 100, y: 500 } });
    expect(codes(validateCase(item, PEOPLE))).toEqual(["HOTSPOT_BOUNDS:01-c1"]);
  });

  it("a zoom clue without a hotspot and a front clue with one", () => {
    const missing = copyCase("01");
    Reflect.deleteProperty(missing.clues.find((c) => c.id === "01-c1") ?? {}, "hotspot");
    expect(codes(validateCase(missing, PEOPLE))).toEqual(["HOTSPOT_MISSING:01-c1"]);
    const extra = copyCase("01");
    mutateClue(extra, "01-c2", { hotspot: { x: 500, y: 500 } });
    expect(codes(validateCase(extra, PEOPLE))).toEqual(["HOTSPOT_UNEXPECTED:01-c2"]);
  });

  it("two hotspots too close on one object", () => {
    const item = copyCase("01");
    mutateClue(item, "01-c4", { face: "zoom", hotspot: { x: 640, y: 400 } });
    const found = codes(validateCase(item, PEOPLE));
    expect(found).toContain("DUPLICATE_FACE:01-c4");
    const forced = validateCase(item, PEOPLE).filter((entry) => entry.code === "HOTSPOT_CLOSE");
    expect(forced.map((entry) => entry.subjectId)).toEqual(["01-c4"]);
  });

  it("a case with three objects", () => {
    const item = copyCase("01");
    item.objects = item.objects.filter((entry) => entry.id !== "01-4");
    item.clues = item.clues.filter((entry) => entry.objectId !== "01-4");
    expect(codes(validateCase(item, PEOPLE))).toEqual(["OBJECT_COUNT:01"]);
  });

  it("case 12 with four objects", () => {
    const item = copyCase("12");
    item.objects = item.objects.filter((entry) => entry.id !== "12-5");
    item.clues = item.clues.filter((entry) => entry.objectId !== "12-5");
    expect(codes(validateCase(item, PEOPLE))).toEqual(["OBJECT_COUNT:12"]);
  });

  it("a reveal that is too short or too long", () => {
    const short = copyCase("01");
    short.reveal = "Odalie Fenn did it.";
    expect(codes(validateCase(short, PEOPLE))).toEqual(["REVEAL_LENGTH:01"]);
    const long = copyCase("01");
    long.reveal = `Odalie Fenn ${"owns it. ".repeat(60)}`;
    expect(codes(validateCase(long, PEOPLE))).toEqual(["REVEAL_LENGTH:01"]);
  });

  it("a reveal that does not name the owner", () => {
    const item = copyCase("01");
    item.reveal = item.reveal.replace("Odalie Fenn", "somebody");
    expect(codes(validateCase(item, PEOPLE))).toEqual(["REVEAL_MISSING_OWNER:01"]);
  });

  it("a pair in case 03 and a rule-out in case 05", () => {
    const pair = copyCase("03");
    const first = pair.deductions[0];
    if (first === undefined) throw new Error("no deduction");
    first.kind = "pair";
    first.clueIds = ["03-c1", "03-c3"];
    Reflect.deleteProperty(pair.clues.find((c) => c.id === "03-c3") ?? {}, "flavour");
    expect(codes(validateCase(pair, PEOPLE))).toEqual(["MECHANIC_GATING:03-D1"]);

    const ruleOut = copyCase("05");
    const second = ruleOut.deductions[1];
    if (second === undefined) throw new Error("no deduction");
    second.kind = "rule-out";
    second.polarity = "isnot";
    second.value = "walking stick";
    expect(codes(validateCase(ruleOut, PEOPLE))).toEqual(["MECHANIC_GATING:05-D2"]);
  });

  it("a missing or wrong art slot", () => {
    const empty = copyCase("02");
    const target = empty.objects[0];
    if (target === undefined) throw new Error("no object");
    target.artSlot = "";
    expect(codes(validateCase(empty, PEOPLE))).toEqual(["ART_SLOT:02-1"]);
    const postcard = copyCase("01");
    const card = postcard.objects[0];
    if (card === undefined) throw new Error("no object");
    card.artSlot = "evidence-01-1";
    expect(codes(validateCase(postcard, PEOPLE))).toEqual(["ART_SLOT:01-1"]);
  });

  it("an unknown glyph", () => {
    const item = copyCase("01");
    const target = item.objects[0];
    if (target === undefined) throw new Error("no object");
    target.glyph = "teapot" as GlyphKind;
    expect(codes(validateCase(item, PEOPLE))).toEqual(["GLYPH_INVALID:01-1"]);
  });

  it("text length, sentence, charset and name rules", () => {
    const item = copyCase("01");
    mutateClue(item, "01-c3", { text: "Too short." });
    mutateClue(item, "01-c4", { text: "A label with two sentences. The second one is here." });
    mutateClue(item, "01-c5", {
      text: "Someone engraved a smiley \u{1F600} on the lid of the compass.",
    });
    mutateClue(item, "01-c2", {
      text: "Odalie left her glove on the sorting table with mud on the cuff.",
    });
    const target = item.objects[1];
    if (target === undefined) throw new Error("no object");
    target.caption = "x".repeat(81);
    expect(codes(validateCase(item, PEOPLE)).sort()).toEqual(
      [
        "CAPTION_LENGTH:01-2",
        "CLUE_TEXT_LENGTH:01-c3",
        "CLUE_TEXT_SENTENCES:01-c4",
        "NAMES_PERSON:01-c2",
        "TEXT_CHARSET:01-c5",
      ].sort(),
    );
  });

  it("a label that is long or names a street", () => {
    const long = copyCase("01");
    long.labelText = "A very long torn label that carries on and on well past the limit.";
    expect(codes(validateCase(long, PEOPLE))).toEqual(["LABEL_LENGTH:01"]);
    const address = copyCase("01");
    address.labelText = "Quay Road, torn at the corner.";
    expect(codes(validateCase(address, PEOPLE))).toEqual(["LABEL_LEAK:01"]);
  });

  it("empty and placeholder text", () => {
    const item = copyCase("01");
    item.foundAt = "  ";
    item.ledgerTitle = "TODO ledger";
    expect(codes(validateCase(item, PEOPLE)).sort()).toEqual([
      "EMPTY_TEXT:01",
      "TEXT_PLACEHOLDER:01",
    ]);
  });

  it("wrong chapter, owner, difficulty and par", () => {
    const item = copyCase("05");
    item.chapter = 1;
    item.ownerId = "p01";
    item.difficulty = 6;
    item.parMinutes = 0;
    const found = codes(validateCase(item, PEOPLE));
    expect(found).toEqual(
      expect.arrayContaining([
        "CHAPTER_MISMATCH:05",
        "OWNER_MISMATCH:p01",
        "BAD_DIFFICULTY:05",
        "BAD_PAR:05",
      ]),
    );
  });

  it("surfaces core analyseCase issues", () => {
    const item = copyCase("01");
    item.ownerId = "p10";
    expect(codes(validateCase(item, PEOPLE))).toEqual(expect.arrayContaining(["WRONG_OWNER:p10"]));
  });
});

describe("validateContent catches broken sets", () => {
  it("a duplicate title", () => {
    const second = copyCase("02");
    second.title = copyCase("01").title;
    expect(codes(validateContent(withCases(replaceCase(second))))).toEqual([
      "DUPLICATE_TITLE:The Seaside Postcard",
    ]);
  });

  it("a duplicate slug and duplicate clue text", () => {
    const second = copyCase("02");
    second.slug = copyCase("01").slug;
    mutateClue(second, "02-c3", { text: copyCase("01").clues[2]?.text ?? "" });
    const found = codes(validateContent(withCases(replaceCase(second))));
    expect(found).toContain("DUPLICATE_SLUG:seaside-postcard");
    expect(found.some((entry) => entry.startsWith("DUPLICATE_CLUE_TEXT"))).toBe(true);
  });

  it("a missing case breaks the totals and the order", () => {
    const found = codes(validateContent(withCases(SHIPPED_CONTENT.cases.slice(0, 11))));
    expect(found).toEqual(
      expect.arrayContaining([
        "TOTAL_MISMATCH:cases",
        "TOTAL_MISMATCH:objects",
        "PERSON_OWNERSHIP:p12",
      ]),
    );
  });

  it("cases out of order", () => {
    const reversed = [...SHIPPED_CONTENT.cases].reverse();
    expect(codes(validateContent(withCases(reversed)))).toContain("CASE_ORDER:12");
  });

  it("a person with a value held by three", () => {
    const people: PersonContent[] = structuredClone([...PEOPLE]);
    const target = people.find((person) => person.id === "p03");
    if (target === undefined) throw new Error("no person");
    target.facets.street = "Quay Road";
    const found = codes(validateContent({ ...SHIPPED_CONTENT, people }));
    expect(found).toContain("VALUE_HOLDERS:street:Quay Road");
    expect(found).toContain("VALUE_HOLDERS:street:Tanner's Row");
  });

  it("a person who appears in only one case", () => {
    const item = copyCase("07");
    item.candidateIds = ["p07", "p02", "p01"];
    const found = codes(validateContent(withCases(replaceCase(item))));
    expect(found).toContain("PERSON_APPEARANCES:p03");
  });

  it("a ledger, achievement, theme, card or tutorial slip", () => {
    const broken: ContentSet = {
      ...SHIPPED_CONTENT,
      ledger: SHIPPED_CONTENT.ledger.slice(1),
      achievements: SHIPPED_CONTENT.achievements.slice(1),
      themes: SHIPPED_CONTENT.themes.slice(1),
      cards: SHIPPED_CONTENT.cards.slice(1),
      tutorial: SHIPPED_CONTENT.tutorial.slice(1),
    };
    const found = codes(validateContent(broken));
    expect(found).toEqual(
      expect.arrayContaining([
        "LEDGER_MISMATCH:count",
        "ACHIEVEMENT_MISMATCH:count",
        "THEME_MISMATCH:count",
        "CARD_MISMATCH:count",
        "TUTORIAL_MISMATCH:count",
      ]),
    );
  });

  it("a chapter with the wrong unlock", () => {
    const chapters = SHIPPED_CONTENT.chapters.map((chapter) =>
      chapter.id === 2 ? { ...chapter, unlockStamps: 8 } : chapter,
    );
    expect(codes(validateContent({ ...SHIPPED_CONTENT, chapters }))).toEqual(["CHAPTER_UNLOCK:2"]);
  });

  it("a place that does not match the owner's street", () => {
    const places = SHIPPED_CONTENT.places.map((place) =>
      place.caseId === "01" ? { ...place, street: "Mill Lane" } : place,
    );
    expect(codes(validateContent({ ...SHIPPED_CONTENT, places }))).toEqual(["PLACE_MISMATCH:01"]);
  });
});
