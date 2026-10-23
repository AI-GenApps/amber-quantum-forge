export type { DefaultAdapterEnv } from "./adapters/default";
export { createDefaultAdapter } from "./adapters/default";
export type { StorageLike } from "./adapters/local-storage";
export { createLocalStorageAdapter, isLocalStorageUsable } from "./adapters/local-storage";
export type { MemoryAdapter } from "./adapters/memory";
export { createMemoryAdapter } from "./adapters/memory";
export type { PreferencesLike } from "./adapters/preferences";
export { createPreferencesAdapter } from "./adapters/preferences";
export { BACKUP_SUFFIX, createSaveStore, SaveSchemaError } from "./store";
export type {
  LoadResult,
  LoadStatus,
  Migration,
  RecoveryReason,
  SaveEnvelope,
  SaveSchema,
  SaveStore,
  StorageAdapter,
} from "./types";
