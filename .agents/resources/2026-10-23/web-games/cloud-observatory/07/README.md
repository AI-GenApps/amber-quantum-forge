# Task 07 evidence: Capacitor Android and iOS projects, icons and splash

Headless only. No Gradle build, no Xcode build, no APK, no JDK installed, no device, emulator or
browser. `cap add`, `capacitor-assets` and `cap sync` only copy files and write manifests, so they
ran fully on the build machine. Nobody has looked at the launcher icon on a device: the owner judges
it during QA.

## What was run (all from `apps-games/cloud-observatory`, Bun only)

| Step | Command | Result |
|---|---|---|
| Web build | `bun run build` | `dist/` produced (index.html, assets, art, audio, fonts) |
| Android project | `bunx cap add android` | success: "android platform added!", 6 plugins found |
| iOS project | `bunx cap add ios` | success: "ios platform added!", Swift Package Manager (no CocoaPods), 6 plugins found |
| Asset sources | `bun scripts/build-icons.mjs` | wrote 5 files in `resources/` |
| Launcher icons and splash | `bunx capacitor-assets generate --android --ios --assetPath resources` | android: 74 files, 10.12 MB; ios: 7 files, 2.88 MB |
| Sync | `bunx cap sync android` then `bunx cap sync ios` | both succeeded, 6 plugins each: `@capacitor/app@8.1.2`, `haptics@8.0.2`, `preferences@8.0.1`, `screen-orientation@8.0.2`, `share@8.0.3`, `status-bar@8.0.4` |

Nothing was NOT RUN: iOS uses Swift Package Manager, so `cap add ios` needed neither CocoaPods nor
Xcode. A `cap` command also wrote `android/local.properties` (machine specific, git-ignored); it was
deleted again so the checkout holds no local path.

## Identity and versions

| Item | Value |
|---|---|
| App id (Android `applicationId` and `namespace`, iOS bundle id) | `app.w3dev.cloudobservatory` |
| Android debug build | `app.w3dev.cloudobservatory.debug` (`applicationIdSuffix ".debug"` on the debug build type, portfolio convention) |
| Name | Cloud Observatory (`strings.xml` `app_name`, iOS `CFBundleDisplayName`) |
| Version | 1.0.0; Android `versionCode 1`; iOS `MARKETING_VERSION 1.0.0`, `CURRENT_PROJECT_VERSION 1` |
| Android SDK | minSdk 24, compileSdk and targetSdk 36 (template defaults, unchanged: no plugin demands more) |
| Android toolchain pinned by the template | Gradle 8.14.3, Android Gradle Plugin 8.13.0, Java 21 source and target |
| iOS deployment target | 15.0 (template default; SPM `platforms: [.iOS(.v15)]`) |
| Capacitor | 8.5.3 (cli, core, android, ios) |

## Portrait lock

- Android: `android:screenOrientation="portrait"` on `.MainActivity`.
- iOS `Info.plist`: `UISupportedInterfaceOrientations` is `Portrait` only (landscape removed);
  `UISupportedInterfaceOrientations~ipad` is `Portrait` only (the template listed all four);
  `UIRequiresFullScreen` is `true`, which Apple requires for an iPad app that is not available in
  all orientations and multitasking layouts.
- The kit lifecycle also locks at runtime (`lockPortrait: true`, asserted by `test/config.test.ts`).

## INTERNET permission outcome: removed

The Capacitor Android template declares `android.permission.INTERNET`. The game makes no network
calls and loads its bundled build from `dist` (no `server.url`). The Capacitor bridge serves the
bundle in-process (`WebViewAssetLoader`), and nothing in the Capacitor Android library, the six
plugins or the template manifest requires the permission (searched the installed packages, no
requirement or comment). So the `<uses-permission>` line was removed and the manifest now declares
no permissions. `test/native/native-projects.test.ts` fails if a `<uses-permission>` returns.

This is the one claim that is not proven on a device: if the Android app opens to a blank
white or black screen, restore `<uses-permission android:name="android.permission.INTERNET" />` in
`android/app/src/main/AndroidManifest.xml`, record it in `store-listing.md` (Permissions row) and
`decisions-log.md`, and change the manifest assertion in the test. The owner checks this on the
first device run (Owner step 4 below).

## Icons and splash

