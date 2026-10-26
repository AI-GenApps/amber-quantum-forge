import { describe, expect, it } from "vitest";
import {
  allRegularsDue,
  applyLateResult,
  buildLateShift,
  decorEffects,
  defaultProfile,
  hashString,
  LAMP_BONUS,
  LATE_SHIFT_TICKS,
  lateCustomers,
  lateIndexToday,
  lateOpen,
  type Profile,
  START_COINS,
  type StreakInput,
  streakBonus,
  WEATHER_RULES,
} from "../src";
import { PERFECT, playShift } from "./helpers/bot";
import { fakeResult } from "./helpers/results";

const seedFor = (date: string) => hashString(`the-last-window|daily|${date}`);
const regulars = allRegularsDue();

function lateProfile(overrides: Partial<Profile> = {}): Profile {
  return { ...defaultProfile(), day: 15, ...overrides };
}

describe("buildLateShift", () => {
  const cases: Array<[number, number, number]> = [
    [0, 12, 40],
    [5, 13, 39],
    [30, 14, 34],
    [100, 14, 34],
  ];
  for (const [n, customers, seconds] of cases) {
    it(`with ${n} Late Shifts done: ${customers} customers, ${seconds} s base patience`, () => {
      const def = buildLateShift(seedFor("2026-10-23"), 0, n, regulars);
      expect(def.arrivals).toHaveLength(customers);
      const rain = WEATHER_RULES[def.weather].patienceSeconds;
      expect(def.basePatienceTicks / 10).toBe(seconds + rain);
      expect(def.kind).toBe("late");
      expect(def.lengthTicks).toBe(LATE_SHIFT_TICKS);
      expect(def.lengthTicks).toBe(2400);
    });
  }

  it("caps customers at 14 and floors patience at 34 seconds for any count", () => {
    for (const n of [0, 4, 5, 9, 10, 25, 26, 29, 30, 31, 55, 100, 1000]) {
      expect(lateCustomers(n)).toBe(Math.min(14, 12 + Math.floor(n / 5)));
      const def = buildLateShift(seedFor("2026-10-23"), 0, n, regulars);
      expect(def.arrivals.length).toBeLessThanOrEqual(14);
      const rain = WEATHER_RULES[def.weather].patienceSeconds;
      expect(def.basePatienceTicks / 10 - rain).toBe(Math.max(34, 40 - Math.floor(n / 5)));
    }
  });

  it("unlocks everything", () => {
    const def = buildLateShift(seedFor("2026-10-23"), 0, 0, regulars);
    expect(def.unlocked.drinks).toHaveLength(6);
    expect(def.unlocked.pastries).toHaveLength(5);
    expect(def.unlocked.books).toHaveLength(5);
  });

  it("brings exactly three distinct regulars", () => {
    for (let index = 0; index < 20; index++) {
      const def = buildLateShift(seedFor("2026-10-23"), index, 0, regulars);
      const ids = def.arrivals
        .filter((a) => a.customer.kind === "regular")
        .map((a) => a.customer.regularId);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
    }
  });

  it("gives the same definition for the same seed and index", () => {
    const a = buildLateShift(seedFor("2026-10-23"), 2, 7, regulars);
    const b = buildLateShift(seedFor("2026-10-23"), 2, 7, regulars);
    expect(b).toEqual(a);
  });

  it("differs between dates and between indexes", () => {
    const base = buildLateShift(seedFor("2026-10-23"), 0, 0, regulars);
    const nextDay = buildLateShift(seedFor("2026-10-24"), 0, 0, regulars);
    const nextIndex = buildLateShift(seedFor("2026-10-23"), 1, 0, regulars);
    expect(nextDay.arrivals).not.toEqual(base.arrivals);
    expect(nextIndex.arrivals).not.toEqual(base.arrivals);
    expect(nextDay.seed).not.toBe(base.seed);
    const weathers = new Set(
      Array.from(
        { length: 30 },
        (_, i) => buildLateShift(seedFor(`2026-11-${10 + (i % 18)}`), i, 0, regulars).weather,
      ),
    );
    expect(weathers.size).toBe(3);
  });

  it("applies owned decor and the relaxed flag", () => {
    const decor = decorEffects(["decor-1", "decor-7"]);
    const plain = buildLateShift(seedFor("2026-10-23"), 0, 0, regulars);
    const dressed = buildLateShift(seedFor("2026-10-23"), 0, 0, regulars, { decor, relaxed: true });
    const extra = 4 + (dressed.weather === "rain" ? 8 : 0);
    expect(dressed.basePatienceTicks - plain.basePatienceTicks).toBe(extra * 10);
    expect(dressed.relaxed).toBe(true);
    expect(dressed.decor).toEqual(decor);
  });

  it("omits pastries from orders when the pastry shelf is empty", () => {
    const def = buildLateShift(seedFor("2026-10-23"), 0, 0, regulars, { shelfEmpty: true });
    expect(def.arrivals.every((a) => a.order.pastry === null)).toBe(true);
  });

  it("runs through the real engine and applies to the profile", () => {
    const def = buildLateShift(seedFor("2026-10-23"), 0, 0, regulars);
    const run = playShift(
      def,
      { pastries: ["pastry-1", "pastry-2", "pastry-3"], books: ["book-1", "book-2", "book-3"] },
      PERFECT,
    );
    expect(run.result.kind).toBe("late");
    expect(run.result.arrived).toBe(12);
    const applied = applyLateResult(
      lateProfile(),
      { dateKey: "2026-10-23", step: "first" },
      run.result,
    );
    expect(applied.accepted).toBe(true);
    expect(applied.profile.coins).toBe(START_COINS + run.result.coins + 15 + 2);
  });
});

