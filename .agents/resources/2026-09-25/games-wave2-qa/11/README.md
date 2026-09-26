# Task 11 — Merge Relay: home, chapter map, results, pause, settings restyle

Evidence for `tasks/epics/16-games-portfolio-wave2/11-mr-screens-restyle.md`.

## What changed

- **Home**: wordmark header (`logoWide` slot), a hero scene (`homeScene` slot,
  code-drawn stacked-character-tile fallback), a primary Continue/Play
  button, a Rescue-progress row that opens the new chapter map, a
  Daily/Endless card pair (Daily shows today's state, Endless shows the
  best-ever score), a campaign-progress bar, and a 6-chapter preview strip.
- **Chapter map** (`lib/src/screens/merge_relay_chapter_map.dart` +
  `merge_relay_chapter_card.dart` + `merge_relay_chapter_node.dart`, new):
  a full screen replacing the old "Rescue paths" bottom sheet — 6 chapter
  cards, each with its 10 board nodes (cleared/current/locked), an
  unlock-rule hint, opens centred on the player's current chapter.
- **Result**: a hero panel with the run's best tile painted as a real
  character tile, `Score`/`Best tile`/`Moves` stat pills, the contextual
  primary action (`Next path` / `Try again` / `New run` / `Play again`), a
  `Replay` action on a Rescue win, an `isNewEndlessBest` "New best!" pill,
  and the same campaign-progress + chapter-strip footer as Home.
