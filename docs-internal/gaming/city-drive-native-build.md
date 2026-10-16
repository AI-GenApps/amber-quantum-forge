---
title: City Drive native build
description: How City Drive is packaged for Android and iOS with Capacitor 8, the Android toolchain under /data/tools, and what is left for signing.
---

# City Drive native build

City Drive (working title) is a Babylon.js web game. Capacitor 8 wraps the
Vite build (`apps-games/city-drive/dist`) as native Android and iOS projects.
The same build also runs in desktop and mobile browsers, where every native
feature below is a no-op.

## Commands

Run from the repo root.

| Command | What it does |
|---|---|
| `bun run city-drive:build` | Web build only. |
| `bun run city-drive:cap:sync` | `vite build`, then `cap sync` for Android, iOS and web. Works on Linux. |
| `bun run city-drive:android:debug` | Preflight, `vite build`, `cap sync android`, then `./gradlew assembleDebug`. Prints the APK path and size. |

`android:debug` exports `JAVA_HOME=/data/tools/jdk21` and
`ANDROID_HOME=/data/tools/android-sdk` itself. It never accepts SDK licences.
When they are missing it exits with code 2 and prints the human command.
Once licences are accepted it installs the missing SDK packages
(`platform-tools`, `platforms;android-36`, `build-tools;36.0.0`) on its own.

Use `bunx cap ...` from `apps-games/city-drive`, never `npx`.

## Project identity and decisions

| Item | Value |
|---|---|
| `appId` | `app.w3dev.citydrive` (task 20 renames the app, not the id) |
| Debug build | `app.w3dev.citydrive.debug` (Gradle `applicationIdSuffix` in the `debug` build type) |
| `webDir` | `dist`. No `server.url`, no live reload in the committed config. |
| Android | minSdk 24, targetSdk and compileSdk 36 (Capacitor 8 defaults), Gradle 8.14.3 from the wrapper |
| `android.minWebViewVersion` | 105. WebGL2, WebAssembly and the ES2022 build target need a modern WebView (class static blocks need Chrome 94). |
| iOS deployment target | **iOS 15** (Capacitor 8 default, `.iOS(.v15)` in `CapApp-SPM`). Rapier compat needs no wasm SIMD and Babylon needs WebGL2, which WKWebView has had since iOS 15. Not measured on a device; raise it to 16.4 only if a device test shows a need. |
| iOS package manager | Swift Package Manager (Capacitor 8 default) |
| Orientation | Android `android:screenOrientation="sensorLandscape"`; iOS `UISupportedInterfaceOrientations` (iPhone and iPad) landscape left and right only. The `@capacitor/screen-orientation` plugin also locks landscape at start. |

Capacitor packages are exact-pinned: `@capacitor/core`, `cli`, `android`, `ios`
8.5.3; `app` 8.1.2; `haptics` 8.0.2; `preferences` 8.0.1; `screen-orientation`
8.0.2; `status-bar` 8.0.4; `@capacitor-community/keep-awake` 8.0.1.

The `android/` and `ios/` folders are committed. Their build outputs
(`build/`, `.gradle/`, `app/src/main/assets/public`, `ios/App/App/public`,
generated `capacitor.config.json`) are git-ignored by the generated
`.gitignore` files.

`ios/App/CapApp-SPM/Package.swift` is written by `cap sync`. It points at
plugin folders inside `node_modules/.bun/...`; rerun `bun install` and
`bun run city-drive:cap:sync` on the Mac before building if a path changes.

## App lifecycle (src/native)

Everything goes through small interfaces in `apps-games/city-drive/src/native`
so tests use mocks and the web build never loads a plugin.

| Feature | Device | Web |
|---|---|---|
| Pause and resume | `@capacitor/app` `pause` and `resume` events | page visibility and `pagehide` |
| On pause | the game pauses (the pause menu opens over a drive), the save is flushed and the audio context is suspended | same |
| On resume | audio resumes and the pause menu is still showing | same |
| Back button | `@capacitor/app` `backButton` goes to the UI navigator; on the home screen an exit confirmation opens, and a second back press closes it | Escape key |
| Keep awake | `@capacitor-community/keep-awake` while the drive is running (not in menus, pause or loading) | no-op |
| Landscape lock and status bar | `@capacitor/screen-orientation` lock, `@capacitor/status-bar` hide, re-applied on resume | no-op |

## Android toolchain (this server)

Everything lives under `/data/tools`; nothing is installed system-wide.

| Tool | Location | Source | SHA-256 | Date |
|---|---|---|---|---|
| Temurin JDK 21.0.12.1+1 | `/data/tools/jdk21` | `https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jdk_x64_linux_hotspot_21.0.12.1_1.tar.gz` | `ce79869e1307ed8ee1e2baa86a412b1eb5b75d10a01006d788a6f968bcfaee94` (matches the Adoptium API) | 2026-10-16 |
| Android command-line tools 22.0 | `/data/tools/android-sdk/cmdline-tools/latest` | `https://dl.google.com/android/repository/commandlinetools-linux-15859902_latest.zip` | `4e4c464f145a7512b57d088ac6c278c03c9eea610886b35a5e0804e74eedf583` (matches developer.android.com/studio) | 2026-10-16 |

Gradle caches go to `/data/tools/cache/gradle` (`GRADLE_USER_HOME`).

### SDK licences (human step, done on this server 2026-10-16)

Only a human may accept the Android SDK licences. In a terminal:

```bash
JAVA_HOME=/data/tools/jdk21 /data/tools/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses
```

Then rerun `bun run city-drive:android:debug`. The APK is
`apps-games/city-drive/android/app/build/outputs/apk/debug/app-debug.apk`.

## What is not done here

- **Signing.** The debug APK is signed only with the Android debug keystore
  that Gradle creates on the build machine. No keystore, signing config or
  key is committed. Release signing, AAB and Play upload are task 22.
- **iOS build.** This server has no Xcode, so `xcodebuild` and any simulator or
  device run are NOT RUN. `cap add ios` and `cap sync ios` do work on Linux.
- **Device and emulator runs** are NOT RUN. No emulator is ever booted here.
- **Icons and splash** are the Capacitor defaults until task 20.
