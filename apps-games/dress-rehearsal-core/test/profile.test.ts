import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  appendHistory,
  bestFor,
  CHALLENGES,
  defaultProfile,
  MAX_DAILY_RESULTS,
  MAX_GALLERY,
  MAX_HISTORY,
  PROFILE_KEY,
  PROFILE_VERSION,
  profileTotals,
  sanitizeProfile,
  shareText,
} from "../src/index";

const LOOK = { top: "item-riviera-1", shoes: "item-riviera-5" };

function clean(data: unknown) {
  const profile = sanitizeProfile(data);
  if (profile === null) throw new Error("expected a profile");
  return profile;
}

describe("profile defaults", () => {
  it("starts with 40 coins, plain frame and nothing else", () => {
    const profile = defaultProfile();
    expect(profile.coins).toBe(40);
    expect(profile.framesOwned).toEqual(["plain"]);
    expect(profile.frameSelected).toBe("plain");
    expect(profile.streakFreezes).toBe(0);
    expect(profile.stars).toEqual({});
    expect(profile.gallery).toEqual([]);
    expect(profile.daily).toEqual({ lastKey: null, streak: 0, bestStreak: 0, results: {} });
  });

  it("is version 1 with the documented key", () => {
    expect(PROFILE_VERSION).toBe(1);
    expect(PROFILE_KEY).toBe("dress-rehearsal.profile");
  });

  it("survives a JSON round trip through sanitizeProfile unchanged", () => {
    const profile = defaultProfile();
    expect(sanitizeProfile(JSON.parse(JSON.stringify(profile)))).toEqual(profile);
  });

  it("accepts an empty object as a fresh profile", () => {
    expect(sanitizeProfile({})).toEqual(defaultProfile());
  });
});

describe("sanitizeProfile rejects", () => {
  it("non-objects", () => {
    for (const bad of [null, undefined, 5, "profile", [], true]) {
      expect(sanitizeProfile(bad)).toBeNull();
    }
  });

  it("wrong types for core fields", () => {
    expect(sanitizeProfile({ coins: "40" })).toBeNull();
    expect(sanitizeProfile({ coins: Number.NaN })).toBeNull();
    expect(sanitizeProfile({ stars: [] })).toBeNull();
    expect(sanitizeProfile({ best: 3 })).toBeNull();
    expect(sanitizeProfile({ gallery: {} })).toBeNull();
    expect(sanitizeProfile({ history: "none" })).toBeNull();
    expect(sanitizeProfile({ daily: [] })).toBeNull();
    expect(sanitizeProfile({ flags: 1 })).toBeNull();
    expect(sanitizeProfile({ stats: null })).toBeNull();
    expect(sanitizeProfile({ framesOwned: "plain" })).toBeNull();
    expect(sanitizeProfile({ streakFreezes: "2" })).toBeNull();
  });
});

describe("sanitizeProfile clamps", () => {
  it("coins to zero or more and whole numbers", () => {
    expect(clean({ coins: -50 }).coins).toBe(0);
    expect(clean({ coins: 12.9 }).coins).toBe(12);
    expect(clean({ coins: 1460 }).coins).toBe(1460);
  });

  it("stars to 0..3 and drops zeros", () => {
    const profile = clean({ stars: { "riv-01": 9, "riv-02": -2, "riv-03": 2.7, "riv-04": "3" } });
    expect(profile.stars).toEqual({ "riv-01": 3, "riv-03": 2 });
  });

  it("streak freezes to 0..2", () => {
    expect(clean({ streakFreezes: 9 }).streakFreezes).toBe(2);
    expect(clean({ streakFreezes: -1 }).streakFreezes).toBe(0);
  });

  it("harmony into 0..100 and best stars to the challenge stars", () => {
    const profile = clean({
      stars: { "riv-01": 2 },
      best: {
        "riv-01": { stars: 3, harmony: 400, spend: -5 },
        "riv-02": { stars: 3, harmony: 80, spend: 1 },
      },
    });
    expect(profile.best).toEqual({ "riv-01": { stars: 2, harmony: 100, spend: 0 } });
  });

  it("affinity levels to 0..3", () => {
    expect(clean({ affinityPaid: { mireille: 7, tobias: 2, nobody: 3 } }).affinityPaid).toEqual({
      mireille: 3,
      tobias: 2,
    });
  });

  it("trims history to the last 50", () => {
    const history = Array.from({ length: 80 }, (_, index) => ({
      kind: "campaign",
      ref: "riv-01",
      stars: 1,
      harmony: index,
      key: "",
    }));
    const profile = clean({ history });
    expect(profile.history).toHaveLength(MAX_HISTORY);
    expect(profile.history[0]?.harmony).toBe(30);
    expect(profile.history.at(-1)?.harmony).toBe(79);
  });

  it("trims daily results to the newest 60 dates", () => {
    const results: Record<string, { stars: number; harmony: number }> = {};
    for (let day = 1; day <= 28; day += 1) {
      const key = `2026-02-${String(day).padStart(2, "0")}`;
      results[key] = { stars: 2, harmony: 70 };
      results[key.replace("-02-", "-01-")] = { stars: 1, harmony: 60 };
      results[key.replace("-02-", "-03-")] = { stars: 3, harmony: 90 };
    }
    const kept = Object.keys(
      clean({ daily: { lastKey: "2026-03-28", streak: 3, results } }).daily.results,
    );
    expect(kept).toHaveLength(MAX_DAILY_RESULTS);
    expect(kept[0]).toBe("2026-01-25");
    expect(kept.at(-1)).toBe("2026-03-28");
  });

  it("trims the gallery to 24 and drops entries that make no sense", () => {
    const entry = (index: number) => ({
      id: `g${index}`,
      kind: "campaign",
      ref: "riv-01",
      look: LOOK,
      stars: 2,
      harmony: 70,
      savedKey: "2026-10-23",
    });
    const entries = Array.from({ length: 40 }, (_, index) => entry(index));
    expect(clean({ gallery: entries }).gallery).toHaveLength(MAX_GALLERY);
    const odd = [
      { ...entry(1), stars: 0 },
      { ...entry(2), ref: "nope" },
      { ...entry(3), look: { top: "item-riviera-5" } },
      { ...entry(4), savedKey: "x" },
      { ...entry(5), id: "" },
      entry(6),
      entry(6),
      "junk",
      null,
    ];
    expect(clean({ gallery: odd }).gallery.map((item) => item.id)).toEqual(["g6"]);
  });
});

