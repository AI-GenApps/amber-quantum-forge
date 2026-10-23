import { describe, expect, it } from "vitest";
import {
  dailySeedOf,
  generateDaily,
  provesThreeStars,
  tierFor,
  validateDailyMap,
  weekdayOfDateKey,
} from "../src";

const START = Date.UTC(2026, 0, 1);
const DAYS = 365;
const MAX_FALLBACKS = 18;

function keyAt(offset: number): string {
  return new Date(START + offset * 86_400_000).toISOString().slice(0, 10);
}

describe("365 consecutive daily maps from 2026-01-01", () => {
  it("proves a 3-star solution for every date and rarely needs a fallback", () => {
    let fallbacks = 0;
    const sims: number[] = [];
    const failures: string[] = [];
    for (let i = 0; i < DAYS; i++) {
      const dateKey = keyAt(i);
      const weekday = weekdayOfDateKey(dateKey);
      if (weekday === null) throw new Error(`bad date ${dateKey}`);
      const tier = tierFor(weekday);
      const puzzle = generateDaily(dailySeedOf(dateKey), tier);
      if (puzzle.fallback !== null) fallbacks++;
      sims.push(puzzle.sims);
      if (!provesThreeStars(puzzle.map)) failures.push(`${dateKey}: not 3 stars`);
      const issues = validateDailyMap(puzzle.map, tier);
      if (issues.length > 0)
        failures.push(`${dateKey}: ${issues.map((issue) => issue.code).join(",")}`);
    }
    expect(failures).toEqual([]);
    expect(fallbacks).toBeLessThanOrEqual(MAX_FALLBACKS);
    expect(sims).toHaveLength(DAYS);
  }, 600_000);

  it("covers every weekday tier the same number of times (52 or 53)", () => {
    const counts = new Array<number>(7).fill(0);
    for (let i = 0; i < DAYS; i++) {
      const index = weekdayOfDateKey(keyAt(i)) ?? 0;
      counts[index] = (counts[index] ?? 0) + 1;
    }
    for (const count of counts) expect([52, 53]).toContain(count);
  });
});
