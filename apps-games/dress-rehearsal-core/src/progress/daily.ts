import type { Stars } from "../types";
import { isDateKey } from "./dates";
import { MAX_DAILY_RESULTS, toStars } from "./profile";
import { addStat, appendHistory } from "./records";
import type { DailyResult, Profile, ProgressEvent, ProgressUpdate } from "./types";

export type DailyStep = "same-day" | "next-day" | "gap" | "clock-went-back";

export const DAILY_REWARD: readonly [number, number, number, number] = [0, 8, 12, 16];
export const STREAK_BONUS_PER_DAY = 2;
export const STREAK_BONUS_CAP_DAYS = 7;

export interface DailyResultInput {
  readonly dateKey: string;
  readonly step: DailyStep;
  readonly stars: Stars;
  readonly harmony: number;
  readonly missedDays?: number;
}

export function streakBonus(streak: number): number {
  return STREAK_BONUS_PER_DAY * Math.min(Math.max(streak, 0), STREAK_BONUS_CAP_DAYS);
}

export function dailyReward(stars: Stars): number {
  return DAILY_REWARD[stars] ?? 0;
}

interface StreakOutcome {
  readonly streak: number;
  readonly freezes: number;
  readonly events: ProgressEvent[];
}

function advanceStreak(profile: Profile, input: DailyResultInput): StreakOutcome {
  const { lastKey, streak } = profile.daily;
  const held = profile.streakFreezes;
  if (lastKey === null) return { streak: 1, freezes: held, events: [] };
  if (input.step === "next-day") return { streak: streak + 1, freezes: held, events: [] };
  if (input.step === "gap") {
    const missed = Math.max(1, Math.floor(input.missedDays ?? 1));
    if (held >= missed) {
      return {
        streak: streak + 1,
        freezes: held - missed,
        events: [{ type: "freeze-used", count: missed }],
      };
    }
    return { streak: 1, freezes: held, events: [{ type: "streak-reset" }] };
  }
  return { streak: Math.max(streak, 1), freezes: held, events: [] };
}

function trimResults(results: Record<string, DailyResult>): Record<string, DailyResult> {
  const keys = Object.keys(results).sort();
  const kept: Record<string, DailyResult> = {};
  for (const key of keys.slice(-MAX_DAILY_RESULTS)) kept[key] = results[key] as DailyResult;
  return kept;
}

export function applyDailyResult(profile: Profile, input: DailyResultInput): ProgressUpdate {
  const stars = toStars(input.stars);
  if (input.step === "clock-went-back" || stars < 1 || !isDateKey(input.dateKey)) {
    return { profile, events: [] };
  }
  const harmony = Math.min(100, Math.max(0, Math.floor(input.harmony)));
  const previous = profile.daily.results[input.dateKey];
  const events: ProgressEvent[] = [];
  const results: Record<string, DailyResult> = { ...profile.daily.results };
  let daily = profile.daily;
  let coins = profile.coins;
  let freezes = profile.streakFreezes;
  const earn = (amount: number, reason: "daily" | "daily-streak"): void => {
    if (amount <= 0) return;
    coins += amount;
    events.push({ type: "coins-gained", amount, reason });
  };
  if (previous === undefined) {
    const outcome = advanceStreak(profile, input);
    freezes = outcome.freezes;
    events.push(...outcome.events);
    earn(dailyReward(stars), "daily");
    earn(streakBonus(outcome.streak), "daily-streak");
    results[input.dateKey] = { stars, harmony };
    daily = {
      lastKey: input.dateKey,
      streak: outcome.streak,
      bestStreak: Math.max(daily.bestStreak, outcome.streak),
      results: trimResults(results),
    };
  } else if (stars > previous.stars || (stars === previous.stars && harmony > previous.harmony)) {
    earn(dailyReward(stars) - dailyReward(previous.stars), "daily");
    results[input.dateKey] = { stars, harmony };
    daily = { ...daily, results: trimResults(results) };
  }
  let next: Profile = { ...profile, coins, streakFreezes: freezes, daily };
  next = appendHistory(next, {
    kind: "daily",
    ref: input.dateKey,
    stars,
    harmony,
    key: input.dateKey,
  });
  next = addStat(next, "looksFinished");
  return { profile: next, events };
}
