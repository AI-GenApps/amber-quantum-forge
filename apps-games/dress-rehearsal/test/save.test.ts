import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  defaultProfile,
  PROFILE_KEY,
  type Profile,
  sanitizeProfile,
} from "@web-games/dress-rehearsal-core";
import {
  BACKUP_SUFFIX,
  createMemoryAdapter,
  createSaveStore,
  type SaveSchema,
} from "@web-games/kit";
import { describe, expect, it } from "vitest";
import {
  createGameSettingsStore,
  createProfileStore,
  profileSchema,
} from "../src/state/saveStores";

const FIXTURE = readFileSync(join(import.meta.dirname, "fixtures", "profile-v1.json"), "utf8");
const FIXTURE_DATA = (JSON.parse(FIXTURE) as { data: unknown }).data;

function envelope(version: number, data: unknown): string {
  return JSON.stringify({ v: version, data });
}

describe("profile save", () => {
  it("uses the documented key and version 1 with no migrations", () => {
    expect(profileSchema.key).toBe("dress-rehearsal.profile");
    expect(profileSchema.version).toBe(1);
    expect(Object.keys(profileSchema.migrations ?? {})).toEqual([]);
  });

  it("gives a fresh profile with 40 coins", async () => {
    const store = createProfileStore(createMemoryAdapter());
    const result = await store.load();
    expect(result.status).toBe("fresh");
    expect(result.data.coins).toBe(40);
    expect(result.data).toEqual(defaultProfile());
  });

  it("round trips a saved profile", async () => {
    const adapter = createMemoryAdapter();
    const store = createProfileStore(adapter);
    const profile: Profile = { ...defaultProfile(), coins: 321, streakFreezes: 2 };
    await store.save(profile);
    expect(JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "")).toEqual({ v: 1, data: profile });
    const loaded = await store.load();
    expect(loaded).toMatchObject({ status: "loaded", fromVersion: 1 });
    expect(loaded.data).toEqual(profile);
  });

  it("persists across a new store on the same adapter", async () => {
    const adapter = createMemoryAdapter();
    await createProfileStore(adapter).update((profile) => ({ ...profile, coins: 777 }));
    const again = await createProfileStore(adapter).load();
    expect(again.status).toBe("loaded");
    expect(again.data.coins).toBe(777);
  });

  it("loads the committed v1 fixture untouched", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: FIXTURE });
    const loaded = await createProfileStore(adapter).load();
    expect(loaded.status).toBe("loaded");
    expect(loaded.fromVersion).toBe(1);
    expect(loaded.data).toEqual(FIXTURE_DATA);
    expect(loaded.data.coins).toBe(215);
    expect(loaded.data.frameSelected).toBe("paper");
    expect(loaded.data.gallery).toHaveLength(1);
  });

  it("recovers from corrupt JSON and keeps the raw text as a backup", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: "{not json" });
    const store = createProfileStore(adapter);
    const loaded = await store.load();
    expect(loaded.status).toBe("recovered");
    expect(loaded.reason).toBe("unreadable");
    expect(loaded.data).toEqual(defaultProfile());
    expect(adapter.entries.get(`${PROFILE_KEY}${BACKUP_SUFFIX}`)).toBe("{not json");
    expect(await store.readBackup()).toBe("{not json");
  });

  it("recovers from a future-version envelope without throwing", async () => {
    const future = envelope(9, { coins: 99999 });
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: future });
    const loaded = await createProfileStore(adapter).load();
    expect(loaded).toMatchObject({ status: "recovered", reason: "future-version", fromVersion: 9 });
    expect(loaded.data.coins).toBe(40);
    expect(adapter.entries.get(`${PROFILE_KEY}${BACKUP_SUFFIX}`)).toBe(future);
  });

  it("recovers from data of the wrong shape", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: envelope(1, { coins: "lots" }) });
    const loaded = await createProfileStore(adapter).load();
    expect(loaded).toMatchObject({ status: "recovered", reason: "invalid-data" });
  });

  it("recovers from a missing envelope", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: JSON.stringify({ coins: 5 }) });
    const loaded = await createProfileStore(adapter).load();
    expect(loaded).toMatchObject({ status: "recovered", reason: "bad-envelope" });
  });

  it("strips unknown fields on load", async () => {
    const dirty = {
      ...(FIXTURE_DATA as Record<string, unknown>),
      cheats: true,
      stars: { "riv-01": 3, "zzz-01": 3 },
      coins: -20,
    };
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: envelope(1, dirty) });
    const loaded = await createProfileStore(adapter).load();
    expect(loaded.status).toBe("loaded");
    expect(Object.keys(loaded.data)).not.toContain("cheats");
    expect(loaded.data.stars).toEqual({ "riv-01": 3 });
    expect(loaded.data.coins).toBe(0);
  });

  it("runs a migration chain through the same parse (local v2 schema with a stub)", async () => {
    const v2: SaveSchema<Profile> = {
      ...profileSchema,
      version: 2,
      migrations: {
        1: (data) => ({ ...(data as Record<string, unknown>), coins: 1000, leftover: "x" }),
      },
    };
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: FIXTURE });
    const store = createSaveStore(adapter, v2);
    const loaded = await store.load();
    expect(loaded.status).toBe("migrated");
    expect(loaded.fromVersion).toBe(1);
    expect(loaded.data.coins).toBe(1000);
    expect(Object.keys(loaded.data)).not.toContain("leftover");
    expect(loaded.data.stars).toEqual((FIXTURE_DATA as Profile).stars);
    expect(JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "").v).toBe(2);
  });

  it("a v2 schema without the stub is rejected, so the chain cannot be skipped", () => {
    expect(() =>
      createSaveStore(createMemoryAdapter(), { ...profileSchema, version: 2 }),
    ).toThrow();
  });

  it("the committed fixture is a fixed point of sanitizeProfile", () => {
    expect(sanitizeProfile(FIXTURE_DATA)).toEqual(FIXTURE_DATA);
  });
});

describe("settings save", () => {
  it("persists separately from the profile", async () => {
    const adapter = createMemoryAdapter();
    const settings = createGameSettingsStore(adapter);
    await settings.set({ sound: false, haptics: false });
    expect(adapter.entries.has("dress-rehearsal.settings")).toBe(true);
    expect(adapter.entries.has(PROFILE_KEY)).toBe(false);
    const again = createGameSettingsStore(adapter);
    await again.load();
    expect(again.get()).toMatchObject({ sound: false, haptics: false, music: true });
  });

  it("is untouched when the profile is reset", async () => {
    const adapter = createMemoryAdapter();
    const settings = createGameSettingsStore(adapter);
    await settings.set({ music: false });
    const profiles = createProfileStore(adapter);
    await profiles.update((profile) => ({ ...profile, coins: 5 }));
    const reset = await profiles.reset();
    expect(reset).toEqual(defaultProfile());
    const reread = createGameSettingsStore(adapter);
    await reread.load();
    expect(reread.get().music).toBe(false);
  });
});
