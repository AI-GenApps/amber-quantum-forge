import { describe, expect, it } from "vitest";
import { hashString } from "../src";
import { CASUAL, PERFECT, playShift } from "./helpers/bot";
import { dayDef, dueList, UNLOCK_ALL } from "./helpers/fixtures";

const stock = {
  pastries: ["pastry-1", "pastry-2", "pastry-3", "pastry-5"],
  books: ["book-1", "book-2", "book-3", "book-4"],
} as const;

const owned = ["decor-4", "decor-5", "decor-1", "decor-6"] as const;

function largest() {
  return dayDef(14, 14, dueList(1, 2, 3, 4, 5, 6, 7, 8), UNLOCK_ALL, stock, 1414, owned);
}

describe("largest case: 14 customers, 2400 ticks, three seats", () => {
  it("has the expected size", () => {
    const def = largest();
    expect(def.lengthTicks).toBe(2400);
    expect(def.arrivals).toHaveLength(14);
    expect(def.decor.shelfSlots).toEqual({ pastries: 4, books: 4 });
  });

  it("perfect bot closes the shift with a stable result hash", () => {
    const run = playShift(largest(), stock, PERFECT);
    expect(run.state.phase).toBe("closed");
    expect(run.result.arrived).toBe(14);
    expect(run.result.counts.left).toBe(0);
    expect(run.result).toMatchObject({ coins: 226, tips: 61, payments: 145, mistakes: 0 });
    expect(hashString(JSON.stringify(run.result))).toBe(HASH_PERFECT);
  });

  it("casual bot closes the shift with a stable result hash", () => {
    const run = playShift(largest(), stock, CASUAL);
    expect(run.state.phase).toBe("closed");
    expect(run.result.arrived).toBe(14);
    expect(run.result).toMatchObject({ coins: 104, mistakes: 9 });
    expect(hashString(JSON.stringify(run.result))).toBe(HASH_CASUAL);
  });
});

const HASH_PERFECT = 437866740;
const HASH_CASUAL = 478833455;
