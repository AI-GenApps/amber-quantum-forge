import {
  dailySeedOf,
  provesThreeStars,
  tierFor,
  validateDailyMap,
  weekdayOfDateKey,
} from "@web-games/floodplain-dispatch-core";
import { addDays } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { dailyInfo, dailyPuzzle, weekdayOf } from "../src/state/dailyInfo";

const START = "2026-01-01";

describe("daily info", () => {
  it("numbers weekdays from Monday like the core helper for 800 days", () => {
    for (let i = 0; i < 800; i++) {
      const key = addDays(START, i - 100);
      expect(weekdayOf(key)).toBe(weekdayOfDateKey(key));
    }
    expect(weekdayOf("2026-10-19")).toBe(0);
    expect(weekdayOf("2026-10-25")).toBe(6);
  });

  it("uses the kit seed, identical to the core seed for 365 dates", () => {
    for (let i = 0; i < 365; i++) {
      const key = addDays(START, i);
      expect(dailyInfo(key).seed).toBe(dailySeedOf(key));
    }
  });

  it("picks the tier from the weekday", () => {
    for (let i = 0; i < 7; i++) {
      const info = dailyInfo(addDays("2026-10-19", i));
      expect(info.weekday).toBe(i);
      expect(info.tier).toBe(tierFor(i));
    }
  });

  it("generates, validates and caches the puzzle for a date", () => {
    const first = dailyPuzzle("2026-10-19");
    expect(dailyPuzzle("2026-10-19")).toBe(first);
    expect(validateDailyMap(first.map, tierFor(0))).toEqual([]);
    expect(provesThreeStars(first.map)).toBe(true);
  });
});
