import { describe, expect, it } from "vitest";
import {
  applyDailyResult,
  DAILY_COINS,
  DAILY_RESULT_LIMIT,
  type DailyStep,
  defaultProfile,
  type Profile,
  STREAK_BONUS_CAP,
  type StarCount,
  streakBonus,
} from "../src";
import { profileWith } from "./progress-helpers";

function dateOf(index: number): string {
  return new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10);
}

function play(
  profile: Profile,
  day: number,
  stars: StarCount,
  step: DailyStep,
  missedDays = 0,
  score = stars * 100,
): ReturnType<typeof applyDailyResult> {
  return applyDailyResult(profile, { dateKey: dateOf(day), step, missedDays, stars, score });
}

describe("daily rewards", () => {
  it("pays 10, 15 and 20 coins for one, two and three stars", () => {
    expect(DAILY_COINS).toEqual({ 0: 0, 1: 10, 2: 15, 3: 20 });
    for (const stars of [1, 2, 3] as const) {
      const out = play(defaultProfile(), 0, stars, "first");
      const bonus = streakBonus(1);
      expect(out.profile.coins - 50).toBe(DAILY_COINS[stars] + bonus);
    }
  });

  it("pays nothing for zero stars and leaves the streak alone", () => {
    const start = defaultProfile();
    const out = play(start, 0, 0, "first");
    expect(out.profile).toBe(start);
    expect(out.counted).toBe(false);
    expect(out.events).toEqual([]);
  });

  it("pays the difference when the tier is upgraded the same day", () => {
    const one = play(defaultProfile(), 0, 1, "first").profile;
    const two = play(one, 0, 2, "same-day");
    expect(two.profile.coins - one.coins).toBe(5);
    const three = play(two.profile, 0, 3, "same-day");
    expect(three.profile.coins - two.profile.coins).toBe(5);
    expect(three.profile.daily.results[dateOf(0)]).toEqual({ stars: 3, score: 300 });
  });

  it("pays nothing for a repeat at the same tier or lower", () => {
    const three = play(defaultProfile(), 0, 3, "first").profile;
    for (const stars of [3, 2, 1] as const) {
      const again = play(three, 0, stars, "same-day");
      expect(again.profile.coins).toBe(three.coins);
    }
  });

  it("keeps the better score of the day", () => {
    const first = play(defaultProfile(), 0, 2, "first", 0, 250).profile;
    const worse = play(first, 0, 2, "same-day", 0, 100).profile;
    expect(worse.daily.results[dateOf(0)]?.score).toBe(250);
    const better = play(worse, 0, 2, "same-day", 0, 400).profile;
    expect(better.daily.results[dateOf(0)]?.score).toBe(400);
  });

  it("adds the day-one streak bonus of 2 to a three-star clear (20 + 2)", () => {
    expect(play(defaultProfile(), 0, 3, "first").profile.coins).toBe(50 + 20 + 2);
  });
});

describe("streak bonus", () => {
  it("is 2 x min(streak, 7)", () => {
    expect([1, 2, 3, 6, 7, 8, 30].map(streakBonus)).toEqual([2, 4, 6, 12, 14, 14, 14]);
    expect(STREAK_BONUS_CAP).toBe(7);
  });

  it("is paid once per day, on the first clear", () => {
    const first = play(defaultProfile(), 0, 1, "first");
    expect(first.events).toContainEqual({
      type: "coins-gained",
      amount: 2,
      reason: "streak-bonus",
    });
    const second = play(first.profile, 0, 3, "same-day");
    expect(
      second.events.some((e) => e.type === "coins-gained" && e.reason === "streak-bonus"),
    ).toBe(false);
  });

  it("grows daily and reaches the cap on day 7 and stays on day 8", () => {
    let profile = defaultProfile();
    const bonuses: number[] = [];
    for (let day = 0; day < 9; day++) {
      const before = profile.coins;
      const out = play(profile, day, 1, day === 0 ? "first" : "next-day");
      bonuses.push(out.profile.coins - before - 10);
      profile = out.profile;
    }
    expect(bonuses).toEqual([2, 4, 6, 8, 10, 12, 14, 14, 14]);
    expect(profile.daily.streak).toBe(9);
    expect(profile.daily.bestStreak).toBe(9);
  });
});

