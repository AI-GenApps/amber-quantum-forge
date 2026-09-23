---
epic: 15-ludo-launch
task: 01-rules-core
status: completed
commit_scope: ludo
depends_on: [15-ludo-launch/00-registry-and-ci]
estimate: L
---

# Build the `ludo_rules` core engine (Classic + Quick)

## Goal

Implement a pure-Dart, deterministic Ludo King Classic rules engine in
`apps-native/games/packages/ludo_rules`, with a `Quick` ruleset variant
defined precisely as configuration, no Flutter/Flame/device imports, and a
seeded-dice replay fixture format that the backend TS engine (task 17) will
later match bit-for-bit.

## Context/Decisions

- No existing source in this repo defines "Quick mode" precisely — the Unity
  reference (`apps-native/unity/ludo/Assets/Content/ludo_v1.json`) only
  encodes a Classic-shaped board and includes blockades, which this epic
  explicitly excludes; `.agents/resources/2026-09-19/ludo-reference/study.md`
  only names an unexplained "Rush Mode" and an unrelated "Quick Ludo" tutorial
  video, neither of which documents rules. This task must therefore define
  "Quick" itself, from public knowledge of Ludo King's Quick Mode: tokens
  start pre-placed on the board (not in the yard) so play begins without
  needing to roll a 6 to enter, and the match is shortened (fewer
  squares/moves to finish, e.g. a reduced home-stretch entry distance or
  fewer required token finishes). Encode the exact numeric choice as a named
  `LudoRuleset` config (see checklist) rather than a hardcoded branch, cite
  the reasoning in a doc comment, and cover it with tests — do not leave it
  ambiguous in code.
- Product-decided Classic rules (final, do not re-litigate): 2-4 players,
  52-cell track + 6-cell home stretch per color, 4 tokens per player, a 6 is
  required to leave the yard, rolling a 6 grants an extra roll, a third
  consecutive 6 forfeits the turn without applying that roll, capturing an
  opponent on a non-safe cell sends it to the yard and grants the capturing
  player a bonus roll, a token reaching home grants a bonus roll, start
  squares and star squares are safe (no capture there), there are **no
  blockades** (any number of tokens, same or different color, may occupy a
  cell), and finishing requires an exact roll (overshooting is an illegal
  move for that token).
- Do not reuse the Unity fixture's safe-cell indices or track geometry
  uncritically — that fixture is explicitly marked "not assumed to be
  universal Ludo rules" and includes blockades. Re-derive the board geometry
  (start indices, safe/star indices, home-entry distances) from Ludo King's
  standard board and record it as this package's own frozen constants.
- Server RNG is authoritative online (task 17); this package's dice must be
  fully injectable (`Random Function()` or an explicit `DiceSource`
  interface) so both local play and server replay can drive it
  deterministically. Never call `dart:math`'s global `Random()` directly
  inside game logic.
- Mirror the shape of `apps-native/games/packages/merge_rules` (see
  `lib/src/merge_rules.dart`, `merge_session.dart`, `merge_config.dart`,
  `merge_models.dart`, `merge_trace.dart`) for package layout conventions:
  versioned config, session/state models, a rules/engine module, a trace/event
  log for replay, and a `bin/replay_fixture.dart` CLI entry point producing
  JSON. Bot strategies and cross-runtime fixture generation are task 02, not
  this task.

## Implementation Checklist

- [x] Create `lib/src/ludo_config.dart`: `LudoRuleset` with a named constant
  for `classic` and `quick` (track length 52, home length 6, tokens per
  player 4, yard-exit roll 6, safe/star indices, and the Quick-specific
  deltas chosen above), a `schemaVersion`, and a `rulesVersion` string.
- [x] Create `lib/src/ludo_board.dart`: track/home-stretch geometry, per-color
  start index and path-distance-to-home-index mapping, safe-cell membership
  check.
- [x] Create `lib/src/ludo_models.dart`: `LudoToken` (yard/track/home/finished
  state + owner + path distance), `LudoPlayerState`, `LudoMatchState`
  (players, current turn, current-roll streak of sixes, phase: `awaitingRoll`
  / `awaitingMove` / `finished`, winner order).
  - [x] Player identity fields carry an opaque `subject` (string) and a
    `seat` index only; no PII, display name, or avatar reference belongs in
    this pure package — the client attaches presentation data separately.
- [x] Create `lib/src/ludo_engine.dart`: pure functions `rollDice(state,
  diceSource)`, `legalMoves(state)`, `applyMove(state, tokenId)`, and
  `isTerminal(state)` implementing: yard-exit-on-6, extra roll on 6, third-six
  forfeit, capture-sends-home, capture bonus roll, home-arrival bonus roll,
  no blockades, exact-roll-to-finish, auto-pass when no legal move exists.
