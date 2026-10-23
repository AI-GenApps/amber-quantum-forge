import { createSaveStore, type SaveStore, type StorageAdapter } from "@web-games/kit";

export const FLAGS_KEY = "lantern-loops.ui";
export const FLAGS_VERSION = 1;

/** One-time UI hints that are not part of the progression profile. */
export interface UiFlags {
  coachSeen: string[];
}

export function parseFlags(data: unknown): UiFlags | null {
  if (typeof data !== "object" || data === null) return null;
  const seen = (data as { coachSeen?: unknown }).coachSeen;
  if (seen === undefined) return { coachSeen: [] };
  if (!Array.isArray(seen) || !seen.every((item) => typeof item === "string")) return null;
  return { coachSeen: [...(seen as string[])] };
}

export interface FlagsStore {
  store: SaveStore<UiFlags>;
  hasSeen(id: string): Promise<boolean>;
  markSeen(id: string): Promise<void>;
  clear(): Promise<void>;
}

export function createFlagsStore(adapter: StorageAdapter): FlagsStore {
  const store = createSaveStore<UiFlags>(adapter, {
    key: FLAGS_KEY,
    version: FLAGS_VERSION,
    defaults: () => ({ coachSeen: [] }),
    parse: parseFlags,
  });
  return {
    store,
    hasSeen: async (id) => (await store.load()).data.coachSeen.includes(id),
    async markSeen(id) {
      await store.update((flags) =>
        flags.coachSeen.includes(id) ? flags : { coachSeen: [...flags.coachSeen, id] },
      );
    },
    clear: async () => {
      await store.reset();
    },
  };
}
