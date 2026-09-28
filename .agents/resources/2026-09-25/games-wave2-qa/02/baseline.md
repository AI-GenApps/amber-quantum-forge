# Server toolchain baseline — 2026-09-25

Task: `tasks/epics/16-games-portfolio-wave2/02-server-toolchain-verification.md`.
Every command below ran with the environment block from
`tasks/epics/16-games-portfolio-wave2/STATUS.md`:

```bash
export PATH=/data/tools/bun/bin:/data/tools/flutter/bin:/data/tools/jdk17/bin:$PATH \
  PUB_CACHE=/data/tools/pub-cache JAVA_HOME=/data/tools/jdk17 \
  ANDROID_HOME=/data/tools/android-sdk ANDROID_SDK_ROOT=/data/tools/android-sdk \
  BUN_INSTALL_CACHE_DIR=/data/tools/bun-cache GRADLE_USER_HOME=/data/tools/gradle-home
```

Repo state: `main`, HEAD `8c5e595` (docs(games) competitor references commit),
no app code touched by this task.

## Results

| Command | Result | Key lines / notes |
|---|---|---|
| `ls node_modules \| wc -l` | pass | `889` — root `node_modules` already installed, no `bun install` needed. |
| `bun --version` | pass | `1.3.3` — matches expected. |
| `bun run games:doctor` | pass | `OK bun: expected 1.3.3, observed 1.3.3`; `OK flutter: expected 3.47.3, observed Flutter 3.47.3`; `OK dart: expected 3.13.3, observed Dart SDK version: 3.13.3`; `NOT RUN xcodebuild: macOS is required`; `NOT RUN adb: a physical Android device is required only for games:run`. Both NOT RUN lines are expected per the task file. |
| `bun run games:format:check` | pass | Ran `flutter format` (dry) across each package/app; every group reports `Formatted N files (0 changed)`. The `Woah! ... running flutter as root` warning is noise (server runs as root), not a failure. |
| `bun run games:validate:strict` | pass | `Gaming registry and content validation passed in strict mode.` |
| `bun run games:content:validate` | pass | `Content validation passed.` |
| `bun run games:icons:check` | **fail — pre-existing** | `error: stale Android launcher label: .../merge_relay/android/app/src/main/AndroidManifest.xml`. See "Pre-existing failure" below. |
| `bun run games:analyze -- --app merge_relay` | pass | Analyzes `snapquest_rules`, `ludo_rules`, `platform_core` (shared deps) then `merge_relay`: `No issues found!` for all, merge_relay analyzed in 4.6s. |
| `bun run games:test -- --app merge_relay` | pass | `All tests passed!` at `+120` — matches the audit's expected baseline of 120 tests. |
| `bun run games:test -- --app pocket_biome` | pass | `All tests passed!` at `+8` — matches expected baseline of 8. |
| `bun run games:test -- --app sixty_second_heist` | pass | `All tests passed!` at `+8` — matches expected baseline of 8. |
| `bun run games:test -- --app meme_court` | pass | `All tests passed!` at `+5` — matches expected baseline of 5. |
| `bun run games:test -- --app snapquest` | pass | `All tests passed!` at `+19` — matches expected baseline of 19. |
| `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug` | pass | `✓ Built build/app/outputs/flutter-apk/app-debug.apk` in ~12s (Gradle daemon and dependency caches already warm from the prior test run in this session — the task file's ~258s figure is a cold-cache first build). APK: `apps-native/games/merge_relay/build/app/outputs/flutter-apk/app-debug.apk`, 155,445,754 bytes (149 MiB). |
| `bun run games:build -- --app pocket_biome --platform android --mode debug --environment debug` | pass | `✓ Built build/app/outputs/flutter-apk/app-debug.apk` in ~36s. APK: `apps-native/games/pocket_biome/build/app/outputs/flutter-apk/app-debug.apk`, 154,450,114 bytes (147 MiB). |
| `bun run games:build -- --app sixty_second_heist --platform android --mode debug --environment debug` | pass | `✓ Built build/app/outputs/flutter-apk/app-debug.apk` in ~37s. APK: `apps-native/games/sixty_second_heist/build/app/outputs/flutter-apk/app-debug.apk`, 154,455,982 bytes (147 MiB). |
| `bun run games:build -- --app meme_court --platform android --mode debug --environment debug` | pass | `✓ Built build/app/outputs/flutter-apk/app-debug.apk` in ~35s. APK: `apps-native/games/meme_court/build/app/outputs/flutter-apk/app-debug.apk`, 153,065,833 bytes (146 MiB). |
| `bun run games:build -- --app snapquest --platform android --mode debug --environment debug` | pass | `✓ Built build/app/outputs/flutter-apk/app-debug.apk`, Gradle task took 64.3s (camera plugin native compile). APK: `apps-native/games/snapquest/build/app/outputs/flutter-apk/app-debug.apk`, 157,150,040 bytes (150 MiB). |
| `bun run check:doc-paths` | pass | Exits 0 with no output — no `docs/` or `*/docs/*` paths staged. |

## Debug APK sizes

| App | Path | Size |
|---|---|---|
| merge_relay | `apps-native/games/merge_relay/build/app/outputs/flutter-apk/app-debug.apk` | 155,445,754 bytes (149 MiB) |
| pocket_biome | `apps-native/games/pocket_biome/build/app/outputs/flutter-apk/app-debug.apk` | 154,450,114 bytes (147 MiB) |
| sixty_second_heist | `apps-native/games/sixty_second_heist/build/app/outputs/flutter-apk/app-debug.apk` | 154,455,982 bytes (147 MiB) |
| meme_court | `apps-native/games/meme_court/build/app/outputs/flutter-apk/app-debug.apk` | 153,065,833 bytes (146 MiB) |
| snapquest | `apps-native/games/snapquest/build/app/outputs/flutter-apk/app-debug.apk` | 157,150,040 bytes (150 MiB) |

All five debug APKs are build outputs under each app's `build/` directory
(already gitignored) and are not part of this commit.

## Summary

Every verification command ran to completion. All pass except
`games:icons:check`, which fails for the pre-existing, documented reason
below (task 18 owns the fix). Every `flutter test` count matches the
2026-09-25 portfolio audit's expected baseline exactly (merge_relay 120,
pocket_biome 8, sixty_second_heist 8, meme_court 5, snapquest 19), and all
five debug APKs built cleanly on the first try — no environment fixes were
needed under `/data/tools`.

