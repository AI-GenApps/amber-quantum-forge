# Glow Rescue release build and manifest inspection, 2026-10-16

**Device evidence note:** the `device/` subfolder is NOT part of the task 27 work described below (which used no device); it comes from a separate earlier performance/smoke run of the pre-task-27 release APK (sha256 `448696e4...`). See `device/README.md`.

Branch `main`, commit `e44495c`, Flutter from `$HOME/flutter/bin`, `ANDROID_HOME=~/Library/Android/sdk` (build-tools 36.0.0, NDK 28.2). No device was used (no adb, run or install). Signed with a throwaway key `CN=NOT FOR UPLOAD` (alias `testkey`, PKCS12, 30 days) generated outside the repo; its password lives only in the scratchpad. Artifacts are NOT in the repo. Nothing was committed; the repo working tree was unchanged by the build (`git status` shows only the pre-existing untracked entries).

## 1. Build

### Commands that worked

```bash
export PATH="$HOME/flutter/bin:$PATH"
export ANDROID_KEYSTORE_PATH=<scratchpad>/test-keystore/test.jks ANDROID_KEY_ALIAS=testkey \
       ANDROID_KEY_PASSWORD=<throwaway> ANDROID_STORE_PASSWORD=<throwaway>

# Production AAB, via the repo CLI (runs `flutter build appbundle --release
#   --android-project-arg gameEnvironment=production --dart-define GAME_ENVIRONMENT=production
#   --dart-define APP_VERSION=0.1.0` in apps-native/games/merge_relay)
bun run games:build -- --app merge_relay --platform android --mode aab --environment production

# Production-environment release APKs (the CLI refuses this, see below), same flags by hand
cd apps-native/games/merge_relay
flutter build apk --release --split-per-abi --android-project-arg gameEnvironment=production \
  --dart-define GAME_ENVIRONMENT=production --dart-define APP_VERSION=0.1.0
