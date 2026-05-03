---
epic: 03-expo-plugins
task: 00-plugin-expo-auth
status: pending
depends_on:
  - 01-auth-redesign/05-swap-auth-middleware
estimate: M
commit_scope: expo-auth
---

# 00 — @plugin/expo-auth

## Goal

Create the `plugins/expo/auth` package (`@plugin/expo-auth`). This plugin handles the full two-stage auth flow for the Expo app: Firebase Auth (Google + Apple sign-in) → exchange for API JWT → store tokens securely → auto-refresh → expose via `useAuth` hook.

This replaces the current `apps/native/contexts/AuthContext.tsx` pattern with a cleanly packaged, reusable plugin.

## Context

### Current auth flow in apps/native

`apps/native/contexts/AuthContext.tsx` does:
1. Listen to Firebase auth state change
2. On sign-in, call `registerDevice(idToken)` (passes raw Firebase token to `/api/auth/register-device`)
3. Expose `getIdToken()` which returns a raw Firebase ID token

### New auth flow

1. Firebase sign-in (Google or Apple) — same as before
2. On sign-in: call `POST /api/auth/exchange` with Firebase ID token → receive `{ accessToken, refreshToken }`
3. Store `accessToken` and `refreshToken` in `expo-secure-store` (encrypted on-device storage)
4. Expose `getAccessToken()` which:
   - Returns cached `accessToken` if not expired (check JWT `exp` claim)
   - If within 5 minutes of expiry, auto-refresh via `POST /api/auth/refresh`
   - If expired, refresh first, then return new token
5. Also call `POST /api/auth/register-device` with the new API access token (not Firebase token)
6. On sign-out: call `POST /api/auth/revoke` with refresh token, clear secure storage, sign out Firebase

### Secure storage keys

```
AUTH_ACCESS_TOKEN     // the 6h API JWT
AUTH_REFRESH_TOKEN    // the 60-day opaque refresh token
```

### Library requirements

- `expo-secure-store` — already in Expo SDK 55; check if in `apps/native/package.json`. If not, install.
- `@react-native-firebase/auth` — already installed
- `@react-native-google-signin/google-signin` — already installed
- `expo-apple-authentication` — already installed

### Plugin structure

```
plugins/expo/auth/
  package.json          # "@plugin/expo-auth"
  tsconfig.json
  src/
    index.ts            # exports: AuthProvider, useAuth, AuthUser
    AuthProvider.tsx    # React context provider (replaces apps/native/contexts/AuthContext.tsx)
    authStorage.ts      # SecureStore read/write helpers
    tokenUtils.ts       # JWT exp check, refresh logic
    apiClient.ts        # thin fetch wrappers for /auth/exchange, /refresh, /revoke, /register-device
```

## Implementation Checklist

- [ ] Add `plugins/expo/*` to root `package.json` `workspaces` array.
- [ ] Create `plugins/expo/auth/package.json`:
  ```json
  {
    "name": "@plugin/expo-auth",
    "version": "0.0.1",
    "private": true,
    "main": "src/index.ts",
    "peerDependencies": {
      "react": "*",
      "react-native": "*",
      "expo-secure-store": "*",
      "@react-native-firebase/auth": "*"
    }
  }
  ```
- [ ] Create `plugins/expo/auth/tsconfig.json` extending `@repo/typescript-config/base.json`.
- [ ] Implement `src/authStorage.ts`:
  - `saveTokens(accessToken: string, refreshToken: string): Promise<void>`
  - `getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }>`
  - `clearTokens(): Promise<void>`
  - Uses `SecureStore.setItemAsync` / `getItemAsync` / `deleteItemAsync`
- [ ] Implement `src/tokenUtils.ts`:
  - `isTokenExpired(jwt: string): boolean` — decode JWT payload (base64) and check `exp < Date.now() / 1000`
  - `isTokenExpiringSoon(jwt: string, windowSeconds = 300): boolean` — check `exp < Date.now() / 1000 + windowSeconds`
  - Note: do NOT use a JWT library for decoding here — just `JSON.parse(atob(jwt.split('.')[1]))`. Keep it lightweight.
- [ ] Implement `src/apiClient.ts`:
  - `exchangeToken(firebaseIdToken: string, apiBaseUrl: string): Promise<ExchangeResponse>`
  - `refreshToken(refreshToken: string, apiBaseUrl: string): Promise<RefreshResponse>`
  - `revokeToken(refreshToken: string, apiBaseUrl: string): Promise<void>`
  - `registerDevice(apiAccessToken: string, fcmToken: string, deviceInfo: unknown, apiBaseUrl: string): Promise<void>`
  - All use `fetch` directly (no axios in this plugin — keep it dependency-light)
  - `apiBaseUrl` comes from `process.env.EXPO_PUBLIC_API_URL`
- [ ] Implement `src/AuthProvider.tsx` — React context provider:
  - State: `user: AuthUser | null`, `loading: boolean`, `accessToken: string | null`
  - `AuthUser`: `{ uid, email, displayName, photoURL }`
  - On Firebase auth state change: if user signed in, call `exchangeToken()`, save tokens, set state
  - Expose: `useAuth()` hook returning `{ user, loading, signInWithGoogle, signInWithApple, signOut, getAccessToken }`
  - `getAccessToken()`: checks expiry → refreshes if needed → returns current access token
  - `signOut()`: calls `revokeToken()`, clears storage, signs out Firebase
- [ ] Export from `src/index.ts`: `AuthProvider`, `useAuth`, `AuthUser`, `ExchangeResponse`
- [ ] Run `bun install` to register the workspace.

## Files Touched

- `plugins/expo/auth/package.json` — create
- `plugins/expo/auth/tsconfig.json` — create
- `plugins/expo/auth/src/index.ts` — create
- `plugins/expo/auth/src/AuthProvider.tsx` — create
- `plugins/expo/auth/src/authStorage.ts` — create
- `plugins/expo/auth/src/tokenUtils.ts` — create
- `plugins/expo/auth/src/apiClient.ts` — create
- `package.json` (root) — add `plugins/expo/*` to workspaces

## Verification

- [ ] `bun install` exits 0
- [ ] `bun run check` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `isTokenExpired` correctly identifies an expired JWT (test with a manually crafted JWT where `exp` is in the past)
- [ ] `saveTokens` + `getTokens` round-trip works (integration test requires a device/simulator)

## Commit

```
feat(expo-auth): add @plugin/expo-auth with two-stage JWT auth flow [03-expo-plugins/00]
```
