import { describe, expect, it } from "vitest";
import { parseRules } from "../src/content/define";
import type { ChallengeDef, ContentIssue, Look, MaxHues, Rule } from "../src/index";
import {
  CHALLENGES,
  CHAPTERS,
  CLIENTS,
  closetFor,
  PIECES,
  RULE_CARDS,
  validateCards,
  validateChallenge,
  validateChallengeIds,
  validateChapters,
  validateClients,
  validateContent,
  validatePieces,
} from "../src/index";

function codes(issues: readonly ContentIssue[]): string[] {
  return issues.map((entry) => entry.code);
}

function broken(base: ChallengeDef, patch: Partial<ChallengeDef>): ChallengeDef {
  return { ...base, ...patch };
}

const BASE = CHALLENGES[0] as ChallengeDef;
const CLOSET = closetFor(BASE.chapterIndex);
const FULL: Look = BASE.reference;

describe("validateChallenge", () => {
  it("accepts every shipped challenge", () => {
    for (const def of CHALLENGES) {
      expect(validateChallenge(def, closetFor(def.chapterIndex)), def.id).toEqual([]);
    }
  });

  it("rejects a malformed rule code", () => {
    expect(() => parseRules("warmth-max")).toThrow();
    expect(() => parseRules("sparkle:high")).toThrow();
    expect(() => parseRules("max-hues:9")).toThrow();
  });

  it("flags a rule argument outside its range", () => {
    const rules: Rule[] = [{ kind: "max-hues", max: 7 as MaxHues }, ...BASE.rules.slice(0, 1)];
    expect(codes(validateChallenge(broken(BASE, { rules }), CLOSET))).toEqual([
      "BAD_RULE_ARGUMENT",
    ]);
  });

  it("flags a formality rule above 5", () => {
    const rules: Rule[] = [{ kind: "formality-min", value: 9 }, ...BASE.rules.slice(0, 1)];
    expect(codes(validateChallenge(broken(BASE, { rules }), CLOSET))).toContain(
      "BAD_RULE_ARGUMENT",
    );
  });

  it("flags five rules", () => {
    const rules = parseRules(
      "warmth-max:9; needs-feature:shade; max-hues:3; max-spend:900; formality-min:1",
    );
    expect(codes(validateChallenge(broken(BASE, { rules }), CLOSET))).toEqual(["RULE_COUNT"]);
  });

  it("flags a single rule", () => {
    const rules = parseRules("max-hues:3");
    const found = validateChallenge(broken(BASE, { rules }), CLOSET);
    expect(codes(found)).toContain("RULE_COUNT");
  });

  it("flags nine slots through a custom slot-set table", () => {
    const slotSets = {
      A: ["top", "bottom", "dress", "outer", "shoes", "bag", "hat", "accessory", "accessory"],
    } as const;
    expect(codes(validateChallenge(BASE, CLOSET, { slotSets }))).toEqual(["SLOT_COUNT"]);
  });

  it("flags an unknown slot set", () => {
    const def = broken(BASE, { slotSet: "Z" as ChallengeDef["slotSet"] });
    expect(codes(validateChallenge(def, CLOSET))).toEqual(["UNKNOWN_SLOT_SET"]);
  });

  it("flags an unknown piece in a rule", () => {
    const rules = parseRules("avoid-piece:item-nowhere-1; warmth-max:2");
    expect(codes(validateChallenge(broken(BASE, { rules }), CLOSET))).toEqual(["UNKNOWN_PIECE"]);
  });

  it("flags a piece that is not in the unlock closet", () => {
    const rules = parseRules("include-piece:item-gala-1; warmth-max:9");
    expect(codes(validateChallenge(broken(BASE, { rules }), CLOSET))).toContain("UNKNOWN_PIECE");
  });

  it("flags a reference that misses a slot", () => {
    const { hat: _hat, ...rest } = FULL;
    expect(codes(validateChallenge(broken(BASE, { reference: rest }), CLOSET))).toEqual([
      "REFERENCE_INCOMPLETE",
    ]);
  });

  it("flags an illegal reference", () => {
    const reference: Look = { ...FULL, hat: "item-riviera-1" };
    expect(codes(validateChallenge(broken(BASE, { reference }), CLOSET))).toEqual([
      "REFERENCE_ILLEGAL",
    ]);
    const closed: Look = { ...FULL, outer: "item-rainy-city-1" };
    expect(codes(validateChallenge(broken(BASE, { reference: closed }), CLOSET))).toEqual([
      "REFERENCE_ILLEGAL",
    ]);
  });

  it("flags a reference that does not earn three stars", () => {
    const reference: Look = { ...FULL, hat: "item-riviera-7", accessory: "item-riviera-8" };
    const rules = parseRules("warmth-max:2; needs-feature:shade; formality-min:5");
    const def = broken(BASE, { reference, rules });
    const found = codes(validateChallenge(def, CLOSET));
    expect(found).toEqual(["REFERENCE_NOT_THREE_STARS"]);
  });

  it("flags an over-long and an empty brief", () => {
    expect(codes(validateChallenge(broken(BASE, { brief: "x".repeat(91) }), CLOSET))).toEqual([
      "BRIEF_TOO_LONG",
    ]);
    expect(codes(validateChallenge(broken(BASE, { brief: "  " }), CLOSET))).toEqual([
      "BRIEF_EMPTY",
    ]);
  });

  it("flags too few three-star looks and a share above the cap", () => {
    const few = validateChallenge(BASE, CLOSET, {
      proof: { looks: 72, threeStar: 1, sharePercent: 1.39 },
    });
    expect(codes(few)).toEqual(["TOO_FEW_THREE_STAR"]);
    const wide = validateChallenge(BASE, CLOSET, {
      proof: { looks: 72, threeStar: 40, sharePercent: 55 },
    });
    expect(codes(wide)).toEqual(["THREE_STAR_SHARE"]);
  });
});