```

`games:build` has no `--help`; `--app` is required and the bare `--help` prints `--app is required for games:build`. The CLI flags are `--app --platform android|ios --mode --environment debug|staging|production`.

Findings about the CLI (`scripts/games/cli-build.ts:193-196`): with `--environment production` it only accepts Android `--mode aab` (iOS archive/ipa); `--mode release` prints `NOT RUN: production builds use Android --mode aab ...` and exits 2. So a production-signed APK cannot be built through `games:build`; I called `flutter build apk` directly with the identical gradle/dart-define arguments. The production environment did not refuse for missing values: `productionIdentityErrors` only checks the Android ID and version (both present), and the four `ANDROID_*` signing variables are the only hard requirement (`build.gradle.kts:78-89` throws without them). Placeholders such as the Play Games ids are NOT required, which is exactly why the empty values below ship silently.

### Artifacts (scratchpad: `/private/tmp/claude-501/-Users-ashutosh-Dev-W3DevMobile-amber-quantum-forge/99f8749b-f102-44d4-a8f1-aa6565a3bca0/scratchpad/`)

| Artifact | Path (under scratchpad) | Size | sha256 |
|---|---|---|---|
| AAB (3 ABIs) | `glow-rescue-release.aab` (copy of `apps-native/games/merge_relay/build/app/outputs/bundle/release/app-release.aab`) | 55,389,911 B = 55.4 MB (52.8 MiB) | `d9ef7fe12b53c54c5edafd3a8418f2d0988b25126786df987d8486a9dbed792d` |
| APK arm64-v8a | `out/app-arm64-v8a-release.apk` | 23,116,591 B = 23.1 MB (22.0 MiB) | `448696e45e0af6bd1df2baa8e1851efb94b506c89c75c008eaa6175a6b92745e` |
| APK armeabi-v7a | `out/app-armeabi-v7a-release.apk` | 20,492,537 B = 20.5 MB | `f8b97b62c10e56d8c58cba193ebf6361337461226f1d553f211e58995b739082` |
| APK x86_64 | `out/app-x86_64-release.apk` | 24,600,366 B = 24.6 MB | `79c6a3d62fe717430aa02216c2c111cd74535780eb438d403bd29a5307352006` |

Build time: AAB 46 s wall (`bundleRelease` 42.1 s), APKs 16 s (`assembleRelease` 12.4 s). These ran on a warm Gradle daemon and warm caches, so they are not clean-build times. The AAB is large mostly because of non-delivered metadata: `BUNDLE-METADATA` holds ~63 MB uncompressed of native debug symbols (`.sym`) plus a 5.9 MB `proguard.map`; Play strips these from user downloads.

APK versionCode is 2001 for arm64 (Flutter adds 1000 x ABI index when splitting); the AAB uses the pubspec value (`version: 0.1.0+1`, so versionCode 1; I could not decode the AAB's versionCode with apkanalyzer, which fails with the same `NoSuchFileException: /AndroidManifest.xml` already recorded in `docs-internal/gaming/verification.md`; the AAB manifest string table shows versionName and the same placeholders as the APK).

## 2. Inspection (arm64 APK, `aapt2 dump badging/xmltree`, `apkanalyzer`, `apksigner`, `zipalign`, `llvm-readelf`; AAB cross-checked via `unzip` + strings of `base/manifest/AndroidManifest.xml`)

Full decoded manifest: scratchpad `manifest-arm64.txt`.

| Item | Value |
|---|---|
| applicationId | `app.w3dev.mergerelay` (release id, no `.debug`/`.staging` suffix) |
| versionName / versionCode | `0.1.0` / 2001 (APK arm64), 1 (AAB) |
| minSdk / targetSdk / compileSdk | 24 / 36 / 36 |
| Launcher label | `Glow Rescue` (also all localised labels) |
| Icon | present, adaptive icon (`res/BW.xml`, background + foreground drawables) |
| debuggable | false (`apkanalyzer manifest debuggable`) |
| usesCleartextTraffic | false |
| allowBackup | NOT set, so defaults to true; `fullBackupContent` and `dataExtractionRules` only exclude the `merge_relay_secure_auth.xml` shared prefs |
| extractNativeLibs | false |
| Signature | v2/v3 verified, signer `CN=NOT FOR UPLOAD`; `jarsigner -verify` on the AAB: "jar verified" |
| Permissions | `android.permission.INTERNET`; custom `app.w3dev.mergerelay.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (declared and used, protectionLevel signature, injected by androidx.core) |
| `<queries>` | PROCESS_TEXT intent (Flutter), packages `com.google.android.gms` and `com.android.vending` (the last two come from play-services-games-v2) |
| Native libs | `lib/arm64-v8a/` libflutter.so, libapp.so, libdartjni.so (APK); AAB has arm64-v8a, armeabi-v7a, x86_64 |
| 16 KB alignment | `zipalign -c -P 16 -v 4` on the arm64 APK: Verification successful; all three .so stored and aligned. ELF LOAD segment alignment: libflutter.so 0x10000, libapp.so 0x10000, libdartjni.so 0x4000 (16 KB), so all meet the 16 KB requirement |

Activities:

| Activity | exported | Source |
|---|---|---|
| `app.w3dev.mergerelay.MainActivity` | true | app (launcher) |
| `com.google.android.gms.games.internal.v2.resolution.GamesResolutionActivity` | false | play-services-games-v2 |
| `com.google.android.gms.games.internal.v2.appshortcuts.PlayGamesAppShortcutsActivity` | **true** | play-services-games-v2 |
| `com.google.android.gms.common.api.GoogleApiActivity` | false | play-services-base |

