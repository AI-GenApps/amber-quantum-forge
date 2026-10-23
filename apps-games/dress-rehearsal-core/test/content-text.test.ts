import { describe, expect, it } from "vitest";
import {
  BRIEF_MAX_LENGTH,
  CHALLENGES,
  CHAPTERS,
  CLIENT_LINE_MAX_LENGTH,
  CLIENTS,
  chapterOf,
  clientOf,
  collectContentText,
  FRAMES,
  getChallenge,
  HARMONY_PART_LABELS,
  HARMONY_PART_NAMES,
  HOW_TO_PAGES,
  hasPlaceholderText,
  isInFontSubset,
  nextChallengeId,
  outsideFontSubset,
  PIECES,
  RESULT_HEADLINES,
  RULE_CARDS,
  RULE_FAMILY,
  resultHeadline,
  SCHEME_NAMES,
  SCHEME_POINTS,
  STAR_NAMES,
  TOTAL_STARS,
  TRAY_TAB_LABELS,
  TRAY_TAB_ORDER,
  TUTORIAL_CHALLENGE_ID,
  TUTORIAL_STEPS,
} from "../src/index";

describe("text rules", () => {
  it("keeps briefs within 90 characters and non-empty", () => {
    for (const def of CHALLENGES) {
      expect(def.brief.length, def.id).toBeGreaterThan(0);
      expect(def.brief.length, def.id).toBeLessThanOrEqual(BRIEF_MAX_LENGTH);
    }
    expect(BRIEF_MAX_LENGTH).toBe(90);
  });

  it("keeps client lines within 80 characters", () => {
    expect(CLIENT_LINE_MAX_LENGTH).toBe(80);
    for (const client of CLIENTS) {
      const lines = Object.values(client.lines);
      expect(lines, client.id).toHaveLength(8);
      for (const line of lines)
        expect(line.length, `${client.id}: ${line}`).toBeLessThanOrEqual(80);
    }
  });

  it("has no duplicate names", () => {
    const sets = [
      PIECES.map((piece) => piece.name),
      CHALLENGES.map((def) => def.name),
      CLIENTS.map((client) => client.name),
      CHAPTERS.map((chapter) => chapter.title),
      CHAPTERS.map((chapter) => chapter.chapterTitle),
    ];
    for (const names of sets) expect(new Set(names).size).toBe(names.length);
  });

  it("has no placeholder or empty text", () => {
    for (const entry of collectContentText()) {
      expect(hasPlaceholderText(entry.text), entry.label).toBe(false);
    }
  });

  it("stays inside the font subset", () => {
    for (const entry of collectContentText()) {
      expect(outsideFontSubset(entry.text), entry.label).toEqual([]);
    }
    expect(isInFontSubset("Café – “quoted” • …")).toBe(true);
    expect(isInFontSubset("\u{1F9E5}")).toBe(false);
    expect(isInFontSubset("中")).toBe(false);
  });

  it("collects a large body of text", () => {
    expect(collectContentText().length).toBeGreaterThan(250);
  });
});

describe("strings", () => {
  it("has a headline for 3, 2, 1 and 0 stars", () => {
    expect(RESULT_HEADLINES.map((headline) => headline.stars)).toEqual([3, 2, 1, 0]);
    expect(resultHeadline(3)).toBe("Polished. The client is speechless.");
    expect(resultHeadline(0)).toBe("Not ready for the rehearsal.");
    for (const headline of RESULT_HEADLINES) expect(headline.text.length).toBeGreaterThan(0);
  });

  it("names the stars, tabs, frames and how-to pages", () => {
    expect(STAR_NAMES).toEqual(["Presentable", "On brief", "Polished"]);
    expect(TRAY_TAB_ORDER.map((category) => TRAY_TAB_LABELS[category])).toEqual([
      "Tops",
      "Bottoms",
      "Dresses",
      "Outerwear",
      "Shoes",
      "Bags",
      "Hats",
      "Extras",
    ]);
    expect(FRAMES.map((frame) => frame.name)).toEqual([
      "Plain",
      "Paper Border",
      "Polaroid",
      "Magazine Cover",
    ]);
    expect(HOW_TO_PAGES).toHaveLength(6);
  });

  it("matches the engine's harmony and scheme names", () => {
    expect([...HARMONY_PART_LABELS]).toEqual([
      HARMONY_PART_NAMES.scheme,
      HARMONY_PART_NAMES.anchor,
      HARMONY_PART_NAMES.dressCode,
      HARMONY_PART_NAMES.era,
      HARMONY_PART_NAMES.season,
    ]);
    expect([...SCHEME_NAMES].sort()).toEqual(Object.keys(SCHEME_POINTS).sort());
  });
});

describe("rule cards and tutorial", () => {
  it("references existing challenges and sits on or before the first use of a family", () => {
    expect(RULE_CARDS).toHaveLength(9);
    for (const card of RULE_CARDS) {
      const shown = CHALLENGES.findIndex((def) => def.id === card.shownOn);
      expect(shown, card.id).toBeGreaterThanOrEqual(0);
      const firstUse = CHALLENGES.findIndex((def) =>
        def.rules.some((rule) => card.kinds.includes(rule.kind)),
      );
      if (firstUse !== -1) expect(shown, card.id).toBeLessThanOrEqual(firstUse);
    }
  });

  it("covers every rule family", () => {
    const families = new Set(Object.values(RULE_FAMILY));
    for (const family of families) {
      const kinds = Object.entries(RULE_FAMILY)
        .filter(([, value]) => value === family)
        .map(([kind]) => kind);
      const covered = RULE_CARDS.some((card) => card.kinds.some((kind) => kinds.includes(kind)));
      expect(covered, family).toBe(true);
    }
  });

  it("introduces every rule exactly on the right challenge", () => {
    const shownOn = new Map(RULE_CARDS.map((card) => [card.id, card.shownOn]));
    expect(shownOn.get("brief")).toBe("riv-01");
    expect(shownOn.get("one-piece")).toBe("riv-03");
    expect(shownOn.get("eras")).toBe("gal-05");
  });

  it("orders five tutorial steps on the first challenge", () => {
    expect(TUTORIAL_STEPS.map((step) => step.index)).toEqual([1, 2, 3, 4, 5]);
    expect(TUTORIAL_CHALLENGE_ID).toBe(CHALLENGES[0]?.id);
    for (const step of TUTORIAL_STEPS) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.targets.length).toBeGreaterThan(0);
    }
  });
});

describe("lookups", () => {
  it("orders and links the campaign", () => {
    expect(CHALLENGES).toHaveLength(40);
    expect(TOTAL_STARS).toBe(120);
    expect(getChallenge("riv-01")?.name).toBe("Harbour Lunch");
    expect(getChallenge("nope")).toBeUndefined();
    expect(nextChallengeId("riv-01")).toBe("riv-02");
    expect(nextChallengeId("riv-07")).toBe("rai-01");
    expect(nextChallengeId("vin-06")).toBeNull();
    expect(nextChallengeId("nope")).toBeNull();
    expect(chapterOf("gal-04")?.themeId).toBe("gala");
    expect(clientOf("gal-04")?.id).toBe("ottoline");
    expect(chapterOf("nope")).toBeUndefined();
    expect(clientOf("nope")).toBeUndefined();
  });

  it("walks every challenge through nextChallengeId", () => {
    const walked: string[] = [];
    let id: string | null = CHALLENGES[0]?.id ?? null;
    while (id !== null) {
      walked.push(id);
      id = nextChallengeId(id);
    }
    expect(walked).toEqual(CHALLENGES.map((def) => def.id));
  });
});
