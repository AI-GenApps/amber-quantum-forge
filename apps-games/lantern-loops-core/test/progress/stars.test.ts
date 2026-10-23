import { describe, expect, it } from "vitest";
import { CAMPAIGN, CHAPTERS, MAX_STARS } from "../../src/content/chapters";
import {
  bestStars,
  chapterSolved,
  chapterStars,
  chaptersCleared,
  isChapterUnlocked,
  newlyUnlocked,
  STAR_UNLOCKS,
  starsForHints,
  starsToUnlock,
  totalStars,
} from "../../src/progress/stars";

function starsFor(count: number, value = 3): Record<string, number> {
  const out: Record<string, number> = {};
  CAMPAIGN.slice(0, count).forEach((record) => {
    out[record.id] = value;
  });
  return out;
}

describe("starsForHints", () => {
  it.each([
    [0, 3],
    [1, 2],
    [2, 1],
    [5, 1],
    [-1, 3],
    [Number.NaN, 3],
  ])("%s hints give %s stars", (hints, stars) => {
    expect(starsForHints(hints)).toBe(stars);
  });

  it("keeps the best result", () => {
    expect(bestStars(undefined, 2)).toBe(2);
    expect(bestStars(3, 1)).toBe(3);
    expect(bestStars(1, 2)).toBe(2);
  });
});

describe("totalStars", () => {
  it("sums over the 120 campaign ids and ignores others", () => {
    expect(totalStars({})).toBe(0);
    expect(totalStars(starsFor(120))).toBe(MAX_STARS);
    expect(MAX_STARS).toBe(360);
    expect(totalStars({ "harbor-01": 3, "daily-2026-10-23": 3, bogus: 3 })).toBe(3);
  });

  it("clamps out-of-range values", () => {
    expect(totalStars({ "harbor-01": 9, "harbor-02": -2, "harbor-03": 2.9 })).toBe(5);
  });
});

describe("chapter unlocks", () => {
  it("matches the chapter table", () => {
    expect(CHAPTERS.map((c) => c.unlockStars)).toEqual([0, 45, 120, 210]);
    for (const chapter of CHAPTERS) expect(STAR_UNLOCKS[chapter.id]).toBe(chapter.unlockStars);
  });

  it.each([
    ["garden", 44, false, 1],
    ["garden", 45, true, 0],
    ["bridge", 119, false, 1],
    ["bridge", 120, true, 0],
    ["sky", 209, false, 1],
    ["sky", 210, true, 0],
    ["harbor", 0, true, 0],
  ] as const)("%s at %s stars: unlocked %s, missing %s", (chapter, total, open, missing) => {
    expect(isChapterUnlocked(chapter, total)).toBe(open);
    expect(starsToUnlock(chapter, total)).toBe(missing);
  });

  it("never reverses when stars are equal or higher", () => {
    let previous = false;
    for (let total = 0; total <= MAX_STARS; total++) {
      const open = isChapterUnlocked("sky", total);
      if (previous) expect(open).toBe(true);
      previous = open;
    }
  });

  it("reports chapters that a gain crosses", () => {
    expect(newlyUnlocked(42, 45)).toEqual(["garden"]);
    expect(newlyUnlocked(45, 50)).toEqual([]);
    expect(newlyUnlocked(0, 360)).toEqual(["garden", "bridge", "sky"]);
  });
});

describe("chapter progress", () => {
  it("counts stars, solved puzzles and cleared chapters", () => {
    const stars = { ...starsFor(30, 1), "garden-01": 2, "garden-02": 3 };
    expect(chapterStars(stars, "harbor")).toBe(30);
    expect(chapterStars(stars, "garden")).toBe(5);
    expect(chapterSolved(stars, "garden")).toBe(2);
    expect(chaptersCleared(stars)).toEqual(["harbor"]);
    expect(chaptersCleared(starsFor(29))).toEqual([]);
    expect(chaptersCleared(starsFor(120, 1))).toEqual(["harbor", "garden", "bridge", "sky"]);
    expect(chaptersCleared({ ...starsFor(30), "harbor-07": 0 })).toEqual([]);
  });
});
