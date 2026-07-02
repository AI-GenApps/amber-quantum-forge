# 12 — Flutter App Setup

`apps-native/flutter-app` is a Flutter app that mirrors `apps-native/ios-app` feature-for-feature: onboarding, two-stage Firebase→JWT auth (Google + Apple), streaming AI chat, RevenueCat subscriptions, and config/force-update gating. It targets both Android and iOS.

## Prerequisites

- Flutter SDK 3.24.x (stable channel) — see `.github/workflows/flutter-ci.yml` for the pinned version
- Dart SDK (bundled with Flutter)
- Android Studio / Android SDK for Android builds
- Xcode 26.2+ for iOS builds
- Run `flutter doctor` and resolve any reported issues before continuing

## Bundle identifiers

| Platform | Identifier |
|---|---|
| Android `applicationId` | `app.w3dev.starter` |
| iOS `PRODUCT_BUNDLE_IDENTIFIER` | `app.w3dev.starter` |

These match `apps-native/ios-app`'s bundle ID so the two native surfaces can share the same backend app registration where relevant (e.g. Firebase project).

## Firebase configuration

Firebase config files are **not committed**. Each platform needs its config file placed locally, with a `.template` version committed for reference:

| File | Location | Committed? |
|---|---|---|
| `google-services.json` | `apps-native/flutter-app/android/app/google-services.json` | No (`.template` only) |
| `GoogleService-Info.plist` | `apps-native/flutter-app/ios/Runner/GoogleService-Info.plist` | No (`.template` only) |
| `firebase_options.dart` | `apps-native/flutter-app/lib/firebase_options.dart` | No |

Generate `firebase_options.dart` with the FlutterFire CLI:

```bash
cd apps-native/flutter-app
dart pub global activate flutterfire_cli
flutterfire configure
```

## Environment configuration (`--dart-define`)

The app reads compile-time environment values instead of a `.env` file. Required defines:

| Define | Purpose |
|---|---|
| `API_BASE_URL` | Base URL of the Hono API (e.g. `http://localhost:4001` for local dev against `bun run dev`) |
| `REVENUECAT_API_KEY` | RevenueCat public SDK key for the target platform |

## Running the app

```bash
cd apps-native/flutter-app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:4001 --dart-define=REVENUECAT_API_KEY=your_key
```

## Building

```bash
# Android debug APK
flutter build apk --debug --dart-define=API_BASE_URL=... --dart-define=REVENUECAT_API_KEY=...

# iOS (no codesign, for CI/verification)
flutter build ios --no-codesign --dart-define=API_BASE_URL=... --dart-define=REVENUECAT_API_KEY=...
```

## Architecture

- `lib/core/config/` — `AppConfig` reads `--dart-define` values
- `lib/core/network/` — generic JSON API client, mirrors `APIClient.swift`
- `lib/features/{onboarding,home,profile}/` — thin screens mirroring the iOS `Features/` tree
- `lib/generated/` — codegen output from `bun run codegen:dart` (see `docs-internal/setup/13-flutter-plugins.md`); never edit by hand

## Known gap vs. iOS

The iOS app ships a WidgetKit home-screen widget. Flutter parity deliberately **skips** an equivalent widget for this pass — a Flutter home-screen widget via the `home_widget` package is a reasonable follow-up, not part of this parity work.
