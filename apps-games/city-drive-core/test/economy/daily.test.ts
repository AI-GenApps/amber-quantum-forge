import { describe, expect, it } from "vitest";
import {
  applyDailyVariant,
  claimDaily,
  DAILY_REWARDS,
  dailyChallenge,
  dailyReward,
  dailyStatus,
  dailyTrafficAgents,
  dailyVariantFor,
  dateKeyOf,
  dateSeed,
  daysBetween,
  defaultSave,
  isDateKey,
  type MissionDef,
  pickDailyMission,
  STREAK_BONUS_CAP,
  streakBonus,
  streakIfClaimed,
} from "../../src/index";
import { readMissions } from "./sim";

const missions = readMissions();
const district1 = missions.filter((m) => m.district === "district-1");
const save = () => defaultSave("sedan");

function dates(from: string, days: number): string[] {
  const start = Date.parse(`${from}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) => dateKeyOf(start + i * 86_400_000));
}

describe("date keys", () => {
  it("accepts real calendar dates only", () => {
    expect(isDateKey("2026-10-15")).toBe(true);
    expect(isDateKey("2024-02-29")).toBe(true);
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2026-13-01")).toBe(false);
    expect(isDateKey("2026-1-1")).toBe(false);
    expect(isDateKey(20261015)).toBe(false);
  });

  it("counts days across month, leap-day and year boundaries", () => {
    expect(daysBetween("2026-01-31", "2026-02-01")).toBe(1);
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
    expect(daysBetween("2024-02-28", "2024-03-01")).toBe(2);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(daysBetween("2026-10-15", "2026-10-15")).toBe(0);
    expect(daysBetween("2026-10-15", "2026-10-10")).toBe(-5);
    expect(dateKeyOf(Date.UTC(2026, 11, 31, 23, 59, 59))).toBe("2026-12-31");
    expect(dateKeyOf(Date.UTC(2027, 0, 1, 0, 0, 0))).toBe("2027-01-01");
  });
});

describe("the daily mission", () => {
  it("gives the same mission and variant for the same date and unlocked set", () => {
    for (const date of dates("2026-12-25", 20)) {
      expect(pickDailyMission(date, district1).id).toBe(pickDailyMission(date, district1).id);
      expect(dailyVariantFor(date)).toEqual(dailyVariantFor(date));
      expect(dateSeed(date)).toBe(dateSeed(date));
    }
  });

  it("does not depend on the order of the unlocked list", () => {
    const reversed = [...district1].reverse();
    for (const date of dates("2026-01-01", 40)) {
      expect(pickDailyMission(date, reversed).id).toBe(pickDailyMission(date, district1).id);
    }
  });

  it("only ever picks from the unlocked missions", () => {
    const ids = new Set(district1.map((m) => m.id));
    for (const date of dates("2026-01-01", 400)) {
      expect(ids.has(pickDailyMission(date, district1).id)).toBe(true);
    }
  });

  it("changes from day to day and reaches every unlocked mission over a year", () => {
    const picked = dates("2026-01-01", 365).map((d) => pickDailyMission(d, district1).id);
    expect(new Set(picked).size).toBe(district1.length);
    const repeats = picked.filter((id, i) => i > 0 && id === picked[i - 1]).length;
    expect(repeats).toBeLessThan(80);
  });

  it("a new district widens the pool without changing the rule", () => {
    const all = new Set<string>();
    for (const date of dates("2026-01-01", 365)) all.add(pickDailyMission(date, missions).id);
    expect(all.size).toBe(missions.length);
  });

  it("rejects a bad date and an empty pool", () => {
    expect(() => pickDailyMission("2026-02-30", missions)).toThrow(/not a YYYY-MM-DD/);
    expect(() => pickDailyMission("2026-10-15", [])).toThrow(/no unlocked missions/);
  });

  it("picks across the year boundary without gaps", () => {
    for (const date of ["2026-12-31", "2027-01-01", "2028-02-29", "2028-03-01"]) {
      expect(pickDailyMission(date, missions).id).toMatch(/^d\d-m\d\d$/);
    }
  });
});

describe("the daily variant", () => {
  const trial = missions.find((m) => m.type === "time_trial") as MissionDef;
  const delivery = missions.find((m) => m.type === "delivery") as MissionDef;
  const step2 = { parStep: 2, trafficStep: 2 } as const;

  it("only uses bounded steps", () => {
    for (const date of dates("2026-01-01", 400)) {
      const v = dailyVariantFor(date);
      expect([0, 1, 2]).toContain(v.parStep);
      expect([0, 1, 2]).toContain(v.trafficStep);
    }
  });

  it("leaves the mission alone at step 0 and for parking and taxi", () => {
    expect(applyDailyVariant(trial, { parStep: 0, trafficStep: 0 })).toBe(trial);
    for (const type of ["parking", "taxi"] as const) {
      const m = missions.find((x) => x.type === type) as MissionDef;
      expect(applyDailyVariant(m, step2)).toBe(m);
    }
  });

  it("never loosens a star bar and keeps the three-star bar within the autopilot time", () => {
    for (const m of missions) {
      const v = applyDailyVariant(m, step2);
      const auto = m.validation?.autopilot_time_s ?? 0;
      if (m.type === "time_trial" && v.type === "time_trial") {
        for (const k of ["1", "2", "3"] as const) {
          expect(v.stars[k].max_time_s).toBeLessThanOrEqual(m.stars[k].max_time_s);
          expect(v.stars[k].max_time_s).toBeGreaterThanOrEqual(
            Math.min(m.stars[k].max_time_s, auto),
          );
        }
      }
      if (m.type === "delivery" && v.type === "delivery") {
        for (const k of ["1", "2", "3"] as const) {
          expect(v.stars[k].min_time_left_s).toBeGreaterThanOrEqual(m.stars[k].min_time_left_s);
        }
        const room = Math.max(m.stars["3"].min_time_left_s, m.params.time_limit_s - auto);
        expect(v.stars["3"].min_time_left_s).toBeLessThanOrEqual(room + 1e-9);
      }
    }
  });

  it("makes a time trial strictly tighter when the autopilot leaves room", () => {
    const v = applyDailyVariant(trial, step2);
    if (v.type !== "time_trial" || trial.type !== "time_trial") throw new Error("not a trial");
    expect(v.stars["1"].max_time_s).toBeLessThan(trial.stars["1"].max_time_s);
  });

  it("makes a delivery demand more time left on the easy bars", () => {
    const v = applyDailyVariant(delivery, step2);
    if (v.type !== "delivery" || delivery.type !== "delivery") throw new Error("not a delivery");
    expect(v.stars["1"].min_time_left_s).toBeGreaterThan(delivery.stars["1"].min_time_left_s);
    expect(v.params).toEqual(delivery.params);
    expect(v.reward_coins).toEqual(delivery.reward_coins);
  });

  it("adds a bounded number of AI cars", () => {
    expect(dailyTrafficAgents(8, { parStep: 0, trafficStep: 0 })).toBe(8);
    expect(dailyTrafficAgents(8, step2)).toBe(12);
  });

  it("dailyChallenge bundles pick, variant, status and streak", () => {
    const s = save();
    const c = dailyChallenge("2026-10-15", district1, s.daily);
    expect(c.missionId).toBe(pickDailyMission("2026-10-15", district1).id);
    expect(c.mission.id).toBe(c.missionId);
    expect(c.status).toBe("available");
    expect(c.streak).toBe(1);
  });
});

describe("daily rewards and streak", () => {
  it("pays the flat reward by stars and nothing for a failed run", () => {
    expect(dailyReward(1, 1)).toEqual({ base: DAILY_REWARDS["1"], bonus: 0 });
    expect(dailyReward(3, 1).base).toBe(DAILY_REWARDS["3"]);
    expect(dailyReward(0, 5)).toEqual({ base: 0, bonus: 0 });
  });

  it("grows the bonus by 10% a day and stops at the cap", () => {
    expect(streakBonus(1)).toBe(0);
    expect(streakBonus(2)).toBeCloseTo(0.1);
    expect(streakBonus(4)).toBeCloseTo(0.3);
    expect(streakBonus(6)).toBeCloseTo(STREAK_BONUS_CAP);
    expect(streakBonus(60)).toBe(STREAK_BONUS_CAP);
    expect(dailyReward(2, 60)).toEqual({ base: 80, bonus: 40 });
  });

  it("starts a streak at 1, extends it on the next day and resets after a gap", () => {
    let s = save();
    const claim = (date: string, stars: 1 | 2 | 3 = 2) => {
      const r = claimDaily(s, date, stars);
      if (r.ok) s = r.save;
      return r;
    };
    expect(claim("2026-10-15")).toMatchObject({ ok: true, streak: 1, coins: 80 });
    expect(claim("2026-10-16")).toMatchObject({ ok: true, streak: 2, coins: 88 });
    expect(claim("2026-10-17")).toMatchObject({ ok: true, streak: 3, coins: 96 });
    expect(claim("2026-10-19")).toMatchObject({ ok: true, streak: 1, coins: 80 });
    expect(s.daily).toEqual({ last_claim_date: "2026-10-19", streak: 1 });
    expect(s.coins).toBe(80 + 88 + 96 + 80);
  });

  it("keeps the streak across month, leap-day and year boundaries", () => {
    for (const [a, b] of [
      ["2026-01-31", "2026-02-01"],
      ["2024-02-28", "2024-02-29"],
      ["2024-02-29", "2024-03-01"],
      ["2026-12-31", "2027-01-01"],
    ] as const) {
      const first = claimDaily(save(), a, 1);
      if (!first.ok) throw new Error("first claim failed");
      expect(streakIfClaimed(first.save.daily, b)).toBe(2);
    }
  });

  it("pays a date once and lets a failed run retry the same day", () => {
    const s = save();
    expect(claimDaily(s, "2026-10-15", 0)).toEqual({ ok: false, reason: "no-stars" });
    const won = claimDaily(s, "2026-10-15", 1);
    if (!won.ok) throw new Error("expected a payout");
    expect(claimDaily(won.save, "2026-10-15", 3)).toEqual({ ok: false, reason: "already-claimed" });
    expect(dailyStatus(won.save.daily, "2026-10-15")).toBe("claimed");
  });

  it("refuses a date at or before the last claim when the clock goes backwards", () => {
    const won = claimDaily(save(), "2026-10-15", 2);
    if (!won.ok) throw new Error("expected a payout");
    expect(claimDaily(won.save, "2026-10-14", 3)).toEqual({
      ok: false,
      reason: "clock-backwards",
    });
    expect(claimDaily(won.save, "2025-01-01", 3).ok).toBe(false);
    expect(dailyStatus(won.save.daily, "2026-10-14")).toBe("clock-backwards");
    expect(won.save.coins).toBe(80);
  });

  it("accepts a clock set forward and resets the streak (no anti-tamper)", () => {
    const won = claimDaily(save(), "2026-10-15", 2);
    if (!won.ok) throw new Error("expected a payout");
    const jump = claimDaily(won.save, "2030-01-01", 2);
    expect(jump).toMatchObject({ ok: true, streak: 1 });
  });

  it("rejects a malformed date and never mutates the save", () => {
    const s = save();
    const before = JSON.stringify(s);
    expect(claimDaily(s, "tomorrow", 3)).toEqual({ ok: false, reason: "bad-date" });
    claimDaily(s, "2026-10-15", 3);
    expect(JSON.stringify(s)).toBe(before);
  });
});
