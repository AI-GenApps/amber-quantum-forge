import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  applyDailyResult,
  DAILY_REWARD,
  type DailyResultInput,
  dailyReward,
  defaultProfile,
  MAX_DAILY_RESULTS,
  type Profile,
  type ProgressEvent,
  type Stars,
  streakBonus,
} from "../src/index";
import { economyTable, numbersIn, rowStartingWith } from "./helpers/economy-doc";

const START = "2026-03-01";

function play(
  profile: Profile,
  dateKey: string,
  stars: Stars,
  step: DailyResultInput["step"],
  missedDays?: number,
) {
  const input: DailyResultInput =
    missedDays === undefined
      ? { dateKey, step, stars, harmony: 80 }
      : { dateKey, step, stars, harmony: 80, missedDays };
  return applyDailyResult(profile, input);
}

function gained(events: readonly ProgressEvent[], reason: string): number {
  return events.reduce(
    (sum, event) =>
      sum + (event.type === "coins-gained" && event.reason === reason ? event.amount : 0),
    0,
  );
}

function streakRun(days: number): { profile: Profile; last: ProgressEvent[] } {
  let profile = defaultProfile();
  let last: ProgressEvent[] = [];
  for (let day = 0; day < days; day += 1) {
    const update = play(profile, addDaysToKey(START, day), 1, day === 0 ? "gap" : "next-day");
    profile = update.profile;
    last = [...update.events];
  }
  return { profile, last };
}

describe("economy.md daily rows", () => {
  it("pays 8, 12 and 16 for a clear", () => {
    const row = rowStartingWith(economyTable("Source"), "Daily clear");
    expect(numbersIn(row[1] ?? "").filter((value) => value > 3)).toEqual([8, 12, 16]);
    expect([dailyReward(1), dailyReward(2), dailyReward(3)]).toEqual([8, 12, 16]);
    expect(DAILY_REWARD[0]).toBe(0);
  });

  it("pays 2 x min(streak, 7) as a bonus", () => {
    const row = rowStartingWith(economyTable("Source"), "Daily streak bonus");
    expect(numbersIn(row[1] ?? "")).toEqual([2, 7, 2, 14]);
    expect(streakBonus(1)).toBe(2);
    expect(streakBonus(7)).toBe(14);
    expect(streakBonus(8)).toBe(14);
    expect(streakBonus(40)).toBe(14);
    expect(streakBonus(0)).toBe(0);
  });
});

describe("daily clear", () => {
  it("pays tier plus streak bonus on the first clear of a date", () => {
    const one = play(defaultProfile(), START, 1, "gap");
    expect(gained(one.events, "daily")).toBe(8);
    expect(gained(one.events, "daily-streak")).toBe(2);
    expect(one.profile.coins).toBe(40 + 10);
    expect(one.profile.daily).toMatchObject({ lastKey: START, streak: 1, bestStreak: 1 });
    const two = play(defaultProfile(), START, 2, "gap");
    expect(two.profile.coins).toBe(40 + 12 + 2);
    const three = play(defaultProfile(), START, 3, "gap");
    expect(three.profile.coins).toBe(40 + 16 + 2);
    expect(three.profile.daily.results[START]).toEqual({ stars: 3, harmony: 80 });
  });

  it("upgrading the tier pays the difference and no second streak bonus", () => {
    const first = play(defaultProfile(), START, 1, "gap").profile;
    const upgrade = play(first, START, 2, "same-day");
    expect(gained(upgrade.events, "daily")).toBe(4);
    expect(gained(upgrade.events, "daily-streak")).toBe(0);
    const top = play(upgrade.profile, START, 3, "same-day");
    expect(gained(top.events, "daily")).toBe(4);
    expect(top.profile.coins).toBe(40 + 8 + 2 + 4 + 4);
    expect(top.profile.daily.streak).toBe(1);
  });

  it("jumping from one to three stars pays the difference of 8", () => {
    const first = play(defaultProfile(), START, 1, "gap").profile;
    const jump = play(first, START, 3, "same-day");
    expect(gained(jump.events, "daily")).toBe(8);
  });

  it("a repeat or a worse result on the same date pays nothing and keeps the best", () => {
    const first = play(defaultProfile(), START, 3, "gap").profile;
    const worse = play(first, START, 1, "same-day");
    expect(worse.profile.coins).toBe(first.coins);
    expect(worse.profile.daily.results[START]?.stars).toBe(3);
    const same = play(first, START, 3, "same-day");
    expect(same.profile.coins).toBe(first.coins);
  });

  it("a zero-star result changes nothing", () => {
    const start = defaultProfile();
    const update = play(start, START, 0, "gap");
    expect(update.profile).toBe(start);
    expect(update.events).toEqual([]);
  });

  it("daily stars never count towards campaign stars", () => {
    const update = play(defaultProfile(), START, 3, "gap");
    expect(update.profile.stars).toEqual({});
    expect(update.profile.stats.starsEarned).toBe(0);
    expect(update.profile.stats.looksFinished).toBe(1);
  });

  it("rejects an invalid date key without changing anything", () => {
    const start = defaultProfile();
    expect(play(start, "2026-02-30", 3, "gap").profile).toBe(start);
    expect(play(start, "tomorrow", 3, "gap").profile).toBe(start);
  });

  it("records history and trims results to the last 60 days", () => {
    let profile = defaultProfile();
    for (let day = 0; day < 70; day += 1) {
      profile = play(profile, addDaysToKey(START, day), 2, day === 0 ? "gap" : "next-day").profile;
    }
    const keys = Object.keys(profile.daily.results);
    expect(keys).toHaveLength(MAX_DAILY_RESULTS);
    expect(keys[0]).toBe(addDaysToKey(START, 10));
    expect(keys.at(-1)).toBe(addDaysToKey(START, 69));
    expect(profile.history).toHaveLength(50);
    expect(profile.history.at(-1)).toMatchObject({ kind: "daily", ref: addDaysToKey(START, 69) });
  });
});

