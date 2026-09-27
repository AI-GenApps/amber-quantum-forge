# Task 23 — budgets

## Release APK size (arm64, split-per-ABI)

Command run from `apps-native/games/merge_relay`:

```bash
flutter build apk --release --split-per-abi
```

Same caveat as task 13: `gameEnvironment` was left at its default (`debug`),
so `android/app/build.gradle.kts`'s `release` build type falls back to the
debug signing config (no `ANDROID_KEYSTORE_PATH`/`ANDROID_KEY_ALIAS`/
`ANDROID_KEY_PASSWORD`/`ANDROID_STORE_PASSWORD` env vars set) — this
measurement is debug-signed, not production-signed. No error was raised;
the build completed as a normal release build (71.7s Gradle task).

| ABI | Size |
|---|---|
| `app-armeabi-v7a-release.apk` | 24.5 MB (25,734,525 bytes) |
| **`app-arm64-v8a-release.apk`** | **27.1 MB (28,374,963 bytes)** |
| `app-x86_64-release.apk` | 28.5 MB (29,858,738 bytes) |

**Result: arm64 release APK is 27.1 MB, well under the 40 MB budget**
(12.9 MB / 32% of budget still free).

## Before/after (task 13 → task 22 → task 23)

| Task | arm64 release APK |
|---|---|
| 13 (pre-art baseline) | 17.9 MB |
| 22 (+ final logo/icon, ~364 KB of art) | not separately re-measured |
| 23 (+ 12 tile tiers, home scene, board frame, 6 chapter cards) | **27.1 MB** |

`apps-native/games/merge_relay/assets/art/` grew from 2 files (~364 KB,
task 22's `logoWide.png`/`logoStacked.png`) to 22 files, 9.1 MB total:

| Slot family | Count | Per-file size | Encoding |
|---|---|---|---|
| `tileFace_<tier>.png` | 12 | 768x768, ~470-500 KB each (RGBA, lossless) | Pillow-resized from the 1254x1254 master, `optimize=True` |
| `homeScene.png` | 1 | 1080x900, ~1.1 MB | RGB (opaque, no alpha needed) |
| `boardFrame.png` | 1 | 1080x1080, ~1.0 MB | RGB (opaque) |
| `chapterCard_<1-6>.png` | 6 | 300x300, ~120-180 KB each | RGB (opaque) |

The ~9.1 MB of new art roughly accounts for the ~9.2 MB APK growth
(17.9 MB → 27.1 MB, with task 22's small logo delta folded in) — consistent
with lossless PNGs at these resolutions, and still leaves a comfortable
12.9 MB of headroom under the 40 MB budget without needing further
compression (e.g. `pngquant`/palette quantization, not available on this
server — see `assets/art/LICENSES.md`).

## Home frame build benchmark

Not added, same as task 13's note: no existing harness for frame-build
timing exists in this app, and this task's Implementation Checklist and
Verification Commands don't call for one. Device performance profiling
remains deferred to task 25 (the human device pass).

## Orchestrator follow-up (2026-09-28)

The verifier flagged the 12 `tileFace_*.png` files as 768x768 (5.9 MB total),
far above the task's "tiles <=256 px" guidance. On-screen tiles are ~53 dp
(~160 px physical at 3x). They were re-encoded to 256x256 (Pillow LANCZOS),
808 KB total. Goldens were regenerated, and all 261 tests pass.

| Build | arm64 release APK |
|---|---|
| Before the re-encode | 28,374,963 bytes (27.1 MB) |
| After the re-encode | 23,102,251 bytes (22.0 MiB; Flutter reports "23.1MB") |

Command: `cd apps-native/games/merge_relay && flutter build apk --release --split-per-abi` (debug-signed fallback).
