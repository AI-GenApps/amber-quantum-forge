---
epic: 15-ludo-launch
task: 02-rules-bots-fixtures
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/01-rules-core]
estimate: M
---

# Add bot strategies and cross-runtime replay fixtures

## Goal

Add easy/medium/hard bot move-selection strategies to `ludo_rules`, and
produce a checked-in set of JSON replay fixtures (seed + dice sequence +
expected event log/final state) that task 17's TypeScript authority engine
must reproduce exactly. This task produces the Dart-side fixtures only — the
actual cross-runtime parity mechanism (compiling to JS, diffing against the
TS engine) does not exist yet and is built in task 17, since the TS engine it
compares against does not exist until then.

## Context/Decisions

- Bot strategies are pure functions over `LudoMatchState` +
  `legalMoves(state)` from task 01 — no I/O, no randomness beyond the
  injected dice source already required by the engine. They select a token
  to move; they never roll dice themselves (the engine/service owns rolling).
- Difficulty tiers (define precisely, do not leave "smarter" vague):
  - `easy`: picks a uniformly random legal move.
  - `medium`: prefers, in order, (1) a move that finishes a token, (2) a move
    that captures an opponent, (3) a move that gets a token out of the yard,
    (4) otherwise random among remaining legal moves.
  - `hard`: same priority ladder as medium, plus (5) prefers moving the token
    with the greatest path distance already traveled when no capture/finish
    is available, and (6) avoids moving a token onto a cell that would be
    capturable by an opponent's single die roll next turn when an
    equally-good alternative exists.
- Fixtures live under `apps-native/games/packages/ludo_rules/test/fixtures/`
  as `*.json`, each with a fixed seed, ruleset (`classic` and `quick` both
  represented), player count (2 and 4 both represented), and a bot policy
  (`easy`/`medium`/`hard`/`none` for pure dice-driven determinism tests).
  Generate them with `bin/replay_fixture.dart` from task 01, extended to
  accept a `--bot <difficulty>` flag.
- **This task does not create a parity script, `games:ludo:parity` entry, or
  any `scripts/games/ludo-*.ts` file.** `bun run games:ludo-parity` /
  `games:ludo:parity` does not exist yet — do not reference it in this
  task's verification. `scripts/games/parity.ts` today is hardcoded to
  `merge_rules` only. Task 17 (`17-match-engine-parity`) is responsible for
  generalizing that script or adding a dedicated Ludo parity script plus a
  `games:ludo:parity` `package.json` entry, and its own verification must
  call that exact script name once it exists. This task's own confidence
  that fixtures are self-consistent comes entirely from
  `ludo_fixture_replay_test.dart` (Dart-only replay-through-`replay()`
  check), not from any JS compilation step.

## Implementation Checklist

- [ ] Add `lib/src/ludo_bot.dart` with an abstract `LudoBotStrategy` and
  `EasyBotStrategy`, `MediumBotStrategy`, `HardBotStrategy` implementations
  per the priority ladders above.
- [ ] Add `test/ludo_bot_test.dart` covering each tier's priority ordering
  with constructed board states (forced finish-available, forced
  capture-available, forced yard-exit-available, forced no-preference).
- [ ] Extend `bin/replay_fixture.dart` with a `--bot <difficulty>` flag that
  runs the match end-to-end using the named strategy instead of requiring
  external move input.
- [ ] Generate and check in at least 8 fixtures under
  `packages/ludo_rules/test/fixtures/` covering the {classic, quick} x
  {2-player, 4-player} x {dice-only, bot-driven} matrix.
- [ ] Add `test/ludo_fixture_replay_test.dart` that loads every checked-in
  fixture, replays its event log through `ludo_replay.dart`'s `replay()`, and
  asserts the final state matches the fixture's recorded final state.

## Files Touched

- `apps-native/games/packages/ludo_rules/lib/src/ludo_bot.dart`
- `apps-native/games/packages/ludo_rules/test/ludo_bot_test.dart`
- `apps-native/games/packages/ludo_rules/bin/replay_fixture.dart`
- `apps-native/games/packages/ludo_rules/test/fixtures/*.json`
- `apps-native/games/packages/ludo_rules/test/ludo_fixture_replay_test.dart`

## Acceptance Criteria

- All three bot tiers are unit-tested against forced states and never select
  an illegal move (assert `legalMoves(state).contains(chosen)` in every
  test).
- Every checked-in fixture replays to its recorded final state exactly
  through `ludo_replay.dart`'s `replay()`.
- No `scripts/games/ludo-*.ts` file and no `games:ludo-parity`/
  `games:ludo:parity` `package.json` entry exists after this task — that is
  explicitly task 17's responsibility.

## Verification Commands

The `apps-native/games/ludo` client app is not scaffolded yet (that's task
03), so `--app ludo` flags on `games:analyze`/`games:test` would fail with
"Game app is not scaffolded: ludo" (see `scripts/games/cli-commands.ts`'s
`selectedApps()`). Use the package-only forms instead:

- `bun run games:format -- --check`
- `cd apps-native/games/packages/ludo_rules && dart analyze` (equivalently,
  `bun run games:analyze` with no `--app` flag, which runs `dart analyze`
  against every existing package directory including `ludo_rules`)
- `cd apps-native/games/packages/ludo_rules && dart test` (equivalently,
  `bun run games:test` with no `--app` flag)
- `bun run games:validate -- --strict`

## Out of Scope

- The TypeScript authority engine and any real cross-runtime parity
  mechanism against these fixtures — including creating `games:ludo:parity`
  or any `scripts/games/ludo-*.ts` file (task 17). **Never modify these
  `ludo_rules` fixtures later to make a parity check pass; if a future
  engine disagrees with a fixture, the engine is what's wrong — stop and
  report it as blocked rather than editing the fixture.**
- Any client-facing bot UI or difficulty selector (task 09/12).
- Human-vs-bot online play (bots are local-only in this task).

## Commit message

`feat(ludo): add bot strategies and cross-runtime replay fixtures [15-ludo-launch/02]`
