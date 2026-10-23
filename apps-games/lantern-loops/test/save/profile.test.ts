import { BACKUP_SUFFIX, createMemoryAdapter } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import {
  createProfileStore,
  defaults,
  LEGACY_BACKUP_SUFFIX,
  migrateV0ToV1,
  PROFILE_KEY,
  PROFILE_VERSION,
  parse,
} from "../../src/save/profile";

const envelope = (v: number, data: unknown): string => JSON.stringify({ v, data });

describe("defaults and round trip", () => {
  it("starts with 3 tokens and 1 freeze", () => {
    const fresh = defaults();
    expect(fresh.tokens).toBe(3);
    expect(fresh.freezes).toBe(1);
    expect(fresh.streak).toBe(0);
    expect(fresh.onboardingDone).toBe(false);
    expect(fresh).toEqual(parse(JSON.parse(JSON.stringify(fresh))));
  });

  it("returns defaults on a fresh load", async () => {
    const store = createProfileStore(createMemoryAdapter());
    const result = await store.load();
    expect(result.status).toBe("fresh");
    expect(result.data).toEqual(defaults());
    expect(store.version).toBe(PROFILE_VERSION);
    expect(store.key).toBe("lantern-loops.profile");
  });

  it("round-trips an update", async () => {
    const adapter = createMemoryAdapter();
    const store = createProfileStore(adapter);
    await store.update((p) => ({
      ...p,
      tokens: 7,
      stars: { "harbor-01": 3 },
      dailiesSolved: { "2026-10-22": { stars: 2, seconds: 91 } },
      lastDailyDate: "2026-10-22",
      brush: "corner",
    }));
    const again = createProfileStore(adapter);
    const loaded = await again.load();
    expect(loaded.status).toBe("loaded");
    expect(loaded.data).toMatchObject({ tokens: 7, brush: "corner", lastDailyDate: "2026-10-22" });
    expect(loaded.data.stars).toEqual({ "harbor-01": 3 });
    expect(loaded.data.dailiesSolved["2026-10-22"]).toEqual({ stars: 2, seconds: 91 });
  });
});

describe("parse rejects wrong types field by field", () => {
  const bad: Array<[string, unknown]> = [
    ["not an object", 5],
    ["array", []],
    ["stars not a map", { stars: [] }],
    ["stars value out of range", { stars: { "harbor-01": 4 } }],
    ["stars value a string", { stars: { "harbor-01": "3" } }],
    ["bestTimes negative", { bestTimes: { "harbor-01": -3 } }],
    ["tokens a string", { tokens: "3" }],
    ["tokens negative", { tokens: -1 }],
    ["tokens fractional", { tokens: 1.5 }],
    ["freezes a boolean", { freezes: true }],
    ["freezeWeek a number", { freezeWeek: 202643 }],
    ["streak negative", { streak: -2 }],
    ["bestStreak a string", { bestStreak: "9" }],
    ["lastDailyDate garbage", { lastDailyDate: "yesterday" }],
    ["lastDailyDate impossible date", { lastDailyDate: "2026-02-30" }],
    ["milestonesGranted not a list", { milestonesGranted: 3 }],
    ["milestonesGranted unknown day", { milestonesGranted: [5] }],
    ["archiveRewarded bad entry", { archiveRewarded: ["2026-10-22", "x"] }],
    ["chaptersCleared unknown chapter", { chaptersCleared: ["moon"] }],
    ["dailiesSolved bad key", { dailiesSolved: { today: { stars: 3, seconds: 5 } } }],
    ["dailiesSolved bad value", { dailiesSolved: { "2026-10-22": { stars: 0, seconds: 5 } } }],
    ["hintsUsed null", { hintsUsed: null }],
    ["playSeconds a string", { playSeconds: "12" }],
    ["onboardingDone a number", { onboardingDone: 1 }],
    ["showTimer a string", { showTimer: "yes" }],
    ["showConflicts a number", { showConflicts: 0 }],
    ["hidePathInShare an object", { hidePathInShare: {} }],
    ["brush unknown", { brush: "spray" }],
  ];

  it.each(bad)("%s", (_name, data) => {
    expect(parse(data)).toBeNull();
  });

  it("has at least 15 cases", () => {
    expect(bad.length).toBeGreaterThanOrEqual(15);
  });

  it("repairs numbers that are only out of range and fills missing fields", () => {
    const repaired = parse({ tokens: 99, freezes: 4, streak: 6, bestStreak: 2 });
    expect(repaired).toMatchObject({ tokens: 20, freezes: 1, streak: 6, bestStreak: 6 });
    expect(repaired?.showConflicts).toBe(true);
    expect(parse({})).toEqual(defaults());
  });
});

