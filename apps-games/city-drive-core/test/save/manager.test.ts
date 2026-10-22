import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEBOUNCE_MS,
  defaultSave,
  MemorySaveStore,
  MIGRATIONS,
  type SaveNotice,
} from "../../src/index";
import { FlakyStore, KEYS, makeManager, v2Fixture } from "./support";

const bump = (coins: number) => ({ ...defaultSave("sedan"), coins });

describe("SaveManager round trip", () => {
  it("starts a new player from defaults without a notice", async () => {
    const { manager } = makeManager(new MemorySaveStore());
    const loaded = await manager.load();
    expect(loaded.source).toBe("fresh");
    expect(manager.data).toEqual(defaultSave("sedan"));
    expect(manager.notices).toEqual([]);
    expect(manager.hasUnsavedChanges).toBe(false);
  });

  it("saves, then a second manager loads the same data", async () => {
    const store = new MemorySaveStore();
    const a = makeManager(store).manager;
    await a.load();
    a.commit(v2Fixture());
    expect(await a.flush()).toBe(true);
    expect(a.hasUnsavedChanges).toBe(false);

    const b = makeManager(store).manager;
    const loaded = await b.load();
    expect(loaded.source).toBe("main");
    expect(b.data).toEqual(v2Fixture());
    expect(b.notices).toEqual([]);
  });

  it("flush with nothing changed writes nothing", async () => {
    const store = new MemorySaveStore();
    const { manager } = makeManager(store);
    await manager.load();
    expect(await manager.flush()).toBe(true);
    expect(store.entries.size).toBe(0);
  });

  it("rejects an invalid commit instead of saving it", async () => {
    const { manager } = makeManager(new MemorySaveStore());
    await manager.load();
    expect(() => manager.commit({ ...defaultSave("sedan"), coins: -5 })).toThrow(/coins/);
    expect(manager.data.coins).toBe(0);
  });
});

describe("debounce", () => {
  it("waits for the timer and restarts it on every change", async () => {
    const store = new MemorySaveStore();
    const { manager, scheduler } = makeManager(store);
    await manager.load();
    manager.commit(bump(1));
    manager.commit(bump(2));
    manager.commit(bump(3));
    expect(scheduler.scheduled).toEqual([
      DEFAULT_DEBOUNCE_MS,
      DEFAULT_DEBOUNCE_MS,
      DEFAULT_DEBOUNCE_MS,
    ]);
    expect(scheduler.cancelled).toBe(2);
    expect(store.entries.size).toBe(0);
    scheduler.fire();
    await manager.flush();
    expect(JSON.parse(store.entries.get(KEYS.main) as string).coins).toBe(3);
  });

  it("uses the configured delay and flush cancels the timer", async () => {
    const store = new MemorySaveStore();
    const { manager, scheduler } = makeManager(store, { debounceMs: 40 });
    await manager.load();
    manager.commit(bump(9));
    expect(scheduler.scheduled).toEqual([40]);
    await manager.flush();
    expect(scheduler.hasPending).toBe(false);
    expect(JSON.parse(store.entries.get(KEYS.main) as string).coins).toBe(9);
  });

  it("dispose cancels the pending write", async () => {
    const store = new MemorySaveStore();
    const { manager, scheduler } = makeManager(store);
    await manager.load();
    manager.commit(bump(4));
    manager.dispose();
    expect(scheduler.hasPending).toBe(false);
    expect(store.entries.size).toBe(0);
  });

  it("changes made during a write are saved by the next one", async () => {
    const store = new FlakyStore();
    const { manager, scheduler } = makeManager(store);
    await manager.load();
    manager.commit(bump(1));
    let changed = false;
    store.onSet = () => {
      if (changed) return;
      changed = true;
      manager.commit(bump(2));
    };
    await manager.flush();
    expect(manager.hasUnsavedChanges).toBe(true);
    expect(scheduler.hasPending).toBe(true);
    await manager.flush();
    expect(JSON.parse(store.entries.get(KEYS.main) as string).coins).toBe(2);
    expect(manager.hasUnsavedChanges).toBe(false);
  });
});

describe("atomic writes", () => {
  async function seeded(): Promise<FlakyStore> {
    const store = new FlakyStore();
    const m = makeManager(store).manager;
    await m.load();
    m.commit(bump(100));
    await m.flush();
    return store;
  }

  it("leaves no pending key after a good write and keeps the previous save as backup", async () => {
    const store = await seeded();
    const { manager } = makeManager(store);
    await manager.load();
    manager.commit(bump(200));
    await manager.flush();
    expect(store.entries.has(KEYS.pending)).toBe(false);
    expect(JSON.parse(store.entries.get(KEYS.main) as string).coins).toBe(200);
    expect(JSON.parse(store.entries.get(KEYS.backup) as string).coins).toBe(100);
  });

  it("a failure at any step never loses the last good save", async () => {
    for (let failAt = 1; failAt <= 3; failAt++) {
      const store = await seeded();
      const { manager } = makeManager(store);
      await manager.load();
      manager.commit(bump(200));
      let sets = 0;
      const original = store.set.bind(store);
      store.set = async (key, value) => {
        sets++;
        if (sets === failAt) throw new Error("power cut");
        await original(key, value);
      };
      const ok = await manager.flush();
      expect(ok).toBe(false);
      const reader = makeManager(store).manager;
      await reader.load();
      expect([100, 200]).toContain(reader.data.coins);
      expect(reader.notices.filter((n) => n.kind === "reset")).toEqual([]);
    }
  });

  it("surfaces a write failure as a notice, keeps the change and retries on the next change", async () => {
    const store = new FlakyStore();
    const seen: SaveNotice[] = [];
    const { manager } = makeManager(store, { onNotice: (n) => seen.push(n) });
    await manager.load();
    manager.commit(bump(5));
    store.failSetAt = 1;
    expect(await manager.flush()).toBe(false);
    expect(seen.map((n) => n.kind)).toEqual(["write-failed"]);
    expect(manager.warnings.join()).toContain("disk full");
    expect(manager.hasUnsavedChanges).toBe(true);
    expect(manager.data.coins).toBe(5);
    store.failSetAt = undefined;
    expect(await manager.flush()).toBe(true);
    expect(JSON.parse(store.entries.get(KEYS.main) as string).coins).toBe(5);
  });
});

