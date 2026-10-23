import {
  createSaveStore,
  createSettingsStore,
  type SaveSchema,
  type SaveStore,
  type SettingsStore,
  type StorageAdapter,
} from "@web-games/kit";
import {
  defaultProfile,
  PROFILE_KEY,
  PROFILE_VERSION,
  type Profile,
  sanitizeProfile,
} from "@web-games/lost-parcel-desk-core";
import { GAME_ID } from "./ids";

export { GAME_ID };

export function profileSchema(): SaveSchema<Profile> {
  return {
    key: PROFILE_KEY,
    version: PROFILE_VERSION,
    defaults: defaultProfile,
    migrations: {},
    parse: sanitizeProfile,
  };
}

export function createProfileStore(adapter: StorageAdapter): SaveStore<Profile> {
  return createSaveStore(adapter, profileSchema());
}

export function createGameSettings(adapter: StorageAdapter): SettingsStore {
  return createSettingsStore(adapter, GAME_ID);
}
