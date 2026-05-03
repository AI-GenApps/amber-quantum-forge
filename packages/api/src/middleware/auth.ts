import type { Context, Next } from "hono";
import { verifyAccessToken } from "../lib/jwt";

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
    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    c.set("user", {
      uid: payload.uid,
      email: payload.email,
      emailVerified: payload.emailVerified,
      provider: payload.provider,
      isAdmin: payload.admin,
    });
    await next();
  } catch {
    return c.json({ error: "Unauthorized: Invalid or expired API token" }, 401);
  }
};

export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get("user");
  if (!user?.isAdmin) {
    return c.json({ error: "Forbidden: Admin access required" }, 403);
  }
  await next();
};
