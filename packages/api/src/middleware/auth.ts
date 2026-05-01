import type { Context, Next } from "hono";
import { verifyIdToken } from "../firebase/admin";

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  provider: string;
  isAdmin: boolean;
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized: Missing or invalid Authorization header" }, 401);
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await verifyIdToken(idToken);

    const provider = decodedToken.firebase?.sign_in_provider || "unknown";

    c.set("user", {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified || false,
      provider,
      isAdmin: (decodedToken as { admin?: unknown }).admin === true,
    });

    await next();
  } catch (error) {
    return c.json(
      {
        error: "Unauthorized: Invalid token",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      401,
    );
  }
};

export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get("user");
  if (!user?.isAdmin) {
    return c.json({ error: "Forbidden: Admin access required" }, 403);
  }
  await next();
};
