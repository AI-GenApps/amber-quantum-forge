# Glow Rescue: task 27 release APK on a physical phone (2026-10-16)

Samsung SM-A525F (A52), Android 14, 1080x2400, **90 Hz** active mode (frame budget 11.1 ms).
APK: `app-arm64-v8a-release.apk` built after task 27, signed with a throwaway test key (not uploadable).
sha256 `314a511983343e8ff5934a323fd54bc05d8f4e36ff5ae2e66b9333788c08f412` (matches the "After task 27" section of `../README.md`).
Package `app.w3dev.mergerelay`, versionName 0.1.0, versionCode 2001. Flags on device: `HAS_CODE ALLOW_CLEAR_USER_DATA` (no ALLOW_BACKUP, no DEBUGGABLE). The release package was uninstalled afterwards; the debug packages were left untouched.

## What this proves

- The task 27 release build installs and launches on a real phone with **no Play Games APP_ID** in the manifest.
- A cold start with a cleared logcat produced zero FATAL / AndroidRuntime / ANR lines and zero lines mentioning PlayGames, APP_ID, NumberFormat or GoogleApi (`startup-logcat-filtered.txt` holds only system lines matching the package name; `crash-check.txt` is empty).
- About 12 minutes of play (Rescue, Endless, Settings with Reduce motion toggled, Daily) ran without a crash.
- `allowBackup` is off on the installed package (`backup-check.txt`).
- The task 26 UI fixes show on a release build: Settings shows "Glow Rescue 0.1.0", switches show a clear blue ON state, the Rescue HUD says "Top tile", and the Daily result has its own copy and "Today's chain" panel (screenshots 01 to 04).

## Numbers and how far to trust them

| Measure | Result | Confidence |
|---|---|---|
| Cold start (`am start -W` TotalTime) | 1845 (first after install), 1404, 1385, 1389, 1413 ms, median 1404 | Medium. A separate launch measured 652 ms and the pre-task-27 median was 656 ms. The variance is not explained (a notification and background load are possible causes). |
| Frame timing | See below | Medium. gfxinfo is unusable here (see below). |
| Memory after play | TOTAL PSS 158,571 KB (Java 6,496, Native 26,160, Graphics 85,876, Code 13,460 KB) | Medium |

Frame timing came from the SurfaceFlinger present timeline, read after each swipe (128-entry buffer), counting a frame interval above 16.7 ms as janky. At 90 Hz one missed vsync is about 22.2 ms and two are about 33.3 ms.

| Window | Frames | p50 | p90 | p95 | p99 | Janky (>16.7 ms) |
|---|---|---|---|---|---|---|
| Rescue, 6 min, 154 swipes | 18,410 | 11.11 | 22.15 | 22.23 | 33.32 | 13.4% |
| Endless, 6 min, 199 swipes | 24,213 | 11.11 | 11.55 | 22.21 | 33.45 | 9.6% |
| Reduce motion on, 31 swipes | 3,669 | 11.10 | 21.71 | 22.22 | 33.32 | 10.1% |

Reading: median frames hit the 90 Hz vsync; roughly 10 to 13% of frames miss one vsync and about 1% miss two or three. This is not comparable with the earlier pre-task-27 gfxinfo run (`../device/`), whose "48% janky" was counted against the 11.1 ms budget and rested on only 18 to 172 frames per window. It is not evidence of a regression.

## Not run / limits

- `dumpsys gfxinfo` reported 0 frames for every window in this run (`gfxinfo-*.txt`), so its Janky / Missed Vsync / Slow UI fields are not_run. The earlier run did report frames; the reason for the difference is not investigated.
- The launcher label was not checked on a real home screen (privacy); the APK badging says "Glow Rescue".
- Sound, music and haptics are not judgeable by an agent.
- Incidents during the run: a personal heads-up notification appeared once (no screenshot of it was kept), and one stray tap opened another app; the agent recovered the game with `am start`. No device settings were changed.
- Play Games sign-in behaviour of the Google Play services app is untested (the SDK is gated off in v1).

Screenshots 01 to 04 were checked for notification text and personal names before commit (status bar icons only).
