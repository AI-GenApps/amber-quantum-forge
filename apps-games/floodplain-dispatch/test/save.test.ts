import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  defaultProfile,
  PROFILE_KEY,
  type Profile,
  START_COINS,
  sanitizeProfile,
} from "@web-games/floodplain-dispatch-core";
import {
  BACKUP_SUFFIX,
  createMemoryAdapter,
  createSaveStore,
  type SaveSchema,
} from "@web-games/kit";
import { describe, expect, it } from "vitest";
import {
  createGameSettings,
  createProfileStore,
  GAME_ID,
  profileSchema,
} from "../src/state/saveStores";

const FIXTURE = readFileSync(join(import.meta.dirname, "fixtures", "profile-v1.json"), "utf8");
const BACKUP_KEY = `${PROFILE_KEY}${BACKUP_SUFFIX}`;

describe("profile store", () => {
  it("uses the documented key and version", () => {
    const store = createProfileStore(createMemoryAdapter());
    expect(store.key).toBe("floodplain-dispatch.profile");
    expect(store.version).toBe(1);
    expect(GAME_ID).toBe("floodplain-dispatch");
  });

  it("starts fresh with 50 coins", async () => {
    const result = await createProfileStore(createMemoryAdapter()).load();
    expect(result.status).toBe("fresh");
    expect(result.data.coins).toBe(START_COINS);
    expect(result.data).toEqual(defaultProfile());
  });

  it("round-trips a saved profile", async () => {
    const store = createProfileStore(createMemoryAdapter());
    const profile: Profile = { ...defaultProfile(), coins: 321, stars: { v01: 3 } };
    await store.save(profile);
    const loaded = await store.load();
    expect(loaded.status).toBe("loaded");
    expect(loaded.data).toEqual(profile);
  });

  it("persists across a new store on the same adapter", async () => {
    const adapter = createMemoryAdapter();
    await createProfileStore(adapter).update((p) => ({ ...p, coins: p.coins + 77 }));
    const again = await createProfileStore(adapter).load();
    expect(again.status).toBe("loaded");
    expect(again.data.coins).toBe(START_COINS + 77);
  });

  it("recovers from corrupt JSON and keeps a backup", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: "{not json" });
    const store = createProfileStore(adapter);
    const result = await store.load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("unreadable");
    expect(result.data).toEqual(defaultProfile());
    expect(adapter.entries.get(BACKUP_KEY)).toBe("{not json");
    expect(await store.readBackup()).toBe("{not json");
  });

  it("recovers from data of the wrong shape", async () => {
    const raw = JSON.stringify({ v: 1, data: { coins: "lots" } });
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: raw });
    const result = await createProfileStore(adapter).load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("invalid-data");
    expect(adapter.entries.get(BACKUP_KEY)).toBe(raw);
  });

  it("recovers from a future version without throwing", async () => {
    const raw = JSON.stringify({ v: 9, data: { coins: 5000 } });
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: raw });
    const result = await createProfileStore(adapter).load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("future-version");
    expect(result.fromVersion).toBe(9);
    expect(result.data.coins).toBe(START_COINS);
    expect(adapter.entries.get(BACKUP_KEY)).toBe(raw);
  });

  it("loads the committed v1 fixture as loaded", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: FIXTURE });
    const result = await createProfileStore(adapter).load();
    expect(result.status).toBe("loaded");
    expect(result.fromVersion).toBe(1);
    expect(result.data).toEqual((JSON.parse(FIXTURE) as { data: Profile }).data);
    expect(result.data.coins).toBe(187);
    expect(result.data.themeSelected).toBe("harvest-ochre");
    expect(result.data.daily.streak).toBe(4);
    expect(adapter.entries.has(BACKUP_KEY)).toBe(false);
  });

  it("strips unknown fields on load", async () => {
    const parsed = JSON.parse(FIXTURE) as { v: number; data: Record<string, unknown> };
    parsed.data.cheat = { coins: 999999 };
    (parsed.data.stars as Record<string, number>).zz99 = 3;
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: JSON.stringify(parsed) });
    const result = await createProfileStore(adapter).load();
    expect(result.status).toBe("loaded");
    expect(result.data).not.toHaveProperty("cheat");
    expect(result.data.stars).not.toHaveProperty("zz99");
  });

  it("clamps edited values on load", async () => {
    const parsed = JSON.parse(FIXTURE) as { v: number; data: Record<string, unknown> };
    parsed.data.coins = -10;
    parsed.data.streakFreezes = 9;
    parsed.data.stars = { v01: 7 };
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: JSON.stringify(parsed) });
    const { data } = await createProfileStore(adapter).load();
    expect(data.coins).toBe(0);
    expect(data.streakFreezes).toBe(2);
    expect(data.stars.v01).toBe(3);
    expect(data.themeSelected).toBe("gouache-meadow");
  });

  it("never throws when the adapter cannot read", async () => {
    const adapter = createMemoryAdapter();
    const broken = {
      ...adapter,
      get: async () => {
        throw new Error("denied");
      },
    };
    const result = await createProfileStore(broken).load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("read-failed");
  });
});

describe("migration chain", () => {
  it("runs a stub 1 to 2 migration and then the same parse", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: FIXTURE });
    const v2: SaveSchema<Profile> = {
      ...profileSchema(),
      version: 2,
      migrations: {
        1: (data) => ({ ...(data as Record<string, unknown>), coins: 5000, purchases: ["none"] }),
      },
    };
    const result = await createSaveStore(adapter, v2).load();
    expect(result.status).toBe("migrated");
    expect(result.fromVersion).toBe(1);
    expect(result.data.coins).toBe(5000);
    expect(result.data).not.toHaveProperty("purchases");
    expect(JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "").v).toBe(2);
    const reloaded = await createSaveStore(adapter, v2).load();
    expect(reloaded.status).toBe("loaded");
  });

  it("rejects a migration that produces rubbish through the same parse", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: FIXTURE });
    const v2: SaveSchema<Profile> = {
      ...profileSchema(),
      version: 2,
      migrations: { 1: () => ({ coins: "broken" }) },
    };
    const result = await createSaveStore(adapter, v2).load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("invalid-data");
  });

  it("exposes the real schema with no migrations yet", () => {
    expect(profileSchema().migrations).toEqual({});
    expect(profileSchema().parse).toBe(sanitizeProfile);
  });
});

describe("settings", () => {
  it("persist separately from the profile", async () => {
    const adapter = createMemoryAdapter();
    const settings = createGameSettings(adapter);
    await settings.set({ haptics: false, highContrast: true });
    await createProfileStore(adapter).save({ ...defaultProfile(), coins: 9 });
    const reloaded = createGameSettings(adapter);
    await reloaded.load();
    expect(reloaded.get().haptics).toBe(false);
    expect(reloaded.get().highContrast).toBe(true);
    expect(adapter.entries.has("floodplain-dispatch.settings")).toBe(true);
    expect(adapter.entries.has(PROFILE_KEY)).toBe(true);
  });
});
