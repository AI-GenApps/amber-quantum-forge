import { Hono } from 'hono';
import { db } from '@repo/db';
import { users, auth, deviceRegistrations } from '@repo/db';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, AuthUser } from '../middleware/auth';

const authRoutes = new Hono();

authRoutes.post('/register-device', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    const { fcmToken, deviceInfo } = body;

    if (!fcmToken) {
      return c.json({ error: 'FCM token is required' }, 400);
    }

    const userResults = await db.select().from(users).where(eq(users.email, user.email || '')).limit(1);
    let userRecord = userResults[0] || null;

    if (!userRecord) {
      const [newUser] = await db
        .insert(users)
        .values({
          name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
        })
        .returning();
      userRecord = newUser;
    }

    const authResults = await db.select().from(auth).where(eq(auth.firebaseUid, user.uid)).limit(1);
    let authRecord = authResults[0] || null;

    if (!authRecord) {
      await db.insert(auth).values({
        userId: userRecord.id,
        firebaseUid: user.uid,
        provider: user.provider,
      });
    } else {
      await db
        .update(auth)
        .set({
          provider: user.provider,
          updatedAt: new Date(),
        })
        .where(eq(auth.id, authRecord.id));
    }

    const deviceResults = await db.select().from(deviceRegistrations).where(eq(deviceRegistrations.fcmToken, fcmToken)).limit(1);
    const existingDevice = deviceResults[0] || null;

    if (existingDevice) {
      if (existingDevice.userId !== userRecord.id) {
        await db
          .update(deviceRegistrations)
          .set({
            userId: userRecord.id,
            deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
            updatedAt: new Date(),
          })
          .where(eq(deviceRegistrations.id, existingDevice.id));
      } else {
        await db
          .update(deviceRegistrations)
          .set({
            deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
            updatedAt: new Date(),
          })
          .where(eq(deviceRegistrations.id, existingDevice.id));
      }
    } else {
      await db.insert(deviceRegistrations).values({
        userId: userRecord.id,
        fcmToken,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
      });
    }

    return c.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
      },
    });
  } catch (error) {
    console.error('Device registration error:', error);
    return c.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

authRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;

    const userResults = await db.select().from(users).where(eq(users.email, user.email || '')).limit(1);
    const userRecord = userResults[0] || null;

    if (!userRecord) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

authRoutes.delete('/device/:fcmToken', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const fcmToken = c.req.param('fcmToken');

    if (!fcmToken) {
      return c.json({ error: 'FCM token is required' }, 400);
    }

    const userResults = await db.select().from(users).where(eq(users.email, user.email || '')).limit(1);
    const userRecord = userResults[0] || null;

    if (!userRecord) {
      return c.json({ error: 'User not found' }, 404);
    }

    const deviceResults = await db
      .select()
      .from(deviceRegistrations)
      .where(and(
        eq(deviceRegistrations.fcmToken, fcmToken),
        eq(deviceRegistrations.userId, userRecord.id)
      ))
      .limit(1);
    const device = deviceResults[0] || null;

    if (!device) {
      return c.json({ error: 'Device not found' }, 404);
    }

    await db.delete(deviceRegistrations).where(eq(deviceRegistrations.id, device.id));

    return c.json({ success: true, message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('Device unregistration error:', error);
    return c.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

export default authRoutes;

