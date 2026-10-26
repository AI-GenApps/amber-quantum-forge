import {
  createProfile,
  PROFILE_VERSION,
  type Profile,
  sanitizeProfile,
} from "@web-games/cloud-observatory-core";
import {
  createSaveStore,
  type Migration,
  type SaveStore,
  type StorageAdapter,
} from "@web-games/kit";

export const PROFILE_KEY = "cloud-observatory.profile";

export const PROFILE_MIGRATIONS: Readonly<Record<number, Migration>> = {};

export interface ProfileStoreOptions {
  readonly now?: () => number;
  readonly version?: number;
  readonly migrations?: Readonly<Record<number, Migration>>;
  readonly parse?: (data: unknown) => Profile | null;
}

export function createProfileStore(
  adapter: StorageAdapter,
  options: ProfileStoreOptions = {},
): SaveStore<Profile> {
  const now = options.now ?? (() => Date.now());
  return createSaveStore<Profile>(adapter, {
    key: PROFILE_KEY,
    version: options.version ?? PROFILE_VERSION,
    defaults: () => createProfile(now()),
    migrations: options.migrations ?? PROFILE_MIGRATIONS,
    parse: options.parse ?? ((data) => sanitizeProfile(data)),
  });
}
