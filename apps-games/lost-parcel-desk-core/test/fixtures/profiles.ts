import { CASES, defaultProfile, type Profile, type StampCount } from "../../src";

export function withCases(stamps: Record<string, number>): Profile {
  const profile = defaultProfile();
  for (const [id, value] of Object.entries(stamps)) {
    profile.cases[id] = {
      stamps: value as StampCount,
      bestTimeMs: null,
      hintsOnBest: 0,
      closedCount: 1,
    };
  }
  return profile;
}

/** Fills cases in order with 3 stamps each until the requested total is reached. */
export function withTotal(total: number): Profile {
  const stamps: Record<string, number> = {};
  let left = total;
  for (const item of CASES) {
    if (left <= 0) break;
    stamps[item.id] = Math.min(3, left);
    left -= stamps[item.id] ?? 0;
  }
  return withCases(stamps);
}
