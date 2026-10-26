---
epic: 23-web-dress-rehearsal
task: 07-capacitor-packaging
status: done
commit_scope: dress-rehearsal
depends_on: [23-web-dress-rehearsal/06-art-integration]
estimate: M
owner: agent
---

# Capacitor Android/iOS projects, icons and splash

## Goal

Add the Capacitor 8 Android and iOS projects to the app, generate icons and splash screens with `@capacitor/assets` from the accepted icon and key art (or a code-drawn fallback), run `cap sync`, and prove the native configuration with file-reading tests. No Gradle build, no Xcode build, no emulator.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/dress-rehearsal/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Identity:** `appId` `app.w3dev.dressrehearsal`, `appName` "Dress Rehearsal", `webDir` `dist`, no `server.url` (already in `capacitor.config.ts` and covered by `test/config.test.ts`).
- **Commands** (run from `apps-games/dress-rehearsal`, offline-capable, no Java or Xcode needed): `bun run build`, `bunx cap add android`, `bunx cap add ios`, `bunx capacitor-assets generate --android --ios`, `bunx cap sync`. Capacitor 8 uses Swift Package Manager for iOS, so CocoaPods should not be required; if `cap sync` fails only because CocoaPods, Java or Xcode is missing, record the exact message in `open-questions.md` and in the evidence README, and verify the project files by tests instead. Never install a JDK and never run `gradlew` or `xcodebuild`.
- **Sources for assets:** `assets/icon-only.png` (1024 x 1024, opaque) from the accepted `icon` master; `assets/splash.png` and `assets/splash-dark.png` (2732 x 2732) composed with sharp from the accepted `key-art` master centred on the `night` colour `#1c1816` (title-safe band kept). If those slots are missing or rejected, `scripts/draw-fallback-icon.ts` renders a code-drawn hanger-and-ribbon badge from the palette tokens and the splash is the badge on `#1c1816`; the evidence README says which path was used.
- **Portrait only:** Android activity `android:screenOrientation="portrait"`; iOS `UISupportedInterfaceOrientations` (and the iPad variant) contain only `UIInterfaceOrientationPortrait`. The kit lifecycle also locks portrait at runtime.
- **Network permission:** the game makes no network calls. Capacitor adds `INTERNET` by default; keep it unless the owner decides otherwise (`open-questions.md` Q9) because the WebView loader is not verified without a device.
- **Git hygiene:** generated native projects are committed (source files only). An app-level `.gitignore` excludes build outputs (`android/**/build`, `android/.gradle`, `android/local.properties`, `ios/App/build`, synced `public` copies of the web build as the Capacitor templates ignore them) and `node_modules/.cache`.

## Implementation Checklist

- [x] Build the web bundle, add both platforms, generate assets, run `cap sync`; capture the command output (trimmed) in `.agents/resources/2026-10-23/web-games/dress-rehearsal/07/README.md`.
- [x] Write `scripts/build-icons.ts` (composes `assets/icon-only.png`, `assets/splash.png`, `assets/splash-dark.png` with sharp from masters or the fallback) and `scripts/draw-fallback-icon.ts`; add `assets/` sources to the repo.
- [x] Set portrait orientation in `android/app/src/main/AndroidManifest.xml` and `ios/App/App/Info.plist`; set the display name, status bar style and `viewport-fit` consistent with `index.html`.
- [x] Confirm `capacitor.plugins.json` (Android) and the iOS package manifest list `@capacitor/app`, `haptics`, `preferences`, `screen-orientation`, `share` and `status-bar`, and nothing else.
- [x] Add `.gitignore` entries and verify `git status` shows only intended native files.
- [x] `test/native.test.ts` (reads files with `node:fs`): Android `applicationId` and `namespace` equal the appId, app name string equals the working title, manifest has portrait orientation and the `android:allowBackup` decision recorded, no `usesCleartextTraffic="true"`, launcher icon resources exist at every density, splash drawable exists; iOS bundle identifier equals the appId, display name equals the title, portrait-only orientations, icon set contains the 1024 marketing icon, launch storyboard or splash image set exists; both `capacitor.config.json` copies match `capacitor.config.ts` values (no `server.url`); plugin lists exactly match the dependency list in `package.json`; `dist` is gitignored but `android` and `ios` project files are tracked.
- [x] `test/assets-sources.test.ts`: `assets/icon-only.png` is 1024 x 1024 and opaque, splash images are 2732 x 2732, read with sharp.
- [x] Update `decisions-log.md` (icon path used, INTERNET decision) and `open-questions.md` (cap sync outcome, Q9).

## Files Touched

- `apps-games/dress-rehearsal/android/**`, `ios/**` (generated, source files only), `assets/**`, `resources` if the tool creates it
- `apps-games/dress-rehearsal/scripts/{build-icons,draw-fallback-icon}.ts`, `.gitignore`
- `apps-games/dress-rehearsal/test/{native,assets-sources}.test.ts`
- `.agents/games/dress-rehearsal/{decisions-log,open-questions}.md`
- `.agents/resources/2026-10-23/web-games/dress-rehearsal/07/README.md`
- `tasks/epics/23-web-dress-rehearsal/STATUS.md` (tick task 07)

## Acceptance Criteria

- `android/` and `ios/` projects exist with the correct id, name, portrait orientation, icons and splash, and all six plugins registered.
- `cap sync` succeeded, or the exact environmental limitation is recorded and the project files are validated by tests.
- Tests prove the native configuration without building; no JDK, Gradle, Xcode or emulator was used.
- The four verification commands pass and the committed tree contains no build outputs.

## Verification Commands

- `bun run --filter '@web-games/dress-rehearsal*' typecheck`
- `bun run --filter '@web-games/dress-rehearsal*' test`
- `bun run --filter '@web-games/dress-rehearsal' build`
- `bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core`

## Out of Scope

- Building APK/AAB/IPA files, signing, store provisioning or uploading.
- Running the app on any device or emulator.
- Changing plugin versions or adding plugins (a Filesystem plugin for native image sharing is an owner decision, `open-questions.md` Q4).

## Commit message

`feat(dress-rehearsal): add Capacitor android and ios projects with icons and splash [23-web-dress-rehearsal/07]`