Intent filters (all on MainActivity):
1. MAIN / LAUNCHER.
2. VIEW + DEFAULT + BROWSABLE, `mergerelay://challenge`.
3. VIEW + DEFAULT + BROWSABLE, scheme `https`, **`host=""`** (EMPTY), `pathPrefix=/games/merge-relay/challenges`. No `autoVerify`.
4. Receiver `androidx.profileinstaller.ProfileInstallReceiver` (exported, DUMP-protected) with 4 profileinstaller actions (androidx, normal for Flutter).

Meta-data: `com.google.android.gms.games.APP_ID` = **`""` (EMPTY)**; `com.google.android.gms.games.SUPPRESS_GAME_PROFILE_CREATION` = true; `com.google.android.gms.games.version` and `com.google.android.gms.version` (SDK versions); `flutterEmbedding` = 2; `io.flutter.embedding.android.NormalTheme`; androidx.startup entries (`ProcessLifecycleInitializer`, `ProfileInstallerInitializer`) under `androidx.startup.InitializationProvider`.

Components from play-services-games-v2 (and its gms deps): `GamesResolutionActivity`, `PlayGamesAppShortcutsActivity`, meta-data `games.version` and `gms.version`, the two `<queries>` packages, `GoogleApiActivity`. `PlayGamesInitProvider` is correctly removed by `tools:node="remove"` (not in the merged manifest). No services. No other providers except androidx.startup.

BuildConfig (build.gradle.kts:112-141) also bakes empty `MERGE_RELAY_PGS_*` ids and an empty `MERGE_RELAY_PUBLIC_ORIGIN` into the dex; Kotlin code (`MergeRelayPlayGamesPlatform.kt`) only calls `PlayGames.*` clients when Dart invokes the bridge, and Dart gates all of it behind `mergeRelaySocialEnabled` (default false). The bridge object is created in `MainActivity.configureFlutterEngine` but only registers a method channel, so I found no startup path that touches the SDK, so I do not expect a crash on launch from the empty APP_ID. This is code reading only; not run on a device.

### Top 10 largest entries in the arm64 APK (uncompressed size)

| # | Entry | Size |
|---|---|---|
| 1 | lib/arm64-v8a/libflutter.so (stored) | 11.75 MB |
| 2 | lib/arm64-v8a/libapp.so (Dart AOT) | 5.24 MB |
| 3 | assets/art/homeScene.png | 1.07 MB |
| 4 | assets/art/boardFrame.png | 0.91 MB |
| 5 | classes.dex | 0.79 MB (0.37 compressed) |
| 6 | NunitoSans variable TTF | 0.57 MB |
| 7 | NunitoSans-Italic variable TTF | 0.56 MB |
| 8 | assets/art/logoStacked.png | 0.23 MB |
| 9 | assets/audio/music_loop.ogg | 0.21 MB |
| 10 | assets/art/chapterCard_3.png | 0.19 MB |

Groups (compressed): libflutter 11.75 MB, libapp 5.24 MB, art (23 PNGs) 4.19 MB, fonts 0.65 MB, dex 0.37 MB, res+arsc 0.31 MB, audio 0.26 MB, other assets 0.13 MB, libdartjni 0.13 MB.
Note: `libflutter.so` plus `libapp.so` are 17 of the 23 MB; art is 4.2 MB. `libdartjni.so` and `jni`/`jni_flutter` come from a transitive dependency.

## 3. Manifest vs docs: mismatches and risks

Compared with `.agents/games/merge-relay/store-listing.md`, `docs-public/legal/glow-rescue-privacy-policy.md`, `docs-internal/gaming/app-source-registry.md`.

