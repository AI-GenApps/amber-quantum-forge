# Task 06 — Merge Relay: solver + 60-board, 6-chapter Rescue campaign

Evidence for `tasks/epics/16-games-portfolio-wave2/06-mr-rescue-campaign-60.md`.

## What was built

- **Solver**: `apps-native/games/packages/merge_rules/lib/src/merge_rescue_solver.dart`
  (`MergeRescueSolver`, algorithm `merge-rescue-solver-v1`). A depth-bounded, fully
  deterministic search over the four directions to exactly `moveBudget` moves deep
  (spawns are a pure function of `rng_state`, so there is no hidden randomness). It
  proves whether a board's `target_score` is reachable by some full-length legal-move
  sequence, returns the winning line whose score first crosses the target at the
  smallest depth (ties broken by direction order, for determinism), the count of
  distinct full-length winning lines (a difficulty signal — fewer is harder), and the
  number of search-tree nodes visited. It throws `MergeRescueSolverLimitExceeded` if a
  configurable node cap is exceeded, rather than silently truncating the search.
  Unit tests: `apps-native/games/packages/merge_rules/test/merge_rescue_solver_test.dart`
  (known-winnable, known-unwinnable, node-cap-exceeded, determinism, and
  out-of-range-budget cases).
- **Generation tool**: `apps-native/games/packages/merge_rules/tool/generate_rescue_campaign.dart`
  + `tool/rescue_campaign_content.dart` (chapter/title data). Seeds
  `MergeRescueGenerator` deterministically per (chapter, index), then uses the solver
  to pick each board's `target_score` from the checkpoint's own achievable-score set,
  ranked by difficulty (rank 1 = easiest, rank 10 = hardest within a chapter),
  preferring a target that keeps both the target score and the winning-line count on
  a non-decreasing / non-increasing trend across the chapter. The very first board
  (chapter 1, board 1) is special-cased to be solvable in exactly one move with at
  least two winning lines remaining (onboarding).
- **Content**: `apps-native/games/merge_relay/content/rescue_boards.json` — regenerated
  to 60 boards (was 5), each carrying `chapter`, `index_in_chapter`, `move_budget`, and
  a `solver` provenance block (`winning_line`, `winning_line_count`,
  `first_reached_depth`, `nodes_explored`), plus a top-level (optional) `campaign`
  block documenting the chapter count, boards-per-chapter, and the move-budget ramp
  formula.
