---
epic: 04-expo-app-upgrade
task: 03-crashlytics-analytics
status: pending
depends_on:
  - 04-expo-app-upgrade/00
estimate: M
commit_scope: native
---

# 03 — Crashlytics + analytics package scaffold

## Goal
Wire up Firebase Crashlytics in the native app and create a `packages/analytics` stub that both native and web can import for typed event tracking.

## Context
- `@react-native-firebase/crashlytics` is already a peer of `@react-native-firebase/app` — check if installed
- `packages/analytics` follows the same shape as `packages/ai`: private bun workspace, exports a typed `track()` function
- Analytics events are defined as a discriminated union — no stringly-typed event names
- Crashlytics: wrap in `try/catch` at app root error boundary; also call `crashlytics().log()` on navigation events

## Implementation Checklist
- [ ] Check `apps/native/package.json` for `@react-native-firebase/crashlytics`; install if missing
- [ ] Initialize Crashlytics in `apps/native/app/_layout.tsx`: call `crashlytics().setCrashlyticsCollectionEnabled(!__DEV__)` on mount
- [ ] Create `packages/analytics/package.json` — `name: @repo/analytics`, `private: true`, `main: src/index.ts`
- [ ] Create `packages/analytics/tsconfig.json` extending `@repo/typescript-config/base.json`
- [ ] Create `packages/analytics/src/events.ts` — define `AnalyticsEvent` discriminated union with at minimum:
  - `{ type: 'screen_view'; screen: string }`
  - `{ type: 'auth_sign_in'; provider: 'google' | 'apple' }`
  - `{ type: 'auth_sign_out' }`
  - `{ type: 'chat_message_sent'; sessionId: string }`
  - `{ type: 'subscription_started'; productId: string }`
- [ ] Create `packages/analytics/src/index.ts` — exports `track(event: AnalyticsEvent): void` (no-op stub, implementation per platform)
- [ ] Add `@repo/analytics` to `apps/native/package.json` dependencies as `"workspace:*"`
- [ ] Add `packages/analytics` to root `turbo.json` pipeline if present
- [ ] Run `bun run check` from repo root — exits 0

## Files Touched
- `apps/native/package.json` — add `@react-native-firebase/crashlytics`, `@repo/analytics`
- `apps/native/app/_layout.tsx` — Crashlytics init
- `packages/analytics/package.json` — create
- `packages/analytics/tsconfig.json` — create
- `packages/analytics/src/events.ts` — create
- `packages/analytics/src/index.ts` — create

## Verification
- [ ] `bun run check` exits 0
- [ ] `packages/analytics/src/events.ts` — `AnalyticsEvent` is a discriminated union (no `any`)
- [ ] No file exceeds 300 lines

## Commit
```
feat(native): add Crashlytics init and @repo/analytics scaffold [04-expo-app-upgrade/03]
```