describe("sanitizeProfile strips", () => {
  it("unknown top-level keys and unknown challenge or client ids", () => {
    const profile = clean({
      coins: 90,
      cheatCode: true,
      stars: { "riv-01": 3, "zzz-99": 3 },
      best: { "zzz-99": { stars: 3, harmony: 50, spend: 1 } },
      chapterBonusClaimed: { riviera: true, atlantis: true, gala: "yes" },
    });
    expect(Object.keys(profile)).not.toContain("cheatCode");
    expect(profile.stars).toEqual({ "riv-01": 3 });
    expect(profile.best).toEqual({});
    expect(profile.chapterBonusClaimed).toEqual({ riviera: true });
  });

  it("resets a frame the player does not own to plain", () => {
    expect(clean({ frameSelected: "magazine" }).frameSelected).toBe("plain");
    expect(clean({ framesOwned: ["paper"], frameSelected: "paper" })).toMatchObject({
      framesOwned: ["plain", "paper"],
      frameSelected: "paper",
    });
    expect(clean({ frameSelected: "gold" }).frameSelected).toBe("plain");
  });

  it("flag keys it does not know", () => {
    const profile = clean({
      flags: { tutorial: true, ruleCards: { brief: true, mystery: true }, x: 1 },
    });
    expect(profile.flags).toEqual({ tutorial: true, howTo: false, ruleCards: { brief: true } });
  });
});

describe("total stars", () => {
  it("can never exceed 120 whatever is stored", () => {
    const stars = Object.fromEntries(CHALLENGES.map((def) => [def.id, 3]));
    const profile = clean({ stars: { ...stars, extra: 3 } });
    expect(profileTotals(profile).stars).toBe(120);
  });
});

describe("history and records", () => {
  it("appendHistory keeps the last 50", () => {
    let profile = defaultProfile();
    for (let i = 0; i < 60; i += 1) {
      profile = appendHistory(profile, {
        kind: "campaign",
        ref: "riv-01",
        stars: 1,
        harmony: i,
        key: "",
      });
    }
    expect(profile.history).toHaveLength(50);
    expect(profile.history[0]?.harmony).toBe(10);
  });

  it("bestFor reads the stored best and null for an unplayed challenge", () => {
    const profile = clean({
      stars: { "riv-01": 3, "riv-02": 1 },
      best: { "riv-01": { stars: 3, harmony: 84, spend: 300 } },
    });
    expect(bestFor(profile, "riv-01")).toEqual({ stars: 3, harmony: 84, spend: 300 });
    expect(bestFor(profile, "riv-02")).toEqual({ stars: 1, harmony: 0, spend: 0 });
    expect(bestFor(profile, "riv-03")).toBeNull();
  });

  it("profileTotals sums what the player has done", () => {
    const profile = clean({
      coins: 123,
      stars: { "riv-01": 3, "riv-02": 2, "riv-03": 3 },
      daily: {
        lastKey: "2026-10-23",
        streak: 2,
        bestStreak: 5,
        results: { "2026-10-23": { stars: 2, harmony: 70 } },
      },
    });
    expect(profileTotals(profile)).toEqual({
      stars: 8,
      challengesCleared: 3,
      threeStarChallenges: 2,
      dailyDays: 1,
      coins: 123,
      bestStreak: 5,
    });
  });
});

describe("share text", () => {
  it("campaign template", () => {
    expect(shareText("campaign", { challengeId: "gal-01", stars: 3, harmony: 84 })).toBe(
      'Dress Rehearsal - Gala Night "Cloakroom": 3/3 stars, harmony 84, styled for Dame Ottoline Frost.',
    );
  });

  it("daily template", () => {
    expect(shareText("daily", { dateKey: "2026-10-23", stars: 2, harmony: 76, streak: 5 })).toBe(
      "Dress Rehearsal Daily 2026-10-23: 2/3 stars, harmony 76. Streak 5.",
    );
  });

  it("matches the two example lines in product.md exactly", () => {
    const doc = readFileSync(
      join(
        import.meta.dirname,
        "..",
        "..",
        "..",
        ".agents",
        "games",
        "dress-rehearsal",
        "product.md",
      ),
      "utf8",
    );
    const quoted = (label: string): string => {
      const line = doc.split("\n").find((text) => text.startsWith(label));
      const match = line === undefined ? null : /`(.+)`/.exec(line);
      if (match === null) throw new Error(`product.md share line missing: ${label}`);
      return match[1] ?? "";
    };
    expect(shareText("campaign", { challengeId: "gal-01", stars: 3, harmony: 84 })).toBe(
      quoted("Campaign:"),
    );
    expect(shareText("daily", { dateKey: "2026-10-23", stars: 2, harmony: 76, streak: 5 })).toBe(
      quoted("Daily:"),
    );
  });
});