- **App**: `MergeRescueBoard` (`merge_relay_content.dart`) gained `chapter`,
  `indexInChapter`, `moveBudget` fields (optional in the wire format, defaulting to
  chapter 1 / index 1 / budget 3 so existing fixtures and the 5-board offline
  `.fallback` catalog are unaffected). `MergeRelayGame` now tracks the active rescue's
  move budget (`_activeMoveBudget`, default 3) instead of a hardcoded `3`, used by
  `movesRemaining` and the rescue completion check
  (`merge_relay_game.dart`, `merge_relay_game_actions.dart`). Chapter grouping and the
  unlock rule (chapter N+1 unlocks after 7 of chapter N's 10 boards are cleared) live
  in the new `merge_relay_campaign.dart` (`MergeRelayCampaign` extension,
  `isChapterUnlocked`, `clearedCountInChapter`, `rescueChapters`). The Rescue picker in
  `merge_relay_home.dart` groups boards under a chapter header and disables locked
  chapters — deliberately minimal; task 11 restyles it.
- **Save migration**: the session-map schema version moved from 1 to 2
  (`merge_relay_save_state.dart`, `_mergeRelaySessionMapVersion`) to carry the new
  optional `move_budget` per session. Both version 1 and 2 payloads are accepted by
  the same tolerant parser (`merge_relay_game_restore_parsing.dart`); `move_budget`
  simply defaults to 3 when absent, exactly matching the old fixed behavior. A save's
  `completed_rescue_ids` (profile-level, unaffected by the session-map version) always
  carries over untouched. Covered by
  `merge_relay/test/merge_relay_game_flow_test.dart` ("a legacy (v1) session map
  migrates and keeps cleared rescue boards", "a legacy rescue session without
  move_budget keeps its three-move play").
- **Campaign test**: `merge_relay/test/merge_relay_rescue_campaign_test.dart` proves,
  for all 60 bundled boards: exactly 60 boards / 6 chapters of 10; board 1 of chapter 1
  is solvable in one move with ≥2 winning lines; every board's solver winning line,
  replayed through the pure rules/session layer (`MergeRules.replayFrom`) AND through
  the real `MergeRelayGame` controller (`game.move()` → `_updateCompletion()`), reaches
  `MergeRelayOutcome.completed`; difficulty (target score, winning-line count) is
  non-decreasing/non-increasing within each chapter allowing ≤2 local inversions per
  metric; chapter grouping and the 7-of-10 unlock rule behave as specified.

## Why `validateMergeRelayGoal`'s move-budget bound was widened, not the ranked-relay cap

Two separate "move budget" concepts already existed in `merge_rules`:

1. **Rescue's own budget** (`MergeRelayGame._rescueMovesUsed` vs. a hardcoded `3`) —
   plain app-level counting, not backed by `MergeCheckpoint.maxLegalMoves` /
   `MergeMoveBudget` / `replayAttempt`. This is what task 06 needed to widen to 3-5,
   and it was purely an app-level change (`merge_relay_game.dart`,
   `merge_relay_game_actions.dart`, `merge_relay_save_state.dart`,
   `merge_relay_game_restore_parsing.dart`).
2. **The ranked-relay path's budget cap** (`MergeCheckpoint.maxLegalMoves`,
   `replayFrom`/`replayAttempt`'s `maxLegalMoves`, `MergeMoveBudget.bounded`, all
   clamped to 1-3) — used only by the friend-relay/challenge subsystem, which is
   gated off for v1 (`merge_relay_features.dart`,
   `.agents/games/merge-relay/product.md`). This was **left untouched**: widening it
   was out of scope, would have touched dozens of relay/network files never listed in
   this task, and rescue mode does not use it. `createRelayFromCurrentBoard()`
   (`merge_relay_game_relay_actions.dart`) still hardcodes `maxLegalMoves: 3` when
   sharing a board — a known, intentional gap in the still-gated v1.1 relay feature,
   not part of this task's acceptance criteria.

`merge_relay_content_validation.dart`'s `validateMergeRelayGoal` (a plain BFS
"reachable within ≤ N moves" check used for content-load-time sanity, and for
validating a restored session's frozen goal) had its own hardcoded `maxMoves > 3`
bound; that bound was widened to `mergeRelayMaxRescueMoveBudget` (=
`maxMergeRescueSolverMoveBudget` = 6) since chapter 5-6 boards now legitimately use a
budget of 5. Callers now pass the board's/session's actual `moveBudget` instead of
relying on the old default of 3.

## `games:parity` is unaffected

`bun run games:parity` only exercises `bin/replay_fixture.dart` /
`MergeRules().replay(seed, moves)` — pure board mechanics — against
`scripts/games/parity_fixture.json`. No fixture file was touched, and none of this
task's changes touch `merge_board.dart`, `merge_rules.dart`'s move mechanics, or the
spawn RNG, so parity passed unmodified (see Verification below).

## Chapter themes and titles

Neutral placeholder chapter themes per the epic's decision record; original, short
titles/subtitles. Real theming lands in the art/brand tasks (15/19/20/22/23).

1. **Harbor** — First Light · Rope and Cleat · Low Tide · Ferry Lane · Salt Crate ·
   Buoy Line · Harbor Watch · Tugboat Turn · Breakwater · Anchor's Rest
2. **Foundry** — Spark Catch · Bellows · Ingot Row · Hammer Fall · Quench · Casting
   Floor · Forge Shift · Slag Heap · White Heat · Foundry Bell
3. **Orchard** — Bud Break · Bee Line · Graft · Windfall · Espalier · Root Bound ·
   Late Bloom · Orchard Ladder · Hard Frost · Harvest Moon
4. **Bazaar** — Open Stall · Haggler's Start · Spice Row · Copper Scale · Silk Thread ·
   Lantern Stall · Crowded Aisle · Last Bid · Market Bell · Sold Out
5. **Glacier** — First Crack · Blue Vein · Cold Snap · Crevasse · Ice Bridge · Frozen
   Drift · Glacial Pace · Deep Freeze · Calving Edge · Summit Ice
6. **Observatory** — First Star · Night Watch · Comet Trail · Dark Sky · Star Chart ·
   Lunar Pass · Meteor Shower · Deep Field · Final Alignment · Observatory Dawn

All 60 titles/subtitles were read end-to-end for quality and originality before
finishing this task.

## Solver metrics (per board)

"Winning lines" = distinct full-length (== move budget) legal-move sequences that
reach the target score. "Minimal solution" = the depth (number of moves) at which the
board's chosen winning line first reaches the target score (a difficulty signal —
board 1 of chapter 1 is 1, the earliest possible).

