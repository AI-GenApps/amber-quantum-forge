import { CHALLENGES, defaultProfile, type Profile, type Stars } from "../../src/index";

export function profileWithStars(
  stars: Readonly<Record<string, Stars>>,
  extra: Partial<Profile> = {},
): Profile {
  return { ...defaultProfile(), stars, ...extra };
}

export function profileWithTotal(total: number, extra: Partial<Profile> = {}): Profile {
  const stars: Record<string, Stars> = {};
  let left = total;
  for (const def of CHALLENGES) {
    if (left <= 0) break;
    const give = Math.min(3, left);
    stars[def.id] = give as Stars;
    left -= give;
  }
  return profileWithStars(stars, extra);
}

export function score(stars: Stars, harmony = 80, spend = 300) {
  return { stars, harmony, spend };
}