Blocking or likely Play Console / runtime risk:
1. **Empty `com.google.android.gms.games.APP_ID`** (`AndroidManifest.xml:12-14`, value from `mergeRelayPgsApplicationId`, `build.gradle.kts:36-39,105,108`). Play Games v2 expects a numeric Play Games project id here; the empty string ships in production because nothing in the build requires it. No evidence of a launch crash in v1 (SDK is only touched when the gated social feature calls it), but if social/PGS is ever enabled this fails at sign-in, and an empty or invalid APP_ID is a likely pre-launch report / review flag. If PGS is not shipping in v1, the safest fix is to drop the SDK.
2. **https intent filter with empty host** (`AndroidManifest.xml:50-55`, `${mergeRelayPublicHost}` from `build.gradle.kts:44-51,111`). Installs fine per aapt2, but it is an invalid or meaningless App Link declaration (no host, no `autoVerify`), advertises a BROWSABLE https handler the app cannot service in v1, and may be flagged by Play's app-links checks. Whether Android treats an empty-host https authority as match-nothing or match-all could not be tested without a device.
3. **Play Games SDK bundled while the Data safety draft and policy say there is no SDK/no data**: store-listing "Data safety" evidence cites only `pubspec.yaml` and never the Gradle dependency `play-services-games-v2:22.1.0` (`build.gradle.kts:170`). The SDK adds `PlayGamesAppShortcutsActivity` (exported=true), the `<queries>` for `com.google.android.gms` and `com.android.vending`, and the games version meta-data. The doc's "No SDK / no other permission / exactly one permission" statement is therefore incomplete (also, the merged manifest has two permissions: INTERNET and the androidx signature-level DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION). Play's SDK disclosure ("Google Play Games Services" on the Play SDK Index) means the Data safety "no data" answers must be re-justified (dormant, never invoked) or the SDK removed.
4. **Backups contradict the privacy policy**: `android:allowBackup` is not set (defaults to true), only the secure-auth prefs are excluded, so the save JSON under the app documents dir is eligible for Android auto-backup to Google Drive (and device transfer). The policy (`glow-rescue-privacy-policy.md:52`) and store-listing FAQ state there is "no cloud backup or sync". Data safety "no data collected/shared" is usually still defensible for OS backup, but the sentence is wrong as written.

Lower severity:
5. INTERNET permission remains with no active network code; the policy and listing already explain this and it is allowed, but it does conflict with the plain-language "makes no network calls" only if the reviewer ignores the explanation.
6. `mergerelay://challenge` custom-scheme filter is also dead in v1; harmless.
7. Placeholders (human): privacy policy URL and support contact are `TBD` (`glow-rescue-privacy-policy.md`, store-listing); 512x512 icon not exported; `docs-internal/gaming/app-source-registry.md:7` still says "Merge Relay".
8. Signing: the AAB here is signed by the test key and cannot be uploaded; a real upload keystore is still needed (human).
9. Claims confirmed true: "no ads, no IAP, no accounts" holds at manifest level (no ad/billing SDK, no ADID permission `com.google.android.gms.permission.AD_ID`, no location/camera/storage/contacts permissions), debuggable=false, cleartext off, label `Glow Rescue`.

## 4. Size budget

The repo's stated budget (epic 16 tasks 13 and 23, `tasks/epics/16-games-portfolio-wave2/13-mr-local-quality.md:74-75` and `23-mr-art-final-and-integrate.md:32`): "the arm64 release APK stays at or under 40 MB", measured with `flutter build apk --release --split-per-abi`. Result: **arm64 APK = 23.1 MB (22.0 MiB): PASS** (17 MB margin). The AAB (55.4 MB) has no budget of its own; its per-device download is approximately the arm64 APK size. Audio budget (task 10, all audio under 1.5 MB): 0.26 MB compressed, PASS. Note: the `budgets.md` that task 13 says must record the size does not exist in `.agents/games/merge-relay/` (not created here by instruction), so the measurement is recorded only in this file.

## 5. Recommended minimal fix list (NOT applied)

