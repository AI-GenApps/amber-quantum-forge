import { describe, expect, it } from "vitest";
import {
  analyseCase,
  createCaseState,
  dailyIssues,
  dailySeedOf,
  FALLBACK_SPECS,
  FLAVOUR_POOL,
  GLYPH_KINDS,
  generateDaily,
  MAX_DAILY_ATTEMPTS,
  PEOPLE,
  RULE_OUT_OBJECTS,
  requestHint,
  TEMPLATES,
  TIERS,
  tierFor,
  weekdayOf,
} from "../src";
import { hasBadCharset, isOneSentence } from "../src/content/text-rules";
import { CLUE_TEXT_MAX, CLUE_TEXT_MIN } from "../src/content/totals";
import { dateRange, seedAndWeekday } from "./fixtures/dates";
import { docLines, docTable, tableWithHeader } from "./fixtures/doc";
import { solve } from "./fixtures/solve";

const FACET_BY_LABEL = { Street: "street", Pastime: "pastime", Look: "look", Pet: "pet" } as const;

describe("the template bank is the bank in content-plan.md", () => {
  const rows = tableWithHeader("content-plan.md", ["Facet", "Value", "Object A"]);

  it("has 24 rows, identical row by row", () => {
    expect(TEMPLATES).toHaveLength(24);
    expect(rows).toHaveLength(24);
    rows.forEach((cells, index) => {
      const template = TEMPLATES[index];
      expect(template?.facet).toBe(FACET_BY_LABEL[cells[0] as keyof typeof FACET_BY_LABEL]);
      expect(template?.value).toBe(cells[1]);
      expect(template?.a).toEqual({ object: cells[2], tag: cells[3] });
      expect(template?.b).toEqual({ object: cells[4], tag: cells[5] });
      expect(`"${template?.ruleOut}"`).toBe(cells[6]);
    });
  });

  it("covers every almanac value exactly once", () => {
    const seen = new Set(TEMPLATES.map((item) => `${item.facet}:${item.value}`));
    const people = new Set(
      PEOPLE.flatMap((person) =>
        Object.entries(person.facets).map(([facet, value]) => `${facet}:${value}`),
      ),
    );
    expect(seen).toEqual(people);
  });

  it("has the 12-line neutral pool, identical to the markdown", () => {
    const line = docLines("content-plan.md").find((item) =>
      item.startsWith("Neutral flavour pool"),
    );
    const listed = (line ?? "").split("): ")[1]?.replace(/\.$/, "").split("; ");
    expect(FLAVOUR_POOL.map((item) => item.line)).toEqual(listed);
    expect(FLAVOUR_POOL).toHaveLength(12);
    for (const entry of FLAVOUR_POOL) expect(GLYPH_KINDS).toContain(entry.glyph);
  });

  it("writes lead clues that pass the text rules", () => {
    for (const template of TEMPLATES) {
      const texts = [
        `${template.a.object}: ${template.a.tag}.`,
        `${template.b.object}: ${template.b.tag}.`,
        `${RULE_OUT_OBJECTS[0]}: "${template.ruleOut}."`,
        `${RULE_OUT_OBJECTS[1]}: "${template.ruleOut}."`,
      ];
      for (const text of texts) {
        expect(text.length).toBeGreaterThanOrEqual(CLUE_TEXT_MIN);
        expect(text.length).toBeLessThanOrEqual(CLUE_TEXT_MAX);
        expect(hasBadCharset(text)).toBe(false);
        expect(isOneSentence(text)).toBe(true);
      }
    }
  });
});

describe("the weekday ladder", () => {
  it("matches content-plan.md", () => {
    const table = docTable(
      "content-plan.md",
      "## Daily Parcel (generated mini-case, template bank)",
    );
    expect(table).toHaveLength(7);
    table.forEach((cells, index) => {
      const tier = TIERS[index];
      expect(tier?.label).toBe(cells[0]);
      expect(tier?.objects).toBe(Number(cells[1]));
      const kinds = tier?.kinds.map((kind) => (kind === "direct" ? "D" : "R")).join("+");
      expect(kinds).toBe(cells[2]);
      expect(tier?.flavour).toBe(Number(cells[3]));
    });
  });

  it("wraps the weekday number", () => {
    expect(tierFor(7)).toBe(tierFor(0));
    expect(tierFor(-1)).toBe(tierFor(6));
  });

  it("derives the weekday from the date key, Monday first", () => {
    expect(weekdayOf("2026-01-01")).toBe(3);
    expect(weekdayOf("2026-10-23")).toBe(4);
    expect(weekdayOf("2026-10-25")).toBe(6);
    expect(weekdayOf("2026-10-26")).toBe(0);
  });
});

