---
epic: 16-games-portfolio-wave2
task: 26-mr-device-qa-fixes
status: complete
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/24-mr-release-readiness]
estimate: M
owner: agent
---

# Glow Rescue: fix the device-QA defects (D1-D5 and old-name leftovers)

## Goal

Fix the defects an independent review found in the 2026-10-16 smoke test on a
real Samsung phone, and keep regression tests for each. Task 25 (the human
device checkpoint) stays pending: this task does not sign anything off.

## Context

- Review: `.agents/resources/2026-10-16/merge-relay-device-qa/REVIEW.md`, with
  the screenshots it cites in the same folder (defect ids D1-D5 below are the
  review's).
- The review's D6-D9 (copy of "Path cleared" on a Rescue board, status-bar
  chrome, home bottom padding, tier 2/4 faces) are polish and are NOT in this
  task.
- The Daily completion rule is unchanged: `merge_relay_game_actions.dart`
  `_updateCompletion` still completes a Daily at `moveCount >= 3`, whatever
  the score. Only the presentation changed.

## Decisions

- **D2 version line.** `package_info_plus` is not a dependency of any game, so
  Settings reads the repo's existing version source: `game.context.appVersion`
  (the `APP_VERSION` dart-define that `games:build` fills from the registry
  release version, which `games:validate` keeps equal to `pubspec.yaml`) and
  `game.context.identity.publicTitle`. It shows "Glow Rescue 0.1.0". The build
  number (`+1`) is NOT shown: no build-number define exists in the pipeline
  and adding one would touch the shared `scripts/games` tooling and
  `platform_core`. The content tag stays as a smaller, muted second line
  ("Content MR-CONTENT-1") for support.
- **D3 board jump.** The status row is now a fixed 20 px slot
  (`mergeFeedbackRowHeight`), and `MergeFeedback` is sized to fit inside it
  (one line, no outer padding). Before, the empty row was 20 px and the
  message row about 24 px. The row is only shown on non-compact screens
  (>= 380 px wide), as before; the 360 px goldens are compact and never show it.
- **D4 one "best".** Endless: the HUD "Best" pill is the best *score*, live
  (`max(all-time best, current score)`, never "-"), and the lower tray's
  second "BEST SCORE" column is removed. Rescue and Daily have no score
  record, so their HUD pill, which showed the highest tile, is relabelled
  "Top tile".
- **D5 switches.** New `lib/src/ui/mr_switch_palette.dart`: ON is a saturated
  `theme.blue` track with a cream thumb; OFF is the pale well track with a
  `theme.muted` thumb and outline; high contrast uses ink and paper with a
  heavier outline. All pairs meet 3:1 (checked in the test, for both themes
  and both modes).
