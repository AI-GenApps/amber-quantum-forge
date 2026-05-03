---
epic: 05-ios-scaffold
task: 04-core-features-folders
status: pending
depends_on:
  - 05-ios-scaffold/03
estimate: M
commit_scope: ios
---

# 04 — Core/Features/Resources/Generated folder structure

## Goal
Establish the canonical source folder structure inside `apps-native/ios-app/Starter/` and create the minimum required Swift files in each group.

## Context
- Structure mirrors MVVM + feature-folder conventions
- `Core/` — app-wide utilities, extensions, design tokens
- `Features/` — one subfolder per feature (Auth, Chat, Home, Profile, Onboarding)
- `Resources/` — assets, localizable strings
- `Generated/` — output of codegen script (task 05); do NOT hand-edit
- Each feature folder has: `View.swift`, `ViewModel.swift`, `Model.swift` as needed

## Implementation Checklist
- [ ] Create folder scaffolding under `apps-native/ios-app/Starter/`:
  ```
  Core/
    Extensions/
      Color+Tokens.swift      # Color extension mapping design tokens
      View+Haptics.swift      # View extension adding .hapticFeedback() modifier
    Network/
      APIClient.swift         # Base URLSession wrapper (no auth yet — that's epic 06)
  Features/
    Home/
      HomeView.swift          # Placeholder SwiftUI view
    Profile/
      ProfileView.swift       # Placeholder showing user email
    Onboarding/
      OnboardingView.swift    # 3-screen TabView carousel
      OnboardingViewModel.swift
  Resources/
    Assets.xcassets/          # (XcodeGen handles this)
    Localizable.strings       # Empty placeholder
  Generated/
    .gitkeep                  # Will be populated by codegen script
  ```
- [ ] Implement `Core/Extensions/Color+Tokens.swift` with static colors mirroring `packages/ui` tokens
- [ ] Implement `Core/Extensions/View+Haptics.swift` with `.hapticImpact(_ style: UIImpactFeedbackGenerator.FeedbackStyle)` ViewModifier
- [ ] Implement `Core/Network/APIClient.swift` stub: `class APIClient` with `baseURL` property and `func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T`
- [ ] Implement `Features/Onboarding/OnboardingView.swift`: TabView with 3 pages, "Get Started" button on last page that calls `viewModel.completeOnboarding()`
- [ ] Implement `Features/Onboarding/OnboardingViewModel.swift`: `@Observable class` with `func completeOnboarding()` storing `UserDefaults` flag and publishing navigation
- [ ] All other Feature views: minimal `struct XxxView: View { var body: some View { Text("TODO") } }`
- [ ] Update `StarterApp.swift` body to use `OnboardingView` or `HomeView` based on UserDefaults flag

## Files Touched
- `apps-native/ios-app/Starter/Core/Extensions/Color+Tokens.swift` — create
- `apps-native/ios-app/Starter/Core/Extensions/View+Haptics.swift` — create
- `apps-native/ios-app/Starter/Core/Network/APIClient.swift` — create
- `apps-native/ios-app/Starter/Features/Home/HomeView.swift` — create
- `apps-native/ios-app/Starter/Features/Profile/ProfileView.swift` — create
- `apps-native/ios-app/Starter/Features/Onboarding/OnboardingView.swift` — create
- `apps-native/ios-app/Starter/Features/Onboarding/OnboardingViewModel.swift` — create
- `apps-native/ios-app/Starter/Resources/Localizable.strings` — create
- `apps-native/ios-app/Starter/Generated/.gitkeep` — create
- `apps-native/ios-app/Starter/StarterApp.swift` — update

## Verification
- [ ] `xcodebuild` build succeeds
- [ ] No Swift compiler warnings for files in scope
- [ ] `bun run check` exits 0

## Commit
```
feat(ios): scaffold Core/Features/Resources/Generated folder structure [05-ios-scaffold/04]
```
