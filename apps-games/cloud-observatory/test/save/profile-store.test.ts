import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createProfile,
  PROFILE_VERSION,
  type Profile,
  sanitizeProfile,
} from "@web-games/cloud-observatory-core";
import { BACKUP_SUFFIX, createMemoryAdapter } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { createProfileStore, PROFILE_KEY, PROFILE_MIGRATIONS } from "../../src/save/profile-store";

const NOW = 1_761_000_000_000;
const GOLDEN_TEXT = readFileSync(
  join(import.meta.dirname, "..", "fixtures", "profile-v1.json"),
  "utf8",
);
const GOLDEN_COMPACT = JSON.stringify(JSON.parse(GOLDEN_TEXT));

function storeFor(initial: Record<string, string> = {}, extra = {}) {
  const adapter = createMemoryAdapter(initial);
  return { adapter, store: createProfileStore(adapter, { now: () => NOW, ...extra }) };
}

describe("profile store basics", () => {
  it("uses the namespaced key and version 1", () => {
    const { store } = storeFor();
    expect(store.key).toBe("cloud-observatory.profile");
    expect(PROFILE_KEY).toBe(store.key);
    expect(store.version).toBe(PROFILE_VERSION);
    expect(Object.keys(PROFILE_MIGRATIONS)).toEqual([]);
  });

  it("reports a fresh profile stamped with the clock when nothing is saved", async () => {
    const { store, adapter } = storeFor();
    const result = await store.load();
    expect(result.status).toBe("fresh");
    expect(result.data).toEqual(createProfile(NOW));
    expect(adapter.entries.size).toBe(0);
  });

  it("round trips a saved profile", async () => {
    const { store, adapter } = storeFor();
    const profile: Profile = {
      ...createProfile(NOW),
      cometStreak: 3,
      cometLastKey: "2026-10-23",
      game: { ...createProfile(NOW).game, starlight: 777.25, taps: 9 },
    };
    await store.save(profile);
    expect(JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "{}")).toMatchObject({ v: 1 });
    const loaded = await store.load();
    expect(loaded.status).toBe("loaded");
    expect(loaded.data).toEqual(profile);
  });

  it("reset returns defaults and stores them", async () => {
    const { store, adapter } = storeFor({ [PROFILE_KEY]: GOLDEN_TEXT });
    const fresh = await store.reset();
    expect(fresh).toEqual(createProfile(NOW));
    expect((await store.load()).data).toEqual(createProfile(NOW));
    expect(adapter.entries.get(PROFILE_KEY)).toContain('"starlight":10');
  });
});

describe("golden v1 fixture", () => {
  it("loads as loaded with the expected content", async () => {
    const { store } = storeFor({ [PROFILE_KEY]: GOLDEN_TEXT });
    const result = await store.load();
    expect(result.status).toBe("loaded");
    expect(result.fromVersion).toBe(1);
    expect(result.data.game.charted).toEqual(["lyre", "crown", "key"]);
    expect(result.data.game.owned.telescope).toBe(34);
    expect(result.data.cometStreak).toBe(2);
    expect(result.data.stats.bestStarlightPerSecond).toBe(96.4);
  });

  it("stays byte-identical after a load and save cycle", async () => {
    const { store, adapter } = storeFor({ [PROFILE_KEY]: GOLDEN_TEXT });
    const { data } = await store.load();
    await store.save(data);
    expect(adapter.entries.get(PROFILE_KEY)).toBe(GOLDEN_COMPACT);
  });

  it("passes the core sanitizer unchanged", () => {
    const envelope = JSON.parse(GOLDEN_TEXT) as { v: number; data: unknown };
    expect(JSON.stringify(sanitizeProfile(envelope.data))).toBe(JSON.stringify(envelope.data));
  });
});

