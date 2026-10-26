import {
  LAMP_BONUS,
  LATE_CUSTOMERS_BASE,
  LATE_CUSTOMERS_MAX,
  LATE_CUSTOMERS_STEP_SHIFTS,
  LATE_REGULARS,
  MAX_COINS,
  STREAK_BONUS_CAP_DAYS,
  STREAK_BONUS_PER_DAY,
} from "../constants";
import { createPrng } from "../prng";
import { LATE_SHIFT_TICKS } from "../rules/day";
import { noDecorEffects } from "../rules/decor";
import { latePatienceSeconds, patienceTicks } from "../rules/patience";
import { weatherForSeed } from "../rules/weather";
import { buildArrivals } from "../shift/schedule";
import type { RegularDue, ShiftDef, ShiftResult } from "../types";
import { LATE_DAY, type ShiftOptions } from "./defs";
import { coinsGained, type ProgressEvent } from "./events";
import { type LateState, MAX_COUNTER, type Profile } from "./profileTypes";
import { betterRecords } from "./records";
import { applyShiftResult, type ShiftApplied, type ShiftExtras } from "./shift";
import { unlockedAtDay } from "./unlocks";

export type StreakInput = "first" | "same-day" | "next-day" | "gap" | "clock-went-back";

export interface LateDate {
  dateKey: string;
  step: StreakInput;
}

export interface LateApplied extends ShiftApplied {
  lampBonus: number;
  streakBonus: number;
}

export function lateCustomers(lateCount: number): number {
  return Math.min(
    LATE_CUSTOMERS_MAX,
    LATE_CUSTOMERS_BASE + Math.floor(lateCount / LATE_CUSTOMERS_STEP_SHIFTS),
  );
}

export function lateShiftSeed(seed: number, index: number): number {
  return createPrng(seed).fork(`late-${index}`).seed;
}

export function lateDueRegulars(shiftSeed: number, regulars: readonly RegularDue[]): RegularDue[] {
  const picked = createPrng(shiftSeed).fork("regulars").shuffle(regulars).slice(0, LATE_REGULARS);
  return picked.sort((a, b) => a.regularId - b.regularId);
}

export function buildLateShift(
  seed: number,
  index: number,
  lateCount: number,
  regulars: readonly RegularDue[],
  options: ShiftOptions = {},
): ShiftDef {
  const shiftSeed = lateShiftSeed(seed, index);
  const weather = weatherForSeed(shiftSeed);
  const decor = options.decor ?? noDecorEffects();
  const unlocked = unlockedAtDay(LATE_DAY);
  const arrivals = buildArrivals(
    shiftSeed,
    lateCustomers(lateCount),
    LATE_SHIFT_TICKS,
    lateDueRegulars(shiftSeed, regulars),
    { unlocked, weather, shelfEmpty: options.shelfEmpty ?? false },
  );
  return {
    kind: "late",
    day: LATE_DAY,
    weather,
    lengthTicks: LATE_SHIFT_TICKS,
    basePatienceTicks: patienceTicks(latePatienceSeconds(lateCount, weather, decor), false),
    relaxed: options.relaxed ?? false,
    decor,
    unlocked,
    arrivals,
    patienceFreeArrivals: 0,
    seed: shiftSeed,
  };
}

export function lateOpen(profile: Profile): boolean {
  return profile.day >= LATE_DAY;
}

export function lateIndexToday(profile: Profile, dateKey: string): number {
  return profile.late.lastKey === dateKey ? profile.late.todayCount : 0;
}

export function streakBonus(streak: number): number {
  return STREAK_BONUS_PER_DAY * Math.min(Math.max(0, streak), STREAK_BONUS_CAP_DAYS);
}

function nextStreak(late: LateState, step: StreakInput): number {
  if (step === "next-day") return late.streak + 1;
  if (step === "same-day") return Math.max(1, late.streak);
  return 1;
}

function bonusClaimed(late: LateState, dateKey: string): boolean {
  return late.lastKey === dateKey && late.firstOfDayClaimed;
}

export function applyLateResult(
  profile: Profile,
  date: LateDate,
  result: ShiftResult,
  extras: ShiftExtras = {},
): LateApplied {
  const applied = applyShiftResult(profile, { kind: "late" }, result, extras);
  const none: LateApplied = { ...applied, lampBonus: 0, streakBonus: 0 };
  if (!applied.accepted) return none;
  const late = profile.late;
  const records = betterRecords(late.records, result);
  const counted = Math.min(MAX_COUNTER, late.count + 1);
  if (date.step === "clock-went-back") {
    return withLate(none, { ...late, count: counted, records });
  }
  if (bonusClaimed(late, date.dateKey)) {
    const todayCount = late.todayCount + 1;
    return withLate(none, { ...late, count: counted, todayCount, records });
  }
  const streak = nextStreak(late, date.step);
  const lamp = LAMP_BONUS;
  const bonus = streakBonus(streak);
  const events: ProgressEvent[] = [
    ...applied.events,
    ...coinsGained(lamp, "lamp"),
    ...coinsGained(bonus, "streak"),
  ];
  const state: LateState = {
    count: counted,
    todayCount: date.step === "same-day" ? late.todayCount + 1 : 1,
    lastKey: date.dateKey,
    streak,
    bestStreak: Math.max(late.bestStreak, streak),
    firstOfDayClaimed: true,
    records,
  };
  const coins = Math.min(MAX_COINS, applied.profile.coins + lamp + bonus);
  return {
    ...applied,
    events,
    lampBonus: lamp,
    streakBonus: bonus,
    profile: { ...applied.profile, coins, late: state },
  };
}

function withLate(base: LateApplied, late: LateState): LateApplied {
  return { ...base, profile: { ...base.profile, late } };
}
