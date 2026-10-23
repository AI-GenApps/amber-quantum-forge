import { describe, expect, it } from "vitest";
import {
  applyCampaignResult,
  buyFreeze,
  buyHint,
  defaultProfile,
  type EconomyEvent,
  evaluate,
  FIRST_CLEAR_COINS,
  FREEZE_PRICE,
  HINT_PRICE,
  MAPS,
  REGION_BONUS_COINS,
  REGIONS,
  runSeason,
  STAR_COINS,
  START_COINS,
  totalStars,
} from "../src";
import { evaluationOf, profileWith } from "./progress-helpers";

function coinsIn(events: EconomyEvent[]): number {
  return events.reduce((sum, e) => sum + (e.type === "coins-gained" ? e.amount : 0), 0);
}

describe("economy constants (economy.md tables)", () => {
  it("matches the source and sink rows", () => {
    expect(START_COINS).toBe(50);
    expect(FIRST_CLEAR_COINS).toBe(10);
    expect(STAR_COINS).toBe(5);
    expect(REGION_BONUS_COINS).toBe(50);
    expect(HINT_PRICE).toEqual({ campaign: 25, daily: 40 });
    expect(FREEZE_PRICE).toBe(30);
  });
});

describe("campaign coin sources", () => {
  it.each([
    [1, 15],
    [2, 20],
    [3, 25],
  ] as const)("a first clear at %i stars pays %i coins", (stars, coins) => {
    const out = applyCampaignResult(defaultProfile(), "v01", evaluationOf(stars));
    expect(out.profile.coins - START_COINS).toBe(coins);
    expect(coinsIn(out.events)).toBe(coins);
    expect(out.profile.stars.v01).toBe(stars);
  });

  it("pays nothing for a failed run and still records the attempt", () => {
    const out = applyCampaignResult(defaultProfile(), "v01", evaluationOf(0));
    expect(out.profile.coins).toBe(START_COINS);
    expect(out.profile.stars.v01).toBeUndefined();
    expect(out.profile.stats.seasons).toBe(1);
    expect(out.profile.history).toHaveLength(1);
    expect(out.events).toEqual([]);
  });

  it("pays only the difference when a result is upgraded", () => {
    const first = applyCampaignResult(defaultProfile(), "v01", evaluationOf(1)).profile;
    const second = applyCampaignResult(first, "v01", evaluationOf(2));
    expect(second.profile.coins - first.coins).toBe(5);
    const third = applyCampaignResult(second.profile, "v01", evaluationOf(3));
    expect(third.profile.coins - second.profile.coins).toBe(5);
    expect(third.profile.coins - START_COINS).toBe(25);
  });

  it("pays two stars at once when jumping from one to three", () => {
    const first = applyCampaignResult(defaultProfile(), "v01", evaluationOf(1)).profile;
    const jump = applyCampaignResult(first, "v01", evaluationOf(3));
    expect(jump.profile.coins - first.coins).toBe(10);
  });

  it("never pays for repeats or lower results", () => {
    const done = applyCampaignResult(defaultProfile(), "v01", evaluationOf(3)).profile;
    for (const stars of [3, 2, 1, 0] as const) {
      const again = applyCampaignResult(done, "v01", evaluationOf(stars));
      expect(again.profile.coins).toBe(done.coins);
      expect(again.profile.stars.v01).toBe(3);
      expect(coinsIn(again.events)).toBe(0);
    }
  });

  it("keeps the best score record and replaces it only when beaten", () => {
    let profile = applyCampaignResult(
      defaultProfile(),
      "v01",
      evaluationOf(2, { score: 400, spend: 8 }),
    ).profile;
    expect(profile.best.v01).toEqual({ score: 400, stars: 2, spend: 8 });
    profile = applyCampaignResult(
      profile,
      "v01",
      evaluationOf(2, { score: 300, spend: 7 }),
    ).profile;
    expect(profile.best.v01?.score).toBe(400);
    profile = applyCampaignResult(
      profile,
      "v01",
      evaluationOf(2, { score: 450, spend: 9 }),
    ).profile;
    expect(profile.best.v01).toEqual({ score: 450, stars: 2, spend: 9 });
    profile = applyCampaignResult(
      profile,
      "v01",
      evaluationOf(3, { score: 200, spend: 6 }),
    ).profile;
    expect(profile.best.v01).toEqual({ score: 200, stars: 3, spend: 6 });
  });

  it("updates totals and history", () => {
    const out = applyCampaignResult(
      defaultProfile(),
      "v02",
      evaluationOf(2, {
        housesSupplied: 3,
        fieldsIrrigated: 2,
        housesFlooded: 0,
        spend: 9,
        score: 333,
      }),
    );
    expect(out.profile.stats).toMatchObject({
      seasons: 1,
      housesSupplied: 3,
      fieldsIrrigated: 2,
      housesFlooded: 0,
    });
    expect(out.profile.history).toEqual([
      { kind: "campaign", id: "v02", stars: 2, score: 333, spend: 9 },
    ]);
  });

  it("caps history at 50 entries", () => {
    let profile = defaultProfile();
    for (let i = 0; i < 60; i++)
      profile = applyCampaignResult(profile, "v01", evaluationOf(1, { score: i })).profile;
    expect(profile.history).toHaveLength(50);
    expect(profile.history[0]?.score).toBe(10);
  });

  it("ignores unknown maps and does not mutate its input", () => {
    const before = defaultProfile();
    const snapshot = JSON.stringify(before);
    const unknown = applyCampaignResult(before, "zz99", evaluationOf(3));
    expect(unknown.profile).toBe(before);
    applyCampaignResult(before, "v01", evaluationOf(3));
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("emits star-gained events with the previous value", () => {
    const first = applyCampaignResult(defaultProfile(), "v01", evaluationOf(1));
    expect(first.events).toContainEqual({
      type: "star-gained",
      mapId: "v01",
      stars: 1,
      previous: 0,
    });
    const next = applyCampaignResult(first.profile, "v01", evaluationOf(3));
    expect(next.events).toContainEqual({
      type: "star-gained",
      mapId: "v01",
      stars: 3,
      previous: 1,
    });
  });
});

describe("region completion bonus", () => {
  function clearedExcept(regionIndex: number, skip: string): ReturnType<typeof defaultProfile> {
    const profile = defaultProfile();
    const region = REGIONS[regionIndex];
    for (const id of region?.mapIds ?? []) if (id !== skip) profile.stars[id] = 1;
    return profile;
  }

  it("pays 50 once when the tenth map of a region is cleared", () => {
    const profile = clearedExcept(0, "v10");
    const out = applyCampaignResult(profile, "v10", evaluationOf(1));
    expect(out.profile.regionBonusClaimed.valley).toBe(true);
    expect(out.profile.coins - profile.coins).toBe(15 + 50);
    expect(out.events).toContainEqual({ type: "region-bonus", region: "valley", amount: 50 });
  });

  it("does not pay it again for a later upgrade", () => {
    const profile = clearedExcept(0, "v10");
    const first = applyCampaignResult(profile, "v10", evaluationOf(1));
    const again = applyCampaignResult(first.profile, "v10", evaluationOf(3));
    expect(again.events.some((e) => e.type === "region-bonus")).toBe(false);
    expect(again.profile.coins - first.profile.coins).toBe(10);
  });

  it("does not pay while one map is still uncleared", () => {
    const profile = clearedExcept(0, "v10");
    const out = applyCampaignResult(profile, "v09", evaluationOf(3));
    expect(out.profile.regionBonusClaimed.valley).toBeUndefined();
  });
});

describe("unlock events", () => {
  it("reports region and theme unlocks as the stars cross the thresholds", () => {
    const profile = defaultProfile();
    for (const id of ["v01", "v02", "v03"]) profile.stars[id] = 3;
    profile.stars.v04 = 2;
    expect(totalStars(profile)).toBe(11);
    const out = applyCampaignResult(profile, "v04", evaluationOf(3));
    expect(totalStars(out.profile)).toBe(12);
    expect(out.events).toContainEqual({ type: "region-unlocked", region: "delta" });
    expect(out.events.some((e) => e.type === "theme-unlocked")).toBe(false);
    const repeat = applyCampaignResult(out.profile, "v04", evaluationOf(3));
    expect(
      repeat.events.some((e) => e.type === "region-unlocked" || e.type === "theme-unlocked"),
    ).toBe(false);
  });
});

describe("theme unlock events", () => {
  it("reports the theme when the ninth star arrives", () => {
    const profile = defaultProfile();
    for (const id of ["v01", "v02"]) profile.stars[id] = 3;
    profile.stars.v03 = 2;
    const out = applyCampaignResult(profile, "v03", evaluationOf(3));
    expect(totalStars(out.profile)).toBe(9);
    expect(out.events).toContainEqual({ type: "theme-unlocked", themeId: "harvest-ochre" });
  });
});

describe("a perfect campaign", () => {
  it("replays all 40 reference solutions and earns exactly 1250 coins including the grant", () => {
    let profile = defaultProfile();
    const unlocked: string[] = [];
    for (const map of MAPS) {
      const evaluation = evaluate(map, runSeason(map, map.reference), map.reference);
      expect(evaluation.stars).toBe(3);
      const out = applyCampaignResult(profile, map.id, evaluation);
      profile = out.profile;
      for (const e of out.events) if (e.type === "region-unlocked") unlocked.push(e.region);
    }
    expect(profile.coins).toBe(1250);
    expect(START_COINS + 40 * 10 + 120 * 5 + 4 * 50).toBe(1250);
    expect(totalStars(profile)).toBe(120);
    expect(Object.keys(profile.regionBonusClaimed).sort()).toEqual([
      "delta",
      "estuary",
      "highland",
      "valley",
    ]);
    expect(unlocked).toEqual(["delta", "highland", "estuary"]);
  });
});

describe("hint purchases", () => {
  it("charges 25 on a campaign map and 40 on the daily", () => {
    const rich = profileWith({ coins: 100 });
    const campaign = buyHint(rich, "campaign");
    expect(campaign.ok && campaign.profile.coins).toBe(75);
    const daily = buyHint(rich, "daily");
    expect(daily.ok && daily.profile.coins).toBe(60);
    expect(campaign.ok && campaign.profile.stats.hintsUsed).toBe(1);
  });

  it("accepts the exact price and rejects one coin short", () => {
    expect(buyHint(profileWith({ coins: 25 }), "campaign").ok).toBe(true);
    const short = buyHint(profileWith({ coins: 24 }), "campaign");
    expect(short.ok).toBe(false);
    expect(!short.ok && short.reason).toBe("insufficient-coins");
    expect(buyHint(profileWith({ coins: 39 }), "daily").ok).toBe(false);
    expect(buyHint(profileWith({ coins: 40 }), "daily").ok).toBe(true);
  });

  it("leaves the profile untouched when rejected", () => {
    const poor = profileWith({ coins: 3 });
    const out = buyHint(poor, "campaign");
    expect(out.profile).toBe(poor);
  });

  it("starts with enough coins for two campaign hints", () => {
    const first = buyHint(defaultProfile(), "campaign");
    const second = first.ok ? buyHint(first.profile, "campaign") : first;
    expect(second.ok).toBe(true);
    expect(second.profile.coins).toBe(0);
  });
});

describe("streak freeze purchases", () => {
  it("costs 30 and is held up to two", () => {
    let profile = profileWith({ coins: 100 });
    const one = buyFreeze(profile);
    expect(one.ok && one.profile.coins).toBe(70);
    profile = one.profile;
    const two = buyFreeze(profile);
    expect(two.ok && two.profile.streakFreezes).toBe(2);
    const third = buyFreeze(two.profile);
    expect(third.ok).toBe(false);
    expect(!third.ok && third.reason).toBe("freezes-full");
    expect(third.profile.coins).toBe(40);
  });

  it("rejects when coins are short", () => {
    const out = buyFreeze(profileWith({ coins: 29 }));
    expect(out.ok).toBe(false);
    expect(!out.ok && out.reason).toBe("insufficient-coins");
    expect(buyFreeze(profileWith({ coins: 30 })).ok).toBe(true);
  });
});