describe("synthetic migration chain", () => {
  const seen: string[] = [];
  const migrations = {
    1: (data: unknown) => {
      seen.push("1->2");
      return { ...(data as object), addedInV2: true };
    },
    2: (data: unknown) => {
      seen.push("2->3");
      const { addedInV2, ...rest } = data as { addedInV2?: boolean };
      if (addedInV2 !== true) throw new Error("step 1 did not run first");
      return rest;
    },
  };

  it("migrates v1 to v3 in order and reports migrated", async () => {
    seen.length = 0;
    const { store, adapter } = storeFor({ [PROFILE_KEY]: GOLDEN_TEXT }, { version: 3, migrations });
    const result = await store.load();
    expect(seen).toEqual(["1->2", "2->3"]);
    expect(result.status).toBe("migrated");
    expect(result.fromVersion).toBe(1);
    expect(result.data.game.charted).toEqual(["lyre", "crown", "key"]);
    expect(JSON.parse(adapter.entries.get(PROFILE_KEY) ?? "{}")).toMatchObject({ v: 3 });
    expect((await store.load()).status).toBe("loaded");
  });

  it("migrates from the middle of the chain", async () => {
    seen.length = 0;
    const v2 = JSON.stringify({ v: 2, data: { ...JSON.parse(GOLDEN_TEXT).data, addedInV2: true } });
    const { store } = storeFor({ [PROFILE_KEY]: v2 }, { version: 3, migrations });
    expect((await store.load()).status).toBe("migrated");
    expect(seen).toEqual(["2->3"]);
  });
});

describe("recovery", () => {
  async function recoverFrom(raw: string, extra = {}) {
    const { store, adapter } = storeFor({ [PROFILE_KEY]: raw }, extra);
    const result = await store.load();
    return { result, adapter, store };
  }

  it("recovers from unreadable JSON with a backup", async () => {
    const { result, adapter, store } = await recoverFrom("{not json");
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("unreadable");
    expect(result.data).toEqual(createProfile(NOW));
    expect(adapter.entries.get(`${PROFILE_KEY}${BACKUP_SUFFIX}`)).toBe("{not json");
    expect(await store.readBackup()).toBe("{not json");
  });

  it("recovers from a bad envelope", async () => {
    const { result, store } = await recoverFrom(JSON.stringify({ hello: "world" }));
    expect(result.reason).toBe("bad-envelope");
    expect(await store.readBackup()).toBe('{"hello":"world"}');
  });

  it("recovers from a save written by a newer version", async () => {
    const future = JSON.stringify({ v: 2, data: JSON.parse(GOLDEN_TEXT).data });
    const { result, store } = await recoverFrom(future);
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("future-version");
    expect(result.fromVersion).toBe(2);
    expect(await store.readBackup()).toBe(future);
  });

  it("recovers from a failing migration", async () => {
    const migrations = {
      1: () => {
        throw new Error("boom");
      },
    };
    const { result, store } = await recoverFrom(GOLDEN_TEXT, { version: 2, migrations });
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("migration-failed");
    expect(result.fromVersion).toBe(1);
    expect(await store.readBackup()).toBe(GOLDEN_TEXT);
  });

  it("recovers from data the sanitizer rejects", async () => {
    const bad = JSON.stringify({ v: 1, data: { game: { starlight: "lots" } } });
    const { result, store } = await recoverFrom(bad);
    expect(result.reason).toBe("invalid-data");
    expect(await store.readBackup()).toBe(bad);
  });

  it("recovers from NaN-like corruption written as null", async () => {
    const data = JSON.parse(GOLDEN_TEXT).data;
    data.game.starlight = null;
    const { result } = await recoverFrom(JSON.stringify({ v: 1, data }));
    expect(result.reason).toBe("invalid-data");
  });

  it("recovers when storage cannot be read", async () => {
    const adapter = createMemoryAdapter();
    const failing = {
      ...adapter,
      get: async () => {
        throw new Error("denied");
      },
    };
    const store = createProfileStore(failing, { now: () => NOW });
    const result = await store.load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe("read-failed");
  });
});
