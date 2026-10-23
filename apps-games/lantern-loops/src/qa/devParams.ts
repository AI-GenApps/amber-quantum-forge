import { localDateKey } from "@web-games/kit";
import {
  CAMPAIGN,
  chaptersCleared,
  MAX_STARS,
  shiftDate,
  TOKEN_CONFIG,
} from "@web-games/lantern-loops-core";
import type { Profile } from "../save/profile";
import type { Services } from "../services";

/** Marker the production-absence test searches for. It only ever appears in this dev module. */
export const QA_MARKER = "ll-dev-qa-helper-v1";

export interface QaOverrides {
  reset: boolean;
  stars?: number;
  tokens?: number;
  streak?: number;
  onboarded?: boolean;
}

const NUMERIC_KEYS = ["stars", "tokens", "streak"] as const;

function whole(raw: string): number | null {
  return /^\d{1,4}$/.test(raw) ? Number(raw) : null;
}

/**
 * Parses `?qa=stars:210,tokens:5,streak:6,onboarded:1,reset:1`. Unknown keys and malformed values
 * are ignored; numbers are clamped to the game limits.
 */
export function parseQaParams(search: string): QaOverrides {
  const out: QaOverrides = { reset: false };
  const raw = new URLSearchParams(search).get("qa");
  if (raw === null) return out;
  for (const part of raw.split(",")) {
    const [key, value = ""] = part.split(":");
    if (key === "reset") out.reset = value === "1";
    else if (key === "onboarded") out.onboarded = value !== "0";
    else if ((NUMERIC_KEYS as readonly string[]).includes(key ?? "")) {
      const number = whole(value);
      if (number === null) continue;
      if (key === "stars") out.stars = Math.min(number, MAX_STARS);
      if (key === "tokens") out.tokens = Math.min(number, TOKEN_CONFIG.cap);
      if (key === "streak") out.streak = Math.min(number, 999);
    }
  }
  return out;
}

/** Star map that totals exactly `total`: puzzles in play order get 3 stars until it runs out. */
export function starsFor(total: number): Record<string, number> {
  const map: Record<string, number> = {};
  let left = Math.max(0, Math.min(total, MAX_STARS));
  for (const record of CAMPAIGN) {
    if (left <= 0) break;
    const give = Math.min(3, left);
    map[record.id] = give;
    left -= give;
  }
  return map;
}

export function profileChange(qa: QaOverrides, today: string): Partial<Profile> {
  const change: Partial<Profile> = {};
  if (qa.stars !== undefined) {
    const stars = starsFor(qa.stars);
    change.stars = stars;
    change.chaptersCleared = chaptersCleared(stars);
  }
  if (qa.tokens !== undefined) change.tokens = qa.tokens;
  if (qa.streak !== undefined) {
    change.streak = qa.streak;
    change.bestStreak = qa.streak;
    change.lastDailyDate = qa.streak > 0 ? shiftDate(today, -1) : null;
  }
  if (qa.onboarded !== undefined) change.onboardingDone = qa.onboarded;
  return change;
}

/** Applies the overrides of a URL query to the saved profile. Returns true when anything changed. */
export async function applyQaParams(services: Services, search: string): Promise<boolean> {
  const qa = parseQaParams(search);
  const hasChange = Object.keys(profileChange(qa, "2000-01-01")).length > 0;
  if (!qa.reset && !hasChange) return false;
  if (qa.reset) await services.progression.reset();
  const change = profileChange(qa, localDateKey(services.now()));
  if (Object.keys(change).length > 0) await services.progression.patch(change);
  console.info(`[${QA_MARKER}] applied`, qa);
  return true;
}
