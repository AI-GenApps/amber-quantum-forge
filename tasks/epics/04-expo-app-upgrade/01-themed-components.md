---
epic: 04-expo-app-upgrade
task: 01-themed-components
status: pending
depends_on:
  - 04-expo-app-upgrade/00
estimate: M
commit_scope: native
---

# 01 — ThemedText, ThemedView, useThemeColor

## Goal
Create reusable themed primitives that respect the device color scheme, replacing raw `Text`/`View` usages across the app.

## Context
- Pattern: `useColorScheme` from `react-native` + a token map
- File limit: 300 lines — keep each component file small
- Place in `apps/native/components/themed/`
- Color tokens: define light/dark pairs for `background`, `surface`, `text`, `textSecondary`, `border`, `primary`
- No external theming library — inline token map only
- Existing `apps/native/components/` — check what already exists before creating

## Implementation Checklist
- [ ] Create `apps/native/components/themed/tokens.ts` — exports `Colors` object with `light` and `dark` keys, each containing the 6 token names above
- [ ] Create `apps/native/components/themed/useThemeColor.ts` — hook accepting `{ light: string; dark: string }` returning the correct value based on `useColorScheme()`
- [ ] Create `apps/native/components/themed/ThemedText.tsx` — wraps `Text`, accepts `variant?: 'body' | 'heading' | 'caption'` prop, applies color from `useThemeColor`
- [ ] Create `apps/native/components/themed/ThemedView.tsx` — wraps `View`, applies background color from `useThemeColor`
- [ ] Create `apps/native/components/themed/index.ts` — re-exports all four above
- [ ] Replace any hardcoded color strings in `apps/native/app/index.tsx` with themed components
- [ ] Run `bun run check` from repo root — exits 0

## Files Touched
- `apps/native/components/themed/tokens.ts` — create
- `apps/native/components/themed/useThemeColor.ts` — create
- `apps/native/components/themed/ThemedText.tsx` — create
- `apps/native/components/themed/ThemedView.tsx` — create
- `apps/native/components/themed/index.ts` — create
- `apps/native/app/index.tsx` — update (use themed components)

## Verification
- [ ] `bun run check` exits 0
- [ ] No file exceeds 300 lines
- [ ] Light/dark mode toggle in Expo dev tools shows correct color swap

## Commit
```
feat(native): add ThemedText, ThemedView, useThemeColor primitives [04-expo-app-upgrade/01]
```
