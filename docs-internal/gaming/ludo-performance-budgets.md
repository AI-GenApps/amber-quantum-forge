---
title: Ludo Vortex performance and size budgets
description: Frame-cost and APK-size budgets for Ludo Vortex, how each is measured, the results recorded in task 27, and the manual on-device profiling procedure.
---

Budgets for the `ludo` Flutter + Flame client, how they are checked, and what
was measured in task 27 (2026-10-16). Nothing here was measured on a phone:
the device pass belongs to task 29.

## Budgets

| Budget | Limit | Checked by |
|---|---|---|
| Board scene frame cost (Dart-side update + render recording) | p90 at or under 16 ms (60 fps) under representative load | `test/perf/ludo_game_frame_budget_test.dart`, part of `bun run games:test -- --app ludo` |
| GPU raster time per frame on a device | at or under 16 ms, no sustained jank | manual procedure below (task 29) |
| Download size of a release APK | at or under 40 MB per device ABI | measured below; `flutter build apk --split-per-abi` |

## Frame budget: automated test

`ludo_game_frame_budget_test.dart` builds the worst case the task names: a
full 4-seat board (16 tokens), a token hop in flight, a dice tumble, and live
capture, home-arrival and win-confetti particle systems. It repeats 40
move/effect cycles, ticks `LudoGame.update(1/60)` and `LudoGame.render` into a
`PictureRecorder` for every frame, times each frame with a `Stopwatch`, and
fails if the p90 exceeds 16 ms. p90 rather than max is used so one garbage
collection pause on a busy CI host cannot fail an otherwise healthy run.

Result on the task 27 run (Apple silicon host, `flutter test`, 3,280 frames):

| p50 | p90 | max | budget |
|---|---|---|---|
| 205 us | 262 us | 4,228 us | 16,000 us |

### Limitations (read before trusting the number)

- The test runs in the host Dart VM in debug/JIT mode, not in profile mode on
  a device. The test harness cannot produce a profile-mode build, so this is
  not a `traceAction` timeline benchmark.
- It measures the Dart-side cost a frame spends in component `update` and in
  recording `render` calls into a canvas. It does **not** measure GPU
  rasterization, shader compilation or the platform compositor. A phone with
  a slow GPU can still jank with a perfect test result.
- Absolute microseconds are not comparable between machines. The value of the
  test is regression catching: a change that makes the scene cost 10x more
  will fail it even on a fast host, and the healthy scene sits roughly 60x
  under the limit, so it is not flaky.

## Frame budget: manual on-device procedure (task 29)

Run this on a mid-range physical Android phone with a release-like build:

1. `bun run games:build -- --app ludo --platform android --mode release --environment debug`
   and install the APK (profile mode would be better; if you need the Flutter
   timeline, use `cd apps-native/games/ludo && flutter run --profile
   --dart-define=GAME_ENVIRONMENT=debug` instead).
2. Start a 4-player match with the in-app all-bots demo (debug builds) so
   tokens, hops, captures and dice animate continuously.
3. Open DevTools > Performance, turn on the performance overlay, and record
   60 seconds that include at least two captures and a home arrival.
4. Pass criteria: no more than 1% of frames over 16 ms for both the UI and
   raster threads, and no frame over 100 ms. Record the numbers and the phone
   model in `.agents/resources/<date>/ludo-task-29/`.
5. If it fails, check capture and confetti first (particle count constants in
   `lib/src/game/ludo_capture_particles.dart` and `ludo_confetti.dart`), then
   token shadows in `ludo_token_component.dart`.

## Size budget

Measured with the exact command the task names:

```bash
bun run games:build -- --app ludo --platform android --mode release --environment debug
```

It succeeded (exit 0) without release signing because `--environment debug`
signs with the debug key. Evidence:
`.agents/resources/2026-10-16/ludo-task-27-release-hardening/`.

| Artifact | Size | Against 40 MB |
|---|---|---|
| `app-release.apk` (universal, all ABIs; what `games:build` produces) | 64.9 MB (64,855,055 bytes) | **over** |
| `app-arm64-v8a-release.apk` (`--split-per-abi`) | 28.4 MB (28,423,593 bytes) | under |
| `app-armeabi-v7a-release.apk` (`--split-per-abi`) | 25.9 MB (25,930,617 bytes) | under |
| `app-x86_64-release.apk` (`--split-per-abi`) | 30.0 MB (29,972,901 bytes) | under |

### How to read this

The universal APK is over 40 MB only because it bundles three copies of the
native code (libflutter.so, libapp.so per ABI: about 55 MB uncompressed of the
total). A phone never downloads that: Google Play serves an Android App Bundle
split per ABI, so the download a player gets is the per-ABI size (arm64 is
28.4 MB). Task 27 therefore applies the 40 MB budget to the per-ABI APK and
records the universal figure honestly instead of hiding it.

If you want the literal universal-APK budget to pass, the options are to drop
x86_64 and armeabi-v7a from the universal build or to ship the AAB only; both
are release-engineering decisions for task 29, not gameplay changes.

Where the arm64 bytes go (uncompressed APK entries): libflutter.so 11.7 MB,
libapp.so 6.8 MB, two dex files 14.3 MB uncompressed (5.7 MB compressed),
assets 2.9 MB (looping music 0.7 MB, lobby tile art about 1.1 MB). The
Firebase Crashlytics dependency added in this task brings the Firebase
Sessions component into the dex; no before/after delta was measured.

The AAB size (what Play actually reports) needs
`bun run games:build -- --app ludo --platform android --mode aab ...`, which
requires the real upload keystore and is `NOT RUN` here until task 29
provisions it.
