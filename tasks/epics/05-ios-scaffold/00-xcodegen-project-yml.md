---
epic: 05-ios-scaffold
task: 00-xcodegen-project-yml
status: pending
depends_on: []
estimate: M
commit_scope: ios
---

# 00 — XcodeGen project.yml

## Goal
Create the `project.yml` file that XcodeGen uses to generate the Xcode project for the iOS app. Two targets: main app and widget extension.

## Context
- iOS app location: `apps-native/ios-app/` (NOT a bun workspace)
- Xcode 26.2, iOS 17 minimum deployment target
- Bundle IDs: App `app.w3dev.starter`, Widget `app.w3dev.starter.widget`
- App Group: `group.app.w3dev.starter`
- XcodeGen installed globally via Homebrew or via `mint` — verify `xcodegen` is available
- Do NOT commit the generated `.xcodeproj` — add to `.gitignore`
- Swift version: 5.10
- Folder structure: `Starter/` (main app sources), `StarterWidget/` (widget sources)

## Implementation Checklist
- [ ] Create `apps-native/ios-app/` directory
- [ ] Create `apps-native/ios-app/project.yml`:
  ```yaml
  name: Starter
  options:
    minimumXcodeVersion: "16.0"
    deploymentTarget:
      iOS: "17.0"
    swift: "5.10"
    groupSortPosition: top
  settings:
    base:
      SWIFT_STRICT_CONCURRENCY: complete
      ENABLE_USER_SCRIPT_SANDBOXING: NO
  targets:
    Starter:
      type: application
      platform: iOS
      bundleIdPrefix: app.w3dev.starter
      sources: Starter/
      settings:
        base:
          PRODUCT_BUNDLE_IDENTIFIER: app.w3dev.starter
          INFOPLIST_FILE: Starter/Info.plist
          CODE_SIGN_ENTITLEMENTS: Starter/Starter.entitlements
      dependencies:
        - package: StarterAuth
        - package: StarterAI
        - package: StarterChat
    StarterWidget:
      type: app-extension
      platform: iOS
      bundleIdPrefix: app.w3dev.starter
      sources: StarterWidget/
      settings:
        base:
          PRODUCT_BUNDLE_IDENTIFIER: app.w3dev.starter.widget
          INFOPLIST_FILE: StarterWidget/Info.plist
          CODE_SIGN_ENTITLEMENTS: StarterWidget/StarterWidget.entitlements
  packages:
    StarterAuth:
      path: ../../plugins/ios/auth
    StarterAI:
      path: ../../plugins/ios/ai
    StarterChat:
      path: ../../plugins/ios/chat-module
  ```
- [ ] Create `apps-native/ios-app/Starter/` directory with empty `.gitkeep`
- [ ] Create `apps-native/ios-app/StarterWidget/` directory with empty `.gitkeep`
- [ ] Add `apps-native/ios-app/*.xcodeproj` and `apps-native/ios-app/*.xcworkspace` to `.gitignore`
- [ ] Document XcodeGen run command in `apps-native/ios-app/README.md`: `xcodegen generate`

## Files Touched
- `apps-native/ios-app/project.yml` — create
- `apps-native/ios-app/Starter/.gitkeep` — create
- `apps-native/ios-app/StarterWidget/.gitkeep` — create
- `.gitignore` — update
- `apps-native/ios-app/README.md` — create

## Verification
- [ ] `xcodegen generate` runs without error from `apps-native/ios-app/`
- [ ] Generated `Starter.xcodeproj` appears (gitignored)
- [ ] `bun run check` exits 0

## Commit
```
feat(ios): add XcodeGen project.yml for Starter app + widget targets [05-ios-scaffold/00]
```