| Chapter | # | ID | Title | Subtitle | Budget | Target | Winning lines | Minimal solution |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | rescue-harbor-01 | First Light | Ease into the harbor. | 3 | 8 | 48 | 1 |
| 1 | 2 | rescue-harbor-02 | Rope and Cleat | Tie the first pair together. | 3 | 16 | 32 | 2 |
| 1 | 3 | rescue-harbor-03 | Low Tide | Work the shrinking shoreline. | 3 | 32 | 8 | 3 |
| 1 | 4 | rescue-harbor-04 | Ferry Lane | Keep the crossing clear. | 3 | 32 | 8 | 3 |
| 1 | 5 | rescue-harbor-05 | Salt Crate | Stack what the dock delivers. | 3 | 52 | 8 | 3 |
| 1 | 6 | rescue-harbor-06 | Buoy Line | Follow the markers in. | 3 | 52 | 8 | 2 |
| 1 | 7 | rescue-harbor-07 | Harbor Watch | Mind every open berth. | 3 | 56 | 8 | 3 |
| 1 | 8 | rescue-harbor-08 | Tugboat Turn | Muscle the heavy pair home. | 3 | 56 | 8 | 3 |
| 1 | 9 | rescue-harbor-09 | Breakwater | Hold the line against the swell. | 3 | 68 | 8 | 3 |
| 1 | 10 | rescue-harbor-10 | Anchor's Rest | Bring the fleet in for the night. | 3 | 68 | 8 | 3 |
| 2 | 1 | rescue-foundry-01 | Spark Catch | Catch the first spark. | 3 | 8 | 48 | 1 |
| 2 | 2 | rescue-foundry-02 | Bellows | Feed the fire two at a time. | 3 | 20 | 40 | 1 |
| 2 | 3 | rescue-foundry-03 | Ingot Row | Line the ingots up true. | 3 | 24 | 32 | 1 |
| 2 | 4 | rescue-foundry-04 | Hammer Fall | Strike while the metal's hot. | 3 | 28 | 32 | 2 |
| 2 | 5 | rescue-foundry-05 | Quench | Cool the pair before it cracks. | 3 | 36 | 24 | 2 |
| 2 | 6 | rescue-foundry-06 | Casting Floor | Mind the molds underfoot. | 3 | 40 | 16 | 3 |
| 2 | 7 | rescue-foundry-07 | Forge Shift | Keep the shift moving. | 3 | 60 | 16 | 3 |
| 2 | 8 | rescue-foundry-08 | Slag Heap | Clear a path through the scrap. | 3 | 64 | 8 | 3 |
| 2 | 9 | rescue-foundry-09 | White Heat | Push the alloy to its limit. | 3 | 72 | 8 | 3 |
| 2 | 10 | rescue-foundry-10 | Foundry Bell | Close the floor on your terms. | 3 | 80 | 8 | 3 |
| 3 | 1 | rescue-orchard-01 | Bud Break | Coax the first bud open. | 4 | 20 | 256 | 1 |
| 3 | 2 | rescue-orchard-02 | Bee Line | Follow the shortest path. | 4 | 28 | 176 | 2 |
| 3 | 3 | rescue-orchard-03 | Graft | Join two branches as one. | 4 | 48 | 64 | 3 |
| 3 | 4 | rescue-orchard-04 | Windfall | Gather what the wind drops. | 4 | 52 | 48 | 3 |
| 3 | 5 | rescue-orchard-05 | Espalier | Train the rows against the wall. | 4 | 60 | 32 | 4 |
| 3 | 6 | rescue-orchard-06 | Root Bound | Work within tight quarters. | 4 | 68 | 32 | 4 |
| 3 | 7 | rescue-orchard-07 | Late Bloom | Coax growth from a slow season. | 4 | 68 | 16 | 4 |
| 3 | 8 | rescue-orchard-08 | Orchard Ladder | Climb toward the highest fruit. | 4 | 76 | 16 | 4 |
| 3 | 9 | rescue-orchard-09 | Hard Frost | Save the harvest before the freeze. | 4 | 80 | 16 | 4 |
| 3 | 10 | rescue-orchard-10 | Harvest Moon | Bring in the last of the crop. | 4 | 88 | 16 | 4 |
| 4 | 1 | rescue-bazaar-01 | Open Stall | Set out your first goods. | 4 | 20 | 80 | 3 |
| 4 | 2 | rescue-bazaar-02 | Haggler's Start | Strike an easy bargain. | 4 | 24 | 64 | 3 |
| 4 | 3 | rescue-bazaar-03 | Spice Row | Sort the jars by scent. | 4 | 52 | 32 | 2 |
| 4 | 4 | rescue-bazaar-04 | Copper Scale | Balance what you're offered. | 4 | 60 | 16 | 4 |
| 4 | 5 | rescue-bazaar-05 | Silk Thread | Follow the finest weave. | 4 | 64 | 16 | 4 |
| 4 | 6 | rescue-bazaar-06 | Lantern Stall | Trade by lamplight. | 4 | 68 | 16 | 4 |
| 4 | 7 | rescue-bazaar-07 | Crowded Aisle | Thread the packed stalls. | 4 | 88 | 16 | 4 |
| 4 | 8 | rescue-bazaar-08 | Last Bid | Close before the crowd moves on. | 4 | 92 | 16 | 4 |
| 4 | 9 | rescue-bazaar-09 | Market Bell | Beat the closing bell. | 4 | 92 | 16 | 4 |
| 4 | 10 | rescue-bazaar-10 | Sold Out | Clear the stall before dusk. | 4 | 128 | 16 | 4 |
| 5 | 1 | rescue-glacier-01 | First Crack | Test the ice underfoot. | 5 | 28 | 928 | 2 |
| 5 | 2 | rescue-glacier-02 | Blue Vein | Follow the seam through the ice. | 5 | 32 | 224 | 1 |
| 5 | 3 | rescue-glacier-03 | Cold Snap | Move before the frost sets. | 5 | 56 | 96 | 2 |
| 5 | 4 | rescue-glacier-04 | Crevasse | Mind the gap as you cross. | 5 | 68 | 96 | 3 |
| 5 | 5 | rescue-glacier-05 | Ice Bridge | Trust a narrow crossing. | 5 | 68 | 32 | 5 |
| 5 | 6 | rescue-glacier-06 | Frozen Drift | Push through the packed snow. | 5 | 80 | 32 | 5 |
| 5 | 7 | rescue-glacier-07 | Glacial Pace | Patience pays here. | 5 | 80 | 32 | 5 |
| 5 | 8 | rescue-glacier-08 | Deep Freeze | Work the coldest stretch yet. | 5 | 88 | 32 | 5 |
| 5 | 9 | rescue-glacier-09 | Calving Edge | Move fast before it shifts. | 5 | 144 | 32 | 5 |
| 5 | 10 | rescue-glacier-10 | Summit Ice | Reach the frozen peak. | 5 | 144 | 32 | 5 |
| 6 | 1 | rescue-observatory-01 | First Star | Spot the easiest pair in the sky. | 5 | 52 | 256 | 2 |
| 6 | 2 | rescue-observatory-02 | Night Watch | Settle in for a long shift. | 5 | 64 | 160 | 3 |
| 6 | 3 | rescue-observatory-03 | Comet Trail | Track a fast-moving pair. | 5 | 64 | 64 | 5 |
| 6 | 4 | rescue-observatory-04 | Dark Sky | Work without much to go on. | 5 | 96 | 64 | 5 |
| 6 | 5 | rescue-observatory-05 | Star Chart | Chart the safest path. | 5 | 96 | 32 | 5 |
| 6 | 6 | rescue-observatory-06 | Lunar Pass | Time the crossing with the moon. | 5 | 132 | 32 | 5 |
| 6 | 7 | rescue-observatory-07 | Meteor Shower | Keep up as they fall. | 5 | 132 | 256 | 4 |
| 6 | 8 | rescue-observatory-08 | Deep Field | Search the faintest corners. | 5 | 132 | 128 | 4 |
| 6 | 9 | rescue-observatory-09 | Final Alignment | Line up the last pieces. | 5 | 132 | 64 | 5 |
| 6 | 10 | rescue-observatory-10 | Observatory Dawn | Close the campaign as the sky lightens. | 5 | 152 | 64 | 5 |

