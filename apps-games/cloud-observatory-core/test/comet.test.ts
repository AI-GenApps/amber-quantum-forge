import { describe, expect, it } from "vitest";
import { minStarDistance, starsInsideMargin } from "../src/chart";
import { type CometStep, claimComet, cometReward, generateComet } from "../src/comet";
import { RULES } from "../src/constants";
import { CATALOG } from "../src/content/catalog";
import { starlightPerSecond } from "../src/economy";
import type { Profile } from "../src/profile";
import { lcg } from "./fixtures/catalog";
import { profileWith } from "./fixtures/profile";

const GOLDEN: Record<number, readonly { x: number; y: number }[]> = {
  1: [
    { x: 289, y: 543 },
    { x: 503, y: 946 },
    { x: 140, y: 543 },
    { x: 720, y: 767 },
    { x: 113, y: 867 },
    { x: 573, y: 1104 },
  ],
  20261023: [
    { x: 456, y: 521 },
    { x: 799, y: 231 },
    { x: 549, y: 937 },
    { x: 555, y: 1144 },
    { x: 188, y: 788 },
    { x: 680, y: 308 },
  ],
  987654321: [
    { x: 152, y: 1148 },
    { x: 596, y: 588 },
    { x: 727, y: 153 },
    { x: 247, y: 665 },
    { x: 847, y: 423 },
    { x: 201, y: 929 },
  ],
};

function charted(patch: Partial<Profile> = {}): Profile {
  return profileWith({ game: { charted: ["lyre"] }, profile: patch });
}

describe("generateComet", () => {
  it("gives the same pattern for the same stream", () => {
    expect(generateComet({ next: lcg(77) })).toEqual(generateComet({ next: lcg(77) }));
  });

  it.each(Object.entries(GOLDEN))("matches the golden pattern for seed %s", (seed, expected) => {
    expect(generateComet({ next: lcg(Number(seed)) })).toEqual(expected);
  });

  it("differs between seeds", () => {
    expect(generateComet({ next: lcg(1) })).not.toEqual(generateComet({ next: lcg(2) }));
  });

  it("is valid for 1,000 different seeds", () => {
    for (let seed = 0; seed < 1000; seed++) {
      const stars = generateComet({ next: lcg(seed * 7919 + 13) });
      expect(stars).toHaveLength(6);
      expect(starsInsideMargin(stars)).toBe(true);
      expect(minStarDistance(stars)).toBeGreaterThanOrEqual(RULES.STAR_MIN_SPACING);
    }
  });

  it("falls back to a valid fixed pattern when the stream cannot place stars", () => {
    const stuck = generateComet({ next: () => 0.5 });
    expect(stuck).toHaveLength(6);
    expect(starsInsideMargin(stuck)).toBe(true);
    expect(minStarDistance(stuck)).toBeGreaterThanOrEqual(RULES.STAR_MIN_SPACING);
    expect(generateComet({ next: () => 0.5 })).toEqual(stuck);
  });
});

describe("cometReward", () => {
  it("pays the 1,000 minimum with no production, growing 10 percent per streak day to day 5", () => {
    const rewards = [1, 2, 3, 4, 5, 6, 7].map((streak) => cometReward(0, streak));
    expect(rewards).toEqual([1000, 1100, 1200, 1300, 1400, 1400, 1400]);
  });

  it("pays 900 seconds of production when that beats the minimum", () => {
    expect(cometReward(2, 1)).toBeCloseTo(1800, 9);
    expect(cometReward(2, 5)).toBeCloseTo(2520, 9);
    expect(cometReward(1000, 3)).toBeCloseTo(900000 * 1.2, 6);
  });

  it("treats a streak below 1 as 1 and never returns NaN or more than the cap", () => {
    expect(cometReward(0, 0)).toBe(1000);
    expect(cometReward(0, -4)).toBe(1000);
    expect(cometReward(Number.NaN, 2)).toBe(1100);
    expect(cometReward(1e300, 5)).toBe(RULES.MAX_VALUE);
  });
});