1. `apps-native/games/merge_relay/android/app/src/main/AndroidManifest.xml:50-55` remove the https intent filter (or give it a build-time guard so it only exists when `MERGE_RELAY_PUBLIC_ORIGIN` is set; manifest placeholders cannot omit an element, so use a debug/staging/production source-set or `tools:node="remove"` in the production variant).
2. `AndroidManifest.xml:11-14` and `build.gradle.kts:104-108,170`: for v1 either remove `play-services-games-v2` plus the APP_ID meta-data, the SUPPRESS meta-data (`:15-17`), the `PlayGamesInitProvider` removal (`:18`) and the Kotlin PGS bridge usage; or make the production build fail if `mergeRelayPgsProductionApplicationId` is blank while the SDK is bundled (add a `GradleException` next to `build.gradle.kts:104`).
3. `AndroidManifest.xml:4-10`: add `android:allowBackup="false"` (or extend `res/xml/backup_rules.xml` and `data_extraction_rules.xml` if save-backup is wanted, then fix the policy text at `glow-rescue-privacy-policy.md:52`).
4. `.agents/games/merge-relay/store-listing.md` (Data safety section, ~line 77-134): add the Gradle-level SDK to the evidence, and mention the extra permission; update after item 2.
5. `scripts/games/cli-build.ts:193-196`: allow `--mode release` APK in production for perf testing, or document the direct `flutter build apk` command; add a production check that rejects empty PGS ids and public host when social is on.
6. `docs-internal/gaming/app-source-registry.md:7`: rename "Merge Relay" to "Glow Rescue". Create `.agents/games/merge-relay/budgets.md`.

## After task 27 (release manifest hardening), 2026-10-16

Task: `tasks/epics/16-games-portfolio-wave2/27-mr-release-manifest-hardening.md`. Owner decision: the Play Games Services SDK (`play-services-games-v2:22.1.0`) and all PGS code stay; the fixes make the manifest and disclosures correct for "SDK present, gated off". No device was used (no adb, run or install). Same throwaway key (`CN=NOT FOR UPLOAD`, outside the repo, passwords only in the scratchpad). Artifacts are NOT in the repo. Decoded manifests are in `manifests/` next to this file:
`before-task27-arm64-apk.txt`, `after-task27-arm64-apk.txt`, `after-task27-aab.txt`, `after-task27-arm64-apk-sample-ids.txt`, `pgs-sdk-22.1.0-app-id-read.txt`.

### Commands (exactly as in sections 1)

```bash
export PATH="$HOME/flutter/bin:$PATH"
export ANDROID_KEYSTORE_PATH=<scratchpad>/test-keystore/test.jks ANDROID_KEY_ALIAS=testkey ANDROID_KEY_PASSWORD=<throwaway> ANDROID_STORE_PASSWORD=<throwaway>
bun run games:build -- --app merge_relay --platform android --mode aab     --environment production   # AAB, 21 s
bun run games:build -- --app merge_relay --platform android --mode release --environment production   # arm64/v7a/x86_64 release APKs, 9 s (NEW: was refused before task 27)
# Extra build (run first), fake values, to prove the conditional entries (not an artifact to keep):
MERGE_RELAY_PGS_PRODUCTION_APPLICATION_ID=1234567890 MERGE_RELAY_PGS_PRODUCTION_LEADERBOARD_ID=fake-leaderboard \
MERGE_RELAY_PUBLIC_ORIGIN=https://glow-rescue.example.com \
bun run games:build -- --app merge_relay --platform android --mode release --environment production
```

Inspection: `aapt2 dump xmltree/badging`, `apkanalyzer manifest debuggable`, `apksigner verify`, `zipalign -c -P 16 -v 4`, `llvm-readelf -lW`, `jarsigner -verify`. bundletool is not installed here, so the AAB manifest was decoded by repackaging `base/manifest/AndroidManifest.xml` + `resources.pb` + `res/` into a throwaway zip and running `aapt2 dump xmltree` on it (it decoded; versionCode 1, versionName 0.1.0, label Glow Rescue).

### Artifacts (scratchpad `/private/tmp/claude-501/-Users-ashutosh-Dev-W3DevMobile-amber-quantum-forge/99f8749b-f102-44d4-a8f1-aa6565a3bca0/scratchpad/`)

