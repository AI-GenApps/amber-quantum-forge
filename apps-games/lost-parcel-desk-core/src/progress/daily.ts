import type { Applied, EconomyEvent } from "./economy";
import { DAILY_RESULT_LIMIT, type Profile, type StampCount } from "./profile";
import { appendHistory } from "./records";

export const DAILY_POSTAGE: Readonly<Record<StampCount, number>> = { 0: 0, 1: 5, 2: 7, 3: 10 };
export const STREAK_BONUS_PER_DAY = 2 as const;
export const STREAK_BONUS_CAP = 7 as const;

export type DailyStep = "first" | "same-day" | "next-day" | "gap" | "clock-went-back";

export interface DailyInput {
  dateKey: string;
  step: DailyStep;
  stamps: number;
  missedDays?: number;
  hints?: number;
}

export interface DailyApplied extends Applied {
  counted: boolean;
}

export function streakBonus(streak: number): number {
  return STREAK_BONUS_PER_DAY * Math.min(Math.max(0, streak), STREAK_BONUS_CAP);
}

interface StreakUpdate {
  streak: number;
  freezes: number;
  events: EconomyEvent[];
}

function updateStreak(profile: Profile, step: DailyStep, missedDays: number): StreakUpdate {
  const { streak } = profile.daily;
  const freezes = profile.streakFreezes;
  if (step === "same-day") return { streak: Math.max(1, streak), freezes, events: [] };
  if (step === "next-day") return { streak: streak + 1, freezes, events: [] };
  if (step === "gap") {
    if (streak > 0 && missedDays >= 1 && freezes >= missedDays) {
      return {
        streak: streak + 1,
        freezes: freezes - missedDays,
        events: [{ type: "freeze-used", count: missedDays }],
      };
    }
    return { streak: 1, freezes, events: streak > 0 ? [{ type: "streak-reset" }] : [] };
  }
  return { streak: 1, freezes, events: [] };
}

function trimResults(results: Profile["daily"]["results"]): Profile["daily"]["results"] {
  const keys = Object.keys(results).sort().reverse().slice(0, DAILY_RESULT_LIMIT);
  return Object.fromEntries(keys.map((key) => [key, results[key] as { stamps: StampCount }]));
}

export function applyDailyResult(profile: Profile, input: DailyInput): DailyApplied {
  const { dateKey, step } = input;
  const stamps = Math.min(3, Math.floor(input.stamps)) as StampCount;
  if (step === "clock-went-back" || stamps < 1) return { profile, events: [], counted: false };
  const before = profile.daily.results[dateKey];
  const previous = before?.stamps ?? 0;
  const firstToday = before === undefined;
  const events: EconomyEvent[] = [];
  let postage = profile.postage;
  let { streak } = profile.daily;
  let freezes = profile.streakFreezes;

  if (firstToday) {
    const update = updateStreak(profile, step, Math.max(0, input.missedDays ?? 0));
    streak = update.streak;
    freezes = update.freezes;
    events.push(...update.events, { type: "streak-extended", streak });
  }
  if (stamps > previous) {
    const amount = DAILY_POSTAGE[stamps] - DAILY_POSTAGE[previous as StampCount];
    postage += amount;
    events.push({ type: "postage-gained", amount, reason: "daily-clear" });
  }
  if (firstToday) {
    const amount = streakBonus(streak);
    postage += amount;
    events.push({ type: "postage-gained", amount, reason: "streak-bonus" });
  }

  const results =
    stamps > previous
      ? trimResults({ ...profile.daily.results, [dateKey]: { stamps } })
      : profile.daily.results;
  const next: Profile = {
    ...profile,
    postage,
    streakFreezes: freezes,
    daily: {
      lastKey: firstToday ? dateKey : profile.daily.lastKey,
      streak,
      bestStreak: Math.max(profile.daily.bestStreak, streak),
      results,
    },
    history: appendHistory(profile.history, {
      kind: "daily",
      id: dateKey,
      stamps,
      hints: input.hints ?? 0,
    }),
    stats: firstToday
      ? { ...profile.stats, dailiesCleared: profile.stats.dailiesCleared + 1 }
      : profile.stats,
  };
  return { profile: next, events, counted: true };
}
