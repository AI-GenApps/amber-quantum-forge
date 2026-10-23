import { describe, expect, it } from "vitest";
import {
  addDays,
  applyDailyResult,
  closeDailyCase,
  DAILY_POSTAGE,
  DAILY_RESULT_LIMIT,
  dailySeedOf,
  defaultProfile,
  generateDaily,
  type Profile,
  streakBonus,
  weekdayOf,
} from "../src";
import { docTable, numbers, row } from "./fixtures/doc";
import { solve } from "./fixtures/solve";

const DAY = "2026-03-01";

function play(profile: Profile, dateKey: string, stamps: number): Profile {
  const last = profile.daily.lastKey;
  let step: "first" | "same-day" | "next-day" | "gap" = "first";
  let missedDays = 0;
  if (last !== null) {
    const delta = Math.round(
      (Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 86_400_000,
    );
    step = delta === 0 ? "same-day" : delta === 1 ? "next-day" : "gap";
    missedDays = Math.max(0, delta - 1);
  }
  return applyDailyResult(profile, { dateKey, step, stamps, missedDays }).profile;
}

describe("daily rewards", () => {
  it("match the economy.md row", () => {
    const rows = docTable("economy.md", "## Sources of postage");
    expect(numbers(row(rows, "Daily Parcel, best tier")[1] ?? "")).toEqual([5, 1, 7, 2, 10, 3]);
    expect(DAILY_POSTAGE).toEqual({ 0: 0, 1: 5, 2: 7, 3: 10 });
    expect(row(rows, "Daily streak bonus")[1]).toBe("2 x min(streak, 7) = 2 to 14");
  });

  it("pays the tier plus the day-one streak bonus on a first clear", () => {
    for (const [stamps, tier] of [
      [1, 5],
      [2, 7],
      [3, 10],
    ] as const) {
      const applied = applyDailyResult(defaultProfile(), { dateKey: DAY, step: "first", stamps });
      expect(applied.counted).toBe(true);
      expect(applied.profile.postage).toBe(30 + tier + 2);
      expect(applied.profile.daily).toEqual({
        lastKey: DAY,
        streak: 1,
        bestStreak: 1,
        results: { [DAY]: { stamps } },
      });
      expect(applied.profile.stats.dailiesCleared).toBe(1);
    }
  });

  it("pays only the difference on an upgrade and no second streak bonus", () => {
    const one = play(defaultProfile(), DAY, 1);
    const three = play(one, DAY, 3);
    expect(three.postage - one.postage).toBe(5);
    expect(three.daily.results[DAY]).toEqual({ stamps: 3 });
    const two = play(one, DAY, 2);
    expect(two.postage - one.postage).toBe(2);
    const worse = play(three, DAY, 1);
    expect(worse.postage).toBe(three.postage);
    expect(worse.daily.results[DAY]).toEqual({ stamps: 3 });
    expect(worse.daily.streak).toBe(1);
    expect(worse.stats.dailiesCleared).toBe(1);
  });

  it("changes nothing for a result without a stamp", () => {
    const start = defaultProfile();
    const applied = applyDailyResult(start, { dateKey: DAY, step: "first", stamps: 0 });
    expect(applied.profile).toBe(start);
    expect(applied.counted).toBe(false);
  });

  it("treats a clock that went back as neutral", () => {
    const start = play(defaultProfile(), DAY, 3);
    const applied = applyDailyResult(start, {
      dateKey: addDays(DAY, -1),
      step: "clock-went-back",
      stamps: 3,
    });
    expect(applied.profile).toBe(start);
    expect(applied.events).toEqual([]);
    expect(applied.counted).toBe(false);
  });
});

describe("streak bonus", () => {
  it("is 2 x min(streak, 7)", () => {
    expect([0, 1, 2, 6, 7, 8, 30].map(streakBonus)).toEqual([0, 2, 4, 12, 14, 14, 14]);
  });

  it("is capped on day 7 and day 8 of a real streak", () => {
    let profile = defaultProfile();
    const gains: number[] = [];
    for (let day = 0; day < 9; day++) {
      const before = profile.postage;
      profile = play(profile, addDays(DAY, day), 1);
      gains.push(profile.postage - before - 5);
    }
    expect(gains).toEqual([2, 4, 6, 8, 10, 12, 14, 14, 14]);
    expect(profile.daily.streak).toBe(9);
    expect(profile.daily.bestStreak).toBe(9);
  });
});

describe("streak and freezes", () => {
  const streakOf3 = (): Profile => {
    let profile = defaultProfile();
    for (let day = 0; day < 3; day++) profile = play(profile, addDays(DAY, day), 1);
    return profile;
  };

  it("continues a streak on the next day", () => {
    const profile = streakOf3();
    expect(profile.daily.streak).toBe(3);
    expect(profile.daily.lastKey).toBe(addDays(DAY, 2));
  });

  it("restarts at 1 after a gap with no freeze", () => {
    const next = play(streakOf3(), addDays(DAY, 4), 1);
    expect(next.daily.streak).toBe(1);
    expect(next.daily.bestStreak).toBe(3);
  });

  it("consumes one freeze for one missed day", () => {
    const held = { ...streakOf3(), streakFreezes: 1 };
    const applied = applyDailyResult(held, {
      dateKey: addDays(DAY, 3 + 1),
      step: "gap",
      stamps: 1,
      missedDays: 1,
    });
    expect(applied.profile.daily.streak).toBe(4);
    expect(applied.profile.streakFreezes).toBe(0);
    expect(applied.events).toContainEqual({ type: "freeze-used", count: 1 });
  });

  it("resets when two days were missed and only one freeze is held", () => {
    const held = { ...streakOf3(), streakFreezes: 1 };
    const applied = applyDailyResult(held, {
      dateKey: addDays(DAY, 5),
      step: "gap",
      stamps: 1,
      missedDays: 2,
    });
    expect(applied.profile.daily.streak).toBe(1);
    expect(applied.profile.streakFreezes).toBe(1);
    expect(applied.events).toContainEqual({ type: "streak-reset" });
  });

  it("consumes two freezes for two missed days", () => {
    const held = { ...streakOf3(), streakFreezes: 2 };
    const applied = applyDailyResult(held, {
      dateKey: addDays(DAY, 5),
      step: "gap",
      stamps: 1,
      missedDays: 2,
    });
    expect(applied.profile.daily.streak).toBe(4);
    expect(applied.profile.streakFreezes).toBe(0);
  });

  it("keeps the streak on a same-day replay", () => {
    const profile = streakOf3();
    const again = play(profile, addDays(DAY, 2), 3);
    expect(again.daily.streak).toBe(3);
  });
});

describe("daily records", () => {
  it("keeps only the latest 60 days", () => {
    let profile = defaultProfile();
    for (let day = 0; day < 75; day++) profile = play(profile, addDays(DAY, day), 1);
    const keys = Object.keys(profile.daily.results).sort();
    expect(keys).toHaveLength(DAILY_RESULT_LIMIT);
    expect(keys.at(-1)).toBe(addDays(DAY, 74));
    expect(keys[0]).toBe(addDays(DAY, 15));
  });

  it("closes a solved daily through the shared helper and clears the session", () => {
    const key = "2026-04-07";
    const def = generateDaily(dailySeedOf(key), weekdayOf(key));
    const state = solve(def);
    expect(state.stamps).toBe(3);
    const start = { ...defaultProfile(), session: { kind: "daily" as const, id: key, state } };
    const closed = closeDailyCase(start, def, state, { dateKey: key, step: "first" });
    expect(closed.counted).toBe(true);
    expect(closed.profile.session).toBeNull();
    expect(closed.profile.postage).toBe(30 + 10 + 2);
    expect(closed.achievements).toContain("clean-sheet");
    expect(closed.achievements).toContain("unaided");
    expect(closed.profile.history.at(-1)).toEqual({ kind: "daily", id: key, stamps: 3, hints: 0 });
  });

  it("closes a daily on a clock that went back without paying", () => {
    const key = "2026-04-07";
    const def = generateDaily(dailySeedOf(key), weekdayOf(key));
    const state = solve(def);
    const closed = closeDailyCase(defaultProfile(), def, state, {
      dateKey: key,
      step: "clock-went-back",
    });
    expect(closed.counted).toBe(false);
    expect(closed.profile.postage).toBe(30);
    expect(closed.achievements).toEqual([]);
  });
});