| Artifact | Path | Size | sha256 |
|---|---|---|---|
| AAB (production, no PGS id, no origin) | `out-after/glow-rescue-release.aab` | 55,389,929 B (before 55,389,911) | `f0a43826f3c7fcd28acdbc522d1eea56a245e3134eb8e448d52eaf0614a34d20` |
| **APK arm64-v8a (for the later on-device launch check; package id `app.w3dev.mergerelay`)** | `out-after/app-arm64-v8a-release.apk` | 23,116,671 B = 23.1 MB (before 23,116,591) | `314a511983343e8ff5934a323fd54bc05d8f4e36ff5ae2e66b9333788c08f412` |
| APK armeabi-v7a | `out-after/app-armeabi-v7a-release.apk` | 20,492,617 B | `b6b6517ee436a7cb12760dca00f1895f5f143d5bcc53a6b48e66128e87fe55fd` |
| APK x86_64 | `out-after/app-x86_64-release.apk` | 24,600,446 B | `3b3df3b57a06af61f5c23a27587ffc8dca00b1e9c97e06ab3b155659990dad04` |
| APK arm64, fake ids + fake origin (proof build only) | `out-sample/app-arm64-v8a-release.apk` | 23,117,239 B | `990809cd542f2e06b1c2a052d0e3024dcb96be156a36f1e12469affb9e093b4b` |

Size budget: arm64 release APK 23.1 MB, limit 40 MB, PASS (unchanged within 80 bytes).

### Before / after merged manifest (arm64 release APK; the AAB matches)

| Item | Before (task 24/26 build) | After task 27 (production, no ids) | After, with fake PGS id + fake https origin |
|---|---|---|---|
| `com.google.android.gms.games.APP_ID` | present, value `""` (empty) | **absent** | present, `@string/merge_relay_pgs_application_id` = `"1234567890"` (`aapt2 dump resources`) |
| https intent-filter on MainActivity | present, `host=""`, `pathPrefix=/games/merge-relay/challenges` | **absent** | present, `host="glow-rescue.example.com"`, same pathPrefix |
| `mergerelay://challenge` filter | present | present | present |
| `android:allowBackup` | not set (default true) | **false** (AAB too) | false |
| `fullBackupContent` / `dataExtractionRules` | only `merge_relay_secure_auth.xml` excluded | all domains excluded (files in `res/xml`) | same |
| `SUPPRESS_GAME_PROFILE_CREATION` | true | true | true |
| `PlayGamesInitProvider` | removed | removed | removed |
| play-services-games-v2 components | `GamesResolutionActivity` (exported false), `PlayGamesAppShortcutsActivity` (**exported true**), `games.version`, `<queries>` gms + vending | unchanged (all still present) | unchanged |
| `GoogleApiActivity`, `gms.version` | present | present | present |
| Exported components | MainActivity, PlayGamesAppShortcutsActivity, ProfileInstallReceiver | same three | same three |
| Permissions | INTERNET + DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION | same | same |
| Label / debuggable | `Glow Rescue` / false | `Glow Rescue` / false (`apkanalyzer`; no `debuggable` attribute in the AAB manifest) | same |
| applicationId, versionName/Code, min/target SDK | `app.w3dev.mergerelay`, 0.1.0/2001 (AAB 1), 24/36 | identical | identical |

A line diff of the before and after `aapt2 dump xmltree` output (line numbers stripped) is exactly: `+allowBackup=false`, `-APP_ID meta-data`, `-https intent-filter`; nothing else changed.

