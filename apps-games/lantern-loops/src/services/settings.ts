import { createSettingsStore, type SettingsStore, type StorageAdapter } from "@web-games/kit";
import { GAME_ID } from "./daily";

/** Kit settings (sound, music, haptics, reduced motion, high contrast) under `lantern-loops.settings`. */
export function createGameSettings(adapter: StorageAdapter): SettingsStore {
  return createSettingsStore(adapter, GAME_ID);
}
