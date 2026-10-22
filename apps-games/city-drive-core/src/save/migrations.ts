import { SAVE_SCHEMA_VERSION, SaveCorruptError } from "./types";

/** `migrations[n]` turns a version-n save into a version-n+1 save. Inputs are untrusted JSON. */
export type MigrationTable = Readonly<Record<number, (raw: Record<string, unknown>) => unknown>>;

/** Real migrations. Version 2 adds car upgrades and the daily challenge. */
export const MIGRATIONS: MigrationTable = {
  1: (raw) => ({ ...raw, upgrades: {}, daily: { last_claim_date: null, streak: 0 } }),
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Walk a stored save up to `target`, one version at a time. A save from a newer app, a missing
 * version or a gap in the table is an error, never a guess.
 */
export function migrateSave(
  raw: unknown,
  migrations: MigrationTable = MIGRATIONS,
  target: number = SAVE_SCHEMA_VERSION,
): unknown {
  if (!isRecord(raw)) throw new SaveCorruptError(["save must be a JSON object"]);
  let current: Record<string, unknown> = raw;
  let version = current.schema_version;
  if (!Number.isInteger(version) || (version as number) < 0) {
    throw new SaveCorruptError(["schema_version must be a non-negative integer"]);
  }
  if ((version as number) > target) {
    throw new SaveCorruptError([
      `save is version ${String(version)} but this app reads up to version ${target}`,
    ]);
  }
  while ((version as number) < target) {
    const step = migrations[version as number];
    if (!step) {
      throw new SaveCorruptError([`no migration from version ${String(version)}`]);
    }
    const next = step(current);
    if (!isRecord(next)) {
      throw new SaveCorruptError([`migration from version ${String(version)} returned no object`]);
    }
    current = { ...next, schema_version: (version as number) + 1 };
    version = current.schema_version;
  }
  return current;
}
