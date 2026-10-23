import { defaultProfile, type Evaluation, MAPS, type Profile, type StarCount } from "../src";

export function evaluationOf(stars: StarCount, extra: Partial<Evaluation> = {}): Evaluation {
  return {
    housesTotal: 3,
    housesSupplied: stars >= 1 ? 3 : 2,
    housesFlooded: stars >= 2 ? 0 : 1,
    fieldsTotal: 2,
    fieldsIrrigated: stars >= 1 ? 2 : 1,
    spend: 10,
    par: 10,
    budgetLeft: 3,
    starSupply: stars >= 1,
    starDry: stars >= 2,
    starThrift: stars >= 3,
    stars,
    cleared: stars >= 1,
    score: 100 * stars + 20,
    ...extra,
  };
}

export function profileWithStars(total: number): Profile {
  const profile = defaultProfile();
  let left = total;
  for (const map of MAPS) {
    const stars = Math.min(3, left) as StarCount;
    if (stars > 0) profile.stars[map.id] = stars;
    left -= stars;
  }
  return profile;
}

export function profileWith(patch: Partial<Profile>): Profile {
  return { ...defaultProfile(), ...patch };
}

export const MAP_V01 = "v01";
