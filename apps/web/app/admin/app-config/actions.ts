"use server";

import { db, appConfig, eq } from "@repo/db";

export async function getAppConfig() {
  try {
    const rows = await db.select().from(appConfig);
    const config: Record<string, unknown> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return { success: true, data: config };
  } catch (error) {
    return { success: false, error: "Failed to fetch app config" };
  }
}

export async function updateAppConfig(key: string, value: unknown) {
  try {
    const existing = await db
      .select()
      .from(appConfig)
      .where(eq(appConfig.key, key))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(appConfig)
        .set({ value, updatedAt: new Date() })
        .where(eq(appConfig.key, key));
    } else {
      await db.insert(appConfig).values({ key, value });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update app config" };
  }
}

export async function deleteAppConfigKey(key: string) {
  try {
    await db.delete(appConfig).where(eq(appConfig.key, key));
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete config key" };
  }
}
