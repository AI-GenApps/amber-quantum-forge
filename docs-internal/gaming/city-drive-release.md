---
title: Street Royale release
description: Versioning, the web deploy workflow and Vercel project settings, signing steps, and the store upload checklist for Street Royale (City Drive).
---

# Street Royale release

Street Royale (internal id `city_drive`) ships three ways: a web build on its own Vercel project,
an Android app bundle for Google Play, and an iOS build for App Store Connect. Everything an agent
can prepare is in the repo; the steps below marked **human** need a console, a Mac, a device or a
secret.

Related: [native build](/gaming/city-drive-native-build), the listing answers in
`.agents/games/city-drive/store-listing.md`, and the privacy policy at
`docs-public/legal/street-royale-privacy-policy.md`.

## What v1 collects

Nothing. The no-data audit (`apps-games/city-drive/test/release/noData.test.ts`, with the raw grep
output in `.agents/resources/2026-10-15/city-drive-qa/21/no-data-audit.txt`) pins these facts:

- The only `fetch` loads the app's own bundled files (`assets/...`). No `XMLHttpRequest`,
  `WebSocket`, `sendBeacon` or `EventSource` anywhere, and no absolute URL in the sources.
- No analytics, ads, crash or purchase SDK in any `package.json`.
- The Android manifest declares **only** `INTERNET`. Capacitor's template includes it and the
  WebView needs it; the game makes no request with it. `Info.plist` has no usage-description
  strings. `capacitor.config.ts` has no `server.url`.

The post-v1 daily challenge (task 23) adds no allowance to this list: it reads only the device clock
(`Date.now()` as a UTC date) and stores its state in the same local save.

If a change makes the test fail, the privacy policy, the Play Data safety form and the App Store
label must be revisited before shipping it.

## Versioning

The single source is the registry entry `city_drive` in `scripts/games/registry-games.ts`:
`release.version` (for example `0.1.0`) and `release.buildNumber` (an integer, at least 1).

| Platform | Field | Set from |
|---|---|---|
| Android `android/app/build.gradle` | `versionName` | `release.version` |
| Android `android/app/build.gradle` | `versionCode` | `release.buildNumber` |
| iOS `ios/App/App.xcodeproj/project.pbxproj` | `MARKETING_VERSION` (Debug and Release) | `release.version` |
| iOS `ios/App/App.xcodeproj/project.pbxproj` | `CURRENT_PROJECT_VERSION` (Debug and Release) | `release.buildNumber` |

`Info.plist` already reads `CFBundleShortVersionString` and `CFBundleVersion` from those two
build settings, so it needs no edit.

```bash
cd apps-games/city-drive
bun run sync-version            # writes the registry release into Android and iOS
bun scripts/sync-version.ts --check   # changes nothing, exits 1 on drift
```

`test/release/syncVersion.test.ts` fails if the committed native files drift from the registry,
so a registry bump without a sync is caught by `bun run city-drive:test`.

**iOS decision: edit `project.pbxproj` in place.** The "never edit `*.xcodeproj`" rule in
`tasks/START.md` is for XcodeGen apps (their project is generated from `project.yml`). A Capacitor
iOS project is the source of truth itself, and the script only rewrites the four version lines. The
alternative, an `.xcconfig` carrying the two settings, was rejected because `ios/debug.xcconfig`
is already the Debug base configuration and a second file would need new pbxproj wiring.

To release: bump `release.version` and/or `release.buildNumber` in the registry (the build number
must increase on every upload to either store), run `bun run sync-version`, then
`bun run city-drive:cap:sync`, and commit.

## Web: Vercel project and deploy workflow

Deployments go through GitHub Actions only. Never run the Vercel CLI (`vercel`, `vercel --prod`).
The workflow is `.github/workflows/deploy-city-drive-web.yml`; it is `workflow_dispatch` only,
with an `environment` input (`preview` or `production`).

### Vercel project settings (human, once)

| Setting | Value |
|---|---|
| Root Directory | `apps-games/city-drive` |
| Include source files outside of the Root Directory | **On** (the app depends on the workspace package `@city-drive/core`) |
| Framework Preset | Other |
| Install Command | `cd ../.. && bun install --frozen-lockfile` |
| Build Command | `bun run build` |
| Output Directory | `dist` |

The same install, build and output settings are in `apps-games/city-drive/vercel.json`, so the
dashboard and the file agree. Root Directory and the "include source files" switch exist only in
the dashboard.

### Secrets and variables (human, once)

| Name | Kind | Value |
|---|---|---|
| `CITY_DRIVE_VERCEL_PROJECT_ID` | repository secret **or** variable | the new project's id (Project > Settings > General) |
| `VERCEL_TOKEN` | repository secret | already used by `deploy-vercel.yml` |

