---
epic: 04-expo-app-upgrade
task: 05-onboarding-3-screen
status: pending
depends_on:
  - 04-expo-app-upgrade/04
estimate: L
commit_scope: native
---

# 05 — 3-screen onboarding carousel

## Goal
Build a swipeable 3-screen onboarding flow that shows once (guarded by AsyncStorage flag `onboarding_seen`), then routes to the main tabs.

## Context
- Use React Native's built-in `FlatList` with `horizontal + pagingEnabled` for the carousel (no extra lib)
- 3 screens: Welcome, Features, Get Started
- "Get Started" button on screen 3 sets `onboarding_seen = "true"` in AsyncStorage and navigates to `/(tabs)/`
- Check happens in `apps/native/app/_layout.tsx` before rendering tabs — redirect to `/onboarding` if flag not set
- Route: `apps/native/app/onboarding.tsx` (single file, not a tab)
- Dot indicators below carousel
- Use `ThemedText` and `ThemedView` from task 01
- Use `hapticLight()` on dot/swipe, `hapticSuccess()` on "Get Started" press

## Implementation Checklist
- [ ] Create `apps/native/app/onboarding.tsx` — full onboarding screen
  - `FlatList` horizontal pagingEnabled with 3 slide objects
  - Slide data array: `[{ title, body, emoji }]` for each of the 3 screens
  - Dot indicator row synced to scroll position via `onViewableItemsChanged`
  - "Get Started" button only visible on slide index 2
  - On press: `await AsyncStorage.setItem('onboarding_seen', 'true')` → `router.replace('/(tabs)/')`
- [ ] Create `apps/native/components/onboarding/OnboardingSlide.tsx` — single slide layout
- [ ] Create `apps/native/components/onboarding/DotIndicator.tsx` — row of dots, active dot highlighted
- [ ] Update `apps/native/app/_layout.tsx`:
  - Read `onboarding_seen` from AsyncStorage on mount
  - If not set: `router.replace('/onboarding')`
  - If set: proceed to `/(tabs)/`
  - Show splash/loading state while reading flag
- [ ] Run `bun run check` from repo root — exits 0

## Files Touched
- `apps/native/app/onboarding.tsx` — create
- `apps/native/components/onboarding/OnboardingSlide.tsx` — create
- `apps/native/components/onboarding/DotIndicator.tsx` — create
- `apps/native/app/_layout.tsx` — update (onboarding guard)

## Verification
- [ ] `bun run check` exits 0
- [ ] Fresh app state (clear AsyncStorage) shows onboarding
- [ ] After "Get Started", onboarding does not appear again on next launch
- [ ] No file exceeds 300 lines

## Commit
```
feat(native): add 3-screen onboarding carousel with AsyncStorage guard [04-expo-app-upgrade/05]
```
