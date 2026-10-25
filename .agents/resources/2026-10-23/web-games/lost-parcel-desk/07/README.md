# Lost Parcel Desk Capacitor packaging evidence (task 07)

Date: 2026-10-23. Produced headlessly: no browser, simulator, emulator, device, APK, IPA or Xcode build, no
`gradlew` task run by hand, and no JDK installed (a Java runtime was already on the machine).

## Tool versions

| Tool | Version |
|---|---|
| `@capacitor/cli` (`bunx cap --version`) | 8.5.3 |
| `@capacitor/assets` (`bunx capacitor-assets --version`) | 3.0.5 |
| `@capacitor/android`, `@capacitor/ios`, `@capacitor/core` | 8.5.3 |
| `sharp` | 0.35.3 |

## Commands (run from `apps-games/lost-parcel-desk`)

1. `bun run build` (writes `dist/`)
2. `bun scripts/build-icons.ts` writes `assets/*.png` (sources below)
3. `bunx cap add android` (`cap-add-android.log`) and `bunx cap add ios` (`cap-add-ios.log`)
4. `bunx capacitor-assets generate --android --ios` (`capacitor-assets.log`)
5. Hand edits, all kept by `cap sync`:
   - `AndroidManifest.xml`: `android:screenOrientation="portrait"` on the main activity
   - `values/ic_launcher_background.xml`: `#015F64` (was `#FFFFFF`)
   - `Info.plist`: both orientation lists reduced to portrait, `UIStatusBarStyle` = light content
   - `LaunchScreen.storyboard`: background colour `#141a22` instead of `systemBackground`
   - `capacitor.config.ts`: `backgroundColor` and `plugins.StatusBar` (`DARK`, `#141a22`)
   - removed Capacitor template leftovers: `drawable/ic_launcher_background.xml`, `drawable-v24/ic_launcher_foreground.xml`
     and the three `Splash.imageset/splash-2732x2732*.png` (none referenced)
6. `bunx cap sync` (`cap-sync.log`, run after the last edit; `<repo>` replaces the worktree path in the logs)

## Which icon path was used

- `assets/icon-only.png` and `assets/icon-foreground.png`: the accepted `icon` master (`../art/masters/icon.webp`),
  1024 x 1024 opaque RGB. `capacitor-assets` insets the adaptive layers by 16.7 percent, so the cream disc (about 63
  percent of the width) sits inside the launcher mask safe zone.
- `assets/icon-background.png`: flat `#015f64`, the mean of the master's four 64 px corner patches.
- `assets/splash.png` and `assets/splash-dark.png`: 2732 x 2732, the code-drawn stamp-and-envelope badge
  (`scripts/draw-fallback-icon.ts`, palette tokens only) inside the central 1200 px on `#141a22`. Identical files (one
  dark look). Reason: `key-art` was rejected in the final designer round, so no accepted key-art exists.
- Only slots from the accepted designer folder were used (`icon`). The art bible (`../art/art-bible.md`) and every review
  note (`../art/review/`: b1 to b7 and retry rounds) are byte-identical to the inbox copies, checked with `cmp` in this pass.
  Rejected or not generated: `key-art` (code-drawn placeholder kept in the title screen and the splash, listed in
  `assets-index.md` and open question Q19), `evidence-04-3`, `evidence-08-1` and `townsfolk-9` (code-drawn placeholders, Q19).
  `feature-graphic` is a store graphic and has no Capacitor role.

## Environment limits (Q6)

`cap add ios` and `cap sync` completed with Swift Package Manager only (`ios/App/CapApp-SPM`): CocoaPods was not needed and
Xcode was not run. `cap add android` runs a "Syncing Gradle" step inside the Capacitor CLI (7.04 s) using the Gradle
wrapper and the Java runtime already present; that is the CLI's own step, not a build: no `assemble`, `build`, `bundle` or
test task was run and no APK or AAB exists. It left `android/.gradle` and `android/local.properties`, both gitignored and
deleted afterwards.

## Files a commit contains

Counts come from `git ls-files --cached --others --exclude-standard`, so build output, the synced web copies
(`android/app/src/main/assets/public`, `ios/App/App/public`), the generated `capacitor.config.json`,
`capacitor.plugins.json` and `config.xml` files and the Cordova plugin folders are excluded.

| Folder | Files | Bytes |
|---|---|---|
| `android/` | 75 | 2,827,322 |
| `ios/` | 23 | 1,961,372 |
| `assets/` | 5 | 1,687,962 |

Android has 24 launcher PNGs under `mipmap-*` (icon, round, foreground and background at six densities) and 26 `splash.png`
variants (portrait, landscape, night). iOS has the 1024 `AppIcon-512@2x.png` (RGB, no alpha) and six splash images (3 light,
3 dark).

## What the tests prove

`test/native.test.ts` (reads files with `node:fs`; two blocks read the synced JSON copies only when present, because they are
gitignored): Android namespace, `applicationId` and Java package equal the app id; app name and activity title equal the game
title; portrait orientation; `allowBackup="true"` pinned and recorded in the decisions log, no cleartext flag and `INTERNET`
the only permission; launcher icons at every density, the splash drawables and the adaptive background colour; the six
plugins equal the `package.json` dependency list in `capacitor.settings.gradle` and `Package.swift` (and
`capacitor.plugins.json` when synced); iOS bundle id, display name, portrait-only on iPhone and iPad, light status bar, 1024
marketing icon, six splash images and the launch storyboard reference; the config copies match `capacitor.config.ts` with no
`server.url`; `index.html` viewport and theme colour agree; build outputs are ignored and the native source files are in
the tree. `test/assets-sources.test.ts` (sharp): icon 1024 x 1024 opaque, adaptive layers 1024 x 1024, splash images 2732 x
2732 on `#141a22`, and the code-drawn fallback renders at the same sizes.

## Not verified

Icon, adaptive mask, splash and launch screen were never seen on a device, in Android Studio or in Xcode (open question
Q21). The PNG sources were viewed as files only.
