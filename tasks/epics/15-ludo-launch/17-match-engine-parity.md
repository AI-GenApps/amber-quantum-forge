---
epic: 15-ludo-launch
task: 17-match-engine-parity
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/16-database]
estimate: L
---

# Port the TS authority engine and prove Dart/TS parity

## Goal

Port the `ludo_rules` Dart engine (task 01/02) to a TypeScript authority
engine under `packages/api/src/games/ludo/engine.ts`, and add a real
cross-runtime parity mechanism that proves the TS engine reproduces every
fixture checked in by task 02 exactly — both a Bun-test-level comparison and
a `scripts/games/` script comparable to `bun run games:parity`.

## Context/Decisions

- The TS engine must implement the exact same rules as `ludo_rules`: board
  geometry, yard-exit-on-6, extra roll on 6, third-six forfeit, capture +
  bonus roll, home-arrival bonus roll, no blockades, exact-roll-to-finish,
  auto-pass, and both `classic`/`quick` rulesets with identical numeric
  constants. Do not re-derive these independently — copy the frozen
  constants from `ludo_rules/lib/src/ludo_config.dart` and
  `ludo_board.dart` verbatim (same track length, home length, safe indices,
  yard-exit roll, Quick-mode deltas) so there is one source of truth in
  practice even though it's two implementations.
- Server RNG is authoritative online: dice rolls come from Node's
  `crypto.randomInt(1, 7)` (CSPRNG), never `Math.random()`. The engine
  itself takes an injectable dice source (mirroring `ludo_rules`' pattern) so
  tests can drive it deterministically; task 18's service wires the real
  `CsprngDiceSource` and records rolls as `dice_rolled` events immediately so
  a client can never influence or predict the roll.
- Bun-test parity: reuse the JSON fixtures checked in at
  `apps-native/games/packages/ludo_rules/test/fixtures/` (task 02). Add a
  Bun test that feeds each fixture's seed/dice sequence/bot policy through
  the TS engine's pure functions (not through the store/service — a
  dice-and-move-in, event-log-out pure comparison) and asserts the resulting
  event log and final state match the fixture's recorded Dart output
  exactly.
- Script-level parity: `scripts/games/parity.ts` today is hardcoded to
  `merge_rules` only (confirmed by reading it — it imports a fixed
  `packageRoot` under `apps-native/games/packages/merge_rules` and a fixed
  `parity_fixture.json`). `bun run games:ludo-parity`/`games:ludo:parity`
  does **not** exist before this task. Pick one of two approaches and
  implement it: (a) generalize `scripts/games/parity.ts` to accept a
  package/game parameter and add a `games:ludo:parity` invocation of it, or
  (b) add a dedicated `scripts/games/ludo-parity.ts` mirroring its
  structure. Either way, add the exact `package.json` script entry
  `"games:ludo:parity"` (this precise name — later tasks and CI reference it
  literally) that: compiles `ludo_rules` to JS for a fixture (`dart compile
  js`), runs it under the pinned Bun, runs the same fixture under `dart run`,
  diffs Dart-VM output against compiled-JS output for byte-identical JSON
  (same self-consistency check task 02 already relies on at the Dart level),
  **and additionally** diffs both against this task's TS engine's pure-function
  output for the same fixture, so the script proves three-way agreement
  (Dart VM, compiled Dart→JS, hand-ported TS) rather than only the two-way
  check task 02 could do before the TS engine existed.
- **Never modify the checked-in `ludo_rules` fixtures to make parity pass.**
  If the TS engine disagrees with a fixture, the TS port has a bug — fix the
  port. If a genuine ambiguity is found in the Dart rules themselves, stop
  and report this task as blocked rather than editing the fixture to match
  whichever engine currently happens to be wrong.
- Match creation/joining is included in this task's engine surface only as
  pure functions (`createMatchState`, `applyJoin`) — the transactional,
  store-backed `createMatch`/`joinMatch`/`processCommand` service is task
  18's responsibility. This task ends at "pure engine functions exist and
  agree with Dart," not at "there is a callable HTTP route."

## Implementation Checklist

- [ ] Create `packages/api/src/games/ludo/engine.ts`: TS port of
  `ludo_board.dart`/`ludo_engine.dart` — `rollDice`, `legalMoves`,
  `applyMove`, `isTerminal`, `createMatchState`, `applyJoin`, both rulesets,
  using an injectable dice source.
- [ ] Create `packages/api/src/games/ludo/dice.ts`: a `CsprngDiceSource`
  using `crypto.randomInt`, plus a deterministic fixture-replay dice source
  for tests.
- [ ] Add `packages/api/src/games/ludo/engine.test.ts` covering the same
  rule scenarios as `ludo_engine_test.dart` (task 01) at the TS level.
- [ ] Add `packages/api/src/games/ludo/parity.test.ts` loading every fixture
  from `apps-native/games/packages/ludo_rules/test/fixtures/` and asserting
  TS-engine output matches the Dart-recorded output exactly.
- [ ] Generalize `scripts/games/parity.ts` or add
  `scripts/games/ludo-parity.ts` implementing the three-way script-level
  parity check described above.
- [ ] Add the `"games:ludo:parity"` entry to the root `package.json`.
- [ ] Update `docs-internal/gaming/commands.md` with the new
  `games:ludo:parity` row, following the existing table format.

## Files Touched

- `packages/api/src/games/ludo/engine.ts`
- `packages/api/src/games/ludo/dice.ts`
- `packages/api/src/games/ludo/engine.test.ts`
- `packages/api/src/games/ludo/parity.test.ts`
- `scripts/games/parity.ts` (generalized) or `scripts/games/ludo-parity.ts` (new)
- `package.json`
- `docs-internal/gaming/commands.md`

## Acceptance Criteria

- `parity.test.ts` passes: every checked-in `ludo_rules` fixture reproduces
  an identical event log and final state through the TS engine.
- `bun run games:ludo:parity` exists, runs, and passes: Dart VM, compiled
  Dart→JS, and the TS engine all agree on the same fixture's output.
- Dice values in test output are never sourced from `Math.random()` —
  `CsprngDiceSource` is the only production-shaped path (verified by reading
  the implementation, not just tests).
- No fixture file under `apps-native/games/packages/ludo_rules/test/
  fixtures/` was modified by this task (`git diff --stat` shows no changes
  under that path).

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test`
- `cd packages/api && bun run test -- parity.test.ts`
- `bun run games:ludo:parity`
- `bun run check`

## Out of Scope

- The transactional command service, match creation/join HTTP routes, and
  idempotency handling (task 18).
- Turn timeout enforcement and the Cron sweeper (task 19).
- Matchmaking tickets, bot-fill, and private rooms (tasks 20/21).
- Realtime fanout (task 22).

## Commit message

`feat(ludo): port ts authority engine and add dart/ts parity check [15-ludo-launch/17]`
