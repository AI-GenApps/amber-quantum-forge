---
epic: 04-expo-app-upgrade
task: 06-wire-auth-plugin
status: pending
depends_on:
  - 04-expo-app-upgrade/04
  - 03-expo-plugins/00
estimate: M
commit_scope: native
---

# 06 — Wire @plugin/expo-auth into the app

## Goal
Replace `apps/native/contexts/AuthContext.tsx` with `@plugin/expo-auth`'s `AuthProvider` and `useAuth`, so the app uses API JWTs instead of raw Firebase ID tokens.

## Context
- `@plugin/expo-auth` is built in epic 03/task 00
- `AuthProvider` from the plugin manages: Firebase sign-in → exchange → JWT storage → refresh
- `useAuth()` exposes: `user`, `signInWithGoogle()`, `signInWithApple()`, `signOut()`, `getAccessToken()`
- The existing `AuthContext.tsx` uses `getIdToken()` returning Firebase token — all callers must be updated
- Search for all `useAuth` / `AuthContext` / `getIdToken` usages in `apps/native/` before replacing
- After wiring: `apps/native/contexts/AuthContext.tsx` is deleted

## Implementation Checklist
- [ ] Audit all files in `apps/native/` importing from `../contexts/AuthContext` or using `getIdToken`
- [ ] Add `@plugin/expo-auth` to `apps/native/package.json` as `"workspace:*"`
- [ ] In `apps/native/app/_layout.tsx`: replace `import { AuthProvider } from '../contexts/AuthContext'` with `import { AuthProvider } from '@plugin/expo-auth'`
- [ ] Update all call sites: replace `getIdToken()` with `getAccessToken()` from `useAuth()`
- [ ] Delete `apps/native/contexts/AuthContext.tsx`
- [ ] Update `apps/native/services/appMetadata.ts` if it uses Firebase token directly
- [ ] Run `bun run check` from repo root — exits 0

## Files Touched
- `apps/native/package.json` — add `@plugin/expo-auth`
- `apps/native/app/_layout.tsx` — swap AuthProvider import
- `apps/native/contexts/AuthContext.tsx` — delete
- Any files calling `getIdToken()` — update to `getAccessToken()`

## Verification
- [ ] `bun run check` exits 0
- [ ] No imports of `../contexts/AuthContext` remain anywhere
- [ ] No calls to `getIdToken()` remain anywhere
- [ ] Sign-in flow works end-to-end in Expo dev mode

## Commit
```
feat(native): replace AuthContext with @plugin/expo-auth [04-expo-app-upgrade/06]
```