- **D1 Daily result.** Title "Daily complete", message "You played all three
  moves of today's chain.", hint "A fresh board arrives tomorrow. Replay
  today's any time."; stats are "Moves 3 of 3" and "Best tile"; **Score is
  hidden when it is 0** (a 0-point Daily is legal under the rule, and "Score
  0" next to "Daily complete" read as a contradiction) and shown when the
  chain earned points. The campaign panel and chapter strip are replaced with
  a "Today's chain" panel (three dots plus "3 / 3 moves"). Home's Daily card
  says "Completed today" instead of "Cleared today". Rescue and Endless
  results are untouched.
- **Old name.** User-visible "Merge Relay" strings replaced with "Glow
  Rescue" (share message and share title). Left alone on purpose:
  - Wire/contract identifiers and their error text: `merge-relay.v1`,
    `merge_relay_wire.dart:51,64`, `merge_relay_network.dart:83` (the
    exception text names the wire contract, and the friend relay is gated off
    for v1.1).
  - Class, file, package, registry and bundle ids (`app.w3dev.mergerelay`,
    `merge_relay`, `MergeRelay*`), the `mergerelay://` and
    `/games/merge-relay/` link schemes and the `app.w3dev.mergerelay/share`
    channel name.
  - Test fixtures: `MergeRelayShareContentTest.kt` (arbitrary strings passed
    to a factory), `scripts/games/content.test.ts`.
  - `pubspec.yaml` description, `assets/README.md`, iOS `CFBundleName`
    (`merge_relay`, the internal product name, not shown to players).
  - Verified already correct, no change needed: Android launcher label
    (`android/app/build.gradle.kts` sets the `mergeRelayAppLabel` manifest
    placeholder to "Glow Rescue", or "Glow Rescue QA" only when an explicit
    debug package suffix is given), iOS `ios/Runner/Info.plist`
    `CFBundleDisplayName` = "Glow Rescue" (`ios/project.yml` uses that
    Info.plist and sets no other display name), `game.config.json`
    `publicTitle`.

## Implementation Checklist

- [x] D2: Settings footer shows app name and version, content tag secondary.
- [x] D3: reserve the status row; widget test asserts the board and lower tray
      do not move.
- [x] D4: one best display; tests for Endless and Rescue labels.
- [x] D5: themed ON/OFF switch palette; contrast test and Settings test; the
      settings golden updated.
- [x] D1: Daily result copy and layout; model and widget tests; Home copy.
- [x] Old-name: share text and title; share test updated.
- [x] Goldens: baseline proven on a throwaway worktree of HEAD, only the
      affected goldens regenerated.
- [ ] Task 25 (human) re-check on the phone: not done here, no device.

## Files Touched

- `apps-native/games/merge_relay/lib/src/`: `merge_relay_controls.dart`,
  `merge_relay_home_widgets.dart`, `merge_relay_models.dart`,
  `merge_relay_overlays.dart`, `merge_relay_play_lower.dart`,
  `merge_relay_play_screen.dart`, `merge_relay_play_widgets.dart`,
  `merge_relay_relay_share.dart`, `merge_relay_result_screen.dart`,
  `ui/mr_switch_palette.dart` (new)
- `apps-native/games/merge_relay/test/`: `merge_relay_device_qa_fixes_test.dart`
  (new), `merge_relay_share_test.dart`
- Goldens regenerated (8): `test/goldens/screens/{settings,play_rescue,play_endless,pause}.png`,
  `test/goldens/store/{store_hero_rescue,store_merge_moment,store_daily_play,store_endless_best}.png`
- `tasks/epics/16-games-portfolio-wave2/{26-mr-device-qa-fixes.md,STATUS.md}`

## Goldens: macOS vs Linux (read before merging)

The repo's golden PNGs were generated on the Linux server. On this Mac (HEAD,
before any change) 19 golden comparisons already fail with small anti-aliasing
differences (0.4% to 21% of pixels, all visually identical): `merge_strip`,
`tier_sheet`, `store_{hero_rescue,merge_moment,daily_play,endless_best}`, and
screens `{home,home_small,chapter_map,welcome,tutorial,tutorial_hint,play_rescue,play_endless,result_win,result_loss,settings,how_to_play,pause}`.
That list was proven on a throwaway worktree of HEAD, so those failures are
platform drift, not regressions.

By comparing this task's renders with the HEAD renders on the same Mac, exactly
8 goldens changed because of intended UI changes (the list under Files
Touched). Those 8 files were regenerated **on macOS**, each with
`flutter test --update-goldens <file> --plain-name <test>`, and nothing else
was regenerated. Implication: the 8 files now pass on macOS but carry macOS
anti-aliasing, so on the Linux server they will differ by a small amount
everywhere (not only where the UI changed). Re-generate those 8 on the Linux
server (same command) before relying on the goldens in Linux CI. The other 11
goldens are untouched and still match Linux. The store screenshots under
`.agents/resources/2026-09-25/merge-relay-store/` were made from the old
goldens and were not rebuilt.

## Acceptance Criteria

- Every defect above has a regression test that fails on the old behaviour.
- `games:format --check`, `games:analyze --app merge_relay`, `games:validate
  --strict` and `bun run check` pass; the merge_relay test suite fails only on
  the pre-existing, platform-dependent goldens listed above.
- No user-visible "Merge Relay" string remains in `lib/`.
- Task 25 remains pending and human-owned.

## Verification Commands

- `export PATH="$HOME/flutter/bin:$PATH"`
- `bun run games:format -- --check`
- `bun run games:analyze -- --app merge_relay`
- `cd apps-native/games/merge_relay && flutter test --timeout 60s`
- `bun run games:validate -- --strict`
- `bun run check`

## Known caveats

- The 8 regenerated goldens were made on macOS and must be regenerated on the
  Linux server before trusting Linux CI (see the goldens section above).
- The store screenshots under `.agents/resources/2026-09-25/merge-relay-store/`
  were not rebuilt.
- The version line shows "Glow Rescue 0.1.0" with no build number.

## Out of Scope

- Review defects D6-D9, the jank/performance numbers, game-over on a device,
  audio/haptics feel (task 25, human).
- Showing a build number; renaming any wire, package, class or registry id.
- Re-capturing device screenshots (no device on this task).

## Commit message

`fix(merge-relay): fix device QA defects found on the physical phone [16-games-portfolio-wave2/26]`
(the smoke-test evidence is committed separately as task 25 partial)
