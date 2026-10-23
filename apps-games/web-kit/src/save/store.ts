import type {
  LoadResult,
  RecoveryReason,
  SaveEnvelope,
  SaveSchema,
  SaveStore,
  StorageAdapter,
} from "./types";

export const BACKUP_SUFFIX = ".corrupt";

export class SaveSchemaError extends Error {}

function validateSchema<T>(schema: SaveSchema<T>): void {
  if (!Number.isInteger(schema.version) || schema.version < 1) {
    throw new SaveSchemaError(`${schema.key}: version must be an integer >= 1`);
  }
  for (let from = 1; from < schema.version; from += 1) {
    if (typeof schema.migrations?.[from] !== "function") {
      throw new SaveSchemaError(`${schema.key}: missing migration from v${from} to v${from + 1}`);
    }
  }
}

function readEnvelope(raw: string): SaveEnvelope | RecoveryReason {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "unreadable";
  }
  if (typeof parsed !== "object" || parsed === null) return "bad-envelope";
  const env = parsed as { v?: unknown; data?: unknown };
  if (typeof env.v !== "number" || !Number.isInteger(env.v) || env.v < 1 || !("data" in env)) {
    return "bad-envelope";
  }
  return { v: env.v, data: env.data };
}

function migrate<T>(schema: SaveSchema<T>, env: SaveEnvelope): unknown {
  let data = env.data;
  for (let from = env.v; from < schema.version; from += 1) {
    const step = schema.migrations?.[from];
    if (!step) throw new SaveSchemaError(`${schema.key}: missing migration from v${from}`);
    data = step(data);
  }
  return data;
}

/**
 * Versioned save slot over a `StorageAdapter`. Never throws on bad stored data: corrupt,
 * unreadable or too-new saves are copied to a backup key and replaced by defaults.
 */
export function createSaveStore<T>(adapter: StorageAdapter, schema: SaveSchema<T>): SaveStore<T> {
  validateSchema(schema);
  const backupKey = `${schema.key}${BACKUP_SUFFIX}`;
  let queue: Promise<unknown> = Promise.resolve();

  const enqueue = <R>(task: () => Promise<R>): Promise<R> => {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  };

  const write = (value: T): Promise<void> => {
    const envelope: SaveEnvelope = { v: schema.version, data: value };
    return adapter.set(schema.key, JSON.stringify(envelope));
  };

  const recover = async (
    raw: string,
    reason: RecoveryReason,
    fromVersion?: number,
  ): Promise<LoadResult<T>> => {
    try {
      await adapter.set(backupKey, raw);
    } catch {
      // The backup is best effort; recovery still has to succeed.
    }
    const result: LoadResult<T> = { status: "recovered", data: schema.defaults(), reason };
    return fromVersion === undefined ? result : { ...result, fromVersion };
  };

  const loadNow = async (): Promise<LoadResult<T>> => {
    let raw: string | null;
    try {
      raw = await adapter.get(schema.key);
    } catch {
      return { status: "recovered", data: schema.defaults(), reason: "read-failed" };
    }
    if (raw === null) return { status: "fresh", data: schema.defaults() };

    const env = readEnvelope(raw);
    if (typeof env === "string") return recover(raw, env);
    if (env.v > schema.version) return recover(raw, "future-version", env.v);

    let data: unknown;
    try {
      data = migrate(schema, env);
    } catch {
      return recover(raw, "migration-failed", env.v);
    }
    let parsed: T | null;
    try {
      parsed = schema.parse(data);
    } catch {
      parsed = null;
    }
    if (parsed === null) return recover(raw, "invalid-data", env.v);

    const migrated = env.v < schema.version;
    if (migrated) {
      try {
        await write(parsed);
      } catch {
        // Keep the in-memory result; the next save writes the upgraded data.
      }
    }
    return { status: migrated ? "migrated" : "loaded", data: parsed, fromVersion: env.v };
  };

  return {
    key: schema.key,
    version: schema.version,
    load: () => enqueue(loadNow),
    save: (value) => enqueue(() => write(value)),
    update: (change) =>
      enqueue(async () => {
        const { data } = await loadNow();
        const next = change(data);
        await write(next);
        return next;
      }),
    reset: () =>
      enqueue(async () => {
        const fresh = schema.defaults();
        await write(fresh);
        return fresh;
      }),
    readBackup: () => adapter.get(backupKey).catch(() => null),
  };
}
