---
epic: 04-expo-app-upgrade
task: 02-haptics-expo-image
status: pending
depends_on:
  - 04-expo-app-upgrade/01
estimate: S
commit_scope: native
---

# 02 — Add expo-haptics and expo-image

## Goal
Replace React Native's built-in `Image` with `expo-image` (better caching, blurhash support) and add haptic feedback utilities.

## Context
- `expo-image` and `expo-haptics` are Expo SDK packages — install via `bun add` in `apps/native`
- Check `apps/native/package.json` — may already have `expo-haptics` from Expo template
- `expo-image` `Image` component is a drop-in replacement for RN `Image` with same `source` prop
- Create a thin `haptics.ts` utility so call sites don't import expo-haptics directly

## Implementation Checklist
- [ ] Check `apps/native/package.json` for existing `expo-image` and `expo-haptics`
- [ ] Install any missing packages: `bun add expo-image expo-haptics` (skip if already present)
- [ ] Create `apps/native/utils/haptics.ts` exporting:
  - `hapticLight()` → `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
  - `hapticMedium()` → `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`
  - `hapticSuccess()` → `Haptics.notificationAsync(NotificationFeedbackType.Success)`
- [ ] Replace any `import { Image } from 'react-native'` in `apps/native/` with `import { Image } from 'expo-image'`
- [ ] Run `bun run check` from repo root — exits 0

## Files Touched
- `apps/native/package.json` — updated (new deps if missing)
- `apps/native/utils/haptics.ts` — create
- Any files using RN `Image` — update import

## Verification
- [ ] `bun run check` exits 0
- [ ] `apps/native/utils/haptics.ts` has no TypeScript errors
- [ ] No `from 'react-native'` Image imports remain in `apps/native/`

## Commit
```
feat(native): add expo-image, expo-haptics utilities [04-expo-app-upgrade/02]
```