- [x] Create `lib/src/ludo_replay.dart`: an append-only event log
  (`diceRolled`, `tokenMoved`, `tokenCaptured`, `tokenFinished`,
  `turnForfeited`, `matchFinished`) and a pure `replay(events, ruleset) ->
  LudoMatchState` function that must reproduce `applyMove`'s result exactly.
- [x] Add `bin/replay_fixture.dart`: reads a JSON fixture (ruleset + seeded
  dice sequence + player count), runs a full match, and prints the resulting
  event log and final state as JSON — this is the format task 02's
  cross-runtime fixtures and task 17's TS parity test consume.
- [x] Add `test/ludo_engine_test.dart`, `test/ludo_board_test.dart`,
  `test/ludo_replay_test.dart` covering: yard exit, extra roll, three-sixes
  forfeit, capture + bonus roll, safe-square immunity, home-arrival bonus
  roll, exact-finish rejection of overshoot, auto-pass, a full 2-player and a
  full 4-player match to completion, and Classic vs Quick producing different
  legal-move sets from the same seed.
- [x] Export the public API from `lib/ludo_rules.dart` (replace the task 00
  placeholder).
- [x] Fill in `apps-native/games/packages/ludo_rules/pubspec.yaml` `dev_dependencies` (`test`/`flutter_lints`-equivalent Dart lints) matching
  `merge_rules/pubspec.yaml`'s dependency style, without adding any
  Flutter/Flame dependency.

## Files Touched

- `apps-native/games/packages/ludo_rules/pubspec.yaml`
- `apps-native/games/packages/ludo_rules/lib/ludo_rules.dart`
- `apps-native/games/packages/ludo_rules/lib/src/ludo_config.dart`
- `apps-native/games/packages/ludo_rules/lib/src/ludo_board.dart`
- `apps-native/games/packages/ludo_rules/lib/src/ludo_models.dart`
- `apps-native/games/packages/ludo_rules/lib/src/ludo_engine.dart`
- `apps-native/games/packages/ludo_rules/lib/src/ludo_replay.dart`
- `apps-native/games/packages/ludo_rules/bin/replay_fixture.dart`
- `apps-native/games/packages/ludo_rules/test/*.dart`

## Acceptance Criteria

- `dart pub get` and analysis pass with zero Flutter/Flame/device imports in
  `ludo_rules` (grep for `package:flutter`, `package:flame`,
  `package:camera` returns nothing under `packages/ludo_rules/lib`).
- All new tests pass; a full simulated match (any legal-move policy) always
  terminates in a bounded number of turns with exactly one winner order.
- `dart run bin/replay_fixture.dart` produces deterministic, byte-identical
  output for the same input fixture across two runs.
- Classic and Quick rulesets are both exercised by tests and differ in at
  least the entry condition and the home-stretch distance, matching the
  documented Quick-mode definition in this file's Context section.

## Verification Commands

The `apps-native/games/ludo` client app is not scaffolded yet (that's task
03), so `--app ludo` flags on `games:analyze`/`games:test` would fail with
"Game app is not scaffolded: ludo" (see `scripts/games/cli-commands.ts`'s
`selectedApps()`). Use the package-only forms instead:

- `bun run games:format -- --check` (formats every existing package,
  including `ludo_rules`, since it has no `--app` requirement)
- `cd apps-native/games/packages/ludo_rules && dart analyze` (equivalently,
  `bun run games:analyze` with no `--app` flag also runs `dart analyze`
  against every package directory, `ludo_rules` included — verified against
  `scripts/games/cli-commands.ts`'s `analyze()`, which loops
  `packageDirectories()` unconditionally before looping selected apps)
- `cd apps-native/games/packages/ludo_rules && dart test` (equivalently,
  `bun run games:test` with no `--app` flag)

`bun run games:validate` (strict or not) fails for `ludo` until task 03 lands the
client's native scaffold and content manifest — `scripts/games/content.ts`'s
`validateContent()` checks every registered game's content manifest
unconditionally, and `scripts/games/config.ts`'s `validateGameConfigs()` calls
`validateNativeIds()` unconditionally for every game with a generated
`game.config.json` (which `ludo` already has, from task 00), checking its
`android/`/`ios/` native projects. Neither is scoped to this task; full
`games:validate -- --strict` coverage starts at task 03.

## Out of Scope

- Bot/AI move selection (task 02).
- Any server-side TS engine or parity harness (task 02 fixtures, task 17
  engine).
- Flame rendering, widgets, or asset references.
- Networking, save persistence, or Firebase.

## Commit message

`feat(ludo): add ludo_rules core engine with classic and quick rulesets [15-ludo-launch/01]`