describe("whole-set validators", () => {
  it("accepts the shipped data", () => {
    expect(validatePieces(PIECES)).toEqual([]);
    expect(validateChapters(CHAPTERS, CHALLENGES)).toEqual([]);
    expect(validateClients(CLIENTS, CHALLENGES)).toEqual([]);
    expect(validateChallengeIds(CHALLENGES)).toEqual([]);
    expect(validateCards(RULE_CARDS, CHALLENGES)).toEqual([]);
    expect(validateContent()).toEqual([]);
  });

  it("flags a duplicate challenge id and name", () => {
    const second = CHALLENGES[1] as ChallengeDef;
    const challenges = [
      BASE,
      broken(second, { id: BASE.id, name: BASE.name }),
      ...CHALLENGES.slice(2),
    ];
    const found = codes(validateChallengeIds(challenges));
    expect(found).toContain("DUPLICATE_ID");
    expect(found).toContain("DUPLICATE_NAME");
    expect(found).toContain("ID_ORDER");
  });

  it("flags a wrong client challenge count", () => {
    const challenges = CHALLENGES.map((def, at) =>
      at === 0 ? broken(def, { clientId: "edie" }) : def,
    );
    const found = validateClients(CLIENTS, challenges);
    expect(found.map((entry) => entry.subject)).toEqual(["mireille", "edie"]);
    expect(codes(found)).toEqual(["CLIENT_CHALLENGE_COUNT", "CLIENT_CHALLENGE_COUNT"]);
  });

  it("flags a missing client and an unknown client", () => {
    expect(codes(validateClients(CLIENTS.slice(1), CHALLENGES))).toContain("CLIENT_COUNT");
    expect(codes(validateClients(CLIENTS.slice(1), CHALLENGES))).toContain("UNKNOWN_CLIENT");
  });

  it("flags a client line that is too long", () => {
    const first = CLIENTS[0];
    if (first === undefined) throw new Error("no client");
    const long = { ...first, lines: { ...first.lines, intro: "x".repeat(81) } };
    expect(codes(validateClients([long, ...CLIENTS.slice(1)], CHALLENGES))).toEqual([
      "CLIENT_LINE_TOO_LONG",
    ]);
  });

  it("flags piece count, category and tag problems", () => {
    expect(codes(validatePieces(PIECES.slice(1)))).toContain("PIECE_COUNT");
    const first = PIECES[0];
    if (first === undefined) throw new Error("no piece");
    const odd = [{ ...first, formality: 9, price: 0 }, ...PIECES.slice(1)];
    expect(codes(validatePieces(odd))).toEqual(["BAD_PIECE_TAG"]);
    const swapped = [{ ...first, category: "hat" as const }, ...PIECES.slice(1)];
    expect(codes(validatePieces(swapped))).toContain("CATEGORY_COUNT");
  });

  it("flags unlock stars and chapter counts", () => {
    const first = CHAPTERS[2];
    if (first === undefined) throw new Error("no chapter");
    const chapters = CHAPTERS.map((chapter) =>
      chapter === first ? { ...chapter, unlockStars: 13 } : chapter,
    );
    expect(codes(validateChapters(chapters, CHALLENGES))).toEqual(["CHAPTER_UNLOCK"]);
    expect(codes(validateChapters(CHAPTERS.slice(1), CHALLENGES))).toContain("CHAPTER_COUNT");
  });

  it("flags a rule that appears before its card", () => {
    const cards = RULE_CARDS.map((card) =>
      card.id === "budget" ? { ...card, shownOn: "riv-05" } : card,
    );
    expect(codes(validateCards(cards, CHALLENGES))).toEqual(["RULE_BEFORE_CARD"]);
  });

  it("flags a card for an unknown challenge and a missing card", () => {
    const cards = RULE_CARDS.map((card) =>
      card.id === "eras" ? { ...card, shownOn: "nope-01" } : card,
    );
    expect(codes(validateCards(cards, CHALLENGES))).toContain("CARD_UNKNOWN_CHALLENGE");
    const found = codes(validateCards(RULE_CARDS.slice(1), CHALLENGES));
    expect(found).toContain("CARD_COUNT");
  });

  it("reports text problems", () => {
    const first = CHAPTERS[0];
    if (first === undefined) throw new Error("no chapter");
    const chapters = [{ ...first, intro: "Bring a coat \u{1F9E5}" }, ...CHAPTERS.slice(1)];
    expect(codes(validateContent({ chapters }))).toEqual(["TEXT_CHARSET"]);
  });
});
