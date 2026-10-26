import { applyOffline } from "./actions";
import { RULES } from "./constants";
import { offlineEfficiency, starlightPerSecond } from "./economy";
import type { Profile } from "./profile";
import { updateStats } from "./progression";
import type { Catalog } from "./types";

export const WELCOME_MIN_SECONDS = 60;

export interface ResumeSummary {
  readonly awaySeconds: number;
  readonly secondsCounted: number;
  readonly gained: number;
  readonly capped: boolean;
  readonly full: boolean;
  readonly efficiency: number;
  readonly perSecond: number;
  readonly worthShowing: boolean;
}

export interface ResumeResult {
  readonly profile: Profile;
  readonly summary: ResumeSummary;
}

function awaySeconds(profile: Profile, nowMs: number): number {
  const elapsed = (nowMs - profile.lastSeenMs) / 1000;
  return Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0;
}

export function markSeen(profile: Profile, nowMs: number): Profile {
  if (!Number.isFinite(nowMs) || nowMs < 0 || nowMs === profile.lastSeenMs) return profile;
  return { ...profile, lastSeenMs: nowMs };
}

export function resume(profile: Profile, nowMs: number, catalog: Catalog): ResumeResult {
  const away = awaySeconds(profile, nowMs);
  const result = applyOffline(profile.game, away, catalog);
  const full = result.gained > 0 && result.secondsCounted >= RULES.OFFLINE_CAP_SECONDS;
  const collected = result.gained > 0;
  const earned: Profile = collected
    ? {
        ...profile,
        game: result.state,
        stats: updateStats(profile.stats, {
          type: "offline",
          seconds: result.secondsCounted,
          full,
        }),
      }
    : profile;
  const next = markSeen(earned, nowMs);
  return {
    profile: next,
    summary: {
      awaySeconds: away,
      secondsCounted: result.secondsCounted,
      gained: result.gained,
      capped: result.capped,
      full,
      efficiency: offlineEfficiency(profile.game, catalog),
      perSecond: starlightPerSecond(profile.game, catalog),
      worthShowing: collected && away >= WELCOME_MIN_SECONDS,
    },
  };
}
