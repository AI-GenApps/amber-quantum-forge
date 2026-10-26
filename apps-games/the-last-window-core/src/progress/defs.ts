import { CAMPAIGN_COMPLETE_DAY } from "../constants";
import { getDay, TUTORIAL_PATIENCE_FREE, tutorialArrivals } from "../content";
import { noDecorEffects } from "../rules/decor";
import { patienceSeconds, patienceTicks } from "../rules/patience";
import { buildArrivals, type OrderContext } from "../shift/schedule";
import type { Arrival, DecorEffects, ShiftDef } from "../types";
import { dueForDay, unlockedAtDay } from "./unlocks";

export const LATE_DAY = CAMPAIGN_COMPLETE_DAY;

export interface ShiftOptions {
  decor?: DecorEffects;
  relaxed?: boolean;
  shelfEmpty?: boolean;
}

export function campaignSeed(day: number): number {
  return day * 7919;
}

export function buildCampaignShift(day: number, options: ShiftOptions = {}): ShiftDef {
  const entry = getDay(day);
  const decor = options.decor ?? noDecorEffects();
  const unlocked = unlockedAtDay(day);
  const seed = campaignSeed(day);
  const context: OrderContext = {
    unlocked,
    weather: entry.weather,
    shelfEmpty: options.shelfEmpty ?? false,
  };
  const arrivals: Arrival[] =
    day === 1
      ? tutorialArrivals()
      : buildArrivals(seed, entry.customers, entry.shiftTicks, dueForDay(day), context);
  return {
    kind: "day",
    day,
    weather: entry.weather,
    lengthTicks: entry.shiftTicks,
    basePatienceTicks: patienceTicks(patienceSeconds(day, entry.weather, decor), false),
    relaxed: options.relaxed ?? false,
    decor,
    unlocked,
    arrivals,
    patienceFreeArrivals: day === 1 ? TUTORIAL_PATIENCE_FREE : 0,
    seed,
  };
}
