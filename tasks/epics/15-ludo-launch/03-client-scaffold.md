---
epic: 15-ludo-launch
task: 03-client-scaffold
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/02-rules-bots-fixtures]
estimate: L
---

# Scaffold the Flutter client app

## Goal

Turn the `apps-native/games/ludo` placeholder from task 00 into a real,
buildable Flutter app matching the shape of `apps-native/games/merge_relay`
(pubspec, `lib/`, `assets/`, `content/`, `ios/`, `android/`), Android first,
with an asset manifest scaffold defining named art/audio slots for every
later task to fill in.

## Context/Decisions

- Mirror `apps-native/games/merge_relay/pubspec.yaml` exactly in shape:
  `flame`, `path_provider`, `crypto` as needed, `ludo_rules: {path:
  ../packages/ludo_rules}`, `platform_core: {path: ../packages/
  platform_core}`, `flutter_lints`/`flutter_test` dev deps, `resolution:
  workspace`, same SDK/Flutter version constraints as the other five apps.
  Do not add `cloud_firestore`, `firebase_auth`, `google_sign_in`, or audio
  packages yet — those are added by the tasks that use them (task 24, task
  06) so each task's dependency footprint is reviewable on its own.
- Directory layout under `lib/`: `main.dart`, `src/app.dart` (root widget +
  routing), `src/screens/` (empty for now, populated by tasks 07-11),
  `src/state/` (empty), `src/game/` (empty, populated by tasks 04-05),
  `src/assets/` (asset manifest). `merge_relay` does not use this nested
  `lib/src/{screens,state,game,assets}` layout (confirm this by reading
  `merge_relay/lib/src/` before assuming otherwise) — this per-concern
  subfolder split is a **new convention this task establishes for Ludo**,
  not a port of an existing pattern; later Ludo tasks (04-12) must follow
  it consistently rather than each inventing their own layout.
- Asset manifest: `lib/src/assets/ludo_art_manifest.dart` (or `.json` loaded
  at runtime — implementer picks, but it must be a single named-slot registry,
  not scattered string literals) declaring every visual/audio asset slot the
  later tasks need by name: `board_background`, `token_<color>`,
  `dice_face_1..6`, `home_stretch_<color>`, `capture_particle`,
  `confetti`, `sfx_dice_roll`, `sfx_token_step`, `sfx_capture`, `sfx_home`,
  `sfx_win`, `sfx_button`, `sfx_turn_alert`, `music_loop`. Each slot's
  initial value is a reference to a **code-drawn** implementation (tasks 04
  and 05 fill these in with Flame/CustomPainter, not bitmaps); the manifest's job
  is to name the slot so a later human-reviewed art session can swap a
  bitmap asset path in without touching gameplay code. Document this
  contract in a doc comment at the top of the manifest file.
- Registry-driven config: reuse the `games:codegen`-generated
  `apps-native/games/ludo/game.config.json` (task 00) for app/environment/
  identity values, the same way `merge_relay` consumes its generated config
  — do not hardcode `app.w3dev.ludo` anywhere in `lib/`.
- Native projects: generate Android (and iOS, even though Android ships
  first — the registry declares `platforms: ["android"]` for v1 but the
  workspace convention still expects both native folders to exist so
  `games:xcodegen`/tooling don't special-case Ludo) via the same mechanism
  used for the other five apps' native scaffolding (`bun run games:native`,
  `bun run games:xcodegen` per `docs-internal/gaming/commands.md`) rather
  than hand-authoring `android/`/`ios/` — confirm the exact bootstrap
  command by reading how `merge_relay`'s native folders were produced
  (check its `AGENTS.md`/task history if referenced) before assuming.
- Offline-first degrade: `main.dart` must not crash or block app start if
  Firebase config (`google-services.json`) is absent — wrap any future
  Firebase initialization point in a guarded, optional bootstrap so
  Android-first debug builds without Play Services config still launch
  straight to local/offline modes. This task only needs to prove the app
  boots and shows a placeholder home screen with no Firebase dependency
  present at all yet (task 24 adds Firebase and must preserve this
  guarantee).

## Implementation Checklist

- [ ] Create `apps-native/games/ludo/pubspec.yaml` per the shape above.
- [ ] Create `lib/main.dart`, `lib/src/app.dart` with a minimal
  `MaterialApp`/Flame `GameWidget` root showing a placeholder home screen
  (real screens are tasks 14-16).
- [ ] Create `lib/src/assets/ludo_art_manifest.dart` with every named slot
  listed above, each initially pointing at a `TODO(task-12)`/
  `TODO(task-13)` placeholder implementation that still compiles (e.g. a
  solid-color `CustomPainter` stub for visuals, a silent no-op for audio).
