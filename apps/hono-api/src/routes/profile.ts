import { Hono } from 'hono';
import { db } from '@repo/db';
import { users } from '@repo/db';
import { eq } from 'drizzle-orm';
import { authMiddleware, AuthUser } from '../middleware/auth';
import { put, del } from '@vercel/blob';

const profileRoutes = new Hono();

profileRoutes.post('/upload-picture', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400);
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: 'File size must be less than 5MB' }, 400);
    }

    const userResults = await db.select().from(users).where(eq(users.email, user.email || '')).limit(1);
    const userRecord = userResults[0];

    if (!userRecord) {
      return c.json({ error: 'User not found' }, 404);
    }

    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile-pictures/${userRecord.id}-${Date.now()}.${fileExtension}`;

    const blob = await put(fileName, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (userRecord.profilePictureUrl) {
      try {
        await del(userRecord.profilePictureUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (error) {
        console.warn('Failed to delete old profile picture:', error);
      }
    }

    await db
      .update(users)
      .set({
        profilePictureUrl: blob.url,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRecord.id));

    return c.json({
      success: true,
      profilePictureUrl: blob.url,
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return c.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

profileRoutes.delete('/picture', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as AuthUser;

    const userResults = await db.select().from(users).where(eq(users.email, user.email || '')).limit(1);
    const userRecord = userResults[0];

    if (!userRecord) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (!userRecord.profilePictureUrl) {
      return c.json({ error: 'No profile picture to delete' }, 400);
    }

    try {
      await del(userRecord.profilePictureUrl, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (error) {
      console.warn('Failed to delete profile picture from blob storage:', error);
    }

    await db
      .update(users)
      .set({
        profilePictureUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRecord.id));

    return c.json({ success: true, message: 'Profile picture deleted successfully' });
  } catch (error) {
    console.error('Profile picture deletion error:', error);
    return c.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

export default profileRoutes;