## Pre-existing failure: `games:icons:check` (merge_relay Android label)

Reproduced on `HEAD` (`8c5e595`) in a throwaway worktree, isolated from this
task's own changes:

```
git worktree add /tmp/wt-icons-check HEAD
ln -s <repo>/node_modules /tmp/wt-icons-check/node_modules   # sharp is a root dep, read-only reuse
cd /tmp/wt-icons-check && bun run games:icons:check
git worktree remove --force /tmp/wt-icons-check
```

Both the live tree and the worktree fail identically:

```
error: stale Android launcher label: .../merge_relay/android/app/src/main/AndroidManifest.xml
      at renderRegisteredIcons (scripts/games/icons.ts:264:36)
```

Root cause (matches the task file's note): `apps-native/games/merge_relay/android/app/src/main/AndroidManifest.xml`
line 5 sets `android:label="${mergeRelayAppLabel}"` (a Gradle manifest
placeholder resolved per build flavor), while `scripts/games/icons.ts`
`updateAndroidLabel()` (line 121) only accepts a literal, escaped title
string (`android:label="<escaped title>"`) and flags anything else as
stale. This is a real mismatch between the icon-check tool and merge_relay's
flavor-based labeling, not a bug introduced by this task. Task 18 ("Merge
Relay: apply the chosen name") is scoped to fix it. Not fixed here — out of
scope for this task (no app code changes).
