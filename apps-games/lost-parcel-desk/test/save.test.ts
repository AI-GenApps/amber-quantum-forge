import { BACKUP_SUFFIX, createMemoryAdapter, createSaveStore, dailySeed } from "@web-games/kit";
import {
  addDays,
  dailySeedOf,
  defaultProfile,
  generateDaily,
  PROFILE_KEY,
  PROFILE_VERSION,
  type Profile,
  sanitizeProfile,
  weekdayOf,
} from "@web-games/lost-parcel-desk-core";
import { describe, expect, it } from "vitest";
import { dailyCaseFor, weekdayOfKey } from "../src/state/dailyCase";
import {
  createGameSettings,
  createProfileStore,
  GAME_ID,
  profileSchema,
} from "../src/state/saveStores";
import { envelope } from "./fixtures/game";
import fixture from "./fixtures/profile-v1.json";

const BACKUP_KEY = `${PROFILE_KEY}${BACKUP_SUFFIX}`;
const FIXTURE_RAW = JSON.stringify(fixture);

describe("profile save store", () => {
  it("uses the documented key and version with no migrations yet", () => {
    const schema = profileSchema();
    expect(schema.key).toBe("lost-parcel-desk.profile");
    expect(schema.version).toBe(1);
    expect(PROFILE_VERSION).toBe(1);
    expect(schema.migrations).toEqual({});
  });

  it("starts a fresh player with 30 postage", async () => {
    const result = await createProfileStore(createMemoryAdapter()).load();
    expect(result.status).toBe("fresh");
    expect(result.data.postage).toBe(30);
    expect(result.data).toEqual(defaultProfile());
  });

  it("round-trips a profile", async () => {
    const store = createProfileStore(createMemoryAdapter());
    const profile: Profile = { ...defaultProfile(), postage: 77, streakFreezes: 2 };
    await store.save(profile);
    const result = await store.load();
    expect(result.status).toBe("loaded");
    expect(result.data).toEqual(profile);
  });

  it("persists across a new store on the same adapter", async () => {
    const adapter = createMemoryAdapter();
    await createProfileStore(adapter).save({ ...defaultProfile(), postage: 123 });
    const again = await createProfileStore(adapter).load();
    expect(again.status).toBe("loaded");
    expect(again.data.postage).toBe(123);
  });

  it("recovers from corrupt JSON and writes the backup key", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: "{oops" });
    const store = createProfileStore(adapter);
    const result = await store.load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("unreadable");
    expect(result.data).toEqual(defaultProfile());
    expect(adapter.entries.get(BACKUP_KEY)).toBe("{oops");
    expect(await store.readBackup()).toBe("{oops");
  });

  it("recovers from a future-version envelope without throwing", async () => {
    const raw = envelope({ postage: 999 }, 9);
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: raw });
    const result = await createProfileStore(adapter).load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("future-version");
    expect(result.fromVersion).toBe(9);
    expect(result.data.postage).toBe(30);
    expect(adapter.entries.get(BACKUP_KEY)).toBe(raw);
  });

  it("recovers from data of the wrong shape", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: envelope({ postage: "lots" }) });
    const result = await createProfileStore(adapter).load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("invalid-data");
  });

  it("loads the committed v1 fixture", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: FIXTURE_RAW });
    const result = await createProfileStore(adapter).load();
    expect(result.status).toBe("loaded");
    expect(result.fromVersion).toBe(1);
    expect(result.data.postage).toBe(109);
    expect(Object.keys(result.data.cases)).toEqual(["01", "02", "03"]);
    expect(result.data.cases["02"]?.stamps).toBe(2);
    expect(result.data.themeSelected).toBe("teal-blotter");
    expect(result.data.streakFreezes).toBe(1);
    expect(result.data.daily.streak).toBe(3);
    expect(result.data.session?.id).toBe("04");
    expect(result.data.session?.state.elapsedMs).toBe(37_500);
    expect(result.data).toEqual(sanitizeProfile(fixture.data));
  });

  it("strips unknown fields on load", async () => {
    const dirty = {
      v: 1,
      data: {
        ...fixture.data,
        cheat: true,
        cases: { ...fixture.data.cases, "01": { ...fixture.data.cases["01"], bonus: 9 } },
      },
    };
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: JSON.stringify(dirty) });
    const { data } = await createProfileStore(adapter).load();
    expect(data).not.toHaveProperty("cheat");
    expect(data.cases["01"]).not.toHaveProperty("bonus");
  });

  it("keeps an in-progress case across a reload with the same clues, pins and links", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: FIXTURE_RAW });
    const { data } = await createProfileStore(adapter).load();
    const stored = fixture.data.session.state;
    const state = data.session?.state;
    expect(state?.foundClueIds).toEqual(stored.foundClueIds);
    expect(state?.pinnedClueIds).toEqual(stored.pinnedClueIds);
    expect(state?.links).toEqual(stored.links);
    expect(state?.seenObjectIds).toEqual(stored.seenObjectIds);
    expect(state?.links).toHaveLength(2);
  });

  it("runs a migration chain through the same parse (local schema at version 2)", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: FIXTURE_RAW });
    const schema = {
      ...profileSchema(),
      version: 2,
      migrations: {
        1: (data: unknown) => ({
          ...(data as Record<string, unknown>),
          postage: 500,
          legacy: "v1",
        }),
      },
    };
    const store = createSaveStore(adapter, schema);
    const result = await store.load();
    expect(result.status).toBe("migrated");
    expect(result.fromVersion).toBe(1);
    expect(result.data.postage).toBe(500);
    expect(result.data).not.toHaveProperty("legacy");
    expect(result.data.session?.id).toBe("04");
    expect(JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "").v).toBe(2);
  });

  it("recovers when a migration produces data the parse rejects", async () => {
    const adapter = createMemoryAdapter({ [PROFILE_KEY]: FIXTURE_RAW });
    const store = createSaveStore(adapter, {
      ...profileSchema(),
      version: 2,
      migrations: { 1: () => "not a profile" },
    });
    const result = await store.load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("invalid-data");
    expect(adapter.entries.get(BACKUP_KEY)).toBe(FIXTURE_RAW);
  });
});