- [ ] Create `apps-native/games/ludo/content/manifest.json` (the default
  manifest path/shape from `scripts/games/content.ts`'s `manifestSpec()` —
  `ludo` is not `meme_court`/`snapquest`, so `relativePath` is
  `content/manifest.json` and `appIdRequired` is `true`) with `app_id:
  "ludo"`, `public_title` matching the registry's `publicTitle`, and a valid
  version field (one of `content_version`/`rule_version`/`version`/
  `schema_version`, matching `^[a-z0-9][a-z0-9._-]*$` if a string). Ensure no
  JSON file under `content/` or `assets/content/` contains any of the
  blocked keys in `scripts/games/content.ts`'s `forbiddenKeys`
  (`raw_photo`, `photo_bytes`, `image_bytes`, `caption_text`,
  `customer_export`, `exif`, `ocr`, matched case/underscore-insensitively) —
  `validateContent()` also requires at least one JSON file under
  `content/`/`assets/content/`, which the manifest itself satisfies.
- [ ] Generate `android/` (and `ios/`) native projects via the documented
  `games:native`/`games:xcodegen` bootstrap, with application id
  `app.w3dev.ludo` / debug suffix `.debug`. This must satisfy
  `scripts/games/config.ts`'s `validateNativeIds()`: `android/app/
  build.gradle.kts` declares `applicationId = "app.w3dev.ludo"` and exactly
  two literal `applicationIdSuffix = ".debug"` assignments guarded by `if
  (gameEnvironment == "debug")` (mirror `pocket_biome`'s
  `build.gradle.kts`, not `merge_relay`'s customized one); `android/app/
  src/main/kotlin/app/w3dev/ludo/MainActivity.kt` exists and declares
  `package app.w3dev.ludo`; `ios/Flutter/Debug.xcconfig` contains
  `PRODUCT_BUNDLE_IDENTIFIER = app.w3dev.ludo.debug` and `ios/Flutter/
  Release.xcconfig` contains `PRODUCT_BUNDLE_IDENTIFIER = app.w3dev.ludo`.
  Do not bundle any optional dependency
  (`camera`/`google_ml_kit`/`image_picker`/`permission_handler`/
  `purchases_flutter`/`in_app_purchase`/`google_mobile_ads`/
  `firebase_messaging`/`flutter_local_notifications`/`share_plus`) or
  declare any permission (e.g. `android.permission.CAMERA`/
  `NSCameraUsageDescription`) that isn't in the registry's enabled
  capabilities/permissions for `ludo` — see
  `scripts/games/config.ts`'s `validateOptionalNativeAccess()`.
- [ ] Add `test/widget_test.dart` asserting the app boots and renders the
  placeholder home screen with no Firebase/network dependency.
- [ ] Re-run `games:codegen` after any registry tweak from this task so
  `apps-native/games/ludo/game.config.json` is not stale (`scripts/games/
  config.ts`'s `validateGameConfigs()` byte-compares it against
  `configForGame()`'s current output).
- [ ] Confirm `bun run games:list` and `bun run games:doctor` recognize the
  new app's toolchain requirements with no missing-file errors.

## Files Touched

- `apps-native/games/ludo/pubspec.yaml`
- `apps-native/games/ludo/lib/main.dart`
- `apps-native/games/ludo/lib/src/app.dart`
- `apps-native/games/ludo/lib/src/assets/ludo_art_manifest.dart`
- `apps-native/games/ludo/assets/*`
- `apps-native/games/ludo/content/*`
- `apps-native/games/ludo/android/*` (generated)
- `apps-native/games/ludo/ios/*` (generated)
- `apps-native/games/ludo/test/widget_test.dart`

## Acceptance Criteria

- `bun run games:build -- --app ludo --platform android --mode debug
  --environment debug` produces a debug APK with application id
  `app.w3dev.ludo.debug`.
- The widget test boots the app and finds the placeholder home screen with
  zero Firebase/network calls made.
- The asset manifest lists every slot named in Context with no orphaned
  references elsewhere in `lib/` (nothing references an asset string not
  present in the manifest).
- No emulator/simulator was booted to produce this evidence.
- `bun run games:validate -- --strict` passes with zero `ludo`-related
  errors (content manifest, native Android/iOS identity, and generated
  config checks all satisfied per the Implementation Checklist above).

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- `bun run games:build -- --app ludo --platform android --mode debug --environment debug`

## Out of Scope

- Real Flame board/token/dice rendering (tasks 04-05).
- Audio playback (task 06).
- Any real screen content beyond a placeholder (tasks 07-11).
- Firebase/network integration (tasks 24-26).

## Commit message

`feat(ludo): scaffold the flutter client app and asset manifest [15-ludo-launch/03]`