describe("streak", () => {
  it("grows one per day and pays 2 x streak up to the cap", () => {
    const bonuses: number[] = [];
    let profile = defaultProfile();
    for (let day = 0; day < 9; day += 1) {
      const update = play(profile, addDaysToKey(START, day), 1, day === 0 ? "gap" : "next-day");
      bonuses.push(gained(update.events, "daily-streak"));
      profile = update.profile;
    }
    expect(bonuses).toEqual([2, 4, 6, 8, 10, 12, 14, 14, 14]);
    expect(profile.daily.streak).toBe(9);
    expect(profile.daily.bestStreak).toBe(9);
  });

  it("reaches the cap on day 7 and stays there on day 8", () => {
    expect(gained(streakRun(7).last, "daily-streak")).toBe(14);
    expect(gained(streakRun(8).last, "daily-streak")).toBe(14);
    expect(gained(streakRun(6).last, "daily-streak")).toBe(12);
  });

  it("a gap with no freeze resets the streak to 1 and keeps the best", () => {
    const run = streakRun(5).profile;
    const gap = play(run, addDaysToKey(START, 7), 1, "gap", 2);
    expect(gap.profile.daily.streak).toBe(1);
    expect(gap.profile.daily.bestStreak).toBe(5);
    expect(gap.events).toContainEqual({ type: "streak-reset" });
    expect(gained(gap.events, "daily-streak")).toBe(2);
  });

  it("one freeze covers exactly one missed day and is consumed", () => {
    const run = { ...streakRun(5).profile, streakFreezes: 1 };
    const update = play(run, addDaysToKey(START, 6), 1, "gap", 1);
    expect(update.profile.daily.streak).toBe(6);
    expect(update.profile.streakFreezes).toBe(0);
    expect(update.events).toContainEqual({ type: "freeze-used", count: 1 });
  });

  it("two missed days with one freeze reset the streak and keep the freeze", () => {
    const run = { ...streakRun(5).profile, streakFreezes: 1 };
    const update = play(run, addDaysToKey(START, 7), 1, "gap", 2);
    expect(update.profile.daily.streak).toBe(1);
    expect(update.profile.streakFreezes).toBe(1);
  });

  it("two missed days with two freezes consume both", () => {
    const run = { ...streakRun(5).profile, streakFreezes: 2 };
    const update = play(run, addDaysToKey(START, 7), 1, "gap", 2);
    expect(update.profile.daily.streak).toBe(6);
    expect(update.profile.streakFreezes).toBe(0);
  });

  it("three missed days with two freezes reset", () => {
    const run = { ...streakRun(5).profile, streakFreezes: 2 };
    const update = play(run, addDaysToKey(START, 8), 1, "gap", 3);
    expect(update.profile.daily.streak).toBe(1);
    expect(update.profile.streakFreezes).toBe(2);
  });

  it("a gap without a missed-day count is treated as one missed day", () => {
    const run = { ...streakRun(3).profile, streakFreezes: 1 };
    const update = play(run, addDaysToKey(START, 4), 1, "gap");
    expect(update.profile.daily.streak).toBe(4);
    expect(update.profile.streakFreezes).toBe(0);
  });

  it("clock-went-back is neutral: no coins, no streak, no result", () => {
    const run = streakRun(3).profile;
    const update = play(run, addDaysToKey(START, 1), 3, "clock-went-back");
    expect(update.profile).toBe(run);
    expect(update.events).toEqual([]);
  });

  it("the first ever clear starts the streak at 1 whatever the step says", () => {
    const update = play(defaultProfile(), START, 1, "next-day");
    expect(update.profile.daily.streak).toBe(1);
  });
});
