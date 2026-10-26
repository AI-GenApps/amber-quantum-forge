import { describe, expect, it } from "vitest";
import { evaluateAchievements, withAchievements } from "../src/achievement-eval";
import { ACHIEVEMENTS } from "../src/content/achievements";
import { CATALOG } from "../src/content/catalog";
import { globalMultiplier } from "../src/economy";
import type { Profile } from "../src/profile";
import {
  ALL_CONSTELLATION_IDS,
  ALL_LORE_IDS,
  type ProfilePatch,
  profileWith,
} from "./fixtures/profile";

interface Case {
  readonly pass: ProfilePatch;
  readonly miss: ProfilePatch;
}

function owned(instrumentId: string, count: number): ProfilePatch {
  return { game: { owned: { [instrumentId]: count } } };
}

function charted(count: number): ProfilePatch {
  return { game: { charted: ALL_CONSTELLATION_IDS.slice(0, count) } };
}

const CASES: Record<string, Case> = {
  "telescope-row": { pass: owned("telescope", 10), miss: owned("telescope", 9) },
  "lens-bench": { pass: owned("lens", 10), miss: owned("lens", 9) },
  "spectrograph-gallery": { pass: owned("prism", 10), miss: owned("prism", 9) },
  "orrery-hall": { pass: owned("orrery", 10), miss: owned("orrery", 9) },
  "press-room": { pass: owned("star-map", 10), miss: owned("star-map", 9) },
  "beacon-ridge": { pass: owned("beacon", 10), miss: owned("beacon", 9) },
  "reading-room": { pass: owned("archive", 10), miss: owned("archive", 9) },
  "coil-field": { pass: owned("aurora-coil", 10), miss: owned("aurora-coil", 9) },
  "first-ink": { pass: charted(1), miss: charted(0) },
  cartographer: { pass: charted(6), miss: charted(5) },
  "whole-sky": { pass: charted(12), miss: charted(11) },
  "steady-hand": { pass: { stats: { flawlessCharts: 1 } }, miss: { stats: { charts: 4 } } },
  "million-rays": {
    pass: { game: { lifetimeStarlight: 1e6 } },
    miss: { game: { lifetimeStarlight: 999_999 } },
  },
  "billion-fold": {
    pass: { game: { lifetimeStarlight: 1e9 } },
    miss: { game: { lifetimeStarlight: 999_999_999 } },
  },
  "first-shadow": { pass: { game: { eclipses: 1 } }, miss: { game: { eclipses: 0 } } },
  "shadow-keeper": { pass: { game: { eclipses: 5 } }, miss: { game: { eclipses: 4 } } },
  "comet-chaser": { pass: { profile: { cometDays: 3 } }, miss: { profile: { cometDays: 2 } } },
  "seven-nights": {
    pass: { stats: { longestStreak: 7 } },
    miss: { stats: { longestStreak: 6 }, profile: { cometStreak: 6 } },
  },
  "keeper-of-tales": {
    pass: { profile: { loreUnlocked: ALL_LORE_IDS } },
    miss: { profile: { loreUnlocked: ALL_LORE_IDS.slice(0, 29) } },
  },
  "long-sleep": {
    pass: { stats: { fullOfflineCollects: 1 } },
    miss: { stats: { offlineSecondsCollected: 28799, fullOfflineCollects: 0 } },
  },
};

describe("achievement catalog coverage", () => {
  it("has a test case for each of the 20 achievements", () => {
    expect(ACHIEVEMENTS).toHaveLength(20);
    expect(Object.keys(CASES).sort()).toEqual(ACHIEVEMENTS.map((def) => def.id).sort());
  });
});

describe.each(ACHIEVEMENTS.map((def) => def.id))("achievement %s", (id) => {
  const testCase = CASES[id] as Case;

  it("unlocks when its condition is met, and exactly once", () => {
    const profile = profileWith(testCase.pass);
    expect(evaluateAchievements(profile, CATALOG)).toContain(id);
    const granted = withAchievements(profile, CATALOG);
    expect(granted.unlocked).toContain(id);
    expect(granted.profile.game.achievements.filter((entry) => entry === id)).toHaveLength(1);
    expect(evaluateAchievements(granted.profile, CATALOG)).not.toContain(id);
    expect(withAchievements(granted.profile, CATALOG).unlocked).not.toContain(id);
  });

  it("stays locked one step short", () => {
    const profile = profileWith(testCase.miss);
    expect(evaluateAchievements(profile, CATALOG)).not.toContain(id);
  });
});

describe("evaluateAchievements", () => {
  it("returns nothing for a new profile", () => {
    expect(evaluateAchievements(profileWith(), CATALOG)).toEqual([]);
  });

  it("never re-grants an owned achievement even when the condition holds", () => {
    const profile: Profile = profileWith({
      game: { charted: ALL_CONSTELLATION_IDS.slice(0, 1), achievements: ["first-ink"] },
    });
    expect(evaluateAchievements(profile, CATALOG)).toEqual([]);
  });

  it("reports several at once in catalog order", () => {
    const profile = profileWith({
      game: { charted: ALL_CONSTELLATION_IDS.slice(0, 6), lifetimeStarlight: 2e6 },
    });
    expect(evaluateAchievements(profile, CATALOG)).toEqual([
      "first-ink",
      "cartographer",
      "million-rays",
    ]);
  });

  it("returns the same profile object when nothing unlocks", () => {
    const profile = profileWith();
    expect(withAchievements(profile, CATALOG).profile).toBe(profile);
  });

  it("raises the global multiplier by one percent each once granted", () => {
    const before = profileWith(owned("telescope", 10));
    const granted = withAchievements(before, CATALOG).profile;
    expect(granted.game.achievements).toEqual(["telescope-row"]);
    expect(
      globalMultiplier(granted.game, CATALOG) / globalMultiplier(before.game, CATALOG),
    ).toBeCloseTo(1.01, 12);
  });
});
