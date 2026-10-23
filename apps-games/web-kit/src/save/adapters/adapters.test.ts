import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultAdapter } from "./default";
import { createLocalStorageAdapter, isLocalStorageUsable, type StorageLike } from "./local-storage";
import { createMemoryAdapter } from "./memory";
import { createPreferencesAdapter, type PreferencesLike } from "./preferences";

function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

async function exerciseAdapter(adapter: {
  get(k: string): Promise<string | null>;
  set(k: string, v: string): Promise<void>;
  remove(k: string): Promise<void>;
}): Promise<void> {
  expect(await adapter.get("a")).toBeNull();
  await adapter.set("a", "1");
  expect(await adapter.get("a")).toBe("1");
  await adapter.set("a", "2");
  expect(await adapter.get("a")).toBe("2");
  await adapter.remove("a");
  expect(await adapter.get("a")).toBeNull();
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("memory adapter", () => {
  it("stores, overwrites and removes, and seeds from an object", async () => {
    await exerciseAdapter(createMemoryAdapter());
    expect(await createMemoryAdapter({ x: "y" }).get("x")).toBe("y");
  });
});

describe("localStorage adapter", () => {
  it("works over an injected Storage", async () => {
    const storage = fakeStorage();
    const adapter = createLocalStorageAdapter(storage);
    await exerciseAdapter(adapter);
    await adapter.set("k", "v");
    expect(storage.data.get("k")).toBe("v");
  });

  it("uses the global localStorage by default (happy-dom)", async () => {
    localStorage.clear();
    const adapter = createLocalStorageAdapter();
    await exerciseAdapter(adapter);
    await adapter.set("g", "1");
    expect(localStorage.getItem("g")).toBe("1");
  });

  it("probes whether storage is usable", () => {
    expect(isLocalStorageUsable(fakeStorage())).toBe(true);
    expect(
      isLocalStorageUsable({
        getItem: () => null,
        setItem: () => {
          throw new Error("quota");
        },
        removeItem: () => undefined,
      }),
    ).toBe(false);
  });

  it("rejects when no storage exists", async () => {
    vi.stubGlobal("localStorage", undefined);
    try {
      await expect(createLocalStorageAdapter().get("a")).rejects.toThrow(/not available/);
      expect(isLocalStorageUsable()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("preferences adapter", () => {
  it("maps onto the plugin calls", async () => {
    const data = new Map<string, string>();
    const plugin: PreferencesLike = {
      get: async ({ key }) => ({ value: data.get(key) ?? null }),
      set: async ({ key, value }) => void data.set(key, value),
      remove: async ({ key }) => void data.delete(key),
    };
    await exerciseAdapter(createPreferencesAdapter(plugin));
  });

  it("works with the real plugin web implementation", async () => {
    localStorage.clear();
    await exerciseAdapter(createPreferencesAdapter());
  });
});

describe("default adapter", () => {
  it("picks Preferences on device", () => {
    expect(
      createDefaultAdapter({ isNative: () => true, localStorageUsable: () => true }).name,
    ).toBe("preferences");
  });

  it("picks localStorage on the web", () => {
    expect(
      createDefaultAdapter({ isNative: () => false, localStorageUsable: () => true }).name,
    ).toBe("localStorage");
  });

  it("falls back to memory when storage is blocked", () => {
    expect(
      createDefaultAdapter({ isNative: () => false, localStorageUsable: () => false }).name,
    ).toBe("memory");
  });

  it("uses the real environment by default", () => {
    expect(createDefaultAdapter().name).toBe("localStorage");
  });
});
