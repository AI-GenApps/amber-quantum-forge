"use server";

import {
  type AppMetadata,
  CONFIG_PARSERS,
  type ConfigKey,
  type FeatureFlags,
  type MaintenanceMode,
  type StoreUrls,
  type SupportUrls,
  type VersionConfig,
} from "@repo/api/types/config";
import { appConfig, db, eq } from "@repo/db";
import { assertAdmin } from "../../../lib/admin-session";

async function writeKey(
  key: ConfigKey,
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdmin();
  let parsed: unknown;
  try {
    parsed = CONFIG_PARSERS[key](raw);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Validation failed" };
  }
  const existing = await db.select().from(appConfig).where(eq(appConfig.key, key)).limit(1);
  if (existing.length > 0) {
    await db
      .update(appConfig)
      .set({ value: parsed, updatedAt: new Date() })
      .where(eq(appConfig.key, key));
  } else {
    await db.insert(appConfig).values({ key, value: parsed });
  }
  return { ok: true };
}

export async function getAllMetadata(): Promise<AppMetadata> {
  await assertAdmin();
  const rows = await db.select().from(appConfig);
  const result: AppMetadata = {};
  for (const row of rows) {
    const key = row.key as ConfigKey;
    if (!CONFIG_PARSERS[key]) continue;
    try {
      // biome-ignore lint/suspicious/noExplicitAny: parser narrows per key
      (result as any)[key] = CONFIG_PARSERS[key](row.value);
    } catch {
      // skip malformed rows; admin can re-save to fix
    }
  }
  return result;
}

export async function updateVersionConfig(input: VersionConfig) {
  return writeKey("version_config", input);
}

export async function updateFeatureFlags(input: FeatureFlags) {
  return writeKey("feature_flags", input);
}

export async function updateMaintenanceMode(input: MaintenanceMode) {
  return writeKey("maintenance_mode", input);
}

export async function updateStoreUrls(input: StoreUrls) {
  return writeKey("store_urls", input);
}

export async function updateSupportUrls(input: SupportUrls) {
  return writeKey("support_urls", input);
}
