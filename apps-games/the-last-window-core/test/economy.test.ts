import { describe, expect, it } from "vitest";
import {
  BOOKS,
  CAMPAIGN_DAYS,
  DECOR,
  DRINKS,
  decorEffects,
  defaultProfile,
  FINAL_SCENE_GIFT,
  FP_CAP,
  FRIENDSHIP_THRESHOLDS,
  GRADE_BONUS_ONE,
  GRADE_BONUS_THREE,
  GRADE_BONUS_TWO,
  LAMP_BONUS,
  levelForFp,
  PASTRIES,
  PORTIONS_PER_KIND,
  paymentFor,
  SCENE_GIFT,
  SCENES,
  START_COINS,
  STREAK_BONUS_CAP_DAYS,
  STREAK_BONUS_PER_DAY,
  stockCost,
  streakBonus,
  TIP_DELIGHTED_PCT,
  TIP_SATISFIED_PCT,
  tipFor,
  totalDecorPrice,
} from "../src";
import { clean, readDoc, tableAfter } from "./helpers/doc";

const ECONOMY = readDoc("economy.md");
const none = decorEffects([]);

describe("currencies table", () => {
  const rows = tableAfter(ECONOMY, "## Currencies and counters");
  it("lists coins starting at 30 and FP capped at 8", () => {
    expect(rows[0]?.[0]).toBe("Coins");
    expect(rows[0]?.[2]).toBe("30");
    expect(START_COINS).toBe(30);
    expect(defaultProfile().coins).toBe(30);
    expect(rows[1]?.[3]).toContain("8 per regular");
    expect(FP_CAP).toBe(8);
    expect(FRIENDSHIP_THRESHOLDS).toEqual([1, 2, 4, 6, 8]);
  });
});

describe("sources of coins, row by row", () => {
  const rows = tableAfter(ECONOMY, "## Sources of coins");
  const byName = (name: string) => rows.find((row) => row[0] === name)?.[1] ?? "";

  it("starting grant is 30", () => {
    expect(byName("Starting grant")).toBe("30");
    expect(START_COINS).toBe(30);
  });

  it("item payment is the item price", () => {
    expect(byName("Item payment")).toContain("item price");
    expect(DRINKS.map((d) => d.price)).toEqual([4, 5, 4, 5, 5, 6]);
    expect(PASTRIES.map((p) => p.price)).toEqual([3, 4, 5, 4, 5]);
    expect(BOOKS.map((b) => b.price)).toEqual([6, 6, 7, 7, 7]);
    expect(DRINKS.reduce((s, d) => s + d.price, 0)).toBe(29);
    expect(PASTRIES.reduce((s, p) => s + p.price, 0)).toBe(21);
    expect(BOOKS.reduce((s, b) => s + b.price, 0)).toBe(33);
  });

  it("pays exact items, substitutes at half rounded down (minimum 1) and wrong-mood books 1", () => {
    const exact = { drink: "drink-6", pastry: "pastry-3", book: "book-4" } as const;
    const order = { drink: "drink-6", pastry: "pastry-3", mood: "funny" } as const;
    expect(paymentFor(order, exact, none)).toBe(6 + 5 + 7);
    expect(paymentFor(order, { ...exact, pastry: "pastry-1" }, none)).toBe(6 + 1 + 7);
    expect(paymentFor(order, { ...exact, pastry: "pastry-5" }, none)).toBe(6 + 2 + 7);
    expect(paymentFor(order, { ...exact, book: "book-1" }, none)).toBe(6 + 5 + 1);
    expect(paymentFor(order, { drink: "drink-1", pastry: null, book: null }, none)).toBe(0);
  });

  it("applies Rosemary +1 per drink and Reading Lamp +2 per right-mood book", () => {
    const order = { drink: "drink-1", pastry: null, mood: "funny" } as const;
    const tray = { drink: "drink-1", pastry: null, book: "book-4" } as const;
    expect(paymentFor(order, tray, none)).toBe(4 + 7);
    expect(paymentFor(order, tray, decorEffects(["decor-3"]))).toBe(5 + 7);
    expect(paymentFor(order, tray, decorEffects(["decor-2"]))).toBe(4 + 9);
    expect(paymentFor(order, { ...tray, book: "book-1" }, decorEffects(["decor-2"]))).toBe(4 + 1);
  });

  it("tips are 40 percent delighted and 15 percent satisfied, rounded up", () => {
    expect(byName("Tip")).toContain("40 percent");
    expect(byName("Tip")).toContain("15 percent");
    expect(TIP_DELIGHTED_PCT).toBe(40);
    expect(TIP_SATISFIED_PCT).toBe(15);
    expect(tipFor(10, "delighted", none)).toBe(4);
    expect(tipFor(11, "delighted", none)).toBe(5);
    expect(tipFor(10, "satisfied", none)).toBe(2);
    expect(tipFor(10, "disappointed", none)).toBe(0);
    expect(tipFor(10, "left", none)).toBe(0);
  });

  it("the Gramophone adds 10 points: 50 and 25 percent", () => {
    const gramophone = decorEffects(["decor-8"]);
    expect(tipFor(10, "delighted", gramophone)).toBe(5);
    expect(tipFor(10, "satisfied", gramophone)).toBe(3);
    expect(tipFor(9, "delighted", gramophone)).toBe(5);
    expect(tipFor(9, "satisfied", gramophone)).toBe(3);
  });

  it("closing bonuses are 5, 10 and 20", () => {
    expect(byName("Closing bonus")).toBe("5 / 10 / 20 for 1 / 2 / 3 stars");
    expect([GRADE_BONUS_ONE, GRADE_BONUS_TWO, GRADE_BONUS_THREE]).toEqual([5, 10, 20]);
  });

  it("scene gifts are 5 for scenes 1 to 4 and 15 for scene 5", () => {
    expect(byName("Scene gift")).toContain("5 for scenes 1 to 4, 15 for scene 5");
    expect([SCENE_GIFT, FINAL_SCENE_GIFT]).toEqual([5, 15]);
    for (const scene of SCENES) expect(scene.gift).toBe(scene.index === 5 ? 15 : 5);
  });

  it("Lamp Bonus is 15 and the streak bonus is 2 x min(streak, 7)", () => {
    expect(byName("Lamp Bonus")).toBe("15");
    expect(byName("Streak bonus")).toContain("2 x min(streak, 7)");
    expect(LAMP_BONUS).toBe(15);
    expect(STREAK_BONUS_PER_DAY).toBe(2);
    expect(STREAK_BONUS_CAP_DAYS).toBe(7);
    expect([0, 1, 2, 7, 8, 30].map(streakBonus)).toEqual([0, 2, 4, 14, 14, 14]);
  });
});

