import { describe, expect, it } from "vitest";
import { computeStats, type StatsProfile } from "../../src/progress/stats";

const profile: StatsProfile = {
  stars: {
    "harbor-01": 3,
    "harbor-02": 3,
    "harbor-03": 2,
    "harbor-11": 1,
    "garden-01": 3,
    "garden-30": 2,
    "sky-05": 1,
    "daily-2026-10-23": 3,
  },
  bestTimes: { "harbor-01": 40, "harbor-02": 35, "harbor-11": 90, "garden-30": 300, "sky-05": 0 },
  dailiesSolved: {
    "2026-10-19": { stars: 3, seconds: 100 },
    "2026-10-20": { stars: 2, seconds: 220 },
    "2026-10-23": { stars: 1, seconds: 75 },
    "2026-10-26": { stars: 3, seconds: 80 },
  },
  streak: 2,
  bestStreak: 5,
  hintsUsed: 7,
  playSeconds: 4321,
};

describe("computeStats", () => {
  const stats = computeStats(profile);

  it("counts campaign solves and stars by hand", () => {
    expect(stats.solved).toBe(7);
    expect(stats.stars).toBe(3 + 3 + 2 + 1 + 3 + 2 + 1);
    expect(stats.maxStars).toBe(360);
    expect(stats.threeStar).toBe(3);
  });

  it("splits stars and solves per chapter", () => {
    const byId = Object.fromEntries(stats.chapters.map((c) => [c.id, c]));
    expect(byId.harbor).toMatchObject({ stars: 9, solved: 4, total: 30, maxStars: 90 });
    expect(byId.garden).toMatchObject({ stars: 5, solved: 2 });
    expect(byId.bridge).toMatchObject({ stars: 0, solved: 0 });
    expect(byId.sky).toMatchObject({ stars: 1, solved: 1 });
  });

  it("summarises dailies, streaks, hints and play time", () => {
    expect(stats.dailiesSolved).toBe(4);
    expect(stats.dailyStars).toBe(9);
    expect(stats.currentStreak).toBe(2);
    expect(stats.bestStreak).toBe(5);
    expect(stats.hintsUsed).toBe(7);
    expect(stats.playSeconds).toBe(4321);
  });

  it("finds the best time per board size and the best daily", () => {
    expect(stats.bestTimeBySize).toEqual({
      5: { id: "harbor-02", seconds: 35 },
      6: { id: "harbor-11", seconds: 90 },
      8: { id: "garden-30", seconds: 300 },
    });
    expect(stats.bestDailySeconds).toBe(75);
  });

  it("counts dailies by ISO weekday (Monday first)", () => {
    expect(stats.solvesByWeekday).toEqual([2, 1, 0, 0, 1, 0, 0]);
  });

  it("handles an empty profile", () => {
    const empty = computeStats({
      stars: {},
      bestTimes: {},
      dailiesSolved: {},
      streak: 0,
      bestStreak: 0,
      hintsUsed: 0,
      playSeconds: 0,
    });
    expect(empty.solved).toBe(0);
    expect(empty.bestDailySeconds).toBeNull();
    expect(empty.bestTimeBySize).toEqual({});
    expect(empty.solvesByWeekday).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("never reports a best streak below the current one", () => {
    expect(computeStats({ ...profile, streak: 9, bestStreak: 5 }).bestStreak).toBe(9);
  });
});
