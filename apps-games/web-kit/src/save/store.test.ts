import { describe, expect, it } from "vitest";
import { createMemoryAdapter } from "./adapters/memory";
import { BACKUP_SUFFIX, createSaveStore, SaveSchemaError } from "./store";
import type { SaveSchema, StorageAdapter } from "./types";

interface ProfileV3 {
  name: string;
  coins: number;
}

const KEY = "game.profile";

function isProfile(data: unknown): ProfileV3 | null {
  if (typeof data !== "object" || data === null) return null;
  const p = data as Partial<ProfileV3>;
  return typeof p.name === "string" && typeof p.coins === "number"
    ? { name: p.name, coins: p.coins }
    : null;
}

const schema: SaveSchema<ProfileV3> = {
  key: KEY,
  version: 3,
  defaults: () => ({ name: "Player", coins: 0 }),
  migrations: {
    1: (d) => ({ name: (d as { n: string }).n }),
    2: (d) => ({ ...(d as { name: string }), coins: 10 }),
  },
  parse: isProfile,
};

const envelope = (v: number, data: unknown): string => JSON.stringify({ v, data });

describe("createSaveStore schema checks", () => {
  it("rejects bad versions and missing migrations", () => {
    const adapter = createMemoryAdapter();
    expect(() => createSaveStore(adapter, { ...schema, version: 0 })).toThrow(SaveSchemaError);
    expect(() => createSaveStore(adapter, { ...schema, version: 1.5 })).toThrow(SaveSchemaError);
    expect(() => createSaveStore(adapter, { ...schema, migrations: { 1: (d) => d } })).toThrow(
      /missing migration from v2 to v3/,
    );
    expect(() => createSaveStore(adapter, { ...schema, version: 1, migrations: {} })).not.toThrow();
  });
});

describe("load", () => {
  it("returns defaults and status fresh when nothing is stored", async () => {
    const store = createSaveStore(createMemoryAdapter(), schema);
    expect(await store.load()).toEqual({ status: "fresh", data: { name: "Player", coins: 0 } });
  });

  it("round-trips a save at the current version", async () => {
    const adapter = createMemoryAdapter();
    const store = createSaveStore(adapter, schema);
    await store.save({ name: "Ada", coins: 5 });
    expect(JSON.parse(adapter.entries.get(KEY) ?? "")).toEqual({
      v: 3,
      data: { name: "Ada", coins: 5 },
    });
    expect(await store.load()).toEqual({
      status: "loaded",
      data: { name: "Ada", coins: 5 },
      fromVersion: 3,
    });
  });

  it("runs migrations in order from an old version and persists the upgrade", async () => {
    const adapter = createMemoryAdapter({ [KEY]: envelope(1, { n: "Old" }) });
    const store = createSaveStore(adapter, schema);
    const result = await store.load();
    expect(result).toEqual({
      status: "migrated",
      data: { name: "Old", coins: 10 },
      fromVersion: 1,
    });
    expect(JSON.parse(adapter.entries.get(KEY) ?? "").v).toBe(3);
  });

  it("starts migrating from a middle version", async () => {
    const adapter = createMemoryAdapter({ [KEY]: envelope(2, { name: "Mid" }) });
    const result = await createSaveStore(adapter, schema).load();
    expect(result.data).toEqual({ name: "Mid", coins: 10 });
  });

  it("keeps the migrated result even if persisting it fails", async () => {
    const adapter = createMemoryAdapter({ [KEY]: envelope(1, { n: "Old" }) });
    const failing: StorageAdapter = {
      ...adapter,
      set: async () => {
        throw new Error("disk full");
      },
    };
    const result = await createSaveStore(failing, schema).load();
    expect(result.status).toBe("migrated");
  });
});

