import type { MissionDef, Stars, Tiers } from "../missions/types";
import { daysBetween, isDateKey } from "../save/dateKey";
import type { DailyState, SaveData } from "../save/types";
import { Rng } from "../traffic/rng";
import { applyDailyVariant, type DailyVariant, dailyVariantFor, hashText } from "./dailyVariant";

/** Flat coins for the daily by stars earned, before the streak bonus. */
export const DAILY_REWARDS: Readonly<Tiers<number>> = { "1": 40, "2": 80, "3": 150 };

/** Bonus per streak day after the first, and the most the bonus can reach. */
export const STREAK_BONUS_PER_DAY = 0.1;
export const STREAK_BONUS_CAP = 0.5;

export function dateSeed(date: string): number {
  return hashText(`daily:${date}`);
}

/**
 * The one catalog mission of a UTC date. Only missions the caller passes can be picked, so a
 * locked district never shows up. Same date and same list give the same mission.
 */
export function pickDailyMission(date: string, unlocked: readonly MissionDef[]): MissionDef {
  if (!isDateKey(date)) throw new Error(`daily: "${date}" is not a YYYY-MM-DD date`);
  if (unlocked.length === 0) throw new Error("daily: no unlocked missions to pick from");
  const sorted = [...unlocked].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return sorted[new Rng(dateSeed(date)).int(sorted.length)] as MissionDef;
}

export type DailyStatus = "available" | "claimed" | "clock-backwards";

/** Whether a reward can still be paid for this date. A date at or before the last claim cannot. */
export function dailyStatus(state: DailyState, date: string): DailyStatus {
  const last = state.last_claim_date;
  if (last === null) return "available";
  const gap = daysBetween(last, date);
  if (gap > 0) return "available";
  return gap === 0 ? "claimed" : "clock-backwards";
}

/** The streak a claim on this date would make: one more after yesterday, otherwise back to 1. */
export function streakIfClaimed(state: DailyState, date: string): number {
  const last = state.last_claim_date;
  return last !== null && daysBetween(last, date) === 1 ? state.streak + 1 : 1;
}

/** Fractional bonus for a streak length: none on day 1, then 10% per day up to 50%. */
export function streakBonus(streak: number): number {
  return Math.min(STREAK_BONUS_CAP, Math.max(0, streak - 1) * STREAK_BONUS_PER_DAY);
}

export function dailyReward(stars: Stars, streak: number): { base: number; bonus: number } {
  if (stars === 0) return { base: 0, bonus: 0 };
  const base = DAILY_REWARDS[String(stars) as "1" | "2" | "3"];
  return { base, bonus: Math.round(base * streakBonus(streak)) };
}

export interface DailyChallenge {
  date: string;
  missionId: string;
  variant: DailyVariant;
  /** The catalog mission with the day's par times applied. */
  mission: MissionDef;
  status: DailyStatus;
  /** The streak a claim today would make. */
  streak: number;
}

export function dailyChallenge(
  date: string,
  unlocked: readonly MissionDef[],
  state: DailyState,
): DailyChallenge {
  const base = pickDailyMission(date, unlocked);
  const variant = dailyVariantFor(date);
  return {
    date,
    missionId: base.id,
    variant,
    mission: applyDailyVariant(base, variant),
    status: dailyStatus(state, date),
    streak: streakIfClaimed(state, date),
  };
}

export type DailyClaimFailure = "no-stars" | "already-claimed" | "clock-backwards" | "bad-date";

export type DailyClaim =
  | { ok: true; save: SaveData; coins: number; base: number; bonus: number; streak: number }
  | { ok: false; reason: DailyClaimFailure };

/**
 * Pay the daily for a date once. A run with no stars pays nothing and leaves the day open for a
 * retry. A date that is not strictly after the last claim is refused.
 */
export function claimDaily(save: SaveData, date: string, stars: Stars): DailyClaim {
  if (!isDateKey(date)) return { ok: false, reason: "bad-date" };
  const status = dailyStatus(save.daily, date);
  if (status === "claimed") return { ok: false, reason: "already-claimed" };
  if (status === "clock-backwards") return { ok: false, reason: "clock-backwards" };
  if (stars === 0) return { ok: false, reason: "no-stars" };
  const streak = streakIfClaimed(save.daily, date);
  const { base, bonus } = dailyReward(stars, streak);
  return {
    ok: true,
    base,
    bonus,
    streak,
    coins: base + bonus,
    save: {
      ...save,
      coins: save.coins + base + bonus,
      daily: { last_claim_date: date, streak },
    },
  };
}
