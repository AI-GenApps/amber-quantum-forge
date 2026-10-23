import type { EconomyEvent } from "./economy";
import { DAILY_RESULT_LIMIT, type Profile, type StarCount } from "./profile";
import { appendHistory } from "./records";

export const DAILY_COINS: Readonly<Record<StarCount, number>> = { 0: 0, 1: 10, 2: 15, 3: 20 };
export const STREAK_BONUS_PER_DAY = 2 as const;
export const STREAK_BONUS_CAP = 7 as const;

export type DailyStep = "first" | "same-day" | "next-day" | "gap" | "clock-went-back";

export interface DailyInput {
  dateKey: string;
  step: DailyStep;
  missedDays: number;
  stars: StarCount;
  score: number;
  spend?: number;
}

export interface DailyApplied {
  profile: Profile;
  events: EconomyEvent[];
  counted: boolean;
}

export function streakBonus(streak: number): number {
  return STREAK_BONUS_PER_DAY * Math.min(streak, STREAK_BONUS_CAP);
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
  return Object.fromEntries(
    keys.map((key) => [key, results[key] as NonNullable<(typeof results)[string]>]),
  );
}

export function applyDailyResult(profile: Profile, input: DailyInput): DailyApplied {
  const { dateKey, step, stars, score } = input;
  if (step === "clock-went-back" || stars < 1) return { profile, events: [], counted: false };
  const before = profile.daily.results[dateKey];
  const previous = before?.stars ?? 0;
  const events: EconomyEvent[] = [];
  let coins = profile.coins;
  let streak = profile.daily.streak;
  let freezes = profile.streakFreezes;
  const firstToday = before === undefined;
  if (firstToday) {
    const update = updateStreak(profile, step, input.missedDays);
    streak = update.streak;
    freezes = update.freezes;
    events.push(...update.events, { type: "streak-extended", streak });
  }
  if (stars > previous) {
    const pay = DAILY_COINS[stars] - DAILY_COINS[previous];
    coins += pay;
    events.push({ type: "coins-gained", amount: pay, reason: "daily-clear" });
  }
  if (firstToday) {
    const bonus = streakBonus(streak);
    coins += bonus;
    events.push({ type: "coins-gained", amount: bonus, reason: "streak-bonus" });
  }
  const improved =
    before === undefined ||
    stars > before.stars ||
    (stars === before.stars && score > before.score);
  const results = improved
    ? trimResults({ ...profile.daily.results, [dateKey]: { stars, score } })
    : profile.daily.results;
  const next: Profile = {
    ...profile,
    coins,
    streakFreezes: freezes,
    daily: {
      lastKey: firstToday ? dateKey : profile.daily.lastKey,
      streak,
      bestStreak: Math.max(profile.daily.bestStreak, streak),
      results,
    },
    history: firstToday
      ? appendHistory(profile.history, {
          kind: "daily",
          id: dateKey,
          stars,
          score,
          spend: input.spend ?? 0,
        })
      : profile.history,
  };
  return { profile: next, events, counted: true };
}
