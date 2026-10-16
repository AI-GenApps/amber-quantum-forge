# Glow Rescue (merge_relay) device smoke test: independent review

Reviewer: read-only review, 2026-10-16. Every distinct PNG was viewed at full size (08 was confirmed byte-identical to
07 by checksum rather than viewed separately; 40 and 50 are text files). The phone was not touched. Code was read, no tests were run.
Evidence dir: `.agents/resources/2026-10-16/merge-relay-device-qa/`.

## Verdict

**Pass with defects.**

The visual bar is largely met on device: Fredoka headings and Nunito Sans body text, painted character tiles, a cream
play field with a tray frame, a composed home screen with a painted hero scene, and no empty or black/white regions.
All five tiers of screens (home, welcome/tutorial, board, result, settings) are stylistically consistent.

The agent run does NOT prove "Endless to game over", performance, "no crash", or the feel items. The Daily result
contradicts itself ("Path cleared", Score 0), and Settings shows an internal content tag. Task 25 stays pending.

## Verified claims

| Haiku claim | Result | Evidence |
|---|---|---|
| Cold start 7.1 s | Confirmed as a number (`TotalTime: 7152`, `LaunchState: COLD`). Debug/JIT build, so not a product metric. "After pm clear" is not shown in any file. | `01-cold-start-timing.txt` |
| Tutorial and boards 1-3 cleared, "3 of 60" | Confirmed. Results show 1/60 (07), 2/60 (11), 3/60 (14); home shows "3 of 60 cleared" (17, 25). Note: `01-welcome-first-screen.png` is actually the Home screen; the welcome screen is 02 (shown on first Play tap, which is by design per task 12). | 02-17 |
| Daily ended after 3 moves, "Path cleared", Score 0 | Confirmed (21, 20, 19). Explained below. | 18-21 |
| Endless 40 swipes, no game over, counter 69 | Partly. Counter reads 69 (23-40, 24, 26). But game over was never reached: board still has 3 empty cells, and 24 is the same state as 23-40. The file names "after 10/20/30/40 swipes" show Moves 40/50/60/69, so about 30 moves happened before the first capture. The "malformed swipes" are not visible in any artifact. | 22, 23-*, 24 |
| Kill + relaunch restored identical run | Confirmed for Endless: Score 536, Moves 69, identical board in 24 and 26; Home shows "Continue run" (25). The force-stop command itself is not recorded. Daily and Rescue mid-run restore were not tested. | 24-26 |
| All settings toggled | Confirmed visually (28-39, 41-42): Board controls, Reduce motion, High contrast, Sound, Music, Vibration and the Ember palette each flip and restore. No screenshot shows the effect of any toggle in the game (on-screen move controls, high-contrast outlines, Ember board colours). | 27-42 |
| 40% janky frames, p99 300 ms | Numbers match the file but the metric is invalid. `Stats since` is about 230 s before the dump (uptime 43018711 ms vs 42788353 ms), so it is the relaunched process only, i.e. about 18:42-18:46, which was spent on the Settings sheet, not on board play. Only 80 frames in about 4 minutes means HWUI is not counting Flutter's own frames. Debug build on top. Treat as "no data". File is mis-named "after-play". | `40-gfxinfo-after-play.txt` |
| No crash/ANR in logcat | Not supported. The tail is the last 300 lines, covering only 18:46:09-18:46:22. It contains adb/uiautomator and Bluetooth scan noise and no app-process lines. It cannot rule out an earlier crash. | `50-logcat-tail-300.txt` |

Screenshot 34 notification: [redacted personal device notification] It is a Samsung/Android
system notification (One UI "Devices" card; the status bar shows "Devices" in place of the clock and the Settings sheet
below is unchanged). It is outside the app. Gmail/Devices icons in the status bar of 30-33 are also system. Note
privacy: 34 contained a personal Bluetooth device name; the notification band of that screenshot was blacked out before commit.


Duplicates (no new information): 07 = 08, 14 = 15 (byte-identical); 11 ~ 12; 24 ~ 23-40.

## Defects

Severity: H = fix before release, M = fix before store listing, L = polish.

