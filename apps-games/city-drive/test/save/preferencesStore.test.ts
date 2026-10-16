// @vitest-environment happy-dom
import { MemorySaveStore, SaveManager, saveKeys } from "@city-drive/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const capacitor = vi.hoisted(() => ({ native: false }));
const plugin = vi.hoisted(() => ({
  data: new Map<string, string>(),
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => capacitor.native } }));
vi.mock("@capacitor/preferences", () => ({ Preferences: plugin }));

import { PreferencesSaveStore, type StoreDeps } from "../../src/save/preferencesStore";

beforeEach(() => {
  capacitor.native = false;
  plugin.data.clear();
  plugin.get.mockReset().mockImplementation(async ({ key }: { key: string }) => ({
    value: plugin.data.get(key) ?? null,
  }));
  plugin.set
    .mockReset()
    .mockImplementation(async ({ key, value }: { key: string; value: string }) => {
      plugin.data.set(key, value);
    });
  plugin.remove.mockReset().mockImplementation(async ({ key }: { key: string }) => {
    plugin.data.delete(key);
  });
  localStorage.clear();
});

describe("PreferencesSaveStore on the web", () => {
  it("uses localStorage when Capacitor says the platform is not native", async () => {
    const store = new PreferencesSaveStore();
    expect(store.backend).toBe("localStorage");
    expect(await store.get("k")).toBeNull();
    await store.set("k", "v");
    expect(localStorage.getItem("k")).toBe("v");
    expect(await store.get("k")).toBe("v");
    await store.remove("k");
    expect(localStorage.getItem("k")).toBeNull();
    expect(plugin.get).not.toHaveBeenCalled();
    expect(plugin.set).not.toHaveBeenCalled();
  });

  it("reports a blocked or full browser storage with a descriptive error", async () => {
    const deps: StoreDeps = {
      isNative: () => false,
      preferences: plugin,
      storage: () => ({
        getItem: () => {
          throw new Error("SecurityError");
        },
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: () => {},
      }),
    };
    const store = new PreferencesSaveStore(deps);
    await expect(store.get("k")).rejects.toThrow(/could not read saved progress.*SecurityError/);
    await expect(store.set("k", "v")).rejects.toThrow(/could not write.*QuotaExceededError/);
  });

  it("rejects clearly when the browser has no storage at all", async () => {
    const store = new PreferencesSaveStore({
      isNative: () => false,
      preferences: plugin,
      storage: () => undefined,
    });
    await expect(store.get("k")).rejects.toThrow(/browser storage is not available/);
  });
});

describe("PreferencesSaveStore on a device", () => {
  it("uses Capacitor Preferences when the platform is native, never localStorage", async () => {
    capacitor.native = true;
    const store = new PreferencesSaveStore();
    expect(store.backend).toBe("preferences");
    expect(await store.get("k")).toBeNull();
    await store.set("k", "v");
    expect(plugin.set).toHaveBeenCalledWith({ key: "k", value: "v" });
    expect(await store.get("k")).toBe("v");
    await store.remove("k");
    expect(plugin.remove).toHaveBeenCalledWith({ key: "k" });
    expect(await store.get("k")).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("passes plugin failures through", async () => {
    capacitor.native = true;
    plugin.set.mockRejectedValueOnce(new Error("native bridge down"));
    await expect(new PreferencesSaveStore().set("k", "v")).rejects.toThrow("native bridge down");
  });
});

describe("a save manager on top of the store", () => {
  for (const native of [false, true]) {
    it(`round-trips a save (${native ? "preferences" : "localStorage"})`, async () => {
      capacitor.native = native;
      const store = new PreferencesSaveStore();
      const first = new SaveManager(store, { starterCarId: "sedan" });
      await first.load();
      first.commit({ ...first.data, coins: 321 });
      expect(await first.flush()).toBe(true);
      const second = new SaveManager(new PreferencesSaveStore(), { starterCarId: "sedan" });
      await second.load();
      expect(second.data.coins).toBe(321);
      expect(second.notices).toEqual([]);
      const keys = saveKeys();
      expect(await store.get(keys.pending)).toBeNull();
    });
  }

  it("recovers from a damaged localStorage save with a notice", async () => {
    const keys = saveKeys();
    const good = new SaveManager(new PreferencesSaveStore(), { starterCarId: "sedan" });
    await good.load();
    good.commit({ ...good.data, coins: 10 });
    await good.flush();
    good.commit({ ...good.data, coins: 20 });
    await good.flush();
    localStorage.setItem(keys.main, "{broken");
    const manager = new SaveManager(new PreferencesSaveStore(), { starterCarId: "sedan" });
    await manager.load();
    expect(manager.data.coins).toBe(10);
    expect(manager.notices.map((n) => n.kind)).toEqual(["recovered-backup"]);
  });

  it("is interchangeable with the in-memory store", async () => {
    const memory = new SaveManager(new MemorySaveStore(), { starterCarId: "sedan" });
    expect((await memory.load()).source).toBe("fresh");
  });
});
