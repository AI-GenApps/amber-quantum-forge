---
epic: 05-ios-scaffold
task: 06-widget-target
status: pending
depends_on:
  - 05-ios-scaffold/02
  - 05-ios-scaffold/04
estimate: M
commit_scope: ios
---

# 06 — Widget extension target

## Goal
Implement a minimal WidgetKit widget that reads shared data from the App Group container and supports the `starter://` deep link scheme for tapping through to the app.

## Context
- Widget target: `StarterWidget` (already in `project.yml`)
- WidgetKit: import `WidgetKit` and `SwiftUI` — no SPM deps needed
- Shared data via `UserDefaults(suiteName: "group.app.w3dev.starter")`
- Widget shows last chat message or a prompt to open the app
- Deep link: tapping widget opens `starter://chat` URL scheme
- Widget entry: `StarterWidgetEntry` with `date` and `lastMessage: String?`

## Implementation Checklist
- [ ] Create `apps-native/ios-app/StarterWidget/StarterWidgetEntry.swift`:
  - `struct StarterWidgetEntry: TimelineEntry { let date: Date; let lastMessage: String? }`
- [ ] Create `apps-native/ios-app/StarterWidget/StarterWidgetProvider.swift`:
  - `struct StarterWidgetProvider: TimelineProvider`
  - Reads `lastMessage` from `UserDefaults(suiteName: "group.app.w3dev.starter")`
  - Returns timeline with single entry, refresh after 1 hour
- [ ] Create `apps-native/ios-app/StarterWidget/StarterWidgetView.swift`:
  - `struct StarterWidgetView: View` showing message or "Tap to start a chat"
  - Wrapped in `Link(destination: URL(string: "starter://chat")!)`
- [ ] Create `apps-native/ios-app/StarterWidget/StarterWidget.swift`:
  - `@main struct StarterWidget: Widget`
  - `kind: "StarterWidget"`, `body: some WidgetConfiguration` using `StaticConfiguration`
  - Supports `.systemSmall` and `.systemMedium` families
- [ ] Ensure main app writes `lastMessage` to shared `UserDefaults` when a chat message is sent (update `Features/Chat` once it exists — add TODO comment referencing this)
- [ ] Run `xcodebuild` for widget target specifically

## Files Touched
- `apps-native/ios-app/StarterWidget/StarterWidgetEntry.swift` — create
- `apps-native/ios-app/StarterWidget/StarterWidgetProvider.swift` — create
- `apps-native/ios-app/StarterWidget/StarterWidgetView.swift` — create
- `apps-native/ios-app/StarterWidget/StarterWidget.swift` — create

## Verification
- [ ] `xcodebuild -scheme StarterWidget -destination generic/platform=iOS build` succeeds
- [ ] Widget previews render in Xcode Canvas
- [ ] `bun run check` exits 0

## Commit
```
feat(ios): add StarterWidget WidgetKit extension with deep link [05-ios-scaffold/06]
```