| # | Sev | Screenshot | What is on screen | Suspected area |
|---|---|---|---|---|
| D1 | H | 21 (also 25) | Daily result titled "Path cleared / Every tile found its place." with Score 0 and a Rescue-flavoured hint "Keep the chain moving into the next path.", plus Rescue "Campaign progress 3/60" and chapter strip. Home Daily card then says "Cleared today" (25). Misleading win state for a 0-score run. | `merge_relay_game_actions.dart:314-318`, `merge_relay_models.dart:11,116`, `merge_relay_result_screen.dart:146`, `merge_relay_home_widgets.dart:298` |
| D2 | M | 27, 28-39, 41-42 | Settings footer reads "Content MR-CONTENT-1", an internal catalog tag, not an app version. Task 11 asked for a version line. | `merge_relay_overlays.dart:163` |
| D3 | M | 10, 19, 20, 23-10..40 vs 05, 18, 22 | A status row ("Chain +4", "Board shifted.") appears between the HUD and the board and pushes the board and lower panel down by about 15 px, then back when it clears. The board jumps on merges. | play screen layout (`merge_relay_play_screen.dart` / `merge_relay_play_widgets.dart`): reserve the row height |
| D4 | M | 22-26 | Endless: HUD "Best 64" is best tile, but the lower panel shows "BEST SCORE -" while Score is 536. Two different "best" labels next to each other; the score-best stays "-" until a run ends. | `merge_relay_play_lower.dart` / HUD labels |
| D5 | L | 27 | Switch ON state is a grey track with a navy thumb, OFF is a cream track with a grey thumb. ON reads as disabled/greyed; state is only clear from thumb position. Sound/Music/Vibration rows have no subtitle, so row heights and rhythm differ from the first three rows. | `_MrSwitchRow` in `merge_relay_overlays.dart` |
| D6 | L | 07-16 | "Path cleared / Every tile found its place." is shown for a campaign board that is not cleared (it ends when the move budget is spent with score >= target); on 06 and 10 the goal is already reached with moves still left and the player must keep swiping. Copy and flow both slightly off. | `merge_relay_models.dart:116`, `merge_relay_game_actions.dart:306-312` |
| D7 | L | all | Status bar is an opaque grey-beige band on the cream background (not edge-to-edge or themed); nav bar is black. Content stays clear of the punch-hole and nav, so this is polish, not a safe-area bug. | `SystemChrome`/theme in `merge_relay_app.dart` |
| D8 | L | 01, 25, 17 | Home Chapters card ends about 25 px above the nav bar with no bottom padding; cannot tell from stills whether the page scrolls. | `merge_relay_home.dart` |
| D9 | L | 06, 07, 10 | Tier 2 and 4 faces are tiny sleepy arcs; 2 and 4 are hard to tell apart except by tint and numeral. Higher tiers (8-64) read well. | tile art `assets/art/tileFace_2.png` / `_4.png` |

Checked and fine: custom fonts present everywhere (Fredoka headings, numerals, buttons; Nunito Sans body; no visible
Roboto), no clipped or overflowing text, no empty or flat bands over about 20% (Daily result 21 has about 14% empty at
the bottom), tile art is the bundled bitmap set (glossy faces, `merge_relay_board_art.dart:249-262`) not code-drawn
placeholders, hero scene and wordmark are painted art. Not verified on device: high-contrast mode in play (uses the
procedural card path, `merge_relay_board_art.dart:249`), the Ember palette in play, large text.

## Daily score finding

**Score 0 is correct per the code; the "Path cleared" wording is a design/copy bug.**

- `merge_relay_game_actions.dart:314-318`: for `MergeRelayMode.daily`, the round ends with
  `MergeRelayOutcome.completed` as soon as `state.value.moveCount >= 3`, with no score condition. (Rescue, by contrast,
  compares score to the frozen target, lines 306-312.)
- `_finish` (line 327 onward) copies `state.value.score` into the result. A fresh Daily starts at score 0
  (`startDaily`, line 190-199, uses `MergeGameState.newGame`; Rescue boards are seeded with a non-zero score from
  `content/rescue_boards.json`, e.g. line 41 `"score": 4`).
- On screen: the Daily board was a `4` and a `2` (18); moves 1-3 made no merge, so score stayed 0 (19-21).
  `merge_relay_models.dart:11` maps `completed` to "Path cleared" and `:116` to "Every tile found its place."
- The in-game panel agrees with the rule: `merge_relay_play_lower.dart:128-134,192` shows "Today's chain 0 / 3 moves" and
  "Chain complete.".

So it is not a scoring bug, but a 0-point, no-merge Daily is rewarded as "completed" and Home then says "Cleared
today". Suggested fix: give Daily its own result copy (title, message, hint), hide the campaign panel for non-Rescue
results, and decide whether a Daily with score 0 is "completed" at all. No test exists for the 0-score case
(`test/quality/daily_seeded_test.dart` is seed determinism).

