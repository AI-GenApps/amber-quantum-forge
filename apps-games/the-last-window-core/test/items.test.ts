import { describe, expect, it } from "vitest";
import {
  BOOKS,
  bookCarriesMood,
  DRINK_TOKENS,
  DRINKS,
  MOODS,
  moodsCoveredBy,
  PASTRIES,
  PASTRY_TOKENS,
  STEP_TICKS,
  stepDuration,
} from "../src";
import { clean, list, readDoc, tableAfter } from "./helpers/doc";

const product = readDoc("product.md");

describe("drink table", () => {
  const rows = tableAfter(product, "### Drinks (6)");
  it("has 6 rows pinned to product.md", () => {
    expect(rows).toHaveLength(6);
    expect(DRINKS).toHaveLength(6);
  });
  for (const [index, row] of rows.entries()) {
    it(`row ${index + 1} matches`, () => {
      const rule = DRINKS[index];
      expect(rule?.id).toBe(clean(row[0] as string));
      expect(rule?.name).toBe(row[1]);
      expect(rule?.steps).toEqual(list(row[2] as string));
      expect(rule?.price).toBe(Number(row[4]));
      const durations = list(row[3] as string).map((part) => part.split(" "));
      const ticks = (rule?.steps ?? [])
        .map((token) => [token, stepDuration(token)] as const)
        .filter(([, value]) => value > 0)
        .map(([token, value]) => [token, String(value)]);
      expect(ticks).toEqual(durations);
    });
  }
  it("sums to 29", () => {
    expect(DRINKS.reduce((sum, rule) => sum + rule.price, 0)).toBe(29);
  });
});

describe("pastry table", () => {
  const rows = tableAfter(product, "### Pastries (5)");
  it("has 5 rows", () => {
    expect(rows).toHaveLength(5);
    expect(PASTRIES).toHaveLength(5);
  });
  for (const [index, row] of rows.entries()) {
    it(`row ${index + 1} matches`, () => {
      const rule = PASTRIES[index];
      expect(rule?.id).toBe(clean(row[0] as string));
      expect(rule?.name).toBe(row[1]);
      expect(rule?.steps).toEqual(list(row[2] as string));
      expect(rule?.price).toBe(Number(row[3]));
      expect(rule?.stockCost).toBe(Number(row[4]));
    });
  }
  it("sums to 21", () => {
    expect(PASTRIES.reduce((sum, rule) => sum + rule.price, 0)).toBe(21);
  });
});

describe("book table", () => {
  const rows = tableAfter(product, "### Books (5)");
  it("has 5 rows", () => {
    expect(rows).toHaveLength(5);
    expect(BOOKS).toHaveLength(5);
  });
  for (const [index, row] of rows.entries()) {
    it(`row ${index + 1} matches`, () => {
      const rule = BOOKS[index];
      expect(rule?.id).toBe(clean(row[0] as string));
      expect(rule?.title).toBe(row[1]);
      expect(rule?.moods).toEqual(list(row[2] as string));
      expect(rule?.price).toBe(Number(row[3]));
    });
  }
  it("sums to 33", () => {
    expect(BOOKS.reduce((sum, rule) => sum + rule.price, 0)).toBe(33);
  });
});

describe("moods and tokens", () => {
  it("has 5 moods, each on exactly two books, each book with two distinct tags", () => {
    expect(MOODS).toEqual(["comforting", "adventurous", "wistful", "funny", "curious"]);
    for (const mood of MOODS) {
      expect(BOOKS.filter((book) => bookCarriesMood(book.id, mood))).toHaveLength(2);
    }
    for (const book of BOOKS) expect(new Set(book.moods).size).toBe(2);
  });

  it("lists the 8 drink tokens and 5 pastry tokens used by recipes", () => {
    expect(DRINK_TOKENS).toHaveLength(8);
    expect(PASTRY_TOKENS).toHaveLength(5);
    for (const rule of DRINKS)
      for (const token of rule.steps) expect(DRINK_TOKENS).toContain(token);
    for (const rule of PASTRIES) {
      for (const token of rule.steps) expect(PASTRY_TOKENS).toContain(token);
    }
  });

  it("every recipe starts with its start token", () => {
    for (const rule of DRINKS) expect(rule.steps[0]).toBe("cup");
    for (const rule of PASTRIES) expect(rule.steps[0]).toBe("plate");
  });

  it("durations come from the constants", () => {
    expect(stepDuration("brew")).toBe(STEP_TICKS.brew);
    expect(stepDuration("steam")).toBe(6);
    expect(stepDuration("water")).toBe(5);
    expect(stepDuration("warm")).toBe(12);
    expect(stepDuration("pour")).toBe(0);
    expect(stepDuration("cup")).toBe(0);
  });

  it("moodsCoveredBy lists moods in table order", () => {
    expect(moodsCoveredBy(["book-1"])).toEqual(["comforting", "curious"]);
    expect(moodsCoveredBy([])).toEqual([]);
    expect(moodsCoveredBy(["book-1", "book-2"])).toEqual(["comforting", "wistful", "curious"]);
  });
});
