---
epic: 21-web-cloud-observatory
task: 07-capacitor-packaging
status: todo
commit_scope: cloud-observatory
depends_on: [21-web-cloud-observatory/06-art-integration, 21-web-cloud-observatory/05-audio-haptics-onboarding]
estimate: M
owner: agent
---

# Capacitor Android/iOS projects, icons and splash

## Goal

Generate the native Android and iOS project folders with Capacitor 8, lock them to portrait, brand
them (name, id, version, icon, splash) from the accepted icon and key art, and prove `cap sync`
works. No Gradle build, no Xcode build, no APK, no JDK install, no device: the owner builds native
binaries later.

## Context / Decisions

- Identity: `appId` `app.w3dev.cloudobservatory`, `appName` Cloud Observatory, `webDir` `dist`,
  version 1.0.0 (Android `versionCode` 1), no `server.url` in committed config (a test already
  guards this in `test/config.test.ts`; keep it green).
- Plugins are already installed by the skeleton (`@capacitor/app`, `haptics`, `preferences`,
  `screen-orientation`, `share`, `status-bar`); this task adds no dependency. `@capacitor/assets`
  and `sharp` are existing devDependencies.
- Capacitor 8 targets: Android minSdk 24 / targetSdk 36 (template defaults), iOS with Swift
  Package Manager. Do not change them unless a plugin demands it; record the values.
- Orientation: portrait only. Android manifest `android:screenOrientation="portrait"` on the main
  activity; iOS `UISupportedInterfaceOrientations` and the iPad variant limited to portrait
  (upside-down excluded on iPhone). The kit lifecycle also locks at runtime.
- Source art: the accepted `icon` master (1024 square, opaque) and `key-art` (2:3) from
  `.agents/resources/2026-10-23/web-games/cloud-observatory/art/masters/` (WebP; convert to PNG in
  the scratch folder `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/cloud-observatory/`). If the
  icon was rejected (task 06 placeholder), build a code-drawn stopgap icon (gold star on
  `#101A33`) with `sharp` and record it in `open-questions.md` row 7; likewise a splash from a flat
  `#101A33` field with a code-drawn gold mark if key art is missing.
- The Capacitor Android template declares `INTERNET`. The game makes no network calls; keep the
  permission only if removing it breaks the bridge (check in the template/docs), otherwise remove
  it and say so. Record the outcome in `store-listing.md` (permissions row) and `decisions-log.md`.
- Generated build outputs (`android/app/build`, `ios/App/Pods`, `.gradle`, `local.properties`,
  keystores) must not be committed; the generated `android/.gitignore` and `ios/.gitignore` cover
  them. The root `.gitignore` is outside the scope fence: if an extra ignore line is needed, return
  `blocked` naming it. No signing keys are committed.

## Implementation Checklist

- [ ] Confirm `bun run --filter '@web-games/cloud-observatory' build` produces `dist/`.
- [ ] From `apps-games/cloud-observatory`: `bunx cap add android` and `bunx cap add ios` (Bun only,
      never npx). Record the exact output. If a macOS-only or toolchain step fails (CocoaPods, SPM
      resolution, Xcode), record it as NOT RUN with the error; keep whatever folder content was
      generated and describe the remaining owner step.
- [ ] Set identity: Android `strings.xml` app name, `build.gradle` `versionName` 1.0.0 /
      `versionCode` 1 and `namespace`/`applicationId` `app.w3dev.cloudobservatory`; iOS display name,
      bundle id, version 1.0.0 build 1; add `.debug` application id suffix for the Android debug
      build type (portfolio convention).
- [ ] Portrait lock in `AndroidManifest.xml` and iOS `Info.plist` as described above.
- [ ] `scripts/build-icons.mjs` (under `apps-games/cloud-observatory/scripts/`, uses `sharp`):
      produces `resources/icon-only.png` (1024), `icon-foreground.png` (icon scaled to 66% centred
      on a transparent 1024 canvas for the adaptive-icon safe zone), `icon-background.png` (the icon
      enlarged and blurred so no hard box shows), `splash.png` and `splash-dark.png` (2732×2732:
      `#101A33` field with the key art or mark centred at about 40% of the width).
