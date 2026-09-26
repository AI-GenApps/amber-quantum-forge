# Task 13 — Merge Relay: local quality gate (seeded runs, flows, budgets)

Evidence for `tasks/epics/16-games-portfolio-wave2/13-mr-local-quality.md`.

## The real bug this task's tests found (and fixed)

Driving the real `MergeRelayGame` controller with a seeded, deterministic
policy across 50 Endless runs (the exact "Ludo lesson" this task's Context
section calls out — tests must drive the real controller, not just the
rules package) surfaced a severe, pre-existing gameplay bug: **swiping
right did nothing different from swiping left, and swiping down did
nothing different from swiping up, on every board, in every mode.**

### Root cause

`MergeRules._move` (`apps-native/games/packages/merge_rules/lib/src/merge_rules.dart`)
scans each line for compaction/merging in `orientedIndexes`, then places
the merged result back into `result` using `indexes`. For `right`/`down`,
the code additionally reversed the scan order (`indexes.reversed`) *and*
reversed the merged output (`merged.reversed`) before placing it — but
`_lineIndexes` already returns each line's indexes in anchor-first order
for the requested direction (e.g. `right`'s `[3, 2, 1, 0]` already starts
at the rightmost cell). Reversing an already-anchor-ordered list and then
reversing the output again exactly cancels out, so `right` ended up
computing and placing tiles in the same order as `left` (and `down` the
same as `up`).

Proven directly (single tile at index 0, sliding right): the tile never
moved. Proven at scale: a corner-bias bot that's supposed to exercise all 4
directions actually only had 2 *distinct* transforms available, and for
several boards (including the very first Endless seed, `0x4d52`/19794) it
found a fixed point where both distinct transforms were no-ops —
`MergeBoard.hasLegalMove`'s `if (!isFull) return true` shortcut (a normally
valid 2048 invariant: a non-full board always has *some* legal move, which
only holds if all 4 directions are genuinely distinct) then incorrectly
reported the board as non-terminal forever. In the real app this is a
genuine, reachable **soft-lock**: a real player who happens to swipe into
that exact board pattern would see the board simply stop responding to two
of the four swipe directions, with no error and no path to a result
screen — exactly the class of bug a controller-only unit test never would
have caught, since the solver/generator pipeline was built and validated
entirely against this same buggy rule set and so never noticed the
asymmetry.

### The fix

`packages/merge_rules/lib/src/merge_rules.dart`: removed the redundant
`orientedIndexes`/`output` reversal entirely and used `_lineIndexes`'s
already-correct anchor-first order directly, for both scanning and
placement. `left`/`up` are byte-for-byte unchanged (they never had the
extra reversal); `right`/`down` now genuinely differ.

### Fallout fixed alongside it

Every rescue-board checkpoint in this app is *trace-derived*: a short
`origin_seed` + `origin_moves` replay is validated against the live
`MergeRules` at load time (`MergeRescueGenerator`/`validateCatalog`), and
`MergeRescueGenerator._DirectionChooser` picks among whichever directions
`_legalDirections` reports as *actually distinct* moves. Fixing the
right/down bug changed which moves are distinct at each step, so every
generated checkpoint (the bundled 60-board `content/rescue_boards.json`
*and* the in-process 5-board fallback catalog `_generatedFallback()` in
`lib/src/merge_relay_content.dart`) now produces different (still valid,
still solvable) boards for the same `origin_seed`/`origin_move_count`.
Regenerating and updating what depended on the old boards:

- **`content/rescue_boards.json`** (60 boards): regenerated with
  `dart run tool/generate_rescue_campaign.dart` from
  `packages/merge_rules` — the exact same task-06 tool, same chapter/id/
  title/difficulty-progression logic, now searching against the corrected
  rules. All 60 IDs, chapters, and titles are unchanged; only the
  checkpoints (and therefore their solver winning lines) differ.
- **Fallback catalog** (`lib/src/merge_relay_content.dart`): board
  `rescue-crossing`'s hardcoded `targetScore` (28 → 24) and objective text,
  the only one of the 5 fallback boards whose old target was no longer
  achievable within its 3-move budget on the new checkpoint (computed via
  the same achievable-scores search `generate_rescue_campaign.dart` uses).
- **Two hardcoded-checkpoint unit tests** in `packages/merge_rules/test/`
  (`merge_rules_test.dart`, `merge_config_test.dart`): updated their
  expected `board` arrays for the same `[left, up, right, down, left]`
  replay sequence — score/move_count/rng_state are identical, only the
  board layout changed, exactly as expected from a right/down fix.