- **Pause**: every action is now an `MrButton` (was `FilledButton`/
  `TextButton`) — Resume, Restart run (`MrDialog` confirmation, was
  `AlertDialog`), Finish here, **Settings** (added per the task's spec),
  and Home. The pause overlay was reworked to cover the full board+lower-
  tray region instead of just the board's own square: at the board's size
  alone, the panel had no room for all 5 actions and was silently clipping
  "Settings"/"Home" off the bottom with no visible scroll affordance — a
  bug this task's own review caught and fixed by re-measuring the panel
  against `tester.getRect` and finding real buttons laid out below the
  visible frame.
- **Settings**: `SwitchListTile`/`ChoiceChip`/`OutlinedButton` replaced with
  design-system rows/pills/`MrButton`s; renamed "Haptics" → "Vibration" per
  the task's checklist; added a content-version line.
- **Play screen recomposition**: the board is now sized by the actual space
  left after a compact HUD (goal + score/best/moves) rather than centred in
  a big `Expanded` (which produced the ~20% empty bands the task's review
  found) — the board shrinks first under a tight viewport, and a capped,
  populated lower "control tray" (accessible move controls, or the swipe
  hint + moves-remaining note) gets the rest, with any further leftover
  distributed as small top/bottom margins instead of one large blank band.

## Verification

- `bun run games:format:check` — pass
- `bun run games:analyze -- --app merge_relay` — pass, no issues
- `bun run games:test -- --app merge_relay` — pass, **229** tests (≥ task
  10's 215; round 2 added the title/message regression test, round 3 added
  the no-relay-wording sweep test), ~18-19s
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug` — pass, `app-debug.apk` built
- `bun run games:content:validate` — pass (round 3's content-copy edits)
- `bun run games:parity` — pass ("Merge Relay VM/JS replay parity passed")
- Device check: **NOT RUN** (no physical device on this server)

## Blank-band measurements

Measured with Pillow: for each row, sample every 5th pixel across the row
and compare to that row's own left-edge (x=6) reference colour (not a
single global sample — `MrBackground`'s radial vignette makes the true
background colour vary slowly by row) — this treats a row as "flat
background" only when every sampled pixel matches its own row's edge
colour, so it correctly ignores the dot texture and the vignette while
still catching real UI content. Bands ≤5px are ignored (antialiasing).

| Golden | Largest flat-background band |
|---|---|
| `home.png` | 3.7% (limit 25%) |
| `home_small.png` (360×640) | 2.7% |
| `play_rescue.png` | 3.7% (limit 20%) |
| `play_endless.png` | 3.7% (limit 20%) |
| `result_win.png` | 3.7% |
| `result_loss.png` | 3.7% |
| `chapter_map.png` | 3.6% |
| `pause.png` | 3.7% |
| `settings.png` | 4.7% |

All comfortably under both stated thresholds. Re-measured after round 2 and
again after round 3 (chapter_map's next-unlock hint added one text line to
one card); all remain in the same 2.7-4.7% range — `chapter_map.png` is now
3.3% (was 3.6%), still comfortably clear of the limit.

## Round 2 (fix round 1 — commit 160878b was pushed before verification, then
failed three review points)

1. **Chapter-map golden didn't show all 6 chapters.** Only chapters 1-3 plus
   chapter 4's header fit in the 1080x2400 frame; 5-6 were off-frame. Fixed
   with the reviewer's preferred option — a compact design, not a second
   scrolled golden: a locked chapter now collapses its 2-row/10-node grid
   into a single row of ten small pips (`_LockedBoardsPreview` in
   `merge_relay_chapter_card.dart`) and its hint text into a
   `Semantics`/`Tooltip` label instead of a second visible text line, and
   the map's own padding/margins were tightened. All 6 chapters, with the
   seeded cleared/current/locked states, now fit with room to spare. (First
   attempt at the compact pips used `Expanded` + `AspectRatio`, which made
   `AspectRatio` derive its height from the `Expanded`-forced tight width
   instead of the intended ~10px — the pips rendered at full node size and
   saved no space at all; fixed by giving the pips a fixed size instead.)
2. **The Play lower tray was functionally empty** (a swipe icon and one
   line, ~27% of the screen in Endless). Replaced with a mode-specific
   insight built from data the game already tracks — no new mechanics:
   Rescue/Daily show a goal-progress bar (score-to-target for Rescue,
   move-of-3 for Daily) plus a moves-left caption; Endless shows the
   current run's best tile and the next milestone tile (double the current
   best — the literal next merge rung) as small character tiles, plus the
   player's all-time best score. Below that, a Restart/Settings quick-
   action row duplicates the pause menu without requiring a trip through
   Pause (`confirmRestartRun` was extracted out of the pause panel so both
   places share the exact same confirmation dialog). The swipe hint / accessible
   move controls stay, just smaller.
3. **Duplicate win copy** ("Path cleared" title, "Path cleared." message).
   `MergeRelayResult.message` for `completed` is now "Every tile found its
   place." — distinct, short, same voice as the other three outcomes. Added
   `merge_relay_models_test.dart`: "every outcome has a distinct title and
   message", which constructs a result for each `MergeRelayOutcome` and
   asserts the message never equals the title (with or without a trailing
   period).

Two regressions surfaced by these changes and fixed in the same round: the
Play lower tray's swipe hint became a `Row` (to save vertical space) and
overflowed at 2x text scale on a 320px-wide screen (fixed with `Flexible`
+ ellipsis, same pattern as the round-1 `MrButton`/campaign-progress
fixes); the new goal-progress header row used a `Spacer()` between two
fixed-width `Text`s, the same footgun the round-1 campaign-progress panel
had, fixed the same way (`Expanded` + ellipsis on the label side).

All verification commands were re-run after round 2 (see above — now 228
tests, +1 for the title/message regression test) and every affected golden
was regenerated and viewed. `before-after/round2_before_after.png` compares
the failed round-1 goldens (from commit 160878b) against the round-2 fix
for chapter_map/play_rescue/play_endless.

## Round 3 (fix round 2 — final): no relay/friend/handoff wording in solo v1

The re-verifier confirmed all three round-2 fixes, then failed on copy: the
task requires "the solo scope has no 'relay'/'friend' wording", and
"handoff" counts too (it's relay language). A complete sweep —
`grep -rniE "relay|friend|handoff|hand off|spark" apps-native/games/merge_relay/{lib,content}`,
then manually classifying every hit as solo-reachable copy (fix), gated
behind the task 05 social gate (leave — `_relay_*`/`network/`/`platform/`
files, and the `_RelayAction`/"Join a relay" row, which only renders when
`game.features.socialEnabled`), the "Merge Relay" brand wordmark (leave —
the rename is task 18), or an internal identifier/exception message (leave
— e.g. `FormatException('Invalid relay content')`, thrown only if the
content JSON itself is malformed, and route/constant names like
`MergeRelayRoute.relay`) — found and fixed every remaining solo-reachable
string:

| File:line | Old | New |
|---|---|---|
| `lib/src/merge_relay_models.dart:35` | "Keep the relay alive for one more merge." | "Keep the chain going for one more merge." |
| `lib/src/merge_relay_home_art.dart:89` | "A tiny board. A clean handoff." | "A tiny board. A clean sweep." |
| `lib/src/merge_relay_result_screen.dart:146` | "Carry the spark into the next path." | "Keep the chain moving into the next path." |
| `lib/src/merge_relay_result_screen.dart:148` | "Read the open lanes, then try a different first handoff." | "Read the open lanes, then try a different first move." |
| `lib/src/merge_relay_overlays.dart:132` | "Replay handoff guide" (Settings button) | "Replay tutorial" (matches the task's own Context spec) |
| `lib/src/merge_relay_tutorial.dart:85` | "First handoff" (tutorial title) | "First merge" |
| `lib/src/merge_relay_content.dart:310` | "Late relay" (fallback dev catalog board title, used by `test/widget_test.dart` and other unit tests via `MergeRelayContentCatalog.fallback`) | "Last Light" |
| `content/rescue_boards.json` (chapter 2, board 1) | title "Spark Catch", subtitle "Catch the first spark." | title "New Lantern", subtitle "Light the very first tile." |
| `content/manifest.json` | subtitle "Merge tiles. Challenge friends" | "Merge tiles. Light the board" (matches `mergeRelayIdentity`'s actual in-app subtitle) |
| `content/themes.json` (both themes) | description "...relay lights." | "...tile lights." |

Only **display text** changed in the two content JSON files — titles,
subtitles, objectives, descriptions. No board data, seed, target score,
move budget, or solver/trace metric was touched; confirmed with
`bun run games:content:validate`, `bun run games:parity`
("Merge Relay VM/JS replay parity passed"), and the full
`merge_relay_rescue_campaign_test.dart`/`merge_relay_content_test.dart`
suites (all pass).

Left alone (gated or brand, not part of this sweep): every string in
`merge_relay_relay_*.dart`, `network/`, `platform/merge_relay_{challenge,
pgs,play_games}*.dart`, `merge_relay_gateway.dart`, `merge_relay_client.dart`,
`merge_relay_pending_create.dart`; the "Join a relay" home row and its
semantics label (`_RelayAction`, only reachable when
`game.features.socialEnabled` — proven off by default in
`solo_v1_scope_test.dart`); "MERGE RELAY"/"Merge Relay"/"MERGE\nRELAY" (the
brand wordmark); `content/manifest.json`'s `app_id`/`public_title` (the
latter is validated byte-for-byte against the games registry by
`scripts/games/content.ts`) and its `stage`/`server_validated_relays`
fields (internal engineering/roadmap metadata about the real v1.1 relay
feature, never rendered in the app).

**New test**: `test/merge_relay_no_relay_wording_test.dart` boots one app
instance and walks it screen to screen — Home, Settings, tutorial, play
(rescue), pause, result (win), play (endless), play (daily), result
(loss), chapter map — collecting every currently-rendered `Text`/
`RichText` string plus every `Tooltip`/`Semantics` label/value/hint, and
asserts none match `relay|friend|handoff|hand\s*off` (case-insensitive)
except the brand wordmark. Verified the test actually catches a violation
(not just vacuously passing) by temporarily reintroducing "A clean
handoff." — the test failed, listing both the `home` and `settings` screens
(the hero is still in the tree, just covered, while the sheet is open) —
then reverted.

**Chapter-map hint** (a second point the verifier raised): after round 2
made every locked card fully compact (no unlock-rule text visible at all),
the rule wasn't shown anywhere. Fixed with `showUnlockHint` on
`MergeRelayChapterCard` — true only for the one locked chapter that's
actually next to unlock (`chapters.firstWhere((c) => !isChapterUnlocked)`,
computed once in `MergeRelayChapterMap`) — so exactly one locked card shows
its "Clear 7 of 10 in Chapter N to unlock" line, the rest stay compact, and
all 6 chapters still fit (`chapter_map.png`'s largest flat band is 3.3%,
still well under any limit).

All verification commands were re-run after round 3 (229 tests total, +1
for the wording-sweep test) and every affected golden was regenerated and
viewed: `home.png`, `tutorial.png`, `play_rescue.png`, `play_endless.png`,
`result_win.png`, `result_loss.png`, `settings.png`, `chapter_map.png`.

## Files

- `goldens/` — every screen golden from
  `apps-native/games/merge_relay/test/goldens/screens/` as of this task
  (home, home_small, chapter_map, tutorial, play_rescue, play_endless,
  result_win, result_loss, pause, settings) — round 3's final versions.
- `before-after/home_play_result_before_after.png` — a contact sheet
  comparing the 2026-09-25 portfolio-audit renders
  (`.agents/resources/2026-09-25/games-portfolio-audit/renders/`, the
  pre-epic baseline) against this task's Home/Play/Result goldens.
- `before-after/round2_before_after.png` — round 1 (failed review, commit
  160878b) vs. round 2 (fixed) for chapter_map/play_rescue/play_endless.
- `before-after/round3_chapter_map_before_after.png` — round 1 (committed,
  failed review) vs. round 3 (final: compact locked cards + the one
  next-unlock hint) for `chapter_map.png`.

## Known follow-ups (out of scope here)

- Bitmap art for `homeScene`/`logoWide`/tile faces ships in tasks 20/23; all
  slots currently render their code-drawn fallbacks.
- Tutorial/how-to-play screen restyle (layout) is task 12; round 3 only
  changed its copy ("First handoff" → "First merge") to clear the
  no-relay-wording requirement.
- The app's final name (task 18) — "MERGE RELAY" is kept as placeholder
  title text per the task's Out of Scope note.
