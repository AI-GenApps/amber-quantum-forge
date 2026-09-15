import { appConfig, db, eq } from "@repo/db";
import { Hono } from "hono";
import { authMiddleware, requireAdmin } from "../middleware/auth";
import { CONFIG_KEYS, CONFIG_PARSERS, type ConfigKey } from "../types/config";

const configRoutes = new Hono();

function isConfigKey(value: unknown): value is ConfigKey {
  return typeof value === "string" && CONFIG_KEYS.includes(value as ConfigKey);
}

// Public endpoint — no auth required
configRoutes.get("/app-metadata", async (c) => {
  try {
    const rows = await db.select().from(appConfig);
    const config: Record<string, unknown> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return c.json(config);
  } catch (error) {
    console.error("Error fetching app config:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Admin-only — update a config entry
configRoutes.put("/:key", authMiddleware, requireAdmin, async (c) => {
  try {
    const key = c.req.param("key");
    if (!isConfigKey(key)) {
      return c.json({ error: `Unknown config key: ${key}` }, 400);
    }

    const body = await c.req.json();
    const { value } = body;
    if (value === undefined) {
      return c.json({ error: "value is required" }, 400);
    }

    let parsed: unknown;
    try {
      parsed = CONFIG_PARSERS[key](value);
    } catch (err) {
      return c.json(
        {
          error: "Invalid value",
          message: err instanceof Error ? err.message : "Validation failed",
        },
        400,
      );
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

    return c.json({ success: true, key, value: parsed });
  } catch (error) {
    console.error("Error updating app config:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default configRoutes;