- **Three widget tests** that hardcoded a fixed `[up, left, left]` swipe
  sequence tuned to the old fallback board (`test/widget_test.dart` x2,
  `test/solo_v1_scope_test.dart` x1): switched to solving the fallback
  board dynamically with `MergeRescueSolver` (the same pattern
  `merge_relay_onboarding_test.dart`'s `_solveFirstRescue` already used for
  the real catalog), so they stay correct however the generator's own
  direction search lands.
- **Two screen goldens** (`play_rescue.png`, `result_loss.png`, then all 10
  screens that show an `MrIconButton` after the tap-target fix below):
  regenerated with `--update-goldens` and viewed — all render correctly
  (real Fredoka/Nunito Sans fonts, no overflow, no black regions, no tofu).

Every one of these was proven necessary by running the *whole* `merge_rules`
+ `merge_relay` suite before and after each change (never assumed) — see
"Verification" below for the before/after failure counts.

## Accessibility bug found and fixed

`MrIconButton` (`lib/src/ui/mr_icon_button.dart`) used
`Padding.all(10)` around a 22px icon — a 42x42 tap target, under the 48dp
platform minimum. Bumped to `Padding.all(13)` (48x48). Verified the new
`accessibility_test.dart` catches the regression (temporarily reverted the
padding, confirmed the test fails; restored the fix, confirmed it passes).
This also changed every screen's icon-button circle size by a few px,
which is why the golden regeneration above touched 10 of 13 screens.

## Tests added

All five files are new, under `apps-native/games/merge_relay/test/quality/`:

- **`endless_seeded_runs_test.dart`**: 50 Endless runs through the real
  `MergeRelayGame` controller (`startEndless` + `move`, not `merge_rules`
  directly), each with `startEndless`'s own seed-increment rule guaranteeing
  a distinct seed, played by a deliberately *weak* deterministic policy
  (first direction in a fixed corner-bias order that merges anything, else
  the first that legally slides) until `roundComplete`. A stronger
  merge-maximizing policy was tried first and found to survive tens of
  thousands of moves on some seeds (a real property of greedy 2048 play,
  not a bug) — the weak policy is documented in the file as the reason a
  "smarter" one isn't used.
