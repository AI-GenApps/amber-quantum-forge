# Task 17 evidence: Capacitor packaging

Date: 2026-10-16. Status: **DONE**. The human accepted the SDK licences; the debug APK is built.

## Human step (done)

The human ran `sdkmanager --licenses` (files in `/data/tools/android-sdk/licenses/`, dated 2026-10-16 07:00). Nothing was auto-accepted by the agent.

## Verification results

| Command | Result |
|---|---|
| `bun run city-drive:test` | PASS. core: 53 files, 483 tests. app: 66 files, 579 passed, 1 skipped (new: `test/native/*` 36 tests, 2 AudioManager suspend/resume tests). |
| `bun run city-drive:cap:sync` | PASS (exit 0). Vite build, then `cap sync` for android, ios and web. 6 plugins found on both platforms. |
| `bunx cap sync android` / `bunx cap sync ios` (alone) | PASS / PASS. iOS sync works on Linux (SPM, no CocoaPods step). |
| `bun run city-drive:android:debug` | PASS (exit 0). Installed the SDK packages, vite build, cap sync, `gradlew assembleDebug`: BUILD SUCCESSFUL in 49s, 273 tasks. |
| `bun run city-drive:typecheck` | PASS |
| `bun run check:ci` (Biome), `check:max-lines`, `check:doc-paths`, `check:banned-deps` | PASS |
| `bun test scripts/games/registry-web.test.ts` | PASS (12). Now also asserts the new script names appear in the `games:build` message. |
| `bun run knip:ci` | No findings in `apps-games/city-drive` (other findings are in frozen Ludo/Merge Relay code and pre-existing). |

## APK

Path: `apps-games/city-drive/android/app/build/outputs/apk/debug/app-debug.apk` (git-ignored build output).
Size: **9,533,928 bytes** (about 9.1 MiB). `output-metadata.json` reports `applicationId: app.w3dev.citydrive.debug`, variant debug.
Unsigned for release: signed only with the auto-generated Android debug keystore (outside the repo). Not installed or run anywhere (no device or emulator).

## Toolchain installed (all under /data/tools, nothing system-wide)

| Tool | Path | SHA-256 (verified before extraction) |
|---|---|---|
| Temurin JDK 21.0.12.1+1 (`OpenJDK21U-jdk_x64_linux_hotspot_21.0.12.1_1.tar.gz`) | `/data/tools/jdk21` | `ce79869e1307ed8ee1e2baa86a412b1eb5b75d10a01006d788a6f968bcfaee94` (equals the Adoptium API checksum) |
| Android command-line tools 22.0 (`commandlinetools-linux-15859902_latest.zip`) | `/data/tools/android-sdk/cmdline-tools/latest` | `4e4c464f145a7512b57d088ac6c278c03c9eea610886b35a5e0804e74eedf583` (equals the checksum on developer.android.com/studio) |

`java -version`: `openjdk version "21.0.12.1" 2026-08-18 LTS`. `sdkmanager --version`: 22.0.
`sdkmanager --licenses` was run with stdin closed and reported "8 of 8 SDK package licenses not accepted";
nothing was auto-accepted.

## NOT RUN

- iOS build (`xcodebuild`, simulator, signing): no Xcode on this server.
- Any device or emulator run: none exists; no emulator was booted.
- Release signing, AAB, store upload: task 22. No keystore or signing config is committed (a test checks this).

## Decisions

- iOS deployment target stays **iOS 15** (Capacitor 8 default). Rapier compat needs no wasm SIMD. Not measured on a device.
- Android minSdk 24, target/compile 36, `minWebViewVersion` 105, `webContentsDebuggingEnabled: false`.
- Debug id `app.w3dev.citydrive.debug` via `applicationIdSuffix` in the Gradle `debug` build type.
- On resume the pause menu stays showing (the pause on background opened it); audio is suspended on pause and resumed on resume.
- Back button: game navigator first; on home an exit confirmation dialog; a second back press closes the dialog.

## Additions beyond Files Touched

- `scripts/games/registry.ts` and `scripts/games/registry-web.test.ts`: the `games:build` web message actually lives in `registry.ts`, not `cli-build.ts`; updated there.
- `docs-internal/docs.json`: added the new doc to the Gaming nav.
- `apps-games/city-drive/scripts/{android-debug.ts,androidToolchain.ts}`: the Android script and its preflight (tested).
- `src/audio/manager.ts`, `src/audio/webaudio.ts`, `test/audio/*`: `AudioManager.suspend()/resume()` and `ContextLike.suspend()` for background audio.
- `src/main.ts`: lifecycle, keep-awake and device back wiring replaced the inline `visibilitychange` handlers.
- Root `.gitignore`: signing material and `local.properties` under the Android project.

## Notes

- `ios/App/CapApp-SPM/Package.swift` (generated) references plugin paths inside `node_modules/.bun/...`; regenerate with `cap sync` on the Mac.
- The scratch dir `/data/tools/tmp/17` (archives, ~390 MB) was deleted at the end of the task.