Other checks on the after build: signature v2 verified (signer `CN=NOT FOR UPLOAD`), `jarsigner -verify` on the AAB "jar verified"; `zipalign -c -P 16 -v 4` on the arm64 APK "Verification successful" (libapp, libdartjni, libflutter all stored and aligned); ELF LOAD alignment libflutter 0x10000, libapp 0x10000, libdartjni 0x4000 (all >= 16 KB); native code arm64-v8a only; `./gradlew :app:lintRelease --offline` (run once) reported no backup, data-extraction, app-link or exported-component issue (only pre-existing icon/ObsoleteSdkInt/UseKtx warnings). A debug build (`--mode debug --environment debug`) also built and has neither entry. Negative builds fail fast as designed: `MERGE_RELAY_PGS_PRODUCTION_APPLICATION_ID=abc2` fails with "The Play Games application id must be numeric", and `MERGE_RELAY_PUBLIC_ORIGIN=http://...` fails with "must be an HTTPS origin".

### What the Play Games SDK does when `APP_ID` is absent (read from the SDK, not guessed)

Source: `~/.gradle/caches/modules-2/files-2.1/com.google.android.gms/play-services-games-v2/22.1.0/.../play-services-games-v2-22.1.0.aar`, unzipped, `classes.jar` decompiled with `javap -p -c -constants` (excerpt in `manifests/pgs-sdk-22.1.0-app-id-read.txt`).

- The AAR's own `AndroidManifest.xml` does not declare `APP_ID` (it declares `PlayGamesInitProvider`, `GamesResolutionActivity`, `PlayGamesAppShortcutsActivity`, the `games.version` meta-data and the two `<queries>` packages).
- Exactly one place in the 454-class client library contains the string `com.google.android.gms.games.APP_ID`: `com.google.android.gms.games.internal.v2.appshortcuts.zzt.zza` (app shortcuts). It does `Long.parseLong(Bundle.getString("com.google.android.gms.games.APP_ID", ""))`; the exception table maps `NumberFormatException` (bytecode 412-430) to a handler that returns `null` ("no shortcuts"). An absent entry and an empty entry both give `""`, so they behave identically: no crash, no shortcuts.
- That helper runs from `PlayGamesSdk.initialize(context)` (`zzbw.zza`, via `zzf.zzd`). `PlayGamesInitProvider.onCreate` is the only automatic caller and the app removes that provider (`tools:node="remove"`, confirmed absent from the merged manifest). The app's own code reaches `PlayGamesSdk.initialize` only from `AndroidMergeRelayPlayGamesSdk.initialize` (`MergeRelayPlayGamesPlatform.kt:37`), called by `MergeRelayPlayGamesSdkGate.ensure`, which returns `application_id_missing` and does not initialise while the id is blank, and only when Dart calls the bridge, which Dart does only when `mergeRelaySocialEnabled` is true (`merge_relay_platform_actions.dart:8,45`). `MainActivity.configureFlutterEngine` only registers method channels.
- Conclusion: the SDK does not need the entry at app start, so a placeholder numeric id is unnecessary (and a fake id would be misleading). The production build with no `APP_ID` entry does not touch the SDK at launch. This is code analysis; no on-device launch was run (that is task 25's later check of the arm64 APK above).
- Not knowable from this repository: what the Google Play services app itself does at sign-in if the entry is missing. That only matters in v1.1, and the human step (Play Console > Play Games Services > Setup and management > Configuration; numeric project id into `MERGE_RELAY_PGS_PRODUCTION_APPLICATION_ID`) is required before enabling PGS.
- Extra finding that shaped the implementation: aapt2 compiles a numeric `android:value` of up to 10 digits as an **integer** (`aapt2 dump xmltree`: `value=1234567` int, `value="123456789012"` string), and the SDK reads the entry with `Bundle.getString`, which returns the default `""` for an integer. The conditional entry therefore uses a `@string/` resource (the form Google's docs use). The 1234567890 fake id in the proof build is such a case and dumps as `@0x7f0b001a` -> `"1234567890"`.

### Still open

- Launching the arm64 APK on a device (task 25, human). Nothing here proves the app starts on a phone.
- Mintlify validation of the edited docs could not run here (`bunx mintlify validate` fails to load `@posthog/core` / `yargs-parser` under bun 1.4.2).
