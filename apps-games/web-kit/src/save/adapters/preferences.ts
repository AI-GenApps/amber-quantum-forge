import { Preferences } from "@capacitor/preferences";
import type { StorageAdapter } from "../types";

/** The slice of the Capacitor Preferences plugin the adapter needs. */
export interface PreferencesLike {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
}

/** Capacitor Preferences: native key-value storage on device, localStorage on the web. */
export function createPreferencesAdapter(plugin: PreferencesLike = Preferences): StorageAdapter {
  return {
    name: "preferences",
    get: async (key) => (await plugin.get({ key })).value,
    set: (key, value) => plugin.set({ key, value }),
    remove: (key) => plugin.remove({ key }),
  };
}
