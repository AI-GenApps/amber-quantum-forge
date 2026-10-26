import {
  defaultProfile,
  PROFILE_KEY,
  PROFILE_VERSION,
  type Profile,
  sanitizeProfile,
} from "@web-games/dress-rehearsal-core";
import {
  createSaveStore,
  createSettingsStore,
  type SaveSchema,
  type SaveStore,
  type SettingsStore,
  type StorageAdapter,
} from "@web-games/kit";

export const GAME_ID = "dress-rehearsal";

export const profileSchema: SaveSchema<Profile> = {
  key: PROFILE_KEY,
  version: PROFILE_VERSION,
  defaults: defaultProfile,
  migrations: {},
  parse: sanitizeProfile,
};

export function createProfileStore(
  adapter: StorageAdapter,
  schema: SaveSchema<Profile> = profileSchema,
): SaveStore<Profile> {
  return createSaveStore(adapter, schema);
}

export function createGameSettingsStore(adapter: StorageAdapter): SettingsStore {
  return createSettingsStore(adapter, GAME_ID);
}
