import { Hono } from 'hono';
import { db } from '@repo/db';
import { appConfig } from '@repo/db';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const configRoutes = new Hono();

// Public endpoint — no auth required
configRoutes.get('/app-metadata', async (c) => {
  try {
    const rows = await db.select().from(appConfig);
    const config: Record<string, unknown> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return c.json(config);
  } catch (error) {
    console.error('Error fetching app config:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Protected endpoint — update a config entry
configRoutes.put('/:key', authMiddleware, async (c) => {
  try {
    const key = c.req.param('key');
    const body = await c.req.json();
    const { value } = body;

    if (value === undefined) {
      return c.json({ error: 'value is required' }, 400);
    }

    const existing = await db.select().from(appConfig).where(eq(appConfig.key, key)).limit(1);

    if (existing.length > 0) {
      await db
        .update(appConfig)
        .set({ value, updatedAt: new Date() })
        .where(eq(appConfig.key, key));
    } else {
      await db.insert(appConfig).values({ key, value });
    }

    return c.json({ success: true, key, value });
  } catch (error) {
    console.error('Error updating app config:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default configRoutes;
