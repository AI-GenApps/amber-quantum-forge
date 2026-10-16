# Device performance and smoke run of the pre-task-27 release APK (2026-10-16)

This folder is evidence from a performance/smoke run of the PRE-task-27 Glow Rescue (Merge Relay) release arm64 APK. It is not evidence for the task 27 build.

- APK sha256: `448696e45e0af6bd1df2baa8e1851efb94b506c89c75c008eaa6175a6b92745e` (versionCode 2001, versionName 0.1.0).
- That build still had `allowBackup` enabled and the empty Play Games `APP_ID` and empty `https` host, all of which task 27 fixed.
- Device: Samsung SM-A525F, Android 14.
- The release package was uninstalled afterwards.
- A re-run on the task 27 APK (sha256 `314a5119...`) is still pending.

## Results

- Cold starts (`TotalTime`, ms): 1418 (first after install), 656, 623, 664, 617. Median 656. See `cold-start.txt`.
- Frame stats (`gfxinfo-*.txt`):
  - Rescue window: 172 frames, 84 janky (48.8%).
  - Settings window: 18 frames, 7 janky.
  - Endless window: 86 frames, 48 janky.
  - Frame times: p50 10 ms, p90 15-16 ms, p95 16-17 ms, p99 18-19 ms.
  - 0 missed Vsync, 0 high input latency. Most janky frames are "slow issue draw commands".
  - Every window is under 300 frames, so confidence is low. The display refresh rate was not checked.
- Memory (`meminfo-after-play.txt`): TOTAL PSS about 168 MB (graphics about 100 MB).
- No FATAL or ANR lines in the filtered logcat.
- Screenshots: `01-home.png` (home), `02-play-endless-board.png` (Endless), `03-settings-sheet.png` (Settings, new switches and version line), `04-daily-result.png` (Daily result).

## Not verified

- The launcher label on a real home screen was NOT verified.
- Sound, music and haptics were not judged.

## Privacy filtering

`packages-before.txt`, `packages-after-install.txt` and `packages-after-uninstall.txt` were filtered after capture with `grep '^package:app\.w3dev\.'`. They contain only `app.w3dev.*` packages; all other installed packages on the phone were removed.
