import { describe, expect, it } from "vitest";
import {
  decorEffects,
  PASTRIES,
  type ShelfSlots,
  type StockPlan,
  shelfBooks,
  stockCost,
  suggestStock,
  validateStockPlan,
} from "../src";
import { dueList, UNLOCK_ALL, UNLOCK_DAY1 } from "./helpers/fixtures";

const slots: ShelfSlots = { pastries: 3, books: 3 };
const codes = (plan: StockPlan, unlocked = UNLOCK_ALL, s = slots, coins = 100): string[] =>
  validateStockPlan(plan, unlocked, s, coins).map((error) => error.code);

describe("stockCost", () => {
  it("is 5 portions at each kind's cost", () => {
    expect(stockCost({ pastries: [], books: [] })).toBe(0);
    expect(stockCost({ pastries: ["pastry-1"], books: [] })).toBe(5);
    expect(stockCost({ pastries: ["pastry-3"], books: [] })).toBe(10);
    expect(stockCost({ pastries: ["pastry-1", "pastry-2", "pastry-3"], books: [] })).toBe(20);
  });

  it("reaches 25 with three dear kinds and the 30 coin maximum with four kinds", () => {
    expect(stockCost({ pastries: ["pastry-3", "pastry-5", "pastry-1"], books: [] })).toBe(25);
    const cake = decorEffects(["decor-4"]).shelfSlots;
    expect(cake.pastries).toBe(4);
    const four: StockPlan = {
      pastries: ["pastry-3", "pastry-5", "pastry-1", "pastry-2"],
      books: ["book-1"],
    };
    expect(stockCost(four)).toBe(30);
    expect(codes(four, UNLOCK_ALL, cake, 30)).toEqual([]);
    const best = PASTRIES.map((p) => p.stockCost)
      .sort((a, b) => b - a)
      .slice(0, 4)
      .reduce((a, b) => a + b, 0);
    expect(best * 5).toBe(30);
  });

  it("counts duplicates once", () => {
    expect(stockCost({ pastries: ["pastry-1", "pastry-1"], books: [] })).toBe(5);
  });
});

describe("validateStockPlan", () => {
  const ok: StockPlan = { pastries: ["pastry-1"], books: ["book-1"] };
  it("accepts a legal plan", () => {
    expect(codes(ok)).toEqual([]);
  });

  it("reports TOO_MANY_PASTRIES and the cake stand lifts it", () => {
    const four: StockPlan = {
      pastries: ["pastry-1", "pastry-2", "pastry-3", "pastry-4"],
      books: ["book-1"],
    };
    expect(codes(four)).toContain("TOO_MANY_PASTRIES");
    expect(codes(four, UNLOCK_ALL, { pastries: 4, books: 3 })).not.toContain("TOO_MANY_PASTRIES");
  });

  it("reports TOO_MANY_BOOKS and the ladder lifts it", () => {
    const four: StockPlan = { pastries: [], books: ["book-1", "book-2", "book-3", "book-4"] };
    expect(codes(four)).toEqual(["TOO_MANY_BOOKS"]);
    expect(codes(four, UNLOCK_ALL, { pastries: 3, books: 4 })).toEqual([]);
  });

  it("reports LOCKED_ITEM with the offending id", () => {
    const errors = validateStockPlan(
      { pastries: ["pastry-4"], books: ["book-1", "book-5"] },
      UNLOCK_DAY1,
      slots,
      100,
    );
    expect(errors).toEqual([
      { code: "LOCKED_ITEM", id: "pastry-4" },
      { code: "LOCKED_ITEM", id: "book-5" },
    ]);
  });

  it("reports NEED_A_BOOK only when a book is unlocked", () => {
    expect(codes({ pastries: [], books: [] })).toEqual(["NEED_A_BOOK"]);
    const noBooks = { ...UNLOCK_DAY1, books: [] };
    expect(codes({ pastries: [], books: [] }, noBooks)).toEqual([]);
  });

  it("reports CANNOT_AFFORD at exactly one coin short", () => {
    const plan: StockPlan = { pastries: ["pastry-3"], books: ["book-1"] };
    expect(codes(plan, UNLOCK_ALL, slots, 10)).toEqual([]);
    expect(codes(plan, UNLOCK_ALL, slots, 9)).toEqual(["CANNOT_AFFORD"]);
  });

  it("reports several errors in a fixed order", () => {
    const bad: StockPlan = {
      pastries: ["pastry-1", "pastry-2", "pastry-3", "pastry-4"],
      books: [],
    };
    expect(codes(bad, UNLOCK_DAY1, slots, 1)).toEqual([
      "TOO_MANY_PASTRIES",
      "LOCKED_ITEM",
      "LOCKED_ITEM",
      "LOCKED_ITEM",
      "NEED_A_BOOK",
      "CANNOT_AFFORD",
    ]);
  });
});

describe("shelfBooks", () => {
  it("shows every unlocked book when there are at most as many as slots", () => {
    expect(shelfBooks({ pastries: [], books: [] }, UNLOCK_DAY1, slots)).toEqual(["book-1"]);
    const three = { ...UNLOCK_ALL, books: ["book-1", "book-2", "book-3"] } as const;
    expect(shelfBooks({ pastries: [], books: ["book-1"] }, three, slots)).toEqual([
      "book-1",
      "book-2",
      "book-3",
    ]);
  });

  it("uses the plan otherwise, without duplicates", () => {
    expect(
      shelfBooks({ pastries: [], books: ["book-5", "book-5", "book-2"] }, UNLOCK_ALL, slots),
    ).toEqual(["book-5", "book-2"]);
  });
});

describe("suggestStock", () => {
  it("picks the due regulars' favourite pastries and the books covering their moods", () => {
    const plan = suggestStock(dueList(1, 2, 3), UNLOCK_ALL, slots);
    expect(plan.pastries).toEqual(["pastry-1", "pastry-2", "pastry-3"]);
    expect(plan.books).toEqual(["book-1", "book-2", "book-3"]);
  });

  it("skips locked favourites and respects the slot count", () => {
    const early = suggestStock(dueList(2, 3), UNLOCK_DAY1, slots);
    expect(early.pastries).toEqual([]);
    expect(early.books).toEqual(["book-1"]);
    const many = suggestStock(dueList(1, 2, 3, 4), UNLOCK_ALL, slots);
    expect(many.pastries).toEqual(["pastry-1", "pastry-2", "pastry-3"]);
    const wide = suggestStock(dueList(1, 2, 3, 4), UNLOCK_ALL, { pastries: 4, books: 3 });
    expect(wide.pastries).toEqual(["pastry-1", "pastry-2", "pastry-3", "pastry-4"]);
  });

  it("deduplicates shared favourites", () => {
    const plan = suggestStock(dueList(2, 6), UNLOCK_ALL, slots);
    expect(plan.pastries).toEqual(["pastry-2"]);
  });

  it("always yields a plan the validator accepts when affordable", () => {
    for (const ids of [
      [1, 2, 3],
      [4, 5, 6],
      [1, 3, 7, 8],
      [5, 6, 8],
    ]) {
      const plan = suggestStock(dueList(...ids), UNLOCK_ALL, slots);
      expect(validateStockPlan(plan, UNLOCK_ALL, slots, 100)).toEqual([]);
    }
  });
});