describe("streak steps", () => {
  function withStreak(streak: number, freezes: number, lastDay = 0): Profile {
    return profileWith({
      streakFreezes: freezes,
      daily: {
        lastKey: dateOf(lastDay),
        streak,
        bestStreak: streak,
        results: { [dateOf(lastDay)]: { stars: 1, score: 100 } },
      },
    });
  }

  it("extends the streak on the next day", () => {
    const out = play(withStreak(4, 0), 1, 1, "next-day");
    expect(out.profile.daily.streak).toBe(5);
    expect(out.profile.daily.lastKey).toBe(dateOf(1));
  });

  it("consumes one freeze for one missed day and keeps the streak going", () => {
    const out = play(withStreak(4, 1), 2, 2, "gap", 1);
    expect(out.profile.daily.streak).toBe(5);
    expect(out.profile.streakFreezes).toBe(0);
    expect(out.events).toContainEqual({ type: "freeze-used", count: 1 });
  });

  it("consumes two freezes for two missed days", () => {
    const out = play(withStreak(6, 2), 3, 1, "gap", 2);
    expect(out.profile.daily.streak).toBe(7);
    expect(out.profile.streakFreezes).toBe(0);
  });

  it("resets the streak when two days are missed with one freeze, keeping the freeze", () => {
    const out = play(withStreak(6, 1), 3, 1, "gap", 2);
    expect(out.profile.daily.streak).toBe(1);
    expect(out.profile.streakFreezes).toBe(1);
    expect(out.profile.daily.bestStreak).toBe(6);
    expect(out.events).toContainEqual({ type: "streak-reset" });
  });

  it("resets the streak on a gap with no freezes", () => {
    const out = play(withStreak(3, 0), 5, 1, "gap", 4);
    expect(out.profile.daily.streak).toBe(1);
  });

  it("changes nothing when the clock went back", () => {
    const start = withStreak(4, 1, 5);
    const out = applyDailyResult(start, {
      dateKey: dateOf(2),
      step: "clock-went-back",
      missedDays: 0,
      stars: 3,
      score: 999,
    });
    expect(out.profile).toBe(start);
    expect(out.counted).toBe(false);
    expect(out.events).toEqual([]);
  });

  it("tracks the best streak across a reset", () => {
    let profile = defaultProfile();
    for (let day = 0; day < 5; day++)
      profile = play(profile, day, 1, day === 0 ? "first" : "next-day").profile;
    profile = play(profile, 9, 1, "gap", 4).profile;
    expect(profile.daily.streak).toBe(1);
    expect(profile.daily.bestStreak).toBe(5);
  });

  it("treats a same-day replay as the same streak", () => {
    const profile = play(defaultProfile(), 0, 1, "first").profile;
    const again = play(profile, 0, 2, "same-day");
    expect(again.profile.daily.streak).toBe(1);
  });
});

describe("freezes are capped by the shop, not by use", () => {
  it("never goes below zero", () => {
    const out = play(
      profileWith({
        daily: { lastKey: dateOf(0), streak: 3, bestStreak: 3, results: {} },
        streakFreezes: 0,
      }),
      2,
      1,
      "gap",
      1,
    );
    expect(out.profile.streakFreezes).toBe(0);
  });
});

describe("daily storage limits", () => {
  it("keeps only the newest 60 results and appends to history", () => {
    let profile = defaultProfile();
    for (let day = 0; day < 75; day++)
      profile = play(profile, day, 1, day === 0 ? "first" : "next-day").profile;
    expect(Object.keys(profile.daily.results)).toHaveLength(DAILY_RESULT_LIMIT);
    expect(profile.daily.results[dateOf(74)]).toBeDefined();
    expect(profile.daily.results[dateOf(0)]).toBeUndefined();
    expect(profile.history).toHaveLength(50);
    expect(profile.history.at(-1)?.kind).toBe("daily");
  });
});
