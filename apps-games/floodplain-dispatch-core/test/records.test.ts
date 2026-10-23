import { describe, expect, it } from "vitest";
import {
  applyCampaignResult,
  bestScore,
  campaignLabel,
  defaultProfile,
  recentHistory,
  shareText,
  totals,
} from "../src";
import { evaluationOf } from "./progress-helpers";

describe("share text", () => {
  it("renders the campaign template exactly", () => {
    expect(
      shareText("campaign", { mapId: "v04", stars: 3, flooded: 0, spend: 11, budget: 14 }),
    ).toBe('Floodplain Dispatch - Valley 4 "The Grey Week": 3/3 stars, 0 flooded, spent 11 of 14.');
  });

  it("renders the daily template exactly", () => {
    expect(shareText("daily", { dateKey: "2026-10-23", stars: 2, flooded: 1, streak: 5 })).toBe(
      "Floodplain Dispatch Daily 2026-10-23: 2/3 stars, 1 flooded. Streak 5.",
    );
  });

  it("labels maps by region name and number within the region", () => {
    expect(campaignLabel("v01")).toBe("Valley 1");
    expect(campaignLabel("d10")).toBe("Delta 10");
    expect(campaignLabel("h05")).toBe("Highland 5");
    expect(campaignLabel("e03")).toBe("Estuary 3");
    expect(campaignLabel("nope")).toBe("nope");
  });
});

describe("records", () => {
  it("looks up best scores and totals", () => {
    let profile = defaultProfile();
    profile = applyCampaignResult(profile, "v01", evaluationOf(3, { score: 540 })).profile;
    profile = applyCampaignResult(profile, "v02", evaluationOf(1, { score: 300 })).profile;
    expect(bestScore(profile, "v01")).toBe(540);
    expect(bestScore(profile, "v09")).toBe(0);
    expect(totals(profile)).toMatchObject({
      stars: 4,
      cleared: 2,
      perfect: 1,
      seasons: 2,
      dailyDays: 0,
    });
  });

  it("lists the newest history first with a limit", () => {
    let profile = defaultProfile();
    for (let i = 0; i < 5; i++)
      profile = applyCampaignResult(profile, "v01", evaluationOf(1, { score: i })).profile;
    expect(recentHistory(profile, 3).map((entry) => entry.score)).toEqual([4, 3, 2]);
    expect(recentHistory(profile)).toHaveLength(5);
  });
});