- **`daily_seeded_test.dart`**: 20 consecutive UTC dates via a `FixedClock`
  (not the system clock) driving `startDaily`, each asserting the game's
  seed matches the documented `_mergeRelayDailySeed` formula (reproduced in
  the test since it's a private, same-library helper) and reaches a
  consistent-score result. Daily's own completion rule (`moveCount >= 3`)
  makes this fast regardless of policy.
- **`rescue_campaign_replay_test.dart`**: one board per chapter (6 of the
  60) replayed via real drag gestures on the actual `MergeRelayBoard`
  widget (`tester.fling`), not `game.move()` directly — the UI-controller
  path task 06's existing all-60-board replay test doesn't cover (that one
  drives `game.move()` directly). A full 60-board gesture sweep would
  duplicate task 06's coverage for no extra signal, since both paths
  converge on the same `game.move` call.
- **`app_flows_test.dart`**: the three required flows. Flow 1 (fresh
  install → tutorial-skip → board 1 cleared → chapter map) is a
  `testWidgets` test through the full `MergeRelayApp`. Flow 2 (mid-run kill
  and restore via the save adapter) uses a plain `test()` driving
  `MergeRelayGame` directly against a **real** `JsonFileSaveStore` backed by
  a `Directory.systemTemp` temp dir — not `MemorySaveStore`. This was
  deliberately *not* wrapped in `testWidgets`/`MergeRelayApp`: a first draft
  doing exactly that hung indefinitely (genuine dart:io file I/O doesn't
  reliably complete inside `flutter test`'s fake-async pump loop — the same
  reason this codebase's own asset loads are always wrapped in
  `tester.runAsync`). Flow 3 (Settings toggle persists across restart) goes
  through the real Settings sheet UI with `MemorySaveStore` and a fresh
  `UniqueKey()`'d `MergeRelayApp` to simulate the restart, the same proven
  idiom `widget_test.dart`'s existing restore test uses.
- **`accessibility_test.dart`**: walks Home, the chapter map, Play
  (rescue), Pause, Result, and Settings, asserting every `MrIconButton`
  (and every unlocked `MergeRelayChapterNode`, and every Settings `Switch`)
  measures at least 48x48 logical px and carries a non-empty semantics
  label with `SemanticsFlags.isButton`. Text-scale-1.3 overflow is already
  covered by task 11's `merge_relay_screens_responsive_test.dart` and isn't
  repeated here.

Test count: 240 (task 12 baseline) + 12 new cases across these 5 files =
**252**, all passing.

## Verification

| Command | Result |
|---|---|
| `bun run games:format:check` | pass |
| `bun run games:analyze -- --app merge_relay` | pass (no issues) |
| `time bun run games:test -- --app merge_relay` | pass — 252 tests, 49s wall time |
| `flutter build apk --release --split-per-abi --dart-define=MERGE_RELAY_SOCIAL=false` | pass — arm64 17.9 MB (debug-signed fallback, see `budgets.md`) |
| `bun run games:validate:strict` | pass |

Before the `merge_rules` fix, the full `flutter test` suite in
`apps-native/games/merge_relay` had 23 failures (content-load rejection,
onboarding/scope-gate widget tests, two golden mismatches) caused entirely
by the trace-derived content becoming inconsistent with the corrected
rules — each was root-caused and fixed as described above, then the full
suite (`packages/merge_rules` `dart test` + `merge_relay` `flutter test`)
was re-run clean.

Device/emulator steps: **NOT RUN** (no device on this server; task 25 is
the human device pass).

## Round 2 (orchestrator review): the server TypeScript engine had the identical bug

Orchestrator review traced `packages/api/src/games/merge-relay/engine.ts`'s
`moveBoard` (lines ~249-271 before this fix) and confirmed it had the exact
same double-reversal bug as the Dart engine: `oriented = values.reverse()`
for `right`/`down`, then `output = merged.reverse()` again before placing —
cancelling out, so the TypeScript server also silently treated `right` as
`left` and `down` as `up`. Left unfixed, the Dart client (now correct) and
the TS server (still buggy) would disagree on every right/down move, so
server-side relay-move validation would reject legitimate client runs (a
v1.1 concern, since relays are gated off in v1, but the shared engine code
and its fixtures are exercised today by `packages/api`'s own test suite and
`bun run games:parity`).

### The fix

`packages/api/src/games/merge-relay/engine.ts`'s `moveBoard`: same fix as
the Dart side — removed the `oriented`/`output` reversal, using
`lineIndexes`'s already-anchor-ordered result directly for both the
compaction scan and the placement. A comment cross-references the Dart fix.

### Fixtures regenerated (documented per-file, as required)

All corrected values were computed from the **Dart** engine (ground truth,
already fixed and verified in round 1), not hand-guessed, using a scratch
script run via `dart run` against `packages/merge_rules` and discarded
afterward (not committed). Every fixture below encodes the confirmed bug
(a `right`/`down` move silently producing `left`/`up`'s result) — this is
exactly the "the fixture encodes a confirmed bug, not a real mismatch"
case, so regenerating rather than hand-preserving old numbers is correct.

- **`scripts/games/parity_fixture.json`** — *why*: its `expected.board` for
  seed `12345` replayed through `["left","up","right","down","left"]` was
  the old buggy board. *How*: recomputed via
  `MergeRules().replayFrom(MergeGameState.newGame(seed: 12345), moves)` in
  `packages/merge_rules` (the same sequence `merge_rules_test.dart`'s
  "initial board and replay are deterministic" test already re-verified in
  round 1). *Old → new*: `board` only —
  `[8,2,0,0, 4,2,0,0, 0,0,2,0, 0,0,0,0]` →
  `[0,0,0,0, 2,0,0,2, 8,0,0,0, 2,4,0,0]`. `score` (12), `move_count` (5),
  `rng_state` (150275943) unchanged (same moves, same RNG draws, just
  reflected onto a corrected board shape).
- **`scripts/games/merge_relay_domain_fixture.json`** — *why*: an
  orphaned fixture (added in `0a5071f`, never wired to any consumer) whose
  `ordinary_replay.expected` and `ranked_replay.expected` both encoded the
  old buggy behavior for the same checkpoint (seed 12345, `origin_moves`
  empty — it's the bare `newGame(12345)` checkpoint). *How*: the
  `checkpoint` and `checkpoint_hash` are untouched (they don't involve a
  move at all, so the bug never touched them — confirmed by recomputing
  `checkpoint.checkpointHash` in Dart and getting the same
  `b1fdc3e9...` hash). `ordinary_replay.expected` recomputed the same way
  as the parity fixture above (identical moves/seed, so identical new
  board). `ranked_replay.expected` recomputed via
  `MergeRules().replayFrom(initialState, ["left","up","right"], rejectNoOp: true, maxLegalMoves: 3)`.
  *Old → new*: `ordinary_replay.expected.board`
  `[8,2,0,0, 4,2,0,0, 0,0,2,0, 0,0,0,0]` →
  `[0,0,0,0, 2,0,0,2, 8,0,0,0, 2,4,0,0]` (score/move_count/rng_state
  unchanged, as above). `ranked_replay.expected.board`
  `[8,2,0,0, 0,0,0,0, 4,0,0,0, 0,0,0,0]` →
  `[2,0,0,8, 0,0,0,0, 0,0,0,4, 0,0,0,0]` — `score` (12), `move_count` (3),
  `rng_state` (2188185676), `score_gained` (12), `max_tile` (8), and
  `outcome` (`"completed"`) are all unchanged (the first 3 moves happen to
  produce the same score/RNG trajectory either way; only which cells end up
  holding which values differs, because the old bug made move 3 (`right`)
  behave like `left` instead of a genuine rightward slide). This fixture is
  now wired up as the actual cross-runtime check (see below) instead of
  sitting unused.
- **`packages/api/src/games/merge-relay/engine.test.ts`**'s "matches the
  Dart replay fixture" test — *why*: hardcoded the same old buggy board
  inline. *How*: same recomputation as `parity_fixture.json`. *Old → new*:
  identical board change as above; `score`/`moveCount`/`rngState` unchanged.

No other fixture needed regeneration. Checked and confirmed clean:
`packages/api/src/games/merge-relay/fixtures/merge-relay-v1-http.json`
(its one `moves` array is `["left"]` only — never touches the buggy
code path) and `packages/api/src/games/merge-relay/service.test.ts` (its
`["left","up","right","down"]` case only asserts a `move_budget_exceeded`
error, no board content).

### New cross-runtime check

`scripts/games/merge_relay_domain_fixture.json` is now genuinely consumed
by both runtimes:

- **TS**: `engine.test.ts`'s new "agrees with the shared Dart/TS domain
  fixture for both ordinary and ranked replay" test reads the JSON file
  directly (`new URL("../../../../../scripts/games/...", import.meta.url)`,
  the same pattern `http-fixture.test.ts`/`commerce-provider.test.ts`
  already use for their own fixture files), replays `ordinary_replay` via
  `replay()`, replays `ranked_replay` move-by-move via `applyMove()`
  (mirroring how `relay-finalize.ts` computes `maxTile`/`outcome`), and
  asserts both against the fixture's `expected` values, plus the
  `checkpoint_hash`.
- **Dart**: `apps-native/games/packages/merge_rules/test/merge_relay_domain_fixture_test.dart`
  (new) reads the same JSON file (walking upward from `Directory.current`
  to find it, so it works whether `dart test` runs from the package
  directory — the normal case — or the repo root), and asserts the same
  three things via `MergeCheckpoint.checkpointHash`, `MergeRules.replay`,
  and `MergeRules.replayFrom`.

Two new direct regression tests were also added to `engine.test.ts`
("a single tile slides to the far edge on right/down" and "merges into the
far edge on right/down"), mirroring the TS-side of what round 1's Dart
`survey_endless.dart` scratch script proved by hand — a single tile at
index 0 moved `right` must land in column 3 (not stay at column 0), and a
matching pair merges into the far edge, not the near one.

### Verification (round 2)

| Command | Result |
|---|---|
| `bun run games:parity` | pass |
| `cd apps-native/games/packages/merge_rules && dart test` | pass — 40 tests |
| `bun run games:test -- --app merge_relay` | pass — 252 tests (unchanged from round 1; this app doesn't consume the TS engine) |
| `bun run test` (documented root command → `packages/api` `vitest run`) | pass — 146 tests, 11 skipped (pre-existing Postgres-only skips, unrelated) |
| `bun run check` | pass (biome reformatted one import ordering in the new test file) |
| `bun run typecheck` | **`web#typecheck` fails — pre-existing, unrelated.** `@repo/api:typecheck` and every other package pass. Reproduced the identical failure (same file/line React `Key` type errors in `apps/web/app/components/ui/{button,dialog,label,switch,tabs}.tsx`) on HEAD (`a2b345d`) in a throwaway `git worktree`, before any of this task's changes — confirmed pre-existing and unrelated to Merge Relay. |
| `bun run games:content:validate` | pass |
| `bun run games:validate:strict` | pass |

## Orchestrator follow-up (2026-09-27)

- The independent verifier found that regenerating `content/rescue_boards.json`
  reverted task 11's copy fix on `rescue-foundry-01` ("New Lantern" / "Light
  the very first tile." had become "Spark Catch" / "Catch the first spark."
  again). The cause: task 11 edited the bundled JSON but not the generator source
  `apps-native/games/packages/merge_rules/tool/rescue_campaign_content.dart`.
  Both are now fixed, so a future regeneration keeps the task 11 copy. All 60
  board ids, titles and subtitles now match the pre-task-13 JSON exactly
  (script-checked). Only board, seed, provenance, solver, difficulty and target
  fields changed, as the rules fix requires. The claim above that "all titles are
  unchanged" was not true before this follow-up.
- `bun run typecheck`: the `web#typecheck` failure is pre-existing. There are 10
  `TS2322` errors in `apps/web/app/components/ui/*.tsx` (a React `Key`/`@types/react`
  incompatibility) on HEAD `a2b345d`, reproduced in a throwaway worktree. It is
  unrelated to this task, which touches nothing under `apps/web`.
- After the fix, content validation passes and all 252 merge_relay tests pass.
