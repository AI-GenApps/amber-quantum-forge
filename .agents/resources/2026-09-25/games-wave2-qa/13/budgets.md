# Task 13 — budgets

## Release APK size (arm64, split-per-ABI)

Command run from `apps-native/games/merge_relay`:

```bash
flutter build apk --release --split-per-abi --dart-define=MERGE_RELAY_SOCIAL=false
```

`gameEnvironment` was left at its default (`debug`), so
`android/app/build.gradle.kts`'s `release` build type fell back to the
`debug` signing config (its documented behavior when no
`ANDROID_KEYSTORE_PATH`/`ANDROID_KEY_ALIAS`/`ANDROID_KEY_PASSWORD`/
`ANDROID_STORE_PASSWORD` env vars are set) — **this measurement is
debug-signed, not production-signed.** No error was raised; the build
completed as a normal release build.

| ABI | Size |
|---|---|
| `app-armeabi-v7a-release.apk` | 16.1 MB (16,118,915 bytes) |
| **`app-arm64-v8a-release.apk`** | **17.9 MB (18,759,353 bytes)** |
| `app-x86_64-release.apk` | 20.2 MB (20,243,132 bytes) |

Build time: 2m15s (first release build in this checkout; Gradle task
`assembleRelease` itself took 133.3s).

**Result: arm64 release APK is 17.9 MB, well under the 40 MB budget.**

## Home frame build benchmark

Not added in this task — the task's Context section calls this "a
best-effort signal, not a device profile" but the Implementation Checklist
and Verification Commands don't require a specific `flutter test`
benchmark harness for it, and no existing harness for frame-build timing
exists in this app yet. Cold start remains explicitly deferred to task 25
(the device pass). Flagging this as a gap rather than fabricating a number:
a real `flutter test` frame-build-time benchmark would need its own
follow-up if the orchestrator wants it measured before task 25.
