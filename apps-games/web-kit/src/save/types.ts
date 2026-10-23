/** Async string key-value storage. Capacitor Preferences is async, so the contract is too. */
export interface StorageAdapter {
  readonly name: string;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Turns data saved at version N into data for version N + 1. Must not mutate its input. */
export type Migration = (data: unknown) => unknown;

export interface SaveSchema<T> {
  /** Storage key, namespaced by the game, e.g. `lantern-loops.profile`. */
  readonly key: string;
  /** Current schema version, an integer >= 1. */
  readonly version: number;
  /** Fresh data for a new player and the fallback after corrupt data. */
  readonly defaults: () => T;
  /** Keys are source versions: `migrations[1]` upgrades v1 data to v2. All of 1..version-1 are required. */
  readonly migrations?: Readonly<Record<number, Migration>>;
  /** Checks (and may repair) data at the current version. Return null to reject it as corrupt. */
  readonly parse: (data: unknown) => T | null;
}

export type LoadStatus = "fresh" | "loaded" | "migrated" | "recovered";

export type RecoveryReason =
  | "unreadable"
  | "bad-envelope"
  | "future-version"
  | "migration-failed"
  | "invalid-data"
  | "read-failed";

export interface LoadResult<T> {
  readonly status: LoadStatus;
  readonly data: T;
  /** Version found in storage (absent for fresh and unreadable data). */
  readonly fromVersion?: number;
  /** Why the stored data was discarded; only set when status is `recovered`. */
  readonly reason?: RecoveryReason;
}

export interface SaveEnvelope {
  readonly v: number;
  readonly data: unknown;
}

export interface SaveStore<T> {
  readonly key: string;
  readonly version: number;
  load(): Promise<LoadResult<T>>;
  save(value: T): Promise<void>;
  /** Loads, applies `change` and saves. Calls are serialised with other writes. */
  update(change: (current: T) => T): Promise<T>;
  /** Replaces the save with defaults. */
  reset(): Promise<T>;
  /** Raw text of the last discarded save, kept so support can inspect it. */
  readBackup(): Promise<string | null>;
}