Per-chapter local inversions (adjacent pairs that break the trend; ≤2 allowed per
metric per the task's tolerance): target score 0/0/0/0/0/0 across chapters 1-6;
winning-line count 0/0/0/0/0/1 (chapter 6, board 7 "Meteor Shower" is the one count
inversion — its target repeats the previous board's target while opening a wider set
of merge options).

## Verification (all run from the repo root unless noted)

| Command | Result |
|---|---|
| `cd apps-native/games/packages/merge_rules && dart analyze && dart test` | pass — analyze clean, 37 tests pass |
| `bun run games:parity` | pass — "Merge Relay VM/JS replay parity passed via Bun 1.3.3." |
| `bun run games:content:validate` | pass — "Content validation passed." |
| `bun run games:format:check` | pass — 0 files changed |
| `bun run games:analyze -- --app merge_relay` | pass — all rules packages + merge_relay clean |
| `bun run games:test -- --app merge_relay` | pass — 134 tests (task 05 baseline was 126; +8 new: 2 save-migration, 6 campaign) |
| `bun run games:validate:strict` | pass — "Gaming registry and content validation passed in strict mode." |
| `bun run check` (repo-wide sanity net) | pass — Biome, 325 files, no fixes needed |
| `bun run check:max-lines` | pass — no output (no file over the limit) |

Device/screen evidence: **NOT RUN** — this task is content/rules/persistence only (no
new screens; the chapter picker's minimal restyle is a `ListTile` grouping change,
covered by widget tests, not a new golden target). Screen goldens start at task 07 per
the epic's harness plan.