describe("version 0 migration", () => {
  const v0 = { solvedIds: ["harbor-01", "harbor-02", "garden-01"], hintsLeft: 5 };

  it("turns solved ids into 3-star solves and hintsLeft into tokens", () => {
    const migrated = migrateV0ToV1(v0) as ReturnType<typeof defaults>;
    expect(migrated.stars).toEqual({ "harbor-01": 3, "harbor-02": 3, "garden-01": 3 });
    expect(migrated.tokens).toBe(5);
    expect(migrated.freezes).toBe(1);
    expect(migrated.streak).toBe(0);
    expect(migrated.onboardingDone).toBe(true);
    expect(parse(migrated)).not.toBeNull();
  });

  it("clamps the token balance and falls back when it is missing", () => {
    expect((migrateV0ToV1({ solvedIds: [], hintsLeft: 99 }) as { tokens: number }).tokens).toBe(20);
    expect((migrateV0ToV1({ solvedIds: [] }) as { tokens: number }).tokens).toBe(3);
    expect(migrateV0ToV1({ solvedIds: "x" })).toBeNull();
    expect(migrateV0ToV1(null)).toBeNull();
  });

  it("loads a v0 envelope as a v1 profile and keeps the original", async () => {
    const raw = envelope(0, v0);
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: raw });
    const result = await createProfileStore(adapter).load();
    expect(result.data.stars["harbor-02"]).toBe(3);
    expect(result.data.tokens).toBe(5);
    expect(adapter.entries.get(`${PROFILE_KEY}${LEGACY_BACKUP_SUFFIX}`)).toBe(raw);
    expect(JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "").v).toBe(1);
  });

  it("loads a bare preview object without an envelope", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: JSON.stringify(v0) });
    const result = await createProfileStore(adapter).load();
    expect(result.data.tokens).toBe(5);
    expect(Object.keys(result.data.stars)).toHaveLength(3);
  });

  it("recovers to defaults when the v0 data is malformed", async () => {
    const raw = envelope(0, { solvedIds: 7 });
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: raw });
    const result = await createProfileStore(adapter).load();
    expect(result.status).toBe("recovered");
    expect(result.data).toEqual(defaults());
    expect(adapter.entries.get(`${PROFILE_KEY}${BACKUP_SUFFIX}`)).toBe(raw);
  });

  it("does not touch current-version data", async () => {
    const adapter = createMemoryAdapter();
    const store = createProfileStore(adapter);
    await store.save({ ...defaults(), tokens: 9 });
    expect((await store.load()).data.tokens).toBe(9);
    expect(adapter.entries.has(`${PROFILE_KEY}${LEGACY_BACKUP_SUFFIX}`)).toBe(false);
  });
});

describe("damaged and newer saves", () => {
  it("recovers from corrupt JSON and keeps a backup", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: "{not json" });
    const store = createProfileStore(adapter);
    const result = await store.load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("unreadable");
    expect(result.data).toEqual(defaults());
    expect(adapter.entries.get(`${PROFILE_KEY}${BACKUP_SUFFIX}`)).toBe("{not json");
    expect(await store.readBackup()).toBe("{not json");
  });

  it("does not crash on data from a newer version and keeps it as a backup", async () => {
    const raw = envelope(PROFILE_VERSION + 4, { tokens: 8, shiny: true });
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: raw });
    const result = await createProfileStore(adapter).load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("future-version");
    expect(result.fromVersion).toBe(PROFILE_VERSION + 4);
    expect(result.data.tokens).toBe(3);
    expect(adapter.entries.get(`${PROFILE_KEY}${BACKUP_SUFFIX}`)).toBe(raw);
  });

  it("recovers from a wrong-typed current save", async () => {
    const raw = envelope(PROFILE_VERSION, { tokens: "many" });
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: raw });
    const result = await createProfileStore(adapter).load();
    expect(result.reason).toBe("invalid-data");
    expect(result.data.tokens).toBe(3);
  });
});
