---
epic: 19-web-lantern-loops
task: 07-capacitor-packaging
status: in-progress
commit_scope: lantern-loops
depends_on: [19-web-lantern-loops/06-art-integration]
estimate: M
owner: agent
---

# Capacitor Android/iOS projects, icons and splash

## Goal

Generate the Capacitor 8 `android` and `ios` platform projects for Lantern Loops, with the launcher
icon and splash screen made from the accepted `icon` and `key-art` (or from code-drawn fallbacks when
those were rejected), portrait only, app id `app.w3dev.lanternloops`, name "Lantern Loops", and the
web build synced into both projects. Nothing is built with Gradle or Xcode, no JDK is installed, no
simulator or device is touched. Tests read the generated files and prove the configuration.

## Context / Decisions

- Follow the City Drive pattern (`apps-games/city-drive/{android,ios,resources}`): platform projects
  committed inside the app folder, brand sources in `resources/`, `capacitor.config.ts` already has
  `appId`, `appName`, `webDir: "dist"` and no `server.url` (a test in the skeleton keeps this).
- Dependencies are already declared (`@capacitor/android`, `@capacitor/ios`, `@capacitor/cli`,
  `@capacitor/assets`, `sharp`); add or change none. Use `bunx cap` and `bunx capacitor-assets` from the
  app directory.
- Capacitor 8 uses Swift Package Manager for iOS: expect `ios/App/CapApp-SPM`; do not run CocoaPods.
  Android needs no JDK for `cap add` and `cap sync`; do not run `./gradlew`.
- Icon sources: `resources/icon.png` (1024x1024, opaque; the accepted `icon` master, rendered from the
  evidence master WebP with sharp), `resources/icon-foreground.png` and `resources/icon-background.png`
  for the Android adaptive icon (foreground = the lantern motif on transparent with 66% safe zone,
  background = flat indigo `#12132E` or a plain crop), `resources/splash.png` and `splash-dark.png`
  (2732x2732: indigo field `#12132E` with the key-art lantern motif centred inside the safe 1200 px
  square). If `icon` or `key-art` were rejected, render the fallback brand mark (SVG lantern on indigo,
  the same drawing as the in-app placeholder) with sharp via `scripts/render-brand-sources.ts`; record
  which path was used in the evidence README.
- Orientation: Android `android:screenOrientation="portrait"` on the main activity; iOS
  `UISupportedInterfaceOrientations` (and the iPad variant) portrait only; the kit lifecycle lock stays as a
  second layer.
- Permissions: keep Capacitor's default Android manifest unchanged (it declares `INTERNET`); whether to
  strip it is open question Q6 and not decided here.
- Root `.gitignore` is outside this epic's scope: rely on the `.gitignore` files that `cap add` writes
  inside `android/` and `ios/`. If build output (`android/app/src/main/assets/public`, `ios/App/App/public`)
  would otherwise be committed, check the generated ignore files and keep generated web copies out of the
  commit; if a root `.gitignore` change is truly needed, stop and report blocked naming the change.
- `biome.json` already excludes `apps-games/**/android` and `apps-games/**/ios`, so synced web bundles are
  never linted; confirm `bunx biome check` stays green after the sync.
- Check the committed size: platform folders should stay far below 5 MB (excluding web assets).

## Implementation Checklist

- [x] `bun run --filter '@web-games/lantern-loops' build` then, from `apps-games/lantern-loops`,
      `bunx cap add android` and `bunx cap add ios`; commit the generated project files.
- [x] `scripts/render-brand-sources.ts` (re-runnable): writes `resources/*.png` from the accepted art
      (evidence masters) or from the code-drawn fallback.
- [x] `bunx capacitor-assets generate --android --ios` (icons, adaptive icons, splash for light and dark);
      commit the outputs; keep `resources/` as the single source.
- [x] Set orientation in `AndroidManifest.xml` and `Info.plist`; set display name, bundle id, version
      name `0.1.0` / code 1 (Android) and marketing version 0.1.0 / build 1 (iOS) to match the package
      version; set status bar style and launch screen background to the indigo.
- [x] `bunx cap sync` (copies `dist` and plugin config into both projects); save the command output under
      `.agents/resources/2026-10-23/web-games/lantern-loops/07/cap-sync.log` (strip absolute home paths if any).
- [x] Add the `android` and `ios` package scripts only if missing (`cap:sync` exists); no new dependency.
- [x] Tests (below), evidence README listing commands, versions of `@capacitor/cli` and
      `@capacitor/assets`, which icon path was used, and file counts.
- [x] Update `assets-index.md` (icon/splash status) and `decisions-log.md` if anything deviates.

## Files Touched

- `apps-games/lantern-loops/{android,ios,resources}/**`, `scripts/render-brand-sources.ts`, `tsconfig.json`
  (include `scripts`, if not already), `package.json` (scripts only, if needed)
- `apps-games/lantern-loops/test/capacitor/*.test.ts`
- `.agents/resources/2026-10-23/web-games/lantern-loops/07/**`
- `.agents/games/lantern-loops/{assets-index,decisions-log,open-questions}.md`

## Acceptance Criteria

- [x] `android/` and `ios/` exist with the Capacitor 8 structure; a test asserts the Android
      `applicationId`/`namespace` and the iOS bundle identifier equal `app.w3dev.lanternloops`, the app
      name is "Lantern Loops" in `strings.xml` and `Info.plist`, versions are 0.1.0, and
      `capacitor.config.ts` still has no `server.url`.
- [x] Portrait only: manifest has `android:screenOrientation="portrait"`; `Info.plist` lists only portrait
      orientations for iPhone and iPad.
- [x] Icons: the Android `mipmap-*` launcher icons (all five densities, round and adaptive foreground)
      and the iOS `AppIcon.appiconset` (1024 marketing icon present, no alpha) exist and are non-empty;
      splash assets exist for light and dark; `resources/` holds the five source PNGs at the stated sizes
      (test reads PNG headers).
- [x] The synced web copy matches `dist` (test compares `index.html` hash after a build, skipped with a clear
      message only if `dist` is absent) and contains no `server.url` in either `capacitor.config.json`.
- [x] No Gradle build, Xcode, JDK install, simulator or device command was run (stated in the evidence README, including the "Syncing Gradle" step that `cap add android` runs inside the CLI).
- [x] Committed platform folders contain no build output, no `local.properties`, no keystores.
- [x] All verification commands below pass.

## Verification Commands

```
bun run --filter '@web-games/lantern-loops*' typecheck
bun run --filter '@web-games/lantern-loops*' test
bun run --filter '@web-games/lantern-loops' build
bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core
```

## Out of Scope

Building an APK/AAB/IPA, installing JDK, Android SDK or Xcode tooling, signing, store submission,
store graphics beyond noting needs, push or other plugins, changing the Android `INTERNET` permission
(Q6), editing the root `.gitignore`.

## Commit message

`feat(lantern-loops): Capacitor android and ios projects with icons and splash [19-web-lantern-loops/07]`
