import { describe, expect, it } from "vitest";
import { CASUAL, PERFECT, playShift } from "./helpers/bot";
import { dayDef, dueList, UNLOCK_ALL, UNLOCK_DAY1 } from "./helpers/fixtures";

const day1Stock = { pastries: ["pastry-1"], books: ["book-1"] } as const;
const fullStock = {
  pastries: ["pastry-1", "pastry-2", "pastry-3"],
  books: ["book-1", "book-2", "book-3"],
} as const;

describe("perfect bot", () => {
  it("finishes a Day 1 style shift with 3 stars and nobody left, over 20 seeds", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const def = dayDef(1, 6, dueList(1, 2, 3), UNLOCK_DAY1, day1Stock, seed * 13);
      const run = playShift(def, day1Stock, PERFECT);
      expect(run.state.phase).toBe("closed");
      expect(run.result.grade.stars).toBe(3);
      expect(run.result.counts.left).toBe(0);
      expect(run.result.arrived).toBe(6);
      expect(run.result.mistakes).toBe(0);
    }
  });

  it("earns friendship from every regular it serves on Day 1", () => {
    const def = dayDef(1, 6, dueList(1, 2, 3), UNLOCK_DAY1, day1Stock, 77);
    const { result } = playShift(def, day1Stock, PERFECT);
    expect(result.fpGains.map((entry) => entry.regularId)).toEqual([1, 2, 3]);
    for (const gain of result.fpGains) expect(gain.fp).toBeGreaterThanOrEqual(1);
  });

  it("closes a Day 14 sized shift with all items and eight regulars", () => {
    const def = dayDef(14, 12, dueList(1, 2, 3, 4, 5, 6, 7, 8), UNLOCK_ALL, fullStock, 14);
    const run = playShift(def, fullStock, PERFECT);
    expect(run.state.phase).toBe("closed");
    expect(run.result.arrived).toBe(12);
    expect(run.result.counts.left).toBe(0);
    expect(run.result.grade.stars).toBeGreaterThanOrEqual(2);
  });
});

describe("casual bot", () => {
  it("finishes shifts without error, with mistakes", () => {
    let mistakes = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const def = dayDef(5, 8, dueList(3, 5, 6), UNLOCK_ALL, fullStock, seed * 17);
      const run = playShift(def, fullStock, CASUAL);
      expect(run.state.phase).toBe("closed");
      expect(run.result.arrived).toBe(8);
      expect(run.result.coins).toBeGreaterThanOrEqual(5);
      mistakes += run.result.mistakes;
    }
    expect(mistakes).toBeGreaterThan(0);
  });

  it("does worse than the perfect bot on the same shift", () => {
    const def = dayDef(10, 10, dueList(3, 5, 7), UNLOCK_ALL, fullStock, 99);
    const perfect = playShift(def, fullStock, PERFECT).result;
    const casual = playShift(def, fullStock, CASUAL).result;
    expect(perfect.coins).toBeGreaterThan(casual.coins);
  });
});
