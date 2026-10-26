import { describe, expect, it } from "vitest";
import { RULES } from "../src/constants";
import { CATALOG } from "../src/content/catalog";
import { createProfile, PROFILE_VERSION, sanitizeProfile } from "../src/profile";
import { profileWith } from "./fixtures/profile";

function golden() {
  return profileWith({
    game: {
      starlight: 1234.5,
      cycleStarlight: 99999,
      lifetimeStarlight: 2500000,
      shards: 3,
      shardsEarned: 8,
      owned: { telescope: 12, lens: 3 },
      upgrades: ["u-telescope-1"],
      charted: ["lyre", "crown"],
      boons: ["dark-adapted"],
      achievements: ["telescope-row", "first-ink"],
      eclipses: 1,
      taps: 321,
      cycleSeconds: 4000.25,
    },
    stats: { taps: 321, charts: 2, flawlessCharts: 1, longestStreak: 4, activeSeconds: 7777 },
    profile: {
      cometLastKey: "2026-10-22",
      cometStreak: 2,
      cometDays: 5,
      loreUnlocked: ["lore-01", "lore-02"],
      loreSeen: ["lore-01"],
      tutorial: { observe: true, build: true, atlas: false, chart: false, skipped: false },
      eclipseIntroSeen: true,
      lastSeenMs: 1761220000000,
      createdMs: 1761000000000,
    },
  });
}

