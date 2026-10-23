import { findMap, REGIONS, type RegionId, THEMES, type ThemeDef, TOTAL_STARS } from "../content";
import { type Profile, sumStars } from "./profile";

export function totalStars(profile: Profile): number {
  return Math.min(sumStars(profile.stars), TOTAL_STARS);
}

export function regionUnlocked(profile: Profile, region: RegionId): boolean {
  const def = REGIONS.find((entry) => entry.id === region);
  return def !== undefined && totalStars(profile) >= def.unlockStars;
}

export function mapUnlocked(profile: Profile, mapId: string): boolean {
  const map = findMap(mapId);
  if (!map || !regionUnlocked(profile, map.region)) return false;
  const region = REGIONS.find((entry) => entry.id === map.region);
  const at = region ? region.mapIds.indexOf(mapId) : -1;
  if (at < 0) return false;
  if (at === 0) return true;
  const previous = region?.mapIds[at - 1];
  return previous !== undefined && (profile.stars[previous] ?? 0) >= 1;
}

export function themesUnlocked(profile: Profile): ThemeDef[] {
  const total = totalStars(profile);
  return THEMES.filter((theme) => theme.starsNeeded <= total);
}

export interface NextUnlock {
  kind: "region" | "theme";
  id: string;
  needed: number;
  remaining: number;
}

export function starsToNextUnlock(profile: Profile): NextUnlock | null {
  const total = totalStars(profile);
  let next: NextUnlock | null = null;
  const consider = (kind: NextUnlock["kind"], id: string, needed: number): void => {
    if (needed <= total) return;
    if (!next || needed < next.needed) next = { kind, id, needed, remaining: needed - total };
  };
  for (const region of REGIONS) consider("region", region.id, region.unlockStars);
  for (const theme of THEMES) consider("theme", theme.id, theme.starsNeeded);
  return next;
}
