import { describe, expect, it } from "vitest";
import {
  betterRecords,
  countItemsServed,
  GAME_TITLE,
  type ShiftEvent,
  shareInputFor,
  shareText,
} from "../src";
import { readDoc } from "./helpers/doc";
import { fakeResult } from "./helpers/results";

describe("shareText", () => {
  it("produces the campaign template exactly", () => {
    expect(shareText({ kind: "day", day: 7, stars: 3, happy: 9, customers: 9, coins: 112 })).toBe(
      "The Last Window, Day 7: 3/3 stars, 9 of 9 customers smiling, 112 coins earned.",
    );
  });

  it("produces the Late Shift template exactly", () => {
    expect(
      shareText({ kind: "late", date: "2026-10-23", stars: 2, coins: 64, delightedRun: 5 }),
    ).toBe("The Last Window, Late Shift 2026-10-23: 2/3 stars, 64 coins, 5 delighted in a row.");
  });

  it("matches the templates in product.md", () => {
    const doc = readDoc("product.md");
    expect(doc).toContain(
      "`The Last Window, Day {n}: {stars}/3 stars, {happy} of {customers} customers smiling, {coins} coins earned.`",
    );
    expect(doc).toContain(
      "`The Last Window, Late Shift {date}: {stars}/3 stars, {coins} coins, {delightedRun} delighted in a row.`",
    );
    expect(GAME_TITLE).toBe("The Last Window");
  });

  it("builds the input from a campaign result", () => {
    const result = fakeResult({
      day: 4,
      stars: 2,
      counts: { delighted: 3, satisfied: 2, disappointed: 1, left: 1 },
    });
    const input = shareInputFor(result, null);
    expect(input).toEqual({
      kind: "day",
      day: 4,
      stars: 2,
      happy: 5,
      customers: 7,
      coins: result.coins,
    });
    expect(shareText(input)).toBe(
      `The Last Window, Day 4: 2/3 stars, 5 of 7 customers smiling, ${result.coins} coins earned.`,
    );
  });

  it("builds the input from a Late Shift result with the date", () => {
    const result = fakeResult({ kind: "late", day: 15, run: 4, stars: 3 });
    expect(shareInputFor(result, "2026-12-01")).toEqual({
      kind: "late",
      date: "2026-12-01",
      stars: 3,
      coins: result.coins,
      delightedRun: 4,
    });
  });

  it("contains no URL", () => {
    const text = shareText({ kind: "day", day: 1, stars: 1, happy: 0, customers: 6, coins: 5 });
    expect(text).not.toMatch(/https?:|www\./);
  });
});

describe("countItemsServed", () => {
  const served = (drink: number, pastry: number | null, book: number | null): ShiftEvent => ({
    type: "served",
    tick: 1,
    seat: 0,
    customerId: "walkin-1",
    regularId: null,
    outcome: "satisfied",
    payment: 1,
    tip: 0,
    fp: 0,
    face: "happy",
    scores: { drink, pastry, book },
  });

  it("counts delivered requested components only", () => {
    const events: ShiftEvent[] = [
      served(10, null, null),
      served(10, 5, 10),
      served(0, 0, 3),
      { type: "shift-closed", tick: 9 },
    ];
    expect(countItemsServed(events)).toBe(1 + 3 + 1);
  });
});

describe("betterRecords", () => {
  it("keeps the best of each record", () => {
    const start = { bestEarnings: 50, bestDelightedRun: 4 };
    expect(betterRecords(start, fakeResult({ payments: 100, tips: 0, stars: 1, run: 2 }))).toEqual({
      bestEarnings: 105,
      bestDelightedRun: 4,
    });
    expect(betterRecords(start, fakeResult({ payments: 1, tips: 0, stars: 1, run: 7 }))).toEqual({
      bestEarnings: 50,
      bestDelightedRun: 7,
    });
  });
});