describe("corruption recovery", () => {
  async function twoGoodSaves(): Promise<MemorySaveStore> {
    const store = new MemorySaveStore();
    const m = makeManager(store).manager;
    await m.load();
    m.commit(bump(100));
    await m.flush();
    m.commit(bump(200));
    await m.flush();
    return store;
  }

  it("restores the backup when the main save is damaged, with a notice", async () => {
    const store = await twoGoodSaves();
    store.entries.set(KEYS.main, '{"schema_version":1,"coins":2');
    const { manager } = makeManager(store);
    const loaded = await manager.load();
    expect(loaded.source).toBe("backup");
    expect(manager.data.coins).toBe(100);
    expect(manager.notices.map((n) => n.kind)).toEqual(["recovered-backup"]);
    expect(manager.notices[0]?.message.length).toBeGreaterThan(10);
    expect(store.entries.get(KEYS.corrupt)).toBe('{"schema_version":1,"coins":2');
    await manager.flush();
    expect(JSON.parse(store.entries.get(KEYS.main) as string).coins).toBe(100);
  });

  it("prefers a complete pending write over the older backup", async () => {
    const store = await twoGoodSaves();
    store.entries.set(KEYS.pending, JSON.stringify(bump(300)));
    store.entries.set(KEYS.main, "garbage");
    const { manager } = makeManager(store);
    const loaded = await manager.load();
    expect(loaded.source).toBe("pending");
    expect(manager.data.coins).toBe(300);
    expect(manager.notices.map((n) => n.kind)).toEqual(["recovered-pending"]);
  });

  it("falls back to defaults when nothing is usable, and never throws", async () => {
    const store = new MemorySaveStore();
    store.entries.set(KEYS.main, "not json");
    store.entries.set(KEYS.backup, JSON.stringify({ ...bump(1), coins: -1 }));
    const { manager } = makeManager(store);
    const loaded = await manager.load();
    expect(loaded.source).toBe("defaults");
    expect(manager.data).toEqual(defaultSave("sedan"));
    expect(manager.notices.map((n) => n.kind)).toEqual(["reset"]);
    expect(store.entries.get(KEYS.corrupt)).toBe("not json");
  });

  it("ignores a damaged pending copy when main is fine", async () => {
    const store = await twoGoodSaves();
    store.entries.set(KEYS.pending, "{");
    const { manager } = makeManager(store);
    expect((await manager.load()).source).toBe("main");
    expect(manager.data.coins).toBe(200);
    expect(manager.notices).toEqual([]);
  });

  it("treats a save from a newer app as unusable and keeps it for diagnosis", async () => {
    const store = new MemorySaveStore();
    const future = JSON.stringify({ ...v2Fixture(), schema_version: 7 });
    store.entries.set(KEYS.main, future);
    const { manager } = makeManager(store);
    await manager.load();
    expect(manager.notices.map((n) => n.kind)).toEqual(["reset"]);
    expect(store.entries.get(KEYS.corrupt)).toBe(future);
  });

  it("starts fresh with a notice when storage cannot be read at all", async () => {
    const store = new FlakyStore();
    store.failGets = true;
    const { manager } = makeManager(store);
    const loaded = await manager.load();
    expect(loaded.source).toBe("unreadable");
    expect(manager.data).toEqual(defaultSave("sedan"));
    expect(manager.notices.map((n) => n.kind)).toEqual(["read-failed"]);
    expect(manager.hasUnsavedChanges).toBe(false);
  });

  it("migrates an old save on load and writes it back as the current version", async () => {
    const store = new MemorySaveStore();
    store.entries.set(KEYS.main, JSON.stringify({ schema_version: 0, money: 77 }));
    const { manager } = makeManager(store, {
      migrations: {
        0: (raw) => ({
          ...defaultSave("sedan"),
          coins: (raw as { money: number }).money,
        }),
        1: MIGRATIONS[1] as (raw: Record<string, unknown>) => unknown,
      },
    });
    const loaded = await manager.load();
    expect(loaded.source).toBe("main");
    expect(manager.data.coins).toBe(77);
    expect(manager.hasUnsavedChanges).toBe(true);
    await manager.flush();
    expect(JSON.parse(store.entries.get(KEYS.main) as string).schema_version).toBe(2);
    expect(manager.notices).toEqual([]);
  });
});
