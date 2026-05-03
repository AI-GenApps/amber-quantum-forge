---
epic: 05-ios-scaffold
task: 02-bundle-ids-app-group
status: pending
depends_on:
  - 05-ios-scaffold/00
estimate: S
commit_scope: ios
---

# 02 — Bundle IDs, entitlements, Info.plist files

## Goal
Create the entitlements and Info.plist files required by both Starter app and StarterWidget targets, including App Group configuration for shared data.

## Context
- Bundle IDs: App `app.w3dev.starter`, Widget `app.w3dev.starter.widget`
- App Group: `group.app.w3dev.starter` — needed for widget to read shared data
- These files are referenced in `project.yml` via `CODE_SIGN_ENTITLEMENTS` and `INFOPLIST_FILE`
- Info.plist keys required for app: `CFBundleDisplayName`, `CFBundleURLTypes` (for deep link `starter://`), `NSFaceIDUsageDescription`

## Implementation Checklist
- [ ] Create `apps-native/ios-app/Starter/Starter.entitlements`:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
  <dict>
    <key>com.apple.security.application-groups</key>
    <array>
      <string>group.app.w3dev.starter</string>
    </array>
  </dict>
  </plist>
  ```
- [ ] Create `apps-native/ios-app/Starter/Info.plist` with keys:
  - `CFBundleDisplayName`: `Starter`
  - `CFBundleURLTypes`: array with one entry, scheme `starter`
  - `NSFaceIDUsageDescription`: `Used for secure authentication`
- [ ] Create `apps-native/ios-app/StarterWidget/StarterWidget.entitlements` with same App Group entry
- [ ] Create `apps-native/ios-app/StarterWidget/Info.plist` with `NSExtension` key for widget
- [ ] Remove `.gitkeep` files from `Starter/` and `StarterWidget/` now that real files exist

## Files Touched
- `apps-native/ios-app/Starter/Starter.entitlements` — create
- `apps-native/ios-app/Starter/Info.plist` — create
- `apps-native/ios-app/StarterWidget/StarterWidget.entitlements` — create
- `apps-native/ios-app/StarterWidget/Info.plist` — create

## Verification
- [ ] `xcodegen generate` succeeds and both targets have correct entitlements
- [ ] `bun run check` exits 0

## Commit
```
feat(ios): add entitlements and Info.plist for app and widget targets [05-ios-scaffold/02]
```
