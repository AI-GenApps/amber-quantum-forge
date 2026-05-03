---
epic: 04-expo-app-upgrade
task: 04-tabs-layout
status: pending
depends_on:
  - 04-expo-app-upgrade/01
  - 04-expo-app-upgrade/02
estimate: M
commit_scope: native
---

# 04 — Tabs navigation layout

## Goal
Upgrade `apps/native/app/_layout.tsx` to a tab-based navigation with Home, Chat, and Profile tabs using expo-router's `Tabs` component.

## Context
- expo-router v3 is used (check `apps/native/package.json` for version)
- Tab structure:
  - `(tabs)/index.tsx` — Home tab
  - `(tabs)/chat.tsx` — Chat tab (placeholder until task 07)
  - `(tabs)/profile.tsx` — Profile tab
- Tab icons: use `@expo/vector-icons` (Ionicons) — check if already installed
- The existing `apps/native/app/index.tsx` content moves to `apps/native/app/(tabs)/index.tsx`
- Keep non-tab screens (`plans`, etc.) outside the `(tabs)` group

## Implementation Checklist
- [ ] Create `apps/native/app/(tabs)/_layout.tsx` with `<Tabs>` containing three `<Tabs.Screen>` entries: `index`, `chat`, `profile`
- [ ] Move `apps/native/app/index.tsx` → `apps/native/app/(tabs)/index.tsx` (keep content)
- [ ] Create `apps/native/app/(tabs)/chat.tsx` — placeholder `ThemedView` + `ThemedText` "Chat coming soon"
- [ ] Create `apps/native/app/(tabs)/profile.tsx` — show user email from auth context, sign-out button
- [ ] Update `apps/native/app/_layout.tsx` root layout to ensure `(tabs)` group is the default route after auth
- [ ] Add tab bar icons using Ionicons: `home`, `chatbubble`, `person`
- [ ] Run `bun run check` from repo root — exits 0

## Files Touched
- `apps/native/app/(tabs)/_layout.tsx` — create
- `apps/native/app/(tabs)/index.tsx` — create (moved from `app/index.tsx`)
- `apps/native/app/(tabs)/chat.tsx` — create
- `apps/native/app/(tabs)/profile.tsx` — create
- `apps/native/app/index.tsx` — delete or redirect
- `apps/native/app/_layout.tsx` — update root routing logic

## Verification
- [ ] `bun run check` exits 0
- [ ] Three tabs visible in Expo dev mode
- [ ] `plans` screen still reachable via `router.push('/plans')`
- [ ] No file exceeds 300 lines

## Commit
```
feat(native): add tabs layout with Home, Chat, Profile screens [04-expo-app-upgrade/04]
```