function clone(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function withGame(patch: Record<string, unknown>) {
  const raw = clone(golden());
  raw.game = { ...(raw.game as Record<string, unknown>), ...patch };
  return raw;
}

describe("profile version and defaults", () => {
  it("starts at version 1", () => {
    expect(PROFILE_VERSION).toBe(1);
  });

  it("creates a new profile with the starting state and the given timestamp", () => {
    const profile = createProfile(1700000000000, CATALOG);
    expect(profile.game.starlight).toBe(RULES.STARTING_STARLIGHT);
    expect(profile.lastSeenMs).toBe(1700000000000);
    expect(profile.createdMs).toBe(1700000000000);
    expect(profile.cometLastKey).toBeNull();
    expect(profile.loreUnlocked).toEqual([]);
    expect(profile.tutorial.skipped).toBe(false);
    expect(profile.eclipseIntroSeen).toBe(false);
    expect(Object.values(profile.stats).every((value) => value === 0)).toBe(true);
  });

  it("falls back to 0 for a bad timestamp", () => {
    expect(createProfile(Number.NaN).lastSeenMs).toBe(0);
    expect(createProfile(-5).createdMs).toBe(0);
  });
});

describe("sanitizeProfile", () => {
  it("accepts a golden profile unchanged", () => {
    const profile = golden();
    expect(sanitizeProfile(clone(profile))).toEqual(profile);
  });

  it("accepts a fresh profile", () => {
    const profile = createProfile(5);
    expect(sanitizeProfile(clone(profile))).toEqual(profile);
  });

  it("round trips through JSON with stable key order", () => {
    const profile = golden();
    const text = JSON.stringify(profile);
    const again = sanitizeProfile(JSON.parse(text));
    expect(JSON.stringify(again)).toBe(text);
    const shuffled = JSON.stringify(Object.fromEntries(Object.entries(clone(profile)).reverse()));
    expect(JSON.stringify(sanitizeProfile(JSON.parse(shuffled)))).toBe(text);
  });

  it.each([
    ["null", null],
    ["a string", "profile"],
    ["an array", []],
    ["an empty object", {}],
    ["a number", 7],
  ])("rejects %s", (_name, raw) => {
    expect(sanitizeProfile(raw)).toBeNull();
  });

  it.each([
    ["NaN starlight", () => withGame({ starlight: Number.NaN })],
    ["negative starlight", () => withGame({ starlight: -1 })],
    ["negative shards", () => withGame({ shards: -2 })],
    ["fractional owned count", () => withGame({ owned: { telescope: 1.5 } })],
    ["string starlight", () => withGame({ starlight: "10" })],
    ["unknown instrument id", () => withGame({ owned: { warp: 1 } })],
    ["unknown upgrade id", () => withGame({ upgrades: ["nope"] })],
    ["unknown constellation id", () => withGame({ charted: ["nope"] })],
    ["unknown boon id", () => withGame({ boons: ["nope"] })],
    ["unknown achievement id", () => withGame({ achievements: ["nope"] })],
    ["owned as array", () => withGame({ owned: [] })],
  ])("rejects a game with %s", (_name, build) => {
    expect(sanitizeProfile(build())).toBeNull();
  });

  it.each([
    ["missing game", (raw: Record<string, unknown>) => ({ ...raw, game: undefined })],
    ["stats not an object", (raw: Record<string, unknown>) => ({ ...raw, stats: 3 })],
    [
      "negative stat",
      (raw: Record<string, unknown>) => ({ ...raw, stats: { ...(raw.stats as object), taps: -1 } }),
    ],
    [
      "NaN stat",
      (raw: Record<string, unknown>) => ({
        ...raw,
        stats: { ...(raw.stats as object), activeSeconds: Number.NaN },
      }),
    ],
    ["missing stat", (raw: Record<string, unknown>) => ({ ...raw, stats: { taps: 1 } })],
    ["bad comet key", (raw: Record<string, unknown>) => ({ ...raw, cometLastKey: "yesterday" })],
    ["numeric comet key", (raw: Record<string, unknown>) => ({ ...raw, cometLastKey: 20261022 })],
    ["negative streak", (raw: Record<string, unknown>) => ({ ...raw, cometStreak: -1 })],
    ["fractional streak", (raw: Record<string, unknown>) => ({ ...raw, cometStreak: 1.5 })],
    ["string comet days", (raw: Record<string, unknown>) => ({ ...raw, cometDays: "3" })],
    ["unknown lore id", (raw: Record<string, unknown>) => ({ ...raw, loreUnlocked: ["lore-99"] })],
    ["lore not an array", (raw: Record<string, unknown>) => ({ ...raw, loreSeen: "lore-01" })],
    [
      "tutorial flag wrong type",
      (raw: Record<string, unknown>) => ({
        ...raw,
        tutorial: { ...(raw.tutorial as object), chart: 1 },
      }),
    ],
    [
      "intro flag wrong type",
      (raw: Record<string, unknown>) => ({ ...raw, eclipseIntroSeen: "yes" }),
    ],
    ["NaN lastSeen", (raw: Record<string, unknown>) => ({ ...raw, lastSeenMs: Number.NaN })],
    ["negative lastSeen", (raw: Record<string, unknown>) => ({ ...raw, lastSeenMs: -1 })],
    ["null createdMs", (raw: Record<string, unknown>) => ({ ...raw, createdMs: null })],
  ])("rejects a profile with %s", (_name, corrupt) => {
    expect(sanitizeProfile(corrupt(clone(golden())))).toBeNull();
  });

  it("clamps oversized values to 1e300", () => {
    const profile = sanitizeProfile(
      withGame({ starlight: 1e305, lifetimeStarlight: Number.POSITIVE_INFINITY }),
    );
    expect(profile?.game.starlight).toBe(RULES.MAX_VALUE);
    expect(profile?.game.lifetimeStarlight).toBe(RULES.MAX_VALUE);
  });

  it("drops duplicate ids and unread lore that was never unlocked", () => {
    const raw = clone(golden());
    raw.loreUnlocked = ["lore-01", "lore-01", "lore-02"];
    raw.loreSeen = ["lore-02", "lore-05"];
    const profile = sanitizeProfile(raw);
    expect(profile?.loreUnlocked).toEqual(["lore-01", "lore-02"]);
    expect(profile?.loreSeen).toEqual(["lore-02"]);
  });

  it("ignores unknown extra keys", () => {
    const raw = { ...clone(golden()), extra: 1 };
    expect(sanitizeProfile(raw)).toEqual(golden());
  });
});
