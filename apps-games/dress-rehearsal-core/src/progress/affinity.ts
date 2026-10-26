import { CHALLENGES } from "../content/challenges";
import { AFFINITY_THRESHOLDS } from "../content/clients";
import type { ClientId } from "../content/types";
import type { Stars } from "../types";
import type { AffinityLevel, Profile, ProgressEvent, ProgressUpdate } from "./types";

export const AFFINITY_PAYMENT = 10;

export function affinityStarsOf(
  stars: Readonly<Record<string, Stars>>,
  clientId: ClientId,
): number {
  let total = 0;
  for (const def of CHALLENGES) if (def.clientId === clientId) total += stars[def.id] ?? 0;
  return total;
}

export function affinityStars(profile: Profile, clientId: ClientId): number {
  return affinityStarsOf(profile.stars, clientId);
}

export function levelForStars(stars: number): AffinityLevel {
  let level = 0;
  for (const threshold of AFFINITY_THRESHOLDS) if (stars >= threshold) level += 1;
  return level as AffinityLevel;
}

export function affinityLevel(profile: Profile, clientId: ClientId): AffinityLevel {
  return levelForStars(affinityStars(profile, clientId));
}

export function affinityProgress(
  profile: Profile,
  clientId: ClientId,
): { readonly stars: number; readonly level: AffinityLevel; readonly nextAt: number | null } {
  const stars = affinityStars(profile, clientId);
  const level = levelForStars(stars);
  return {
    stars,
    level,
    nextAt: AFFINITY_THRESHOLDS.find((threshold) => threshold > stars) ?? null,
  };
}

export function payAffinity(profile: Profile, clientId: ClientId): ProgressUpdate {
  const level = affinityLevel(profile, clientId);
  const paid = profile.affinityPaid[clientId] ?? 0;
  if (level <= paid) return { profile, events: [] };
  const events: ProgressEvent[] = [];
  let coins = profile.coins;
  for (let reached = paid + 1; reached <= level; reached += 1) {
    coins += AFFINITY_PAYMENT;
    events.push({
      type: "affinity-level",
      clientId,
      level: reached as AffinityLevel,
      amount: AFFINITY_PAYMENT,
    });
    events.push({ type: "coins-gained", amount: AFFINITY_PAYMENT, reason: "affinity" });
  }
  return {
    profile: { ...profile, coins, affinityPaid: { ...profile.affinityPaid, [clientId]: level } },
    events,
  };
}
