import type { StorageAdapter } from "../types";

/** The slice of `Storage` the adapter needs. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Wraps `localStorage` (or any `Storage`). Pass a fake in tests; defaults to the global one. */
export function createLocalStorageAdapter(storage?: StorageLike): StorageAdapter {
  const resolve = (): StorageLike => {
    const target = storage ?? globalThis.localStorage;
    if (!target) throw new Error("localStorage is not available");
    return target;
  };
  return {
    name: "localStorage",
    get: async (key) => resolve().getItem(key),
    set: async (key, value) => {
      resolve().setItem(key, value);
    },
    remove: async (key) => {
      resolve().removeItem(key);
    },
  };
}

/** True when the browser allows reading and writing `localStorage` (private modes can block it). */
export function isLocalStorageUsable(storage?: StorageLike): boolean {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return false;
    const probe = "__wg_probe__";
    target.setItem(probe, "1");
    target.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
