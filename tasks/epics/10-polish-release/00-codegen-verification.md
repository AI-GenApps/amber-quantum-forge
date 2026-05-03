---
epic: 10-polish-release
task: 00-codegen-verification
status: pending
depends_on:
  - 05-ios-scaffold/05
estimate: S
commit_scope: ios
---

# 00 — Codegen verification pass

## Goal
Run `bun run codegen:swift`, verify all three Generated Swift files are correct, and ensure the Xcode build still succeeds after regeneration.

## Context
- Sources that feed codegen may have changed during earlier epics
- This task is a final idempotency check before release
- If any generated file is incorrect: fix the codegen script, not the generated file

## Implementation Checklist
- [ ] Run `bun run codegen:swift`
- [ ] Inspect `apps-native/ios-app/Starter/Generated/AppConfigKeys.swift` — all `ConfigKey` values present
- [ ] Inspect `apps-native/ios-app/Starter/Generated/AnalyticsEvents.swift` — all `AnalyticsEvent` types present
- [ ] Inspect `apps-native/ios-app/Starter/Generated/DesignTokens.swift` — all color tokens present
- [ ] Run `xcodegen generate && xcodebuild -scheme Starter -destination generic/platform=iOS build CODE_SIGNING_REQUIRED=NO` — succeeds
- [ ] Run `bun run codegen:swift` a second time — output identical to first run (idempotent)
- [ ] `bun run check` exits 0
- [ ] Commit generated files if changed

## Files Touched
- `apps-native/ios-app/Starter/Generated/*.swift` — regenerated
- `scripts/codegen-swift.ts` — fix if needed

## Verification
- [ ] `xcodebuild` succeeds after codegen
- [ ] Second codegen run produces no diff
- [ ] `bun run check` exits 0

## Commit
```
chore(ios): regenerate Swift codegen output [10-polish-release/00]
```