describe("applyLateResult", () => {
  const result = fakeResult({ kind: "late", day: 15, payments: 50, tips: 8, stars: 3, run: 6 });
  const run = (profile: Profile, dateKey: string, step: StreakInput) =>
    applyLateResult(profile, { dateKey, step }, result);

  it("pays the Lamp Bonus and a streak of 1 on the first Late Shift ever", () => {
    const applied = run(lateProfile(), "2026-10-23", "first");
    expect(applied.lampBonus).toBe(LAMP_BONUS);
    expect(applied.streakBonus).toBe(2);
    expect(applied.profile.coins).toBe(START_COINS + 78 + 15 + 2);
    expect(applied.profile.late).toMatchObject({
      count: 1,
      todayCount: 1,
      lastKey: "2026-10-23",
      streak: 1,
      bestStreak: 1,
      firstOfDayClaimed: true,
    });
    expect(applied.events.map((e) => e.type === "coins-gained" && e.source)).toEqual([
      "shift",
      "lamp",
      "streak",
    ]);
  });

  it("pays the Lamp Bonus only once per local date", () => {
    const first = run(lateProfile(), "2026-10-23", "first");
    const second = run(first.profile, "2026-10-23", "same-day");
    expect(second.lampBonus).toBe(0);
    expect(second.streakBonus).toBe(0);
    expect(second.profile.coins).toBe(first.profile.coins + 78);
    expect(second.profile.late).toMatchObject({ count: 2, todayCount: 2, streak: 1 });
    const third = run(second.profile, "2026-10-23", "same-day");
    expect(third.profile.coins).toBe(second.profile.coins + 78);
    expect(third.profile.late.todayCount).toBe(3);
  });

  it("grows the streak on the next day: 2 x streak", () => {
    const first = run(lateProfile(), "2026-10-23", "first");
    const next = run(first.profile, "2026-10-24", "next-day");
    expect(next.profile.late).toMatchObject({
      streak: 2,
      bestStreak: 2,
      todayCount: 1,
      lastKey: "2026-10-24",
    });
    expect(next.lampBonus).toBe(15);
    expect(next.streakBonus).toBe(4);
  });

  it("resets the streak to 1 after a gap but keeps the best", () => {
    let profile = run(lateProfile(), "2026-10-23", "first").profile;
    profile = run(profile, "2026-10-24", "next-day").profile;
    profile = run(profile, "2026-10-25", "next-day").profile;
    const gap = run(profile, "2026-10-29", "gap");
    expect(gap.profile.late.streak).toBe(1);
    expect(gap.profile.late.bestStreak).toBe(3);
    expect(gap.streakBonus).toBe(2);
    expect(gap.lampBonus).toBe(15);
  });

  it("changes no streak data when the clock went back", () => {
    const first = run(lateProfile(), "2026-10-23", "first");
    const back = run(first.profile, "2026-10-20", "clock-went-back");
    expect(back.lampBonus).toBe(0);
    expect(back.streakBonus).toBe(0);
    expect(back.profile.late.lastKey).toBe("2026-10-23");
    expect(back.profile.late.streak).toBe(1);
    expect(back.profile.late.todayCount).toBe(first.profile.late.todayCount);
    expect(back.profile.late.count).toBe(2);
    expect(back.profile.coins).toBe(first.profile.coins + 78);
  });

  it("caps the streak bonus at 7 days", () => {
    let profile = lateProfile();
    const bonuses: number[] = [];
    for (let day = 1; day <= 10; day++) {
      const key = `2026-11-${String(day).padStart(2, "0")}`;
      const applied = run(profile, key, day === 1 ? "first" : "next-day");
      bonuses.push(applied.streakBonus);
      profile = applied.profile;
    }
    expect(bonuses).toEqual([2, 4, 6, 8, 10, 12, 14, 14, 14, 14]);
    expect(profile.late.streak).toBe(10);
    expect(streakBonus(profile.late.streak)).toBe(14);
  });

  it("tracks records and the number of Late Shifts", () => {
    const better = fakeResult({ kind: "late", day: 15, payments: 90, tips: 10, stars: 3, run: 9 });
    const worse = fakeResult({ kind: "late", day: 15, payments: 10, tips: 0, stars: 1, run: 1 });
    let profile = applyLateResult(
      lateProfile(),
      { dateKey: "2026-10-23", step: "first" },
      better,
    ).profile;
    profile = applyLateResult(profile, { dateKey: "2026-10-23", step: "same-day" }, worse).profile;
    expect(profile.late.records).toEqual({ bestEarnings: 120, bestDelightedRun: 9 });
    expect(profile.late.count).toBe(2);
  });

  it("is refused before the campaign is complete", () => {
    const applied = run(defaultProfile(), "2026-10-23", "first");
    expect(applied.accepted).toBe(false);
    expect(applied.profile).toEqual(defaultProfile());
    expect(applied.lampBonus).toBe(0);
  });

  it("does not advance the campaign day or write the diary", () => {
    const applied = run(lateProfile(), "2026-10-23", "first");
    expect(applied.profile.day).toBe(15);
    expect(applied.profile.diary).toEqual([]);
    expect(applied.profile.daysDone).toEqual({});
  });
});

describe("late shift index and gate", () => {
  it("uses today's count as the index and restarts on a new date", () => {
    let profile = lateProfile();
    expect(lateIndexToday(profile, "2026-10-23")).toBe(0);
    const result = fakeResult({ kind: "late", day: 15 });
    profile = applyLateResult(profile, { dateKey: "2026-10-23", step: "first" }, result).profile;
    expect(lateIndexToday(profile, "2026-10-23")).toBe(1);
    profile = applyLateResult(profile, { dateKey: "2026-10-23", step: "same-day" }, result).profile;
    expect(lateIndexToday(profile, "2026-10-23")).toBe(2);
    expect(lateIndexToday(profile, "2026-10-24")).toBe(0);
  });

  it("opens after Day 14 only", () => {
    expect(lateOpen(defaultProfile())).toBe(false);
    expect(lateOpen({ ...defaultProfile(), day: 14 })).toBe(false);
    expect(lateOpen({ ...defaultProfile(), day: 15 })).toBe(true);
  });
});