The designer `icon` was rejected in the last round of batch b1 (bloom has blocky pixel-stepped
edges; vector eight-point star overlapped by the telescope tube; telescope pasted across the dome
face; bare pillar base), so the launcher icon is a code-drawn stopgap. The accepted `key-art` master
is the splash source. `scripts/build-icons.mjs` (sharp only, deterministic, re-runnable with
`bun scripts/build-icons.mjs`) writes:

| File | Size | Content |
|---|---|---|
| `resources/icon-only.png` | 1024, opaque | Gold-foil four-point star (`#EBCB85` light upper left, `#D8A94B` base, `#A47C30` shade lower right) in two thin rings on a radial `#22335C` to `#101A33` field |
| `resources/icon-foreground.png` | 1024, transparent | The star mark alone at 66% (adaptive-icon safe zone); the icon square is not used because its navy field would show a box inside the adaptive mask |
| `resources/icon-background.png` | 1024, opaque | `icon-only.png` enlarged 1.6x and blurred (sigma 40) so no hard shape shows |
| `resources/splash.png` | 2732, opaque | `#101A33` field, accepted key art (read from `art/masters/key-art.webp`) at 40% of the width, edges feathered so no box shows |
| `resources/splash-dark.png` | 2732, opaque | Same on `#0B1226` (ink-950) |

Generated outputs (committed): Android `mipmap-{ldpi..xxxhdpi}` launcher, round, foreground and
background PNGs, `mipmap-anydpi-v26` adaptive XML, `drawable*/splash.png` in 6 port, 6 land and
night variants; iOS `AppIcon.appiconset` (1024, opaque) and `Splash.imageset` (3 light, 3 dark).
Removed as stale after generation: the template's default grid launcher vectors
(`drawable-v24/ic_launcher_foreground.xml`, `drawable/ic_launcher_background.xml`) and the three
default `splash-2732x2732*.png` files, none referenced any more.

Never committed: build output (`android/app/build`, `.gradle`, `ios/App/Pods`), the synced copies
(`android/app/src/main/assets/public`, `ios/App/App/public`) and the config copies, all covered by
the generated `.gitignore` files. The Android `.gitignore` had `*.jks` and `*.keystore`
commented out; they are enabled, and `keystore.properties` and `google-services.json` were added
(iOS: `*.p12`, `*.mobileprovision`, `GoogleService-Info.plist`). The root `.gitignore` was not
touched.

## Owner build steps (later, human)

Prerequisites: a recent Android Studio with a JDK 21 (bundled JetBrains Runtime is fine)
and Android SDK 36; Xcode 26 on macOS for iOS. Run `bun install` at the repo root first.

1. Refresh the web build and native copies after any web change:
   `cd apps-games/cloud-observatory && bun run cap:sync` (runs `vite build && cap sync`).
2. Android debug: `bunx cap open android`, let Gradle sync, run the `app` configuration on a device
   or emulator. Or from a terminal with JDK 21: `cd android && ./gradlew assembleDebug`
   (APK in `android/app/build/outputs/apk/debug/`, application id ends `.debug`). Android Studio
   writes `android/local.properties` itself (git-ignored).
3. iOS: `bunx cap open ios`, select the `App` target, set your Team under Signing and
   Capabilities, pick a device or simulator and Run. Packages resolve through Swift Package Manager
   on the first open (needs network once).
4. First-run checks on device: the game boots past the splash (if blank, see the INTERNET note),
   rotating the device does not rotate the app, the star icon shows in the launcher and as a round
   and adaptive icon, the dark-mode splash is the darker field, save persists across a relaunch.
5. Release signing (left for submission, nothing is committed): create an upload keystore outside
   the repo, reference it from a git-ignored `android/keystore.properties`, then
   `./gradlew bundleRelease`; for iOS use Xcode Archive with your team and distribution profile.

## Known limits

- The stopgap icon is vector-flat by design. Open question 15 recommends one more designer round
  (accepted building as reference, bloom fix first) so a painted icon can replace it: run the
  art pipeline, change `scripts/build-icons.mjs` to read the accepted master, re-run
  `capacitor-assets generate` and update `assets-index.md`.
- Landscape splash drawables are generated by `capacitor-assets` although the app is portrait only;
  they are never selected and cost about 5 MB of the repository. They could be deleted later.
- `ios/App/CapApp-SPM/Package.swift` and `android/capacitor.settings.gradle` hold relative paths into
  the bun store (`node_modules/.bun/...`); they are rewritten by every `cap sync` and are the
  same on every checkout that installs the same lockfile.
