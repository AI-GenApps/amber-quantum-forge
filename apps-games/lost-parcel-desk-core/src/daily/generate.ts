import { createPrng } from "../prng";
import { assembleDaily } from "./assemble";
import { fallbackPlan } from "./fallbacks";
import { makePlan } from "./plan";
import { tierFor } from "./tiers";
import type { DailyCase } from "./types";
import { dailyIssues } from "./validate";

export const MAX_DAILY_ATTEMPTS = 12 as const;

export interface GenerateOptions {
  maxAttempts?: number;
}

export function generateDaily(
  seed: number,
  weekday: number,
  options: GenerateOptions = {},
): DailyCase {
  const tier = tierFor(weekday);
  const base = createPrng(seed);
  const limit = options.maxAttempts ?? MAX_DAILY_ATTEMPTS;
  for (let attempt = 0; attempt < limit; attempt++) {
    const plan = makePlan(base.fork(`attempt-${attempt}`), tier);
    if (plan === null) continue;
    const made = assembleDaily(seed, weekday, plan, attempt, false);
    if (dailyIssues(made).length === 0) return made;
  }
  return assembleDaily(seed, weekday, fallbackPlan(seed, weekday), limit, true);
}
