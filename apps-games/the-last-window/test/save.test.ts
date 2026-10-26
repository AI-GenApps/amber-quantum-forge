import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BACKUP_SUFFIX,
  createMemoryAdapter,
  createSaveStore,
  type SaveSchema,
} from "@web-games/kit";
import {
  defaultProfile,
  type Profile,
  START_COINS,
  sanitizeProfile,
} from "@web-games/the-last-window-core";
import { describe, expect, it } from "vitest";
import {
  createGameSettings,
  createProfileStore,
  GAME_ID,
  PROFILE_KEY,
  profileSchema,
} from "../src/state/saveStores";

const FIXTURE = readFileSync(join(import.meta.dirname, "fixtures", "profile-v1.json"), "utf8");
const BACKUP_KEY = `${PROFILE_KEY}${BACKUP_SUFFIX}`;

function fixtureData(): Record<string, unknown> {
  return (JSON.parse(FIXTURE) as { data: Record<string, unknown> }).data;
}

describe("profile store", () => {
  it("uses the documented key and version", () => {
    const store = createProfileStore(createMemoryAdapter());
    expect(store.key).toBe("the-last-window.profile");
    expect(store.version).toBe(1);
    expect(GAME_ID).toBe("the-last-window");
  });

  it("starts fresh with 30 coins", async () => {
    const result = await createProfileStore(createMemoryAdapter()).load();
    expect(result.status).toBe("fresh");
    expect(result.data.coins).toBe(START_COINS);
    expect(result.data.coins).toBe(30);
    expect(result.data).toEqual(defaultProfile());
  });

  it("round-trips a saved profile", async () => {
    const store = createProfileStore(createMemoryAdapter());
    const profile: Profile = { ...defaultProfile(), coins: 321, day: 4, owned: ["decor-1"] };
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
    expect(result.data).toEqual(fixtureData());
    expect(result.data.coins).toBe(642);
    expect(result.data.day).toBe(15);
    expect(result.data.owned).toHaveLength(5);
    expect(result.data.late.streak).toBe(3);
    expect(result.data.regulars[2]?.ending).toBe("b");
    expect(result.data.pendingEvening).toEqual(["scene-3-5", "scene-6-5"]);
    expect(result.data.settings.textSize).toBe("large");
    expect(adapter.entries.has(BACKUP_KEY)).toBe(false);
  });

  it("strips unknown fields on load", async () => {
    const data = fixtureData();
    data.cheat = { coins: 999999 };
    (data.settings as Record<string, unknown>).secret = true;
    (data.daysDone as Record<string, unknown>)["99"] = {
      stars: 3,
      earned: 1,
      served: 1,
      delighted: 1,
    };
    const raw = JSON.stringify({ v: 1, data });
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: raw });
    const result = await createProfileStore(adapter).load();
    expect(result.status).toBe("loaded");
    expect(result.data).not.toHaveProperty("cheat");
    expect(result.data.settings).not.toHaveProperty("secret");
    expect(result.data.daysDone).not.toHaveProperty("99");
  });

  it("clamps edited values on load", async () => {
    const data = fixtureData();
    data.coins = -10;
    (data.regulars as Record<string, Record<string, unknown>>)["1"] = {
      fp: 50,
      visits: 3,
      scenesDone: 9,
      choices: {},
      ending: null,
    };
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: JSON.stringify({ v: 1, data }) });
    const { data: loaded } = await createProfileStore(adapter).load();
    expect(loaded.coins).toBe(0);
    expect(loaded.regulars[1]).toMatchObject({ fp: 8, scenesDone: 5 });
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

  it("recovers when a migration throws", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: FIXTURE });
    const v2: SaveSchema<Profile> = {
      ...profileSchema(),
      version: 2,
      migrations: {
        1: () => {
          throw new Error("boom");
        },
      },
    };
    const result = await createSaveStore(adapter, v2).load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("migration-failed");
  });

  it("exposes the real schema with no migrations yet", () => {
    expect(profileSchema().migrations).toEqual({});
    expect(profileSchema().parse).toBe(sanitizeProfile);
    expect(profileSchema().version).toBe(1);
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
    expect(adapter.entries.has("the-last-window.settings")).toBe(true);
    expect(adapter.entries.has(PROFILE_KEY)).toBe(true);
  });
});
