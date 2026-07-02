# 07 — iOS App Setup

## Prerequisites

- Xcode 26.2+ (from Mac App Store)
- XcodeGen: `brew install xcodegen`
- SwiftLint: `brew install swiftlint`
- swift-format: `brew install swift-format`

## Generate Xcode project

The `.xcodeproj` is **not** committed. Generate it from `project.yml`:

```bash
cd apps-native/ios-app
xcodegen generate
```

Run this command whenever `project.yml` or `Package.swift` changes.

## Open in Xcode

```bash
open Starter.xcodeproj
```

## First build

1. Select a simulator target (e.g. iPhone 16)
2. Press ⌘B to build
3. Press ⌘R to run

## Bundle identifiers

| Target | Bundle ID |
|---|---|
| Main app | `app.w3dev.starter` |
| Widget | `app.w3dev.starter.widget` |

## App Group

`group.app.w3dev.starter` — used for sharing data between app and widget via SwiftData.

## Signing

Use **automatic signing** in Xcode for development. Set your team in Project → Signing & Capabilities. For CI/production, configure certificates in EAS or Xcode Cloud.

## Minimum deployment target

iOS 17.0

## Architecture

- SwiftUI views in `Starter/Features/<FeatureName>/Views/`
- Models in `Starter/Core/Models/`
- No UIKit unless absolutely unavoidable
- Never edit `*.xcodeproj` directly — edit `project.yml`, then regenerate