describe("settings", () => {
  it("persist separately from the profile", async () => {
    const adapter = createMemoryAdapter();
    const settings = createGameSettings(adapter);
    await settings.set({ sound: false, highContrast: true });
    await createProfileStore(adapter).save({ ...defaultProfile(), postage: 5 });
    const reloaded = createGameSettings(adapter);
    await reloaded.load();
    expect(reloaded.get().sound).toBe(false);
    expect(reloaded.get().highContrast).toBe(true);
    expect(adapter.entries.has(`${GAME_ID}.settings`)).toBe(true);
    expect(adapter.entries.has(PROFILE_KEY)).toBe(true);
    expect((await createProfileStore(adapter).load()).data.postage).toBe(5);
  });
});

describe("kit and core agree on the daily date maths", () => {
  const keys = Array.from({ length: 366 }, (_, i) => addDays("2026-01-01", i));

  it("computes the same seed", () => {
    for (const key of keys) expect(dailySeed(GAME_ID, key)).toBe(dailySeedOf(key));
  });

  it("computes the same weekday, Monday first", () => {
    for (const key of keys) {
      expect(weekdayOfKey(key)).toBe(weekdayOf(key));
      const [year, month, day] = key.split("-").map(Number);
      const sunday0 = new Date(year ?? 0, (month ?? 1) - 1, day).getDay();
      expect(weekdayOfKey(key)).toBe((sunday0 + 6) % 7);
    }
  });

  it("makes the same Daily Parcel from either side", () => {
    for (const key of keys.slice(0, 40)) {
      expect(dailyCaseFor(key)).toEqual(generateDaily(dailySeedOf(key), weekdayOf(key)));
    }
  });
});