Related, expected: campaign boards start at a non-zero score and have a 3-move budget in chapters 1-2
(`content/rescue_boards.json`, `move_budget_formula: 3 + floor((chapter-1)/2)`), which is why boards 1-3 clear in 3
swipes.

## Naming leftovers

Screens showing "Glow Rescue": home wordmark (01, 17, 25), welcome screen wordmark (02), dimmed under the Settings
sheet (27-42). No screenshot shows "Merge Relay" anywhere (home, tutorial, play, results, settings, How to play was
never opened). No launcher, recents, or app-info screenshot was captured, so the launcher label is unverified on
device.

Android label:

- `AndroidManifest.xml:5` uses `android:label="${mergeRelayAppLabel}"`.
- `android/app/build.gradle.kts:109-110` sets it to "Glow Rescue", or "Glow Rescue QA" when
  `mergeRelayDebugPackageSuffix` is non-empty. The device ran `app.w3dev.mergerelay.debug` (no extra suffix), so the label
  should be "Glow Rescue".
- There is no `res/values/strings.xml` in the Android module. The label lives only in Gradle. This is fine, but the
  task brief's expectation of a strings.xml entry does not hold.
- `game.config.json` has `canonicalName`/`publicTitle` "Glow Rescue"; `ios/Runner/Info.plist:10` display name is
  "Glow Rescue".

Remaining old-name strings (none visible in the captured flows):

- `lib/src/merge_relay_relay_share.dart:58,88`: share text "Join ... in Merge Relay" and share title "Merge Relay"
  (the friend-relay feature is out of v1 scope, but it is user-facing if ever surfaced).
- `lib/src/network/merge_relay_wire.dart:51,64` and `merge_relay_network.dart:83`: error messages.
- `android/.../MergeRelayShareContentTest.kt:11,15,21` and `scripts/games/content.test.ts:10`: test fixtures.
- `pubspec.yaml:2` description, `assets/README.md:1`, iOS `CFBundleName` = `merge_relay`.
- Package id `app.w3dev.mergerelay` is intentionally unchanged.

## Task 25 coverage

Checklist from `tasks/epics/16-games-portfolio-wave2/25-human-device-checkpoint.md`.

| Item | Status |
|---|---|
| Build the debug APK for merge_relay and install on a phone | Done for merge_relay only (`00-build.log` EXIT=0, ran on a Samsung A52). The other four APKs were not built or installed. |
| MR: fresh install, welcome, tutorial, clear chapter 1 | Partly. Welcome and tutorial (02-04), boards 1-3 of 10 in chapter 1 (not the whole chapter), and "fresh install" (pm clear) is asserted, not shown. |
| MR: Daily | Done (18-21), with defect D1. |
| MR: Endless **to game over** | NOT done (23-40, 24 show a live board). |
| MR: kill mid-run and relaunch | Done for Endless (24-26). |
| MR: toggle every setting | Done visually (27-42); effects in play not shown. |
| MR: sound, music, haptics, animation feel vs Threes! | NOT done; needs a human. Silent stills cannot show any of it, and the phone showed the muted icon in the status bar throughout. |
| Screenshots under `.agents/resources/<date>/merge-relay-device-qa/` | Done (see privacy note on 34). |
| Other four apps: fonts on device, one screenshot each | NOT done; needs a human with those APKs. |
| Cold start time and jank | Cold start recorded (debug only). Jank not valid (see above). Needs a profile or release run for a real number. |
| Decide open questions: crash vendor, privacy-policy host, support email, Play account | NOT done; human (`.agents/games/merge-relay/open-questions.md` #2, #3, #4, #12). |
| Upload keystore, signed AAB, internal testing upload, install from Play | NOT done; human, credential-only (#10). |
| Sign off or write the fix list | Not yet. Do not mark task 25 done. D1-D4 are the candidates for a `26-...` fix task. |
| Acceptance: sign-off in `.agents/games/merge-relay/decisions-log.md` and STATUS.md | NOT done. |

What the agent evidence does cover: the visual product bar (fonts, tile art, no empty regions, consistent styling), the
naming on screen, the core loop (campaign, Daily, Endless), local persistence across a force-kill, and the settings UI
state. What still needs the human: game-over path, audio/haptics/animation feel, release-mode performance, the other four
apps, store/provisioning steps and the open decisions.