The first workflow step stops the run with an error annotation when the project id or the token is
missing, before checkout or install. The job then runs the tests, builds (`bun run
city-drive:build`) and deploys with `W3Dev/vercel-deploy`, using the same org id as `deploy-vercel.yml`.
Run it from the Actions tab: choose "Deploy City Drive Web", pick `preview` first, smoke-test the
URL, then run it again with `production`.

### Headers

`apps-games/city-drive/vercel.json` sets: hashed bundles under `/assets/` (`name-<8 chars>.js`,
`.css`, `.wasm`) are `public, max-age=31536000, immutable`; any `.wasm` is served as
`application/wasm` (Rapier's wasm is inlined into a JS chunk today, so this is a guard); `/fonts/`
is cached for a week; everything gets `X-Content-Type-Options: nosniff`. Unhashed files such as
`assets/manifest.json`, models and audio keep Vercel's default revalidation, so a new build is
always picked up. `test/release/vercelConfig.test.ts` checks the rules against a built `dist/`.

### Browsers without WebGL2

`index.html` carries a `<noscript>` message. When JavaScript runs but a WebGL2 context cannot be
created, `src/support/guard.ts` shows a "cannot start here" screen (and removes the canvas)
instead of a blank page. Both are covered by `test/release/unsupported.test.ts`.

## Signing (human)

No keystore, signing config or key is committed, and none ever should be.

### Android

1. Create the app in Play Console with package `app.w3dev.citydrive` and turn on **Play App
   Signing** (default for new apps).
2. Generate an **upload key** outside the repo, for example under `~/keys/`:
   `keytool -genkeypair -v -keystore ~/keys/street-royale-upload.jks -alias upload -keyalg RSA
   -keysize 2048 -validity 10000`. Back it up in a password manager.
3. Build the bundle without committing a signing config, passing the key on the command line:
   `bun run city-drive:cap:sync`, then in `apps-games/city-drive/android`:
   `./gradlew bundleRelease -Pandroid.injected.signing.store.file=$HOME/keys/street-royale-upload.jks
   -Pandroid.injected.signing.store.password=... -Pandroid.injected.signing.key.alias=upload
   -Pandroid.injected.signing.key.password=...` (or Android Studio > Build > Generate Signed App
   Bundle). Use `JAVA_HOME=/data/tools/jdk21` on the build server.
4. The output is `app/build/outputs/bundle/release/app-release.aab`.

### iOS (on a Mac with Xcode 26)

1. `bun run city-drive:cap:sync`, open `apps-games/city-drive/ios/App/App.xcodeproj`.
2. Set the signing Team on the App target (automatic signing). Bundle id `app.w3dev.citydrive`.
3. Add `PrivacyInfo.xcprivacy` to the App target (see open question 16 in
   `.agents/games/city-drive/open-questions.md`) before the first upload.
4. Product > Archive, then Distribute App > App Store Connect.

## Upload checklist

Before every store upload:

- [ ] `bun run city-drive:test`, `bun run city-drive:build`, `bun run check:ci` pass.
- [ ] Registry release bumped, `bun run sync-version` run, `--check` clean.
- [ ] The privacy policy is published and its URL is in both store consoles.
- [ ] `store-listing.md` matches the console fields (title, short and full description).
- [ ] Device checkpoint (task 22) done: landscape lock, back button, pause and resume, save after
      force-kill, audio unlock, haptics, notch and safe areas; frame rate per district.

Google Play (internal testing track first):

- [ ] Create the app, set default language, free, game, category Racing.
- [ ] App content: privacy policy URL, ads = No, content rating questionnaire, target audience 13+,
      Data safety = no data collected or shared.
- [ ] Store listing: title, short description, full description, icon 512x512, feature graphic
      1024x500, phone screenshots, 7" and 10" tablet screenshots (plan in `store-listing.md`).
- [ ] Upload the signed `.aab` to Internal testing, add testers, install from the Play link.

App Store Connect:

- [ ] Create the app record with bundle id `app.w3dev.citydrive`; name, subtitle, keywords,
      description, promotional text, category Racing (secondary Simulation).
- [ ] App Privacy = Data Not Collected; privacy policy URL; age rating questionnaire.
- [ ] Screenshots for the required device sizes.
- [ ] Upload the archive, wait for processing, then TestFlight internal testing.

Web:

- [ ] Vercel project created with the settings above; `CITY_DRIVE_VERCEL_PROJECT_ID` set.
- [ ] Run the workflow with `preview`, smoke-test on desktop and phone, then `production`.