describe("corrupt-data recovery", () => {
  const cases: Array<[string, string, string]> = [
    ["not JSON", "{oops", "unreadable"],
    ["a JSON scalar", "42", "bad-envelope"],
    ["missing version", JSON.stringify({ data: {} }), "bad-envelope"],
    ["fractional version", JSON.stringify({ v: 1.5, data: {} }), "bad-envelope"],
    ["missing data", JSON.stringify({ v: 3 }), "bad-envelope"],
    ["null", "null", "bad-envelope"],
    ["a newer version", envelope(9, { name: "x", coins: 1 }), "future-version"],
    ["a throwing migration", envelope(1, null), "migration-failed"],
    ["wrong shape", envelope(3, { name: 5 }), "invalid-data"],
  ];

  it.each(cases)("recovers from %s", async (_label, raw, reason) => {
    const adapter = createMemoryAdapter({ [KEY]: raw });
    const store = createSaveStore(adapter, schema);
    const result = await store.load();
    expect(result.status).toBe("recovered");
    expect(result.reason).toBe(reason);
    expect(result.data).toEqual({ name: "Player", coins: 0 });
    expect(adapter.entries.get(`${KEY}${BACKUP_SUFFIX}`)).toBe(raw);
    expect(await store.readBackup()).toBe(raw);
  });

  it("reports fromVersion for version-related recoveries", async () => {
    const adapter = createMemoryAdapter({ [KEY]: envelope(9, {}) });
    expect((await createSaveStore(adapter, schema).load()).fromVersion).toBe(9);
  });

  it("treats a throwing parse as invalid data", async () => {
    const adapter = createMemoryAdapter({ [KEY]: envelope(1, {}) });
    const store = createSaveStore(adapter, {
      ...schema,
      version: 1,
      migrations: {},
      parse: () => {
        throw new Error("boom");
      },
    });
    expect((await store.load()).reason).toBe("invalid-data");
  });

  it("survives a failing read and a failing backup write", async () => {
    const base = createMemoryAdapter({ [KEY]: "{oops" });
    const readFails: StorageAdapter = {
      ...base,
      get: async () => {
        throw new Error("nope");
      },
    };
    const store = createSaveStore(readFails, schema);
    expect((await store.load()).reason).toBe("read-failed");
    expect(await store.readBackup()).toBeNull();

    const writeFails: StorageAdapter = {
      ...base,
      set: async () => {
        throw new Error("nope");
      },
    };
    expect((await createSaveStore(writeFails, schema).load()).status).toBe("recovered");
  });

  it("lets the next save replace the corrupt data", async () => {
    const adapter = createMemoryAdapter({ [KEY]: "{oops" });
    const store = createSaveStore(adapter, schema);
    await store.load();
    await store.save({ name: "New", coins: 1 });
    expect((await store.load()).status).toBe("loaded");
  });
});

describe("update, reset and ordering", () => {
  it("update applies a change on top of the current data", async () => {
    const store = createSaveStore(createMemoryAdapter(), schema);
    const next = await store.update((p) => ({ ...p, coins: p.coins + 7 }));
    expect(next.coins).toBe(7);
    expect((await store.load()).data.coins).toBe(7);
  });

  it("serialises concurrent updates so none are lost", async () => {
    const store = createSaveStore(createMemoryAdapter(), schema);
    await Promise.all(
      Array.from({ length: 25 }, () => store.update((p) => ({ ...p, coins: p.coins + 1 }))),
    );
    expect((await store.load()).data.coins).toBe(25);
  });

  it("keeps working after a failed write", async () => {
    const base = createMemoryAdapter();
    let fail = true;
    const flaky: StorageAdapter = {
      ...base,
      set: async (key, value) => {
        if (fail) throw new Error("transient");
        await base.set(key, value);
      },
    };
    const store = createSaveStore(flaky, schema);
    await expect(store.save({ name: "A", coins: 1 })).rejects.toThrow("transient");
    fail = false;
    await store.save({ name: "B", coins: 2 });
    expect((await store.load()).data.name).toBe("B");
  });

  it("reset writes defaults", async () => {
    const store = createSaveStore(createMemoryAdapter(), schema);
    await store.save({ name: "Ada", coins: 99 });
    expect(await store.reset()).toEqual({ name: "Player", coins: 0 });
    expect((await store.load()).data.coins).toBe(0);
  });

  it("exposes key and version", () => {
    const store = createSaveStore(createMemoryAdapter(), schema);
    expect(store.key).toBe(KEY);
    expect(store.version).toBe(3);
  });
});
