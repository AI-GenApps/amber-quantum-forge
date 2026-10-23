import { findMap, REGIONS, type RegionId } from "../content";
import type { Evaluation } from "../types";
import { MAX_FREEZES, type Profile, type StarCount } from "./profile";
import { appendHistory } from "./records";
import { regionUnlocked, themesUnlocked } from "./unlocks";

export const FIRST_CLEAR_COINS = 10 as const;
export const STAR_COINS = 5 as const;
export const REGION_BONUS_COINS = 50 as const;
export const HINT_PRICE = { campaign: 25, daily: 40 } as const;
export const FREEZE_PRICE = 30 as const;

export type HintKind = keyof typeof HINT_PRICE;

export type CoinReason =
  | "first-clear"
  | "star-gained"
  | "region-bonus"
  | "daily-clear"
  | "streak-bonus";

export type EconomyEvent =
  | { type: "coins-gained"; amount: number; reason: CoinReason }
  | { type: "star-gained"; mapId: string; stars: StarCount; previous: StarCount }
  | { type: "region-bonus"; region: RegionId; amount: number }
  | { type: "region-unlocked"; region: RegionId }
  | { type: "theme-unlocked"; themeId: string }
  | { type: "streak-extended"; streak: number }
  | { type: "streak-reset" }
  | { type: "freeze-used"; count: number }
  | { type: "hint-bought"; kind: HintKind; price: number }
  | { type: "freeze-bought"; price: number };

export interface Applied {
  profile: Profile;
  events: EconomyEvent[];
}

export type PurchaseFailure = "insufficient-coins" | "freezes-full";

export type Purchase =
  | { ok: true; profile: Profile; events: EconomyEvent[] }
  | { ok: false; reason: PurchaseFailure; profile: Profile };

function unlockEvents(before: Profile, after: Profile): EconomyEvent[] {
  const events: EconomyEvent[] = [];
  for (const region of REGIONS) {
    if (!regionUnlocked(before, region.id) && regionUnlocked(after, region.id)) {
      events.push({ type: "region-unlocked", region: region.id });
    }
  }
  const had = new Set(themesUnlocked(before).map((theme) => theme.id));
  for (const theme of themesUnlocked(after)) {
    if (!had.has(theme.id)) events.push({ type: "theme-unlocked", themeId: theme.id });
  }
  return events;
}

function regionCleared(profile: Profile, region: RegionId): boolean {
  const def = REGIONS.find((entry) => entry.id === region);
  return def?.mapIds.every((id) => (profile.stars[id] ?? 0) >= 1) ?? false;
}

export function applyCampaignResult(
  profile: Profile,
  mapId: string,
  evaluation: Evaluation,
): Applied {
  const map = findMap(mapId);
  if (!map) return { profile, events: [] };
  const events: EconomyEvent[] = [];
  const previous = (profile.stars[mapId] ?? 0) as StarCount;
  const stars = evaluation.stars;
  const next: Profile = {
    ...profile,
    stars: { ...profile.stars },
    best: { ...profile.best },
    regionBonusClaimed: { ...profile.regionBonusClaimed },
    stats: {
      ...profile.stats,
      seasons: profile.stats.seasons + 1,
      housesSupplied: profile.stats.housesSupplied + evaluation.housesSupplied,
      fieldsIrrigated: profile.stats.fieldsIrrigated + evaluation.fieldsIrrigated,
      housesFlooded: profile.stats.housesFlooded + evaluation.housesFlooded,
    },
    history: appendHistory(profile.history, {
      kind: "campaign",
      id: mapId,
      stars,
      score: evaluation.score,
      spend: evaluation.spend,
    }),
  };
  const record = profile.best[mapId];
  if (
    !record ||
    stars > record.stars ||
    (stars === record.stars && evaluation.score > record.score)
  ) {
    next.best[mapId] = { score: evaluation.score, stars, spend: evaluation.spend };
  }
  if (stars > previous) {
    next.stars[mapId] = stars;
    events.push({ type: "star-gained", mapId, stars, previous });
    if (previous === 0) {
      next.coins += FIRST_CLEAR_COINS;
      events.push({ type: "coins-gained", amount: FIRST_CLEAR_COINS, reason: "first-clear" });
    }
    const starCoins = STAR_COINS * (stars - previous);
    next.coins += starCoins;
    events.push({ type: "coins-gained", amount: starCoins, reason: "star-gained" });
  }
  if (!next.regionBonusClaimed[map.region] && regionCleared(next, map.region)) {
    next.regionBonusClaimed[map.region] = true;
    next.coins += REGION_BONUS_COINS;
    events.push({ type: "region-bonus", region: map.region, amount: REGION_BONUS_COINS });
    events.push({ type: "coins-gained", amount: REGION_BONUS_COINS, reason: "region-bonus" });
  }
  events.push(...unlockEvents(profile, next));
  return { profile: next, events };
}

export function buyHint(profile: Profile, kind: HintKind): Purchase {
  const price = HINT_PRICE[kind];
  if (profile.coins < price) return { ok: false, reason: "insufficient-coins", profile };
  const next: Profile = {
    ...profile,
    coins: profile.coins - price,
    stats: { ...profile.stats, hintsUsed: profile.stats.hintsUsed + 1 },
  };
  return { ok: true, profile: next, events: [{ type: "hint-bought", kind, price }] };
}

export function buyFreeze(profile: Profile): Purchase {
  if (profile.streakFreezes >= MAX_FREEZES) return { ok: false, reason: "freezes-full", profile };
  if (profile.coins < FREEZE_PRICE) return { ok: false, reason: "insufficient-coins", profile };
  const next: Profile = {
    ...profile,
    coins: profile.coins - FREEZE_PRICE,
    streakFreezes: profile.streakFreezes + 1,
  };
  return { ok: true, profile: next, events: [{ type: "freeze-bought", price: FREEZE_PRICE }] };
}
