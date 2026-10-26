# The Last Window Capacitor packaging evidence (task 07)

Date: 2026-10-23. Produced headlessly: no browser, simulator, emulator, device, APK, IPA or Xcode build,
no `gradlew` run by hand, and no JDK installed (a Java 17 runtime was already on the machine).

## Tool versions

| Tool | Version |
|---|---|
| `@capacitor/cli` | 8.5.3 |
| `@capacitor/assets` | 3.0.5 |
| `@capacitor/android`, `@capacitor/ios`, `@capacitor/core` | 8.5.3 |
| `sharp` | 0.35.3 |

## Commands (run from `apps-games/the-last-window`)

1. `bun run build` (writes `dist/`)
2. `bun scripts/build-icons.ts` writes `assets/*.png` (sources below)
3. `bunx cap add android` (`cap-add-android.log`) and `bunx cap add ios` (`cap-add-ios.log`)
4. `bunx capacitor-assets generate --android --ios` (`capacitor-assets.log`; `<repo>` replaces the worktree path)
5. Hand edits, all kept by `cap sync`:
   - `AndroidManifest.xml`: `android:screenOrientation="portrait"` on the main activity
   - `values/ic_launcher_background.xml`: `#1F2F45` (was `#FFFFFF`)
   - `Info.plist`: both orientation lists reduced to `UIInterfaceOrientationPortrait`, `UIStatusBarStyle` =
     `UIStatusBarStyleLightContent`
   - `LaunchScreen.storyboard`: background colour `#1F2F45` instead of `systemBackgroundColor`
   - `capacitor.config.ts`: `backgroundColor` and `plugins.StatusBar` (`DARK`, `#1F2F45`)
   - removed Capacitor template leftovers: `drawable/ic_launcher_background.xml`,
     `drawable-v24/ic_launcher_foreground.xml` and the three `Splash.imageset/splash-2732x2732*.png`
     (none referenced)
6. `bunx cap sync` (`cap-sync.log`, run after the last edit)

## Which icon path was used

- `assets/icon-only.png`: the accepted `icon` master (`../art/masters/icon.webp`), 1024 x 1024 opaque RGB.
- `assets/icon-foreground.png`: the same icon with its outer 200 px faded to transparent (smoothstep) so the
  wall melts into the flat background layer once `capacitor-assets` insets the adaptive layers by 16.7 percent.
  The lit window and lamp take about 40 percent of the width, inside the launcher mask safe zone.
- `assets/icon-background.png`: flat `#1F2F45` (`night`).
- `assets/splash.png` and `assets/splash-dark.png`: the accepted `key-art` master (1024 x 1536) scaled to
  1200 x 1800, edges softened over 220 px, centred on `#1F2F45` in a 2732 x 2732 canvas. Identical files (one
  dark look). The cottage spans about 54 percent of the panel width and sits inside the central 1200 px box.
- Both slots came from the accepted designer folder. The art bible, the accepted manifest and all 17 review
  notes in `../art/` were re-compared with the inbox and are byte-identical. Rejected or not generated slots:
  none (the code-drawn fallback in `scripts/draw-fallback-icon.ts` stays available through `--fallback`).
  `feature-graphic` is a store graphic and has no Capacitor role.

## Environment limits

`cap add ios` and `cap sync` completed with Swift Package Manager only (`ios/App/CapApp-SPM`): CocoaPods was
not needed and Xcode was not run (Q6 closed). `cap add android` runs a "Syncing Gradle" step inside the
Capacitor CLI (6.44 s) using the Java runtime already present; that is the CLI's own step, not a build: no
`assemble`, `build`, `bundle` or test task was run and no APK or AAB exists. It left `android/.gradle` and
`android/local.properties`, both gitignored and deleted afterwards.

## Files a commit contains

Counts come from `git ls-files --cached --others --exclude-standard`, so build output, the synced web copies
(`android/app/src/main/assets/public`, `ios/App/App/public`), the generated `capacitor.config.json`,
`capacitor.plugins.json` and `config.xml` files, and the Cordova plugin folders are excluded.

| Folder | Files | Bytes |
|---|---|---|
| `android/` | 75 | 13,692,343 |
| `ios/` | 23 | 12,857,957 |
| `assets/` | 5 | 7,871,799 |

Android has 24 launcher PNGs under `mipmap-*` and 26 `splash.png` variants (portrait, landscape, night). iOS
has the 1024 `AppIcon-512@2x.png` and six 2732 x 2732 splash images (3 light, 3 dark). The splash files are
larger than in the sibling games because the key art is a full painting (about 1.8 MB per 2732 px image).

## What the tests prove

`test/native.test.ts` (reads files with `node:fs`; two blocks read the synced JSON copies only when present,
because they are gitignored): Android namespace, `applicationId` and Java package equal the app id; app name
and activity title equal "The Last Window"; portrait orientation; `allowBackup="true"` pinned, no cleartext
flag and `INTERNET` the only permission; launcher icons at every density, the splash drawables and the
adaptive background colour; the six plugins equal the `package.json` dependency list in
`capacitor.settings.gradle` and `Package.swift` (and `capacitor.plugins.json` when synced); iOS bundle id,
display name, portrait-only on iPhone and iPad, light status bar, 1024 marketing icon, six splash images and
the launch storyboard reference; config copies match `capacitor.config.ts` with no `server.url`; `index.html`
viewport and theme colour agree; build outputs are ignored and the native source files are in the tree.
`test/assets-sources.test.ts` (sharp): icon 1024 x 1024 opaque, adaptive layers 1024 x 1024 (foreground fades
to transparent, background flat night), splash images 2732 x 2732 with night corners and key art in the
centre, and the code-drawn fallback renders at the same sizes.

## Not verified

Icon, adaptive mask, splash and launch screen were never seen on a device, in Android Studio or in Xcode
(open question Q13). The source PNGs and a downscaled preview of the splash were viewed as files only.
