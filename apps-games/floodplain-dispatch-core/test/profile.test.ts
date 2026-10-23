import { describe, expect, it } from "vitest";
import {
  DAILY_RESULT_LIMIT,
  DEFAULT_THEME,
  defaultProfile,
  HISTORY_LIMIT,
  MAPS,
  PROFILE_KEY,
  PROFILE_VERSION,
  type Profile,
  START_COINS,
  sanitizeProfile,
  TOTAL_STARS,
  totalStars,
} from "../src";
import { profileWithStars } from "./progress-helpers";

function roundTrip(profile: Profile): Profile | null {
  return sanitizeProfile(JSON.parse(JSON.stringify(profile)));
}

describe("default profile", () => {
  it("starts with the grant and nothing else", () => {
    const profile = defaultProfile();
    expect(profile.coins).toBe(START_COINS);
    expect(START_COINS).toBe(50);
    expect(profile.streakFreezes).toBe(0);
    expect(profile.themeSelected).toBe(DEFAULT_THEME);
    expect(profile.stars).toEqual({});
    expect(profile.daily).toEqual({ lastKey: null, streak: 0, bestStreak: 0, results: {} });
    expect(PROFILE_VERSION).toBe(1);
    expect(PROFILE_KEY).toBe("floodplain-dispatch.profile");
  });

  it("returns fresh objects each call", () => {
    const a = defaultProfile();
    a.stars.v01 = 3;
    expect(defaultProfile().stars).toEqual({});
  });

  it("survives its own sanitizer unchanged", () => {
    expect(roundTrip(defaultProfile())).toEqual(defaultProfile());
  });
});

describe("sanitizeProfile", () => {
  it("rejects non-objects", () => {
    for (const bad of [null, undefined, 4, "x", true, [], [1, 2]]) {
      expect(sanitizeProfile(bad)).toBeNull();
    }
  });

  it("fills missing fields from the defaults", () => {
    expect(sanitizeProfile({})).toEqual(defaultProfile());
    expect(sanitizeProfile({ coins: 7 })?.coins).toBe(7);
  });

  it("rejects wrong types on known fields", () => {
    const wrong: Record<string, unknown>[] = [
      { coins: "12" },
      { coins: Number.NaN },
      { coins: null },
      { stars: [] },
      { stars: "x" },
      { best: 3 },
      { regionBonusClaimed: [] },
      { streakFreezes: "2" },
      { daily: 5 },
      { daily: { results: [] } },
      { history: {} },
      { flags: [] },
      { stats: "none" },
      { stats: { seasons: "many" } },
      { themeSelected: 4 },
    ];
    for (const patch of wrong) expect(sanitizeProfile(patch)).toBeNull();
  });

  it("clamps coins, stars and freezes", () => {
    const out = sanitizeProfile({
      coins: -40,
      streakFreezes: 9,
      stars: { v01: 9, v02: -2, v03: 2.9 },
    });
    expect(out?.coins).toBe(0);
    expect(out?.streakFreezes).toBe(2);
    expect(out?.stars).toEqual({ v01: 3, v03: 2 });
    expect(sanitizeProfile({ coins: 12.9 })?.coins).toBe(12);
    expect(sanitizeProfile({ streakFreezes: -1 })?.streakFreezes).toBe(0);
  });

  it("drops unknown keys, maps, regions and themes", () => {
    const out = sanitizeProfile({
      coins: 5,
      cheat: true,
      stars: { v01: 1, zz99: 3 },
      best: { zz99: { score: 1, stars: 1, spend: 1 }, v01: { score: 120, stars: 1, spend: 6 } },
      regionBonusClaimed: { valley: true, mars: true, delta: false },
      themeSelected: "not-a-theme",
    });
    expect(out).not.toBeNull();
    expect(out).not.toHaveProperty("cheat");
    expect(out?.stars).toEqual({ v01: 1 });
    expect(Object.keys(out?.best ?? {})).toEqual(["v01"]);
    expect(out?.regionBonusClaimed).toEqual({ valley: true });
    expect(out?.themeSelected).toBe(DEFAULT_THEME);
  });

  it("refuses a theme the stars have not unlocked", () => {
    expect(sanitizeProfile({ themeSelected: "harvest-ochre" })?.themeSelected).toBe(DEFAULT_THEME);
    const earned = profileWithStars(9);
    const out = sanitizeProfile({ ...earned, themeSelected: "harvest-ochre" });
    expect(out?.themeSelected).toBe("harvest-ochre");
  });

  it("trims history to the last 50 entries", () => {
    const history = Array.from({ length: 80 }, (_, i) => ({
      kind: "campaign",
      id: "v01",
      stars: 1,
      score: i,
      spend: 4,
    }));
    const out = sanitizeProfile({ history });
    expect(out?.history).toHaveLength(HISTORY_LIMIT);
    expect(out?.history[0]?.score).toBe(30);
    expect(out?.history.at(-1)?.score).toBe(79);
  });

  it("drops malformed history entries but keeps good ones", () => {
    const out = sanitizeProfile({
      history: [
        { kind: "campaign", id: "v01", stars: 2, score: 10, spend: 3 },
        { kind: "weekly", id: "v01", stars: 2, score: 10, spend: 3 },
        { kind: "daily", id: 5, stars: 2, score: 10, spend: 3 },
        "junk",
      ],
    });
    expect(out?.history).toHaveLength(1);
  });

  it("keeps the newest 60 daily results and drops bad keys", () => {
    const results: Record<string, { stars: number; score: number }> = {
      "not-a-date": { stars: 1, score: 1 },
    };
    for (let i = 0; i < 90; i++) {
      const day = String(1 + (i % 28)).padStart(2, "0");
      const month = String(1 + Math.floor(i / 28)).padStart(2, "0");
      results[`2026-${month}-${day}`] = { stars: 3, score: i };
    }
    const out = sanitizeProfile({
      daily: { lastKey: "2026-04-06", streak: 3, bestStreak: 1, results },
    });
    const keys = Object.keys(out?.daily.results ?? {});
    expect(keys).toHaveLength(DAILY_RESULT_LIMIT);
    expect(keys).not.toContain("not-a-date");
    expect(keys).toContain("2026-04-06");
    expect(keys).not.toContain("2026-01-01");
    expect(out?.daily.bestStreak).toBe(3);
  });

  it("rejects an invalid lastKey by clearing it", () => {
    expect(sanitizeProfile({ daily: { lastKey: "tomorrow" } })?.daily.lastKey).toBeNull();
  });

  it("keeps only true flags and caps their number", () => {
    const flags: Record<string, unknown> = { tutorial: true, off: false, "": true };
    for (let i = 0; i < 100; i++) flags[`card-${i}`] = true;
    const out = sanitizeProfile({ flags });
    expect(out?.flags.tutorial).toBe(true);
    expect(out?.flags).not.toHaveProperty("off");
    expect(Object.keys(out?.flags ?? {}).length).toBeLessThanOrEqual(64);
  });

  it("never lets total stars exceed the campaign maximum", () => {
    const stars: Record<string, number> = {};
    for (const map of MAPS) stars[map.id] = 99;
    stars.extra = 3;
    const out = sanitizeProfile({ stars });
    expect(out).not.toBeNull();
    expect(totalStars(out as Profile)).toBe(TOTAL_STARS);
    expect(TOTAL_STARS).toBe(120);
  });

  it("is idempotent", () => {
    const messy = sanitizeProfile({ coins: 12.5, streakFreezes: 5, stars: { v01: 7 }, junk: 1 });
    expect(roundTrip(messy as Profile)).toEqual(messy);
  });
});
