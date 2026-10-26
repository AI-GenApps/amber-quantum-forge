# Dress Rehearsal Capacitor packaging evidence (task 07)

Date: 2026-10-26. Produced headlessly: no browser, simulator, emulator, device, APK, IPA or Xcode build, no
`gradlew` run by hand, no JDK installed and no Java run.

## Tool versions

| Tool | Version |
|---|---|
| `@capacitor/cli` (`bunx cap --version`) | 8.5.3 |
| `@capacitor/assets` (`bunx capacitor-assets --version`) | 3.0.5 |
| `@capacitor/android`, `@capacitor/ios`, `@capacitor/core` | 8.5.3 |
| `sharp` | 0.35.3 |

## Commands (run from `apps-games/dress-rehearsal`)

1. `bun run build` (writes `dist/`)
2. `bun scripts/build-icons.ts` writes `assets/*.png` (sources below)
3. `bunx cap add android` (`cap-add-android.log`) and `bunx cap add ios` (`cap-add-ios.log`)
4. `bunx capacitor-assets generate --android --ios` (`capacitor-assets.log`; the five source files were present
   from the first run, so the adaptive foreground and background layers were generated at once)
5. Hand edits, all kept by `cap sync`:
   - `AndroidManifest.xml`: `android:screenOrientation="portrait"` on the main activity
   - `values/ic_launcher_background.xml`: `#1c1816` (was `#FFFFFF`)
   - `Info.plist`: both orientation lists reduced to portrait, `UIStatusBarStyle` = light content
   - `LaunchScreen.storyboard`: background colour `#1c1816` instead of `systemBackground`
   - `capacitor.config.ts`: `backgroundColor` and `plugins.StatusBar` (`DARK`, `#1c1816`)
   - removed Capacitor template leftovers: `drawable/ic_launcher_background.xml`,
     `drawable-v24/ic_launcher_foreground.xml` and the three `Splash.imageset/splash-2732x2732*.png`
     (none referenced)
6. `bunx cap sync` (`cap-sync.log`, run after the last edit; `<repo>` replaces the worktree path in the logs)

## Which icon path was used

- `assets/icon-only.png` and `assets/icon-foreground.png`: the accepted `icon` master
  (`../art/masters/icon.webp`), 1024 x 1024 opaque RGB. `capacitor-assets` insets the adaptive layers by
  16.7 percent; the hanger is about 52 percent of the width inside a central 66 percent circle, so it clears
  the launcher mask.
- `assets/icon-background.png`: flat `#1c1816`, the icon ground colour.
- `assets/splash.png` and `assets/splash-dark.png`: 2732 x 2732, the code-drawn hanger-and-ribbon badge
  (`scripts/draw-fallback-icon.ts`, palette tokens only) inside the central 1200 px on `#1c1816`.
  Identical files (one dark look). Reason: `key-art` was never delivered, so no accepted key-art exists.
  Placing the painted icon master on the splash was not done: its paper grain would show as a square on the
  flat night ground and no browser or device check is allowed (open question Q13).
- Only slots from the accepted designer folder were used (`icon`). The art bible and every review note
  (b1 rounds 1 to 4, b2 rounds 1 to 4, b3 rounds 1 and 2, b4 rounds 1 to 4, b5 rounds 1 and 2, b6 rounds 1 to 4,
  retry rounds 1 to 3) are in `../art/` and `../art/reviews/`, checked byte-identical to the inbox copies in
  this pass. Rejected or not generated: `key-art` (code-drawn placeholder kept in the title screen, listed in
  `assets-index.md` and `open-questions.md`), `item-rainy-city-5` and `item-studio-3` (code-drawn glyphs kept);
  `feature-graphic` is a store graphic with no Capacitor role.

## Environment limits

`cap add ios` and `cap sync` completed with Swift Package Manager only (`ios/App/CapApp-SPM`): CocoaPods was
not needed and Xcode was not run. `cap add android` prints a "Syncing Gradle" step, but in the CLI source
(`node_modules/@capacitor/cli/dist/tasks/add.js`) that step only calls `createLocalProperties`, which writes
`android/local.properties`. It runs no Gradle wrapper and no Java. No Gradle task of any kind was run, no
`assemble`, `build`, `bundle` or test task either, and no APK or AAB exists. No `android/.gradle` or
`android/app/build` directory was created; `android/local.properties` is gitignored.

## Files a commit contains

Counts come from `git ls-files --cached --others --exclude-standard`, so build output, the synced web copies
(`android/app/src/main/assets/public`, `ios/App/App/public`), the generated `capacitor.config.json`,
`capacitor.plugins.json` and `config.xml` files, and the Cordova plugin folders are excluded.

| Folder | Files | Bytes |
|---|---|---|
| `android/` | 75 | 1,656,450 |
| `ios/` | 23 | 1,274,687 |
| `assets/` | 5 | 843,433 |

Android has 24 launcher PNGs under `mipmap-*` (icon, round, foreground and background at six densities) and 26
`splash.png` variants (portrait, landscape, night). iOS has the 1024 `AppIcon-512@2x.png` (RGB, no alpha) and six
2732 x 2732 splash images (3 light, 3 dark). All six plugins (app, haptics, preferences, screen-orientation,
share, status-bar) appear in `capacitor.settings.gradle`, `Package.swift` and both sync logs, and nothing else.

## What the tests prove

`test/native.test.ts` (reads files with `node:fs`; two blocks read the synced JSON copies only when present,
because they are gitignored): Android namespace, `applicationId` and Java package equal the app id; app name
and activity title equal the working title; portrait orientation; `allowBackup="true"` pinned, no cleartext
flag and `INTERNET` the only permission (Q9); launcher icons at every density and the splash drawables; the six
plugins equal the `package.json` dependency list in `capacitor.settings.gradle` and `Package.swift` (and
`capacitor.plugins.json` when synced); iOS bundle id, display name, portrait-only on iPhone and iPad, light
status bar, 1024 marketing icon, six splash images and the launch storyboard reference; the config copies match
`capacitor.config.ts` with no `server.url`; `index.html` viewport and theme colour agree; build outputs are
ignored and the native source files are in the tree.
`test/assets-sources.test.ts` (sharp): icon 1024 x 1024 opaque, adaptive layers 1024 x 1024, splash images
2732 x 2732 on `#1c1816`, and the code-drawn fallback renders at the same sizes.

## Not verified

Icon, adaptive mask, splash and launch screen were never seen on a device, in Android Studio or in Xcode.
The splash PNG was viewed as a file only.
