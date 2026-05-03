---
epic: 05-ios-scaffold
task: 03-firebase-revenuecat-setup
status: pending
depends_on:
  - 05-ios-scaffold/01
estimate: M
commit_scope: ios
---

# 03 — Firebase and RevenueCat initialization

## Goal
Add Firebase and RevenueCat SDKs to the iOS app and initialize them at startup. `GoogleService-Info.plist` is gitignored; a template is committed.

## Context
- Firebase: `FirebaseApp.configure()` called in `StarterApp.init()` or `AppDelegate`
- RevenueCat: `Purchases.configure(withAPIKey:)` called after Firebase
- `GoogleService-Info.plist`: must NOT be committed (contains API keys) — add to `.gitignore`, commit `GoogleService-Info.plist.template` instead
- RevenueCat SDK: `RevenueCat` via SPM from `https://github.com/RevenueCat/purchases-ios`
- Add RevenueCat to `plugins/ios/auth/Package.swift` OR directly to `project.yml` — choose `project.yml` as it's app-level concern

## Implementation Checklist
- [ ] Add RevenueCat SPM package to `apps-native/ios-app/project.yml` packages section:
  ```yaml
  RevenueCat:
    url: https://github.com/RevenueCat/purchases-ios
    from: "5.0.0"
  ```
- [ ] Add `RevenueCat` to Starter target dependencies in `project.yml`
- [ ] Create `apps-native/ios-app/Starter/StarterApp.swift`:
  - `@main struct StarterApp: App`
  - `init()` calls `FirebaseApp.configure()` then `Purchases.configure(withAPIKey: AppConfig.revenueCatKey)`
  - `body` returns `WindowGroup { ContentView() }`
- [ ] Create `apps-native/ios-app/Starter/AppConfig.swift`:
  - Constants read from `Info.plist` or hardcoded non-secret values
  - `static let revenueCatKey: String` — read from `REVENUECAT_API_KEY` Info.plist entry
- [ ] Create `apps-native/ios-app/Starter/GoogleService-Info.plist.template` with placeholder values
- [ ] Add `apps-native/ios-app/Starter/GoogleService-Info.plist` to `.gitignore`
- [ ] Run `xcodegen generate` — verify project compiles with `xcodebuild -scheme Starter -destination generic/platform=iOS build`

## Files Touched
- `apps-native/ios-app/project.yml` — add RevenueCat package + dependency
- `apps-native/ios-app/Starter/StarterApp.swift` — create
- `apps-native/ios-app/Starter/AppConfig.swift` — create
- `apps-native/ios-app/Starter/GoogleService-Info.plist.template` — create
- `.gitignore` — add GoogleService-Info.plist

## Verification
- [ ] `xcodebuild` build succeeds (may need signing disabled: `CODE_SIGNING_REQUIRED=NO`)
- [ ] `bun run check` exits 0
- [ ] `GoogleService-Info.plist` is in `.gitignore`

## Commit
```
feat(ios): add Firebase and RevenueCat initialization [05-ios-scaffold/03]
```