describe("fixed campaign income", () => {
  it("scene gifts over the campaign sum to 280", () => {
    expect(SCENES).toHaveLength(40);
    expect(SCENES.reduce((sum, scene) => sum + scene.gift, 0)).toBe(280);
    expect(8 * (4 * SCENE_GIFT + FINAL_SCENE_GIFT)).toBe(280);
  });

  it("maximum closing bonuses over 14 days sum to 280", () => {
    expect(CAMPAIGN_DAYS * GRADE_BONUS_THREE).toBe(280);
  });
});

describe("sinks of coins", () => {
  it("pastry stock costs per portion: 1, 1, 2, 1, 2 with 5 portions per kind", () => {
    expect(PASTRIES.map((p) => p.stockCost)).toEqual([1, 1, 2, 1, 2]);
    expect(PORTIONS_PER_KIND).toBe(5);
    expect(stockCost({ pastries: ["pastry-3"], books: [] })).toBe(10);
  });

  it("the daily stock bill is at most 30 with four kinds and 25 with three", () => {
    expect(
      stockCost({ pastries: ["pastry-3", "pastry-5", "pastry-1", "pastry-2"], books: [] }),
    ).toBe(5 * (2 + 2 + 1 + 1));
    expect(stockCost({ pastries: ["pastry-3", "pastry-5", "pastry-1"], books: [] })).toBe(25);
    expect(5 * (2 + 2 + 1 + 1)).toBe(30);
  });

  it("decor total is 1,200 and matches the table rows", () => {
    const rows = tableAfter(ECONOMY, "## Decor (8)");
    expect(rows.map((row) => Number(row[2]))).toEqual(DECOR.map((rule) => rule.price));
    expect(rows.map((row) => clean(row[0] ?? ""))).toEqual(DECOR.map((rule) => rule.id));
    expect(totalDecorPrice()).toBe(1200);
  });
});

describe("friendship table", () => {
  it("levels come from the thresholds 1, 2, 4, 6, 8", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(levelForFp)).toEqual([0, 1, 2, 2, 3, 3, 4, 4, 5]);
  });
});
