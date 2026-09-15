---
epic: 12-repository-hygiene
task: 00-local-artifact-hygiene
status: completed
commit_scope: native
depends_on: []
estimate: S
---

# NativeTabs review and local artifact exclusions

## Context

The Expo app is on SDK 56 with `expo-router` 56.2.14. The existing local tab layout uses `expo-router/unstable-native-tabs`, while the checkout also contains linked Vercel state and an Expo prebuild iOS tree that are not source-controlled product inputs.

## Implementation Checklist

- [x] Preserve the reviewed NativeTabs layout using the installed Expo Router 56 interface.
- [x] Ignore the local `.vercel` linkage directory, including its environment file.
- [x] Ignore the generated `apps/native/ios` CNG and CocoaPods tree without deleting or rewriting local bytes.
- [x] Record the platform and secret-risk review without including secret values.
- [x] Run the repository verification gates and confirm only the approved source files are staged.

## Review Evidence

The installed `expo-router` 56.2.14 declarations expose `NativeTabs`, `NativeTabs.Trigger.Label`, and `NativeTabs.Trigger.Icon`. The icon declaration accepts the reviewed `sf` and `md` combination, and the layout uses valid SF Symbol and Material icon names for Home, Chat, and Profile.

Expo Router 56.2.14 includes a web NativeTabs implementation. It renders accessible text tab triggers and intentionally omits native icons, so the reviewed layout does not require a web-only fallback.

The local `apps/native/ios` tree contains Expo prebuild markers, generated CocoaPods/Xcode files, and ignored build/vendor output. The tracked `app.json` and Firebase config plugin remain the source of truth. The KMP architecture change manifest explicitly excludes existing user-owned Expo/Vercel/iOS generated files.

The local `.vercel` environment file contains secret-bearing variable names for API JWT, database, and Vercel authentication values. No values are included in this task or commit.

## Verification

- `bun run check` — passed; Biome checked 171 files with no fixes.
- `bun run check:ci` — passed; Biome checked 171 files with no fixes.
- `bun run typecheck` — passed; all 7 Turbo tasks succeeded.
- `bun run test` — passed; 6 API suites and 25 tests succeeded.
- `bunx react-doctor@latest --verbose --scope changed` — passed; score 100/100 with no issues.
- `git diff --check` — passed.
- `.vercel` and `apps/native/ios` resolve to root ignore rules; neither directory has staged files.

## Commit

```text
feat(native): use native tabs and ignore local artifacts [12-repository-hygiene/00]
```
