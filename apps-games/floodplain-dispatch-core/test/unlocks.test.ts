import { describe, expect, it } from "vitest";
import {
  defaultProfile,
  mapUnlocked,
  REGIONS,
  regionUnlocked,
  starsToNextUnlock,
  THEMES,
  themesUnlocked,
  totalStars,
} from "../src";
import { profileWithStars } from "./progress-helpers";

describe("total stars", () => {
  it("sums best stars across maps", () => {
    const profile = defaultProfile();
    profile.stars = { v01: 3, v02: 1, d01: 2 };
    expect(totalStars(profile)).toBe(6);
    expect(totalStars(defaultProfile())).toBe(0);
    expect(totalStars(profileWithStars(120))).toBe(120);
  });
});

describe("region unlocks", () => {
  const cases: Array<[string, number, number]> = [
    ["delta", 12, 11],
    ["highland", 33, 32],
    ["estuary", 60, 59],
  ];

  it("uses the thresholds 12, 33 and 60", () => {
    expect(REGIONS.map((region) => region.unlockStars)).toEqual([0, 12, 33, 60]);
  });

  it("opens the valley from the start", () => {
    expect(regionUnlocked(defaultProfile(), "valley")).toBe(true);
  });

  it.each(cases)("%s unlocks at %i stars and not at one fewer", (region, at, below) => {
    expect(regionUnlocked(profileWithStars(below), region as "delta")).toBe(false);
    expect(regionUnlocked(profileWithStars(at), region as "delta")).toBe(true);
    expect(regionUnlocked(profileWithStars(120), region as "delta")).toBe(true);
  });
});

describe("map unlocks", () => {
  it("opens the first valley map and chains by clearing the previous map", () => {
    const profile = defaultProfile();
    expect(mapUnlocked(profile, "v01")).toBe(true);
    expect(mapUnlocked(profile, "v02")).toBe(false);
    profile.stars.v01 = 1;
    expect(mapUnlocked(profile, "v02")).toBe(true);
    expect(mapUnlocked(profile, "v03")).toBe(false);
  });

  it("keeps later regions closed until the stars are earned", () => {
    expect(mapUnlocked(profileWithStars(11), "d01")).toBe(false);
    expect(mapUnlocked(profileWithStars(12), "d01")).toBe(true);
    expect(mapUnlocked(profileWithStars(12), "d02")).toBe(false);
  });

  it("does not open a later map of a closed region even if the previous one has stars", () => {
    const profile = defaultProfile();
    profile.stars.d01 = 3;
    expect(mapUnlocked(profile, "d02")).toBe(false);
  });

  it("opens every map of a fully cleared campaign and rejects unknown ids", () => {
    const profile = profileWithStars(120);
    for (const region of REGIONS)
      for (const id of region.mapIds) expect(mapUnlocked(profile, id)).toBe(true);
    expect(mapUnlocked(profile, "x99")).toBe(false);
  });
});

describe("theme unlocks", () => {
  it("uses the thresholds 0, 9, 27, 48, 75, 100 and 120", () => {
    expect(THEMES.map((theme) => theme.starsNeeded)).toEqual([0, 9, 27, 48, 75, 100, 120]);
  });

  it.each([
    [0, 1],
    [8, 1],
    [9, 2],
    [26, 2],
    [27, 3],
    [47, 3],
    [48, 4],
    [74, 4],
    [75, 5],
    [99, 5],
    [100, 6],
    [119, 6],
    [120, 7],
  ])("%i stars unlock %i themes", (stars, count) => {
    expect(themesUnlocked(profileWithStars(stars))).toHaveLength(count);
  });
});

describe("stars to next unlock", () => {
  it("points at the nearest locked region or theme", () => {
    expect(starsToNextUnlock(defaultProfile())).toEqual({
      kind: "theme",
      id: "harvest-ochre",
      needed: 9,
      remaining: 9,
    });
    expect(starsToNextUnlock(profileWithStars(9))).toMatchObject({
      kind: "region",
      id: "delta",
      remaining: 3,
    });
    expect(starsToNextUnlock(profileWithStars(11))).toMatchObject({
      kind: "region",
      id: "delta",
      remaining: 1,
    });
    expect(starsToNextUnlock(profileWithStars(12))).toMatchObject({
      kind: "theme",
      id: "reed-and-mist",
      remaining: 15,
    });
  });

  it("is null once everything is open", () => {
    expect(starsToNextUnlock(profileWithStars(120))).toBeNull();
  });
});
