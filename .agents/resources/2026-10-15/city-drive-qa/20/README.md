# Task 20: apply name, icon and splash (verification evidence)

| File | What |
|---|---|
| `city-drive-test.log` | `bun run city-drive:test`: core pass; app 68 files, 603 passed, 1 skipped (pre-existing skip). |
| `cap-sync.log` | `bun run city-drive:cap:sync`: build, copy and update for Android and iOS, exit 0. |
| `games-test-tooling.log` | `bun run games:test:tooling`: 58 pass, 3 fail (below). `git checkout -- apps-native/` run straight after; nothing under `apps-native/` changed. |
| `head-tooling-baseline.log` | The same `scripts/games` tests on a throwaway HEAD worktree (no node_modules of its own, so it shows 1 extra failure, `jose` not resolvable from the symlinked tree, and the 3 below). |
| `android-debug.log`, `apk-badging.txt` | `bun run city-drive:android:debug`: BUILD SUCCESSFUL; `aapt2 dump badging` shows `application-label:'Street Royale'`, package `app.w3dev.citydrive.debug`. |

## Pre-existing, unrelated failures of `games:test:tooling` (same on HEAD)

1. `checked-in Dart VM and compiled JS replay fixture stays in parity`: `Pinned Bun 1.3.3 is required; found 1.4.2`.
2. `generated Dart registry is formatter-stable`: `dart` is not installed.
3. `generic generator keeps debug and production native identities separate`: `flutter` is not installed.

Not run: device or emulator checks, iOS build, store consoles, any browser or screenshot QA.
Art evidence is under `.agents/resources/2026-10-15/city-drive-art/icon/`.
