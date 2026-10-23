import { describe, expect, it } from "vitest";
import { gradeShift, longestDelightedRun } from "../src";

const grade = (d: number, s: number, x: number, l: number, arrived: number) =>
  gradeShift({ counts: { delighted: d, satisfied: s, disappointed: x, left: l }, arrived });

describe("gradeShift", () => {
  it("gives 3 stars at 80 percent good with nobody left", () => {
    expect(grade(4, 4, 2, 0, 10)).toMatchObject({ stars: 3, bonusCoins: 20, good: 0.8 });
    expect(grade(10, 0, 0, 0, 10).stars).toBe(3);
  });

  it("gives 2 stars just under 80 percent", () => {
    expect(grade(4, 3, 3, 0, 10)).toMatchObject({ stars: 2, bonusCoins: 10 });
    expect(grade(7, 0, 3, 0, 9).stars).toBe(2);
  });

  it("any customer who left costs the third star", () => {
    expect(grade(9, 0, 0, 1, 10)).toMatchObject({ stars: 2, bonusCoins: 10 });
  });

  it("gives 2 stars at exactly 60 percent and 1 star below", () => {
    expect(grade(3, 3, 4, 0, 10)).toMatchObject({ stars: 2, bonusCoins: 10, good: 0.6 });
    expect(grade(3, 2, 5, 0, 10)).toMatchObject({ stars: 1, bonusCoins: 5 });
  });

  it("completed shifts are at least 1 star, even with no customers", () => {
    expect(grade(0, 0, 0, 0, 0)).toEqual({ stars: 1, bonusCoins: 5, good: 0 });
    expect(grade(0, 0, 5, 5, 10).stars).toBe(1);
  });

  it("uses exact comparisons: 4 of 5 is 3 stars, 7 of 9 and 5 of 7 are 2 stars", () => {
    expect(grade(4, 0, 1, 0, 5).stars).toBe(3);
    expect(grade(7, 0, 2, 0, 9).stars).toBe(2);
    expect(grade(5, 0, 2, 0, 7).stars).toBe(2);
    expect(grade(4, 0, 3, 0, 7).stars).toBe(1);
  });
});

describe("longestDelightedRun", () => {
  it("counts consecutive delighted outcomes and resets on anything else", () => {
    expect(longestDelightedRun([])).toBe(0);
    expect(longestDelightedRun(["delighted", "delighted", "satisfied", "delighted"])).toBe(2);
    expect(longestDelightedRun(["left", "delighted", "delighted", "delighted", "left"])).toBe(3);
    expect(longestDelightedRun(["satisfied", "disappointed"])).toBe(0);
  });
});
