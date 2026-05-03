---
epic: 01-auth-redesign
task: 01-jwt-utils-package
status: pending
depends_on:
  - 00-foundations/00-husky-lintstaged
estimate: S
commit_scope: auth
---

# 01 — JWT Utils Package

## Goal

Create `packages/api/src/lib/jwt.ts` — a small, typed module for signing and verifying the API access JWTs. This is the foundation that the exchange, refresh, and middleware tasks all build on.

## Context

### JWT payload structure

```typescript
interface ApiTokenPayload {
  sub: string;        // Firebase UID
  uid: string;        // alias for sub (convenience)
  email: string | null;
  emailVerified: boolean;
  provider: string;   // "google.com" | "apple.com" | "password"
  admin: boolean;     // from Firebase custom claim
  iat: number;        // issued at (set by JWT library)
  exp: number;        // expiry (set by JWT library)
}
```

### Token config

- **Algorithm**: `HS256` (symmetric, fast, sufficient for this use case)
- **Access token TTL**: `6h` (6 hours)
- **Secret**: `process.env.API_JWT_SECRET` — must be validated at module load time

### Library to use

Use `jose` (the standard JOSE/JWT library for modern JS/TS). Check if it's already in `packages/api/package.json`. If not, install it:
```bash
bun add jose --filter @repo/api
```

`jose` is preferred over `jsonwebtoken` because it's ESM-native, has zero native dependencies, and works in both Node and edge runtimes.

### Refresh token generation

The refresh token is an opaque 32-byte random hex string. Generate it with `crypto.randomBytes(32).toString('hex')` (Node built-in). Hash it with SHA-256 before storing: `crypto.createHash('sha256').update(token).digest('hex')`.

## Implementation Checklist

- [ ] Check if `jose` is in `packages/api/package.json`. If not: `bun add jose --filter @repo/api`
- [ ] Create `packages/api/src/lib/jwt.ts`:

  ```typescript
  import { SignJWT, jwtVerify } from "jose";
  import { createHash, randomBytes } from "node:crypto";

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
  ```

- [ ] Create `packages/api/src/lib/index.ts` that re-exports from `jwt.ts`:
  ```typescript
  export * from "./jwt";
  ```
  (Or add to existing lib index if one exists)

- [ ] Add a unit test file `packages/api/src/lib/__tests__/jwt.test.ts`:
  ```typescript
  import { expect, test, beforeAll } from "bun:test";
  import { signAccessToken, verifyAccessToken, generateRefreshToken, hashRefreshToken } from "../jwt";

  beforeAll(() => {
    process.env.API_JWT_SECRET = "test-secret-that-is-at-least-32-chars-long-for-test";
  });

  test("signs and verifies access token", async () => {
    const payload = { sub: "uid123", uid: "uid123", email: "a@b.com", emailVerified: true, provider: "google.com", admin: false };
    const token = await signAccessToken(payload);
    const verified = await verifyAccessToken(token);
    expect(verified.uid).toBe("uid123");
    expect(verified.admin).toBe(false);
  });

  test("generateRefreshToken returns 64-char hex string", () => {
    const token = generateRefreshToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  test("hashRefreshToken is deterministic", () => {
    const token = "abc123";
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
  });
  ```

## Files Touched

- `packages/api/src/lib/jwt.ts` — create
- `packages/api/src/lib/index.ts` — create or update
- `packages/api/src/lib/__tests__/jwt.test.ts` — create
- `packages/api/package.json` — may add `jose` dependency

## Verification

- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run test` runs the JWT tests and they pass
- [ ] `API_JWT_SECRET` missing → module throws on load (test this manually if possible)

## Commit

```
feat(auth): add JWT sign/verify utils and refresh token helpers [01-auth-redesign/01]
```
