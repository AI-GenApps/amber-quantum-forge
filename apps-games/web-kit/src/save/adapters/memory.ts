import type { StorageAdapter } from "../types";

export interface MemoryAdapter extends StorageAdapter {
  /** Raw view for assertions in tests. */
  readonly entries: Map<string, string>;
}

/** In-memory storage for tests and for a web fallback when nothing persistent is allowed. */
export function createMemoryAdapter(initial: Record<string, string> = {}): MemoryAdapter {
  const entries = new Map<string, string>(Object.entries(initial));
  return {
    name: "memory",
    entries,
    get: async (key) => entries.get(key) ?? null,
    set: async (key, value) => {
      entries.set(key, value);
    },
    remove: async (key) => {
      entries.delete(key);
    },
  };
}
