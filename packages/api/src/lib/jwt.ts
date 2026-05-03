import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

const secret = process.env.API_JWT_SECRET;
if (!secret) throw new Error("API_JWT_SECRET env var is required");
const encodedSecret = new TextEncoder().encode(secret);

export interface ApiTokenPayload {
  sub: string;
  uid: string;
  email: string | null;
  emailVerified: boolean;
  provider: string;
  admin: boolean;
}

export async function signAccessToken(payload: ApiTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("6h")
    .sign(encodedSecret);
}

export async function verifyAccessToken(token: string): Promise<ApiTokenPayload> {
  const { payload } = await jwtVerify(token, encodedSecret);
  return payload as unknown as ApiTokenPayload;
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
