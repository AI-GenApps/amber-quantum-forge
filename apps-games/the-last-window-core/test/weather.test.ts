import { describe, expect, it } from "vitest";
import { weatherForDay, weatherForSeed, weatherRules } from "../src";
import { readDoc, tableAfter } from "./helpers/doc";

describe("weatherForDay", () => {
  it("follows day mod 3 for Days 1 to 14", () => {
    const expected = [
      "morning",
      "evening",
      "rain",
      "morning",
      "evening",
      "rain",
      "morning",
      "evening",
      "rain",
      "morning",
      "evening",
      "rain",
      "morning",
      "evening",
    ];
    expect(Array.from({ length: 14 }, (_, i) => weatherForDay(i + 1))).toEqual(expected);
  });

  it("matches the content plan weather column", () => {
    const rows = tableAfter(readDoc("content-plan.md"), "## Campaign days");
    expect(rows).toHaveLength(14);
    for (const row of rows) {
      expect(weatherForDay(Number(row[0]))).toBe(row[2]);
    }
  });
});

describe("weatherForSeed (Late Shift sample)", () => {
  it("is stable for eight sample seeds", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(weatherForSeed)).toEqual([
      "rain",
      "rain",
      "morning",
      "rain",
      "rain",
      "morning",
      "evening",
      "rain",
    ]);
  });

  it("covers all three variants over many seeds", () => {
    const seen = new Set(Array.from({ length: 60 }, (_, i) => weatherForSeed(i)));
    expect(seen.size).toBe(3);
  });
});

describe("weatherRules", () => {
  const rows = tableAfter(readDoc("product.md"), "## Weather variants");
  it("matches the product.md table", () => {
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      const weather = row[0] as string as "morning" | "evening" | "rain";
      const rule = weatherRules(weather);
      expect(`${rule.pastryChancePct} percent`).toBe(row[2]);
      expect(`${rule.bookChancePct} percent`).toBe(row[3]);
      const other = row[4] as string;
      if (weather === "rain") {
        expect(other).toBe("+1 customer, +6 s patience");
        expect(rule.extraCustomers).toBe(1);
        expect(rule.patienceSeconds).toBe(6);
      } else {
        expect(other).toBe("none");
        expect(rule.extraCustomers).toBe(0);
        expect(rule.patienceSeconds).toBe(0);
      }
    }
  });
});
