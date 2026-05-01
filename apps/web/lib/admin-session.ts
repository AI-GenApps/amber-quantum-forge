import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
const ALG = "HS256";
const TTL_SECONDS = 60 * 60; // 1h

export interface AdminSession {
  uid: string;
  email: string | null;
}

function getSecret(): Uint8Array {
  const raw = process.env.ADMIN_SESSION_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set and at least 32 chars long.");
  }
  return new TextEncoder().encode(raw);
}

export function isAllowlistedUid(uid: string): boolean {
  const list = (process.env.ADMIN_UIDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(uid);
}

export async function signAdminSession(payload: AdminSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyAdminSession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    if (typeof payload.uid !== "string") return null;
    return { uid: payload.uid, email: typeof payload.email === "string" ? payload.email : null };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookie = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!cookie) return null;
  return verifyAdminSession(cookie);
}

export async function assertAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized: admin session required");
  return session;
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: TTL_SECONDS,
};
