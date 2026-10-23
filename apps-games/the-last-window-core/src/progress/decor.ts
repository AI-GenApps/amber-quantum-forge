import { MAX_COINS } from "../constants";
import { DECOR, type DecorRule, decorEffects } from "../rules/decor";
import type { DecorEffects, DecorId } from "../types";
import type { Profile } from "./profileTypes";

export type PurchaseFailure = "unknown" | "owned" | "locked" | "unaffordable";

export type DecorPurchase =
  | { ok: true; profile: Profile; price: number }
  | { ok: false; reason: PurchaseFailure };

export function ownedEffects(profile: Profile): DecorEffects {
  return decorEffects(profile.owned);
}

export function totalDecorPrice(): number {
  return DECOR.reduce((sum, rule) => sum + rule.price, 0);
}

export function decorUnlocked(rule: DecorRule, day: number): boolean {
  return day >= rule.unlockDay;
}

export function shopDecor(profile: Profile, day: number = profile.day): DecorRule[] {
  return DECOR.filter((rule) => decorUnlocked(rule, day));
}

export function buyDecor(profile: Profile, id: DecorId, day: number = profile.day): DecorPurchase {
  const rule = DECOR.find((entry) => entry.id === id);
  if (rule === undefined) return { ok: false, reason: "unknown" };
  if (profile.owned.includes(id)) return { ok: false, reason: "owned" };
  if (!decorUnlocked(rule, day)) return { ok: false, reason: "locked" };
  if (profile.coins < rule.price) return { ok: false, reason: "unaffordable" };
  const owned = DECOR.filter((entry) => entry.id === id || profile.owned.includes(entry.id)).map(
    (entry) => entry.id,
  );
  const coins = Math.min(MAX_COINS, profile.coins - rule.price);
  return { ok: true, profile: { ...profile, coins, owned }, price: rule.price };
}
