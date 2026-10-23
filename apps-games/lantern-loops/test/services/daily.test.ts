import { dailySeed } from "@web-games/kit";
import {
  dailyId,
  dailyTier,
  decodePuzzle,
  encodePuzzle,
  evaluate,
  generateDaily,
  isUnique,
  weekdayOf,
} from "@web-games/lantern-loops-core";
import { beforeEach, describe, expect, it } from "vitest";
import { defaults } from "../../src/save/profile";
import {
  archiveList,
  clearDailyCache,
  GAME_ID,
  puzzleForDate,
  todayKey,
} from "../../src/services/daily";

beforeEach(clearDailyCache);

describe("todayKey", () => {
  it("uses the local calendar date", () => {
    expect(todayKey(new Date(2026, 9, 23, 0, 0, 1))).toBe("2026-10-23");
    expect(todayKey(new Date(2026, 11, 31, 23, 59, 59))).toBe("2026-12-31");
  });
});

describe("puzzleForDate", () => {
  it("builds the tier puzzle for the date from the kit seed", () => {
    const daily = puzzleForDate("2026-10-23");
    expect(daily.id).toBe("daily-2026-10-23");
    expect(daily.weekday).toBe(5);
    expect(daily.tier).toEqual(dailyTier(5));
    expect(daily.puzzle.size).toBe(8);
    expect(evaluate(daily.puzzle, daily.solution).solved).toBe(true);
    expect(isUnique(daily.puzzle)).toBe(true);
    expect(
      encodePuzzle(
        generateDaily(dailySeed(GAME_ID, "2026-10-23"), 5, dailyId("2026-10-23")).puzzle,
      ),
    ).toBe(daily.code);
    const decoded = decodePuzzle(daily.code, daily.id);
    expect(decoded.ok).toBe(true);
  });

  it("serves the second request from memory", () => {
    expect(puzzleForDate("2026-10-24")).toBe(puzzleForDate("2026-10-24"));
  });

  it("covers a week with the matching sizes", () => {
    const week = [26, 27, 28, 29, 30, 31].map((day) => {
      const date = `2026-10-${day}`;
      return [weekdayOf(date), puzzleForDate(date).puzzle.size];
    });
    expect(week).toEqual([
      [1, 5],
      [2, 6],
      [3, 7],
      [4, 7],
      [5, 8],
      [6, 8],
    ]);
  });

  it("rejects an invalid date", () => {
    expect(() => puzzleForDate("2026-02-30")).toThrow(RangeError);
  });
});

describe("archiveList", () => {
  it("lists 30 dates, yesterday first, with solved ones completed", () => {
    const profile = { ...defaults(), dailiesSolved: { "2026-10-22": { stars: 3, seconds: 88 } } };
    const list = archiveList("2026-10-23", profile);
    expect(list).toHaveLength(30);
    expect(list[0]).toMatchObject({
      dateKey: "2026-10-22",
      status: "completed",
      stars: 3,
      seconds: 88,
    });
    expect(list[1]).toMatchObject({
      dateKey: "2026-10-21",
      status: "to-play",
      stars: 0,
      seconds: null,
    });
    expect(list[29]?.dateKey).toBe("2026-09-23");
    expect(list.every((entry) => entry.dateKey !== "2026-10-23")).toBe(true);
    expect(list[0]?.tier).toEqual(dailyTier(weekdayOf("2026-10-22")));
  });
});
