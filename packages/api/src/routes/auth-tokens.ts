import { and, auth, authRefreshTokens, db, eq, gt, isNull, users } from "@repo/db";
import { Hono } from "hono";
import { verifyIdToken } from "../firebase/admin";
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from "../lib/jwt";

const authTokenRoutes = new Hono();

authTokenRoutes.post("/exchange", async (c) => {
  let body: { idToken?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const { idToken } = body;
  if (!idToken || typeof idToken !== "string") {
    return c.json({ error: "idToken is required" }, 400);
  }
  let decoded: Awaited<ReturnType<typeof verifyIdToken>>;
  try {
    decoded = await verifyIdToken(idToken);
  } catch {
    return c.json({ error: "Invalid or expired Firebase ID token" }, 401);
  }
  const uid = decoded.uid;
  const email = decoded.email || null;
  const emailVerified = decoded.email_verified || false;
  const provider = decoded.firebase?.sign_in_provider || "unknown";
  const admin = (decoded as { admin?: unknown }).admin === true;
  const userResults = await db
    .select()
    .from(users)
    .where(eq(users.email, email || ""))
    .limit(1);
  let userRecord = userResults[0] ?? null;
  if (!userRecord) {
    const [newUser] = await db
      .insert(users)
      .values({
        name: decoded.name || email?.split("@")[0] || "User",
        email: email || "",
        profilePictureUrl: decoded.picture || null,
        isAdmin: admin,
      })
      .returning();
    userRecord = newUser;
  } else {
    const [updated] = await db
      .update(users)
      .set({
        name: decoded.name || userRecord.name,
        profilePictureUrl: decoded.picture || userRecord.profilePictureUrl,
        isAdmin: admin,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRecord.id))
      .returning();
    userRecord = updated;
  }
  const authResults = await db.select().from(auth).where(eq(auth.firebaseUid, uid)).limit(1);
  const authRecord = authResults[0] ?? null;
  if (!authRecord) {
    await db.insert(auth).values({ userId: userRecord.id, firebaseUid: uid, provider });
  } else {
    await db
      .update(auth)
      .set({ provider, updatedAt: new Date() })
      .where(eq(auth.id, authRecord.id));
  }
  const rawToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  await db.insert(authRefreshTokens).values({ userId: userRecord.id, tokenHash, expiresAt });
  const accessToken = await signAccessToken({
    sub: uid,
    uid,
    email,
    emailVerified,
    provider,
    admin,
  });
  return c.json({
    accessToken,
    refreshToken: rawToken,
    expiresIn: 21600,
    tokenType: "Bearer",
    user: {
      uid,
      email,
      displayName: decoded.name || null,
      photoURL: decoded.picture || null,
    },
  });
});

authTokenRoutes.post("/refresh", async (c) => {
  let body: { refreshToken?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const { refreshToken } = body;
  if (!refreshToken || typeof refreshToken !== "string") {
    return c.json({ error: "refreshToken is required" }, 400);
  }
  const hash = hashRefreshToken(refreshToken);
  const tokenRows = await db
    .select()
    .from(authRefreshTokens)
    .where(
      and(
        eq(authRefreshTokens.tokenHash, hash),
        isNull(authRefreshTokens.revokedAt),
        gt(authRefreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const tokenRow = tokenRows[0] ?? null;
  if (!tokenRow) {
    return c.json({ error: "Invalid or expired refresh token" }, 401);
  }
  const newRawToken = generateRefreshToken();
  const newHash = hashRefreshToken(newRawToken);
  const newExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  await db
    .update(authRefreshTokens)
    .set({
      tokenHash: newHash,
      rotatedAt: new Date(),
      expiresAt: newExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(authRefreshTokens.id, tokenRow.id));
  const userResults = await db.select().from(users).where(eq(users.id, tokenRow.userId)).limit(1);
  const userRecord = userResults[0] ?? null;
  if (!userRecord) {
    return c.json({ error: "User not found" }, 401);
  }
  const authResults = await db.select().from(auth).where(eq(auth.userId, userRecord.id)).limit(1);
  const authRecord = authResults[0] ?? null;
  const provider = authRecord?.provider || "unknown";
  const accessToken = await signAccessToken({
    sub: userRecord.email,
    uid: userRecord.email,
    email: userRecord.email,
    emailVerified: true,
    provider,
    admin: userRecord.isAdmin,
  });
  return c.json({ accessToken, refreshToken: newRawToken, expiresIn: 21600, tokenType: "Bearer" });
});

authTokenRoutes.post("/revoke", async (c) => {
  let body: { refreshToken?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: true });
  }
  const { refreshToken } = body;
  if (!refreshToken || typeof refreshToken !== "string") {
    return c.json({ success: true });
  }
  const hash = hashRefreshToken(refreshToken);
  await db
    .update(authRefreshTokens)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(authRefreshTokens.tokenHash, hash), isNull(authRefreshTokens.revokedAt)));
  return c.json({ success: true });
});

export { authTokenRoutes };

export async function verifyApiToken(
  authHeader: string | undefined,
): Promise<{ ok: true; payload: Awaited<ReturnType<typeof verifyAccessToken>> } | { ok: false }> {
  if (!authHeader?.startsWith("Bearer ")) return { ok: false };
  try {
    const payload = await verifyAccessToken(authHeader.substring(7));
    return { ok: true, payload };
  } catch {
    return { ok: false };
  }
}