- [ ] Run `bunx capacitor-assets generate --android --ios` (or the equivalent for the pinned
      `@capacitor/assets` 3.0.5) to fill Android mipmaps/drawables and the iOS asset catalog;
      commit the generated resources, not the scratch intermediates.
- [ ] `bunx cap sync android` and `bunx cap sync ios` succeed (or ios is NOT RUN with the exact
      reason); commit the synced `public` copies only if the template tracks them.
- [ ] Verify the plugin list in `android/capacitor.settings.gradle` and the iOS package manifest
      contains exactly app, haptics, preferences, screen-orientation, share, status-bar.
- [ ] `docs`: add the owner build steps (Android Studio / Gradle `assembleDebug`, Xcode run,
      signing left for submission) to `.agents/resources/2026-10-23/web-games/cloud-observatory/07/README.md`;
      do not edit `docs-internal` (outside the fence).
- [ ] Update `assets-index.md` (icon and splash provenance), `store-listing.md` (permissions),
      `decisions-log.md` (SDK values, INTERNET outcome).

Tests (headless, in `apps-games/cloud-observatory/test/native/`):

- [ ] `native-projects.test.ts`: `android/` and `ios/` exist; `AndroidManifest.xml` contains
      `screenOrientation="portrait"` and the main activity; `build.gradle` contains
      `app.w3dev.cloudobservatory`; iOS `Info.plist` lists only portrait orientations on iPhone;
      bundle id correct; no `server.url` anywhere in `capacitor.config.json` copies.
- [ ] `no-secrets.test.ts`: no `*.jks`, `*.keystore`, `local.properties`, `GoogleService-Info.plist`
      or `google-services.json` under `android/` or `ios/`.
- [ ] `icons.test.ts`: the icon, adaptive foreground/background and splash sources exist with the
      right dimensions (read with `sharp`); the generated Android mipmap set and iOS app-icon set
      exist and are non-empty; icon sources are opaque where required.
- [ ] `plugins.test.ts`: the synced plugin list equals the six expected plugins.
- [ ] Config test from the skeleton still passes (id, name, `webDir`, no `server.url`).

## Files Touched

- `apps-games/cloud-observatory/{android,ios}/**` (generated, minus ignored build output)
- `apps-games/cloud-observatory/{capacitor.config.ts,resources/**,scripts/build-icons.mjs}`
- `apps-games/cloud-observatory/test/native/*.test.ts`
- `.agents/resources/2026-10-23/web-games/cloud-observatory/07/README.md`
- `.agents/games/cloud-observatory/{assets-index,store-listing,decisions-log,open-questions}.md`
- `tasks/epics/21-web-cloud-observatory/STATUS.md` (tick task 07)

## Acceptance Criteria

- `android/` and `ios/` exist, are portrait-only, carry the right id, name and version, and contain
  generated launcher icons and splash from the accepted (or stopgap) art.
- `cap sync android` succeeds; `cap sync ios` succeeds or is recorded NOT RUN with the exact
  macOS/Xcode reason and the owner command to finish.
- Exactly the six expected Capacitor plugins are present in both projects.
- No keystore, signing config, `local.properties` or Firebase file is committed.
- No Gradle or Xcode build was run, no JDK installed, no device or emulator used.
- Biome ignores generated native folders and the JS checks stay green.

## Verification Commands

- `bun run --filter '@web-games/cloud-observatory*' typecheck`
- `bun run --filter '@web-games/cloud-observatory*' test`
- `bun run --filter '@web-games/cloud-observatory' build`
- `bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core`

## Out of Scope

- Building APK/AAB/IPA, signing, store upload, screenshots (owner, later).
- New plugins, keep-awake, push notifications, analytics, ads.
- Editing the root `.gitignore`, `biome.json`, `knip.json`, `bun.lock` or other games.

## Commit message

`feat(cloud-observatory): add capacitor android and ios projects, icons and splash [21-web-cloud-observatory/07]`
