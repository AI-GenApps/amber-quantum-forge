# Floodplain Dispatch Capacitor packaging evidence (task 07)

Date: 2026-10-23. Produced headlessly: no browser, simulator, emulator, device, APK, IPA or Xcode build,
no `gradlew` run by hand, and no JDK installed (a Java 17 runtime was already on the machine).

## Tool versions

| Tool | Version |
|---|---|
| `@capacitor/cli` (`bunx cap --version`) | 8.5.3 |
| `@capacitor/assets` (`bunx capacitor-assets --version`) | 3.0.5 |
| `@capacitor/android`, `@capacitor/ios`, `@capacitor/core` | 8.5.3 |
| `sharp` | 0.35.3 |

## Commands (run from `apps-games/floodplain-dispatch`)

1. `bun run build` (writes `dist/`)
2. `bun scripts/build-icons.ts` writes `assets/*.png` (sources below)
3. `bunx cap add android` (`cap-add-android.log`) and `bunx cap add ios` (`cap-add-ios.log`)
4. `bunx capacitor-assets generate --android --ios` (`capacitor-assets.log`, run twice: the first run had only
   `icon-only.png`, so Android kept the Capacitor template adaptive foreground; adding `icon-foreground.png` and
   `icon-background.png` fixed it, and the log is from the final run)
5. Hand edits, all kept by `cap sync`:
   - `AndroidManifest.xml`: `android:screenOrientation="portrait"` on the main activity
   - `values/ic_launcher_background.xml`: `#8aa468` (was `#FFFFFF`)
   - `Info.plist`: both orientation lists reduced to portrait, `UIStatusBarStyle` = light content
   - `LaunchScreen.storyboard`: background colour `#18231d` instead of `systemBackground`
   - `capacitor.config.ts`: `backgroundColor` and `plugins.StatusBar` (`DARK`, `#18231d`)
   - removed Capacitor template leftovers: `drawable/ic_launcher_background.xml`,
     `drawable-v24/ic_launcher_foreground.xml` and the three `Splash.imageset/splash-2732x2732*.png`
     (none referenced)
6. `bunx cap sync` (`cap-sync.log`, repeated after the last edit; `<repo>` replaces the worktree path in the logs)

## Which icon path was used

- `assets/icon-only.png` and `assets/icon-foreground.png`: the accepted `icon` master
  (`../art/masters/icon.webp`), 1024 x 1024 opaque RGB. `capacitor-assets` insets the adaptive layers by
  16.7 percent, so the cottage (about 58 percent of the width) sits inside the launcher mask safe zone.
- `assets/icon-background.png`: flat `#8aa468`, the icon ground colour.
- `assets/splash.png` and `assets/splash-dark.png`: 2732 x 2732, the code-drawn roof-and-wave badge
  (`scripts/draw-fallback-icon.ts`, palette tokens only) inside the central 1200 px on `#18231d`.
  Identical files (one dark look). Reason: `key-art` was rejected in the final round, so no accepted
  key-art exists.
- Only slots from the accepted designer folder were used (`icon`). The art bible and every review note
  (b1 rounds 1 to 4, b2 round 1, b3 rounds 1 to 3, retry rounds 1 to 3) are in `../art/` and
  `../art/review/`, checked identical to the inbox copies in this pass. Rejected or not generated:
  `key-art` (code-drawn placeholder kept in the title screen, listed in `assets-index.md` and open
  question Q25); `feature-graphic` is a store graphic and has no Capacitor role.

## Environment limits

`cap add ios` and `cap sync` completed with Swift Package Manager only (`ios/App/CapApp-SPM`): CocoaPods
was not needed and Xcode was not run (Q6 closed). `cap add android` runs a "Syncing Gradle" step inside the
Capacitor CLI (6.24 s) using the Gradle wrapper and the Java runtime already present; that is the CLI's own
step, not a build: no `assemble`, `build`, `bundle` or test task was run, and no APK or AAB exists. It left
`android/.gradle` and `android/local.properties`, both gitignored and deleted afterwards.

## Files a commit contains

Counts come from `git ls-files --cached --others --exclude-standard`, so build output, the synced web copies
(`android/app/src/main/assets/public`, `ios/App/App/public`), the generated `capacitor.config.json`,
`capacitor.plugins.json` and `config.xml` files, and the Cordova plugin folders are excluded.

| Folder | Files | Bytes |
|---|---|---|
| `android/` | 75 | 2,443,856 |
| `ios/` | 23 | 1,916,299 |
| `assets/` | 5 | 1,946,330 |

Android has 24 launcher PNGs under `mipmap-*` (icon, round, foreground and background at five or six
densities) and 26 `splash.png` variants (portrait, landscape, night). iOS has the 1024 `AppIcon-512@2x.png`
(RGB, no alpha) and six 2732 x 2732 splash images (3 light, 3 dark).

## What the tests prove

`test/native.test.ts` (reads files with `node:fs`; two blocks read the synced JSON copies only when present,
because they are gitignored): Android namespace, `applicationId` and Java package equal the app id; app name
and activity title equal the working title; portrait orientation; `allowBackup="true"` pinned, no cleartext
flag and `INTERNET` the only permission; launcher icons at every density and the splash drawables; the six
plugins equal the `package.json` dependency list in `capacitor.settings.gradle` and `Package.swift`
(and `capacitor.plugins.json` when synced); iOS bundle id, display name, portrait-only on iPhone and iPad,
light status bar, 1024 marketing icon, six splash images and the launch storyboard reference; the config
copies match `capacitor.config.ts` with no `server.url`; `index.html` viewport and theme colour agree;
build outputs are ignored and the native source files are in the tree.
`test/assets-sources.test.ts` (sharp): icon 1024 x 1024 opaque, adaptive layers 1024 x 1024, splash images
2732 x 2732 on `#18231d`, and the code-drawn fallback renders at the same sizes.

## Not verified

Icon, adaptive mask, splash and launch screen were never seen on a device, in Android Studio or in Xcode
(open question Q32). The two PNG sources the badge and icon came from were viewed as files only.