describe("claimComet", () => {
  it("is locked before the first constellation is charted", () => {
    expect(claimComet(profileWith(), "2026-10-23", "gap", CATALOG)).toEqual({
      ok: false,
      reason: "locked",
    });
  });

  it("starts the streak at 1 on the first claim whatever the step says", () => {
    for (const step of ["gap", "next-day", "same-day", "clock-went-back"] as const) {
      const claim = claimComet(charted(), "2026-10-23", step, CATALOG);
      expect(claim.ok).toBe(true);
      if (!claim.ok) continue;
      expect(claim.streak).toBe(1);
      expect(claim.profile.cometLastKey).toBe("2026-10-23");
      expect(claim.profile.cometStreak).toBe(1);
      expect(claim.profile.cometDays).toBe(1);
    }
  });

  it("credits starlight to balance, cycle and lifetime", () => {
    const profile = charted();
    const claim = claimComet(profile, "2026-10-23", "gap", CATALOG);
    if (!claim.ok) throw new Error("expected a claim");
    expect(claim.reward).toBe(1000);
    expect(claim.profile.game.starlight).toBe(profile.game.starlight + 1000);
    expect(claim.profile.game.cycleStarlight).toBe(1000);
    expect(claim.profile.game.lifetimeStarlight).toBe(1000);
  });

  it("scales the reward by production at the time of the claim", () => {
    const profile = profileWith({ game: { charted: ["lyre"], owned: { telescope: 100 } } });
    const claim = claimComet(profile, "2026-10-23", "gap", CATALOG);
    if (!claim.ok) throw new Error("expected a claim");
    expect(claim.reward).toBeCloseTo(900 * starlightPerSecond(profile.game, CATALOG), 6);
  });

  it("adds one on the next day", () => {
    const profile = charted({ cometLastKey: "2026-10-22", cometStreak: 3, cometDays: 3 });
    const claim = claimComet(profile, "2026-10-23", "next-day", CATALOG);
    if (!claim.ok) throw new Error("expected a claim");
    expect(claim.streak).toBe(4);
    expect(claim.reward).toBe(1300);
    expect(claim.profile.cometDays).toBe(4);
  });

  it("resets the streak to 1 after a gap but keeps counting days", () => {
    const profile = charted({ cometLastKey: "2026-10-18", cometStreak: 6, cometDays: 6 });
    const claim = claimComet(profile, "2026-10-23", "gap", CATALOG);
    if (!claim.ok) throw new Error("expected a claim");
    expect(claim.streak).toBe(1);
    expect(claim.profile.cometStreak).toBe(1);
    expect(claim.profile.cometDays).toBe(7);
  });

  it("refuses a second claim on the same day", () => {
    const profile = charted({ cometLastKey: "2026-10-23", cometStreak: 2, cometDays: 2 });
    expect(claimComet(profile, "2026-10-23", "same-day", CATALOG)).toEqual({
      ok: false,
      reason: "already-claimed",
    });
    expect(claimComet(profile, "2026-10-23", "gap", CATALOG)).toEqual({
      ok: false,
      reason: "already-claimed",
    });
  });

  it("refuses when the clock went back and leaves the streak intact", () => {
    const profile = charted({ cometLastKey: "2026-10-23", cometStreak: 5, cometDays: 5 });
    const claim = claimComet(profile, "2026-10-20", "clock-went-back", CATALOG);
    expect(claim).toEqual({ ok: false, reason: "clock-went-back" });
    const later = claimComet(profile, "2026-10-24", "next-day", CATALOG);
    if (!later.ok) throw new Error("expected a claim");
    expect(later.streak).toBe(6);
  });

  it("awards one shard on every 7th streak day and no other", () => {
    let profile = charted();
    const shards: number[] = [];
    for (let day = 0; day < 15; day++) {
      const step: CometStep = day === 0 ? "gap" : "next-day";
      const claim = claimComet(
        profile,
        `2026-11-${String(day + 1).padStart(2, "0")}`,
        step,
        CATALOG,
      );
      if (!claim.ok) throw new Error("expected a claim");
      shards.push(claim.shards);
      profile = claim.profile;
    }
    expect(shards).toEqual([0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0]);
    expect(profile.game.shards).toBe(2);
    expect(profile.game.shardsEarned).toBe(2);
    expect(profile.cometDays).toBe(15);
  });

  it("does not mutate the input profile", () => {
    const profile = charted();
    const copy = JSON.stringify(profile);
    claimComet(profile, "2026-10-23", "gap", CATALOG);
    expect(JSON.stringify(profile)).toBe(copy);
  });
});