describe("generateDaily", () => {
  const sample = dateRange(28, "2026-05-04");

  it("is deterministic per seed", () => {
    for (const key of sample) {
      const [seed, weekday] = seedAndWeekday(key);
      expect(generateDaily(seed, weekday)).toEqual(generateDaily(seed, weekday));
    }
  });

  it("differs from one date to the next", () => {
    const cases = sample.map((key) => JSON.stringify(generateDaily(...seedAndWeekday(key))));
    expect(new Set(cases).size).toBe(sample.length);
    const ids = sample.map((key) => dailySeedOf(key));
    expect(new Set(ids).size).toBe(sample.length);
  });

  it("matches the tier of its weekday in objects, kinds and flavour", () => {
    for (const key of sample) {
      const [seed, weekday] = seedAndWeekday(key);
      const def = generateDaily(seed, weekday);
      const tier = tierFor(weekday);
      expect(def.objects).toHaveLength(tier.objects);
      expect(def.clues).toHaveLength(tier.objects);
      expect(def.deductions.map((item) => item.kind)).toEqual([...tier.kinds]);
      expect(def.clues.filter((clue) => clue.flavour === true)).toHaveLength(tier.flavour);
      expect(def.weekday).toBe(weekday);
    }
  });

  it("passes analyseCase and the hygiene rules", () => {
    for (const key of sample) {
      const def = generateDaily(...seedAndWeekday(key));
      expect(analyseCase(def, PEOPLE)).toEqual([]);
      expect(dailyIssues(def)).toEqual([]);
      expect(def.fallback).toBe(false);
      expect(def.attempt).toBeLessThan(MAX_DAILY_ATTEMPTS);
    }
  });

  it("uses three of the twelve townsfolk and never a key-and-lock pair", () => {
    for (const key of sample) {
      const def = generateDaily(...seedAndWeekday(key));
      expect(new Set(def.candidateIds).size).toBe(3);
      for (const id of def.candidateIds)
        expect(PEOPLE.some((person) => person.id === id)).toBe(true);
      expect(def.candidateIds).toContain(def.ownerId);
      expect(def.deductions.every((item) => item.kind !== "pair")).toBe(true);
      expect(def.clues.every((clue) => clue.face !== "zoom")).toBe(true);
    }
  });

  it("gives every object a glyph and no art slot", () => {
    for (const key of sample) {
      const def = generateDaily(...seedAndWeekday(key));
      for (const object of def.objects) {
        expect(GLYPH_KINDS).toContain(object.glyph);
        expect(object).not.toHaveProperty("artSlot");
      }
    }
  });

  it("never repeats a clue text, object name or tag inside a case", () => {
    for (const key of sample) {
      const def = generateDaily(...seedAndWeekday(key));
      expect(new Set(def.clues.map((clue) => clue.text)).size).toBe(def.clues.length);
      expect(new Set(def.clues.map((clue) => clue.tag)).size).toBe(def.clues.length);
      expect(new Set(def.objects.map((object) => object.name)).size).toBe(def.objects.length);
    }
  });

  it("can be solved to 3 stamps and hinted", () => {
    const def = generateDaily(...seedAndWeekday("2026-05-09"));
    expect(solve(def).stamps).toBe(3);
    const hint = requestHint(def, PEOPLE, createCaseState(def));
    expect(hint.ok).toBe(true);
  });
});

describe("hygiene on generated cases", () => {
  it("flags a flavour clue that names a separating fact", () => {
    const def = generateDaily(...seedAndWeekday("2026-05-09"));
    const flavour = def.clues.find((clue) => clue.flavour === true);
    const owner = PEOPLE.find((person) => person.id === def.ownerId);
    const decoy = PEOPLE.find(
      (person) =>
        def.candidateIds.includes(person.id) &&
        person.id !== def.ownerId &&
        person.facets[def.deductions[0]?.facet ?? "street"] !==
          owner?.facets[def.deductions[0]?.facet ?? "street"],
    );
    const facet = def.deductions[0]?.facet ?? "street";
    const word = decoy?.facets[facet] ?? "";
    const dirty = {
      ...def,
      clues: def.clues.map((clue) =>
        clue.id === flavour?.id ? { ...clue, text: `Among the contents: ${word}.` } : clue,
      ),
    };
    expect(dailyIssues(dirty).map((issue) => issue.code)).toContain("FLAVOUR_KEYWORD_LEAK");
  });

  it("flags repeated clue texts", () => {
    const def = generateDaily(...seedAndWeekday("2026-05-09"));
    const first = def.clues[0];
    const dirty = {
      ...def,
      clues: def.clues.map((clue, index) =>
        index === 1 && first !== undefined ? { ...clue, text: first.text } : clue,
      ),
    };
    expect(dailyIssues(dirty).map((issue) => issue.code)).toContain("DUPLICATE_CLUE_TEXT");
  });
});

describe("the committed fallback templates", () => {
  it("are 14, two per weekday", () => {
    expect(FALLBACK_SPECS).toHaveLength(7);
    for (const pair of FALLBACK_SPECS) expect(pair).toHaveLength(2);
    expect(FALLBACK_SPECS.flat()).toHaveLength(14);
  });

  for (let weekday = 0; weekday < 7; weekday++) {
    for (const parity of [0, 1]) {
      it(`weekday ${weekday} template ${parity} validates on its own and follows the ladder`, () => {
        const seed = 1000 + parity;
        const def = generateDaily(seed, weekday, { maxAttempts: 0 });
        const tier = tierFor(weekday);
        expect(def.fallback).toBe(true);
        expect(analyseCase(def, PEOPLE)).toEqual([]);
        expect(dailyIssues(def)).toEqual([]);
        expect(def.objects).toHaveLength(tier.objects);
        expect(def.deductions.map((item) => item.kind)).toEqual([...tier.kinds]);
        expect(def.clues.filter((clue) => clue.flavour === true)).toHaveLength(tier.flavour);
        expect(solve(def).stamps).toBe(3);
      });
    }
  }

  it("picks by seed mod 2", () => {
    for (let weekday = 0; weekday < 7; weekday++) {
      const even = generateDaily(10, weekday, { maxAttempts: 0 });
      const odd = generateDaily(11, weekday, { maxAttempts: 0 });
      expect(
        even.ownerId === odd.ownerId && even.candidateIds.join() === odd.candidateIds.join(),
      ).toBe(false);
      expect(generateDaily(12, weekday, { maxAttempts: 0 }).candidateIds).toEqual(
        even.candidateIds,
      );
    }
  });
});
