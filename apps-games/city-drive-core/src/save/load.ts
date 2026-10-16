import type { SaveKeys } from "./keys";
import { MIGRATIONS, type MigrationTable, migrateSave } from "./migrations";
import type { SaveStore } from "./store";
import { SAVE_SCHEMA_VERSION, type SaveData } from "./types";
import { parseSave } from "./validate";

export type SaveSource = "main" | "pending" | "backup" | "fresh" | "defaults" | "unreadable";

export interface Loaded {
  data: SaveData;
  source: SaveSource;
  /** True when the data came from an older version or a fallback copy and should be written back. */
  needsWrite: boolean;
  /** Problems that did not stop loading, such as failing to keep a damaged copy. */
  warnings: string[];
}

/** Parse, migrate and validate one stored string. Returns undefined when it is unusable. */
export function decodeSave(
  text: string,
  migrations: MigrationTable = MIGRATIONS,
): { data: SaveData; migrated: boolean } | undefined {
  try {
    const raw: unknown = JSON.parse(text);
    const migrated = migrateSave(raw, migrations, SAVE_SCHEMA_VERSION);
    const from = (raw as { schema_version?: unknown }).schema_version;
    return { data: parseSave(migrated), migrated: from !== SAVE_SCHEMA_VERSION };
  } catch {
    return undefined;
  }
}

async function read(store: SaveStore, key: string): Promise<string | null | "error"> {
  try {
    return await store.get(key);
  } catch {
    return "error";
  }
}

/**
 * Try the saved copy, then the pending copy (a finished write that died before the swap), then the
 * backup. Falls back to defaults and keeps a damaged main file under the corrupt key for diagnosis.
 */
export async function loadSave(
  store: SaveStore,
  keys: SaveKeys,
  fresh: () => SaveData,
  migrations: MigrationTable = MIGRATIONS,
): Promise<Loaded> {
  const order = [
    ["main", keys.main],
    ["pending", keys.pending],
    ["backup", keys.backup],
  ] as const;
  let sawData = false;
  let sawError = false;
  let damagedMain: string | undefined;
  const warnings: string[] = [];
  const keep = async (): Promise<void> => {
    if (damagedMain === undefined) return;
    const problem = await keepDamaged(store, keys, damagedMain);
    if (problem) warnings.push(problem);
  };
  for (const [source, key] of order) {
    const text = await read(store, key);
    if (text === "error") {
      sawError = true;
      continue;
    }
    if (text === null) continue;
    sawData = true;
    const decoded = decodeSave(text, migrations);
    if (decoded) {
      const needsWrite = source !== "main" || decoded.migrated;
      if (source !== "main") await keep();
      return { data: decoded.data, source, needsWrite, warnings };
    }
    if (source === "main") damagedMain = text;
  }
  await keep();
  if (sawError) return { data: fresh(), source: "unreadable", needsWrite: false, warnings };
  const source = sawData ? "defaults" : "fresh";
  return { data: fresh(), source, needsWrite: sawData, warnings };
}

async function keepDamaged(
  store: SaveStore,
  keys: SaveKeys,
  text: string,
): Promise<string | undefined> {
  try {
    await store.set(keys.corrupt, text);
    return undefined;
  } catch (error) {
    return `could not keep the damaged save under ${keys.corrupt}: ${String(error)}`;
  }
}
