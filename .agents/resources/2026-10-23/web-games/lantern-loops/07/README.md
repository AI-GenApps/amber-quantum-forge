# Lantern Loops Capacitor packaging evidence (task 07)

Date: 2026-10-23. Everything below was produced headlessly: no browser, simulator, emulator, device,
APK or IPA, and no Xcode. No JDK was installed.

## Tool versions

| Tool | Version |
|---|---|
| `@capacitor/cli` (`bunx cap --version`) | 8.5.3 |
| `@capacitor/assets` (`bunx capacitor-assets --version`) | 3.0.5 |
| `@capacitor/android`, `@capacitor/ios`, `@capacitor/core` | 8.5.3 |
| `sharp` | 0.35.3 |

## Commands (run from `apps-games/lantern-loops`)

1. `bun run --filter '@web-games/lantern-loops' build` (writes `dist/`)
2. `bun scripts/render-brand-sources.ts` writes `resources/*.png`
3. `bunx cap add android` and `bunx cap add ios` (Swift Package Manager, `ios/App/CapApp-SPM`; no CocoaPods)
4. `bunx capacitor-assets generate --android --ios` (log: `capacitor-assets.log`)
5. Hand edits: Android manifest orientation, `versionName`, indigo styles and adaptive background colour;
   iOS `Info.plist` orientation lists, `MARKETING_VERSION`, `LaunchScreen.storyboard` background;
   `capacitor.config.ts` (`backgroundColor`, `plugins.StatusBar`)
6. `bunx cap sync` (log: `cap-sync.log`, home paths stripped; the log was captured by `tee`, the
   `cap add` output was only read in the terminal)

## Which icon path was used

Accepted-art path (not the code-drawn fallback):

- `resources/icon.png`: accepted `icon` master (`../art/masters/icon.webp`), 1024x1024 opaque RGB.
- `resources/icon-foreground.png`: accepted `lantern-amber` master trimmed and fitted into the central
  66% (676 px) of 1024x1024 on transparent.
- `resources/icon-background.png`: flat `#12132E`.
- `resources/splash.png` and `splash-dark.png`: 2732x2732 `#12132E` with the centre lantern of the accepted
  `key-art` inside the central 1200 px box (identical files; one dark look; first pass used `lantern-amber`,
  see the update pass below).

Update pass (art track finished, status `ok`): `key-art` was accepted (retry round 1), so
`resources/splash.png` and `splash-dark.png` now use the centre lantern of the accepted `key-art` master
(`../art/masters/key-art.webp`): a 380x430 crop around (512, 790) with a soft elliptical mask (radii
148x210, 12 px blur) so the neighbouring garland lanterns, 172 px from the centre, stay out and the edge
fades into `#12132E`, centred in the 1200 px safe box. The first pass had used `lantern-amber` because
`key-art` was then undelivered (`style_anchor_failed`). Icon, foreground and background are unchanged byte
for byte. Re-run: `bun scripts/render-brand-sources.ts`, `bunx capacitor-assets generate --android --ios`
(log `capacitor-assets.log` replaced; totals android 3.57 MB, ios 3.11 MB generated), `bunx cap sync`
(`cap-sync.log` unchanged apart from timings, so kept). Only the splash files changed:
`resources/splash*.png`, 26 Android `drawable*/splash.png` and the 6 iOS `Splash.imageset` PNGs. The
splash lantern is posterised to 32 colours (median 5) so the 12
committed splash copies stay small (otherwise 6.4 MB android and 12.8 MB ios). The code-drawn fallback is
available as `bun scripts/render-brand-sources.ts --fallback` and is covered by a test. Nothing outside the
accepted folder was used. The art bible and every review note (b1 rounds 1 to 4, b2 rounds 1 to 4, retry
rounds 1 to 3) are in `../art/` and `../art/review/` (checked identical to the inbox copies in this pass).
Not used here: `empty-archive` (rejected in its final round, code-drawn placeholder kept, no Capacitor
role), `feature-graphic` (a store graphic, only noted) and the in-app art slots.

## File counts and sizes

| Folder | Files a commit would contain | Bytes |
|---|---|---|
| `android/` | 77 | 2,134,732 (2.1 MB) |
| `ios/` | 23 | 2,377,300 (2.4 MB) |
| `resources/` | 5 | about 1.4 MB source PNGs (icon 321 KB, foreground 383 KB, background 16 KB, splash 2 x 338 KB) |

Counts come from `git ls-files --cached --others --exclude-standard`, so ignored build output, the synced
web copies (`android/app/src/main/assets/public`, `ios/App/App/public`), the generated
`capacitor.config.json` and `config.xml` files, and plugin folders are excluded. Android has 50 PNGs
under `res/` (24 `mipmap-*` launcher PNGs and 26 `splash.png` variants including night and landscape); iOS has the 1024 `AppIcon-512@2x.png` (RGB, no alpha) and six 2732x2732
splash images (3 light, 3 dark).

## Honest note on Gradle

`bunx cap add android` runs a "Syncing Gradle" step inside the Capacitor CLI (it took 141 s) using the Gradle
wrapper and a Java runtime that was already on this machine. That is the CLI's own step, not a build: no
`./gradlew assemble`, `build`, `bundle` or test task was run by hand, no APK/AAB was produced, and no JDK or
Android SDK tooling was installed. The step left `android/.gradle`, `android/app/build` and
`android/local.properties`; all three are gitignored and were deleted afterwards. `cap sync` and
`capacitor-assets` run no Gradle.

## What the tests prove (`test/capacitor/`)

- `platforms.test.ts`: both platform structures, Android `namespace` and `applicationId`, iOS bundle id in
  every configuration, app name in `strings.xml` and `Info.plist`, versions 0.1.0 / 1, portrait only on
  Android and on iPhone and iPad, INTERNET as the only permission (Q6 untouched), indigo launch colours.
- `icons.test.ts`: the five `resources/` PNGs at their sizes and alpha rules, both render paths, the key-art
  splash (committed pixels equal a fresh render from the master, differ from the fallback, indigo corners,
  lit centre, no neighbour lantern in the crop), Android
  launcher / round / foreground icons in all five densities, adaptive icon XML, Android light and dark splash,
  iOS 1024 icon without alpha, six iOS splash images.
- `sync.test.ts`: the synced `index.html` equals `dist/index.html` (skipped with a console message when `dist`
  or the sync is absent), neither synced `capacitor.config.json` has `server.url`, and the committed folders
  hold no build output, `local.properties`, keystore, APK/AAB or synced web copy and stay under 5 MB.
