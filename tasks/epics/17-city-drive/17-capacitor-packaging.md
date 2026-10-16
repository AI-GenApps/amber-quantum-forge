---
epic: 17-city-drive
task: 17-capacitor-packaging
status: completed
commit_scope: city-drive
depends_on: [17-city-drive/16-human-playtest-checkpoint]
estimate: L
owner: agent
---

# Capacitor packaging (Android/iOS), Android toolchain, debug APK

## Goal

Wrap the web build as native Android and iOS projects with Capacitor 8.
Integrate the native plugins, and produce an unsigned debug APK on this
server if the toolchain can be installed. Otherwise produce a verified
`cap sync` and the exact steps for the human.

## Context / Decisions

- **Capacitor:** exact-pin `@capacitor/core`, `@capacitor/cli`,
  `@capacitor/android`, `@capacitor/ios` (8.x; check
  `npm view @capacitor/core version`), plus:
  - `@capacitor/screen-orientation`
  - `@capacitor/status-bar`
  - `@capacitor/app` (hardware back button, pause/resume)
  - `@capacitor-community/keep-awake`

  `haptics` and `preferences` were added in tasks 12 and 14.
- **`capacitor.config.ts`:**
  - `appId: "app.w3dev.citydrive"`, `appName` = the working-title constant
    (task 20 renames it), `webDir: "dist"`.
  - No server URL, no live reload in committed config.
  - `android.minWebViewVersion` set sensibly (WebGL2 needs a modern WebView).
- **Native projects:** run `bunx cap add android` and `bunx cap add ios`, and
  commit the generated `android/` and `ios/` folders. Their build outputs are
  git-ignored. Biome already excludes them (task 01).
  - iOS: Capacitor 8 defaults to SPM. Set the deployment target to **iOS 16.4**
    if any wasm SIMD dependency requires it; Rapier compat does not need SIMD,
    so iOS 15 is fine unless measured otherwise. Record the decision.
  - Android: minSdk 24 / targetSdk 36 (Capacitor 8 defaults).
  - Lock orientation to landscape in the manifest
    (`android:screenOrientation="sensorLandscape"`) and in iOS
    `Info.plist` (landscape left and right only).
- **App lifecycle:**
  - On `pause`, pause the game loop and audio and save.
  - On `resume`, show the pause menu.
  - `backButton` goes to the task 13 navigator (exit the app only from home,
    with a confirmation).
  - keep-awake is active while driving.
  - Hide the status bar in-game.
- **Debug identity:** the debug build uses the `app.w3dev.citydrive.debug`
  suffix via a Gradle `applicationIdSuffix` in the debug buildType, matching
  the portfolio convention.
- **Android toolchain:**
  - Install **JDK 21** (Temurin tarball; Capacitor 8 needs Java 21) and the **Android command-line tools**
    under `/data/tools/{jdk21,android-sdk}`, with nothing system-wide.
  - Install `platform-tools`, `platforms;android-36`, and
    `build-tools;36.0.0` (or the version Capacitor's Gradle requires).
  - **The SDK licences need acceptance.** Do NOT auto-accept them with
    `yes |`. Return blocked with the exact command for the human
    (`/data/tools/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses`)
    unless they are already accepted. The human runs it in a terminal, then
    the workflow resumes at this task.
  - Then run `./gradlew assembleDebug` and copy the APK path and size into the
    evidence. Never boot an emulator.
- **iOS:** this server has no Xcode, so iOS build steps are **NOT RUN**.
  `npx cap sync ios` must still succeed.
- **Scripts:**
  - `city-drive:cap:sync` (build + `cap sync`)
  - `city-drive:android:debug` (sync + `assembleDebug` with `JAVA_HOME` (`/data/tools/jdk21`) and
    `ANDROID_HOME` pointing to `/data/tools`)
- **Registry:** have `games:build` for `city_drive` print the new script
  names (task 02 left a message there).

## Implementation Checklist

- [x] Add the Capacitor dependencies and config; `cap add android ios`;
      orientation; debug suffix.
- [x] Lifecycle, back-button, keep-awake, and status-bar wiring behind
      interfaces, with tests (mocked plugins; web no-ops).
- [x] Install the toolchain under `/data/tools` (or return blocked on
      licences with the exact command). *JDK 21 and the command-line tools
      installed; the human accepted the SDK licences.*
- [x] `assembleDebug` produces an APK. Record the size and path in the evidence README.
      *9,533,928 bytes, `app.w3dev.citydrive.debug`.*
- [x] Docs: `docs-internal/gaming/city-drive-native-build.md` (toolchain,
      commands, signing left for task 22).

## Files Touched

- `apps-games/city-drive/{capacitor.config.ts,android/**,ios/**,src/native/**,package.json,test/native/**}`, `bun.lock`, `.gitignore`
- `package.json` (root scripts), `scripts/games/cli-build.ts` (message only)
- `docs-internal/gaming/city-drive-native-build.md`
- `.agents/resources/2026-10-15/city-drive-qa/17/README.md`

## Acceptance Criteria

- `cap sync android` and `cap sync ios` succeed.
- A debug APK is built (or the task returns blocked solely on the human
  licence step, with the command).
- iOS build is NOT RUN with a reason.
- The lifecycle and back-button tests pass, and all earlier tests still pass.
- No signing keys or keystores are committed.

## Out of Scope

- Release signing, store uploads, icons and splash (task 20).

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:cap:sync`
- `bun run city-drive:android:debug`

## Commit message

`feat(city-drive): package with capacitor for android and ios [17-city-drive/17]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **JDK 21, not 17.** `@capacitor/android` 8.5.3 compiles with Java 21 (AGP 8.13). Install Temurin **JDK 21** at `/data/tools/jdk21` (verify the tarball's SHA-256).
- **Android script:** the `city-drive:android:debug` script exports `JAVA_HOME=/data/tools/jdk21` and `ANDROID_HOME=/data/tools/android-sdk` explicitly.
- **Bun only:** use `bunx cap …`, never `npx`.
- **iOS on Linux:** `cap add ios` and `cap sync ios` may fail on Linux only at a macOS-only step (CocoaPods or SPM resolution). Record that step as **NOT RUN** with the exact error; it does not fail the task.
