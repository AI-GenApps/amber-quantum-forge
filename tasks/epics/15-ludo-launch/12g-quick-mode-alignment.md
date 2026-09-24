---
epic: 15-ludo-launch
task: 12g-quick-mode-alignment
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/12f-device-visual-qa]
estimate: L
---

# Align Quick mode with Ludo King's official Quick Mode

## Goal

Task 01 invented Quick mode's rules from scratch (no reference in this repo
documented it at the time) and encoded a shortened-track guess:
`stepsToHomeEntry = 25` with all four tokens starting pre-placed on the
track and no yard state at all. That guess is wrong. Product decision
(2026-09-25, source: `.agents/resources/2026-09-25/ludo-king-points/
README.md`, citing Gametion's own blog post "Ludo King rolls out Quick
Mode and 6 Player Online Multiplayer updates") is: Quick mode uses the
**full-length Classic track** (no shortened race) and differs from Classic
in exactly two ways — (1) each player starts with 2 of their 4 tokens
already released onto their start square, the other 2 still in the yard (a
6 is still required to release a yard token, same as Classic); (2) the win
condition is objective-based, not "all 4 tokens home": a player wins the
instant they satisfy **both** of "has at least one token home" and "has
captured at least one opponent token during the match", evaluated at every
point either condition becomes newly true, not just at token-finish time.
This task rewrites `ludo_rules`'s Quick config/engine to match, regenerates
Quick fixtures (Classic must stay byte-identical), updates bots, and fixes
every client surface that shows Quick copy or state.

## Context/Decisions

- **Win-condition precision** (must be implemented exactly, not
  approximated): track two booleans per player, `hasHomeToken` (at least
  one of their tokens has reached the finished path position) and
  `hasCaptured` (they have captured at least one opponent token at any
  point in the match, including a capture that happens after they already
  have a token home). The match's winner is the first player for whom
  `hasHomeToken && hasCaptured` becomes true, checked immediately after
  *both* the `tokenFinished` event (does this player already have a
  capture?) and every `tokenCaptured` event (does the capturing player
  already have a token home?) — whichever event makes the AND newly true
  triggers the win at that moment, not retroactively and not deferred to
  end-of-turn. A token reaching home with zero captures so far does not
  win by itself; the player keeps playing (that token stays home/safe,
  normal Classic bonus-roll-on-home-arrival still applies) until they
  either capture something themselves or (moot, since only one player can
  win) another win condition resolves the match.
- **Other Classic rules are unchanged in Quick**: six = extra roll, three
  consecutive sixes forfeits the turn, capture sends the token back (to the
  yard, since yard state exists again in Quick — reuse Classic's
  `ludoYardPathPosition` reset, not Quick's old track-reset-to-0 behavior),
  capture and home-arrival both grant a bonus roll, start squares and star
  squares are safe, no blockades, exact roll required to finish, full
  52-cell/6-home-cell track and geometry (`ludo_board.dart` is unchanged —
  Quick was never actually a different board, only a different
  ruleset/config, and this task does not touch `ludo_board.dart`).
- **Ranking of the remaining (non-winning) players**: the match ends the
  moment a winner is decided (do not keep playing out the rest of the
  match to rank everyone by finish order, unlike Classic's `winnerOrder`
  list which is built from `allFinished` sequencing). Rank the remaining
  players deterministically and simply: (1) more tokens in `finished`
  state first, (2) tie-break by more captures made during the match, (3)
  tie-break by total path-distance progress summed across all 4 tokens
  (yard = 0). Any remaining tie after all three is broken by seat order
  (lower seat ranked higher) — document this explicitly in
  `ludo_config.dart`/`ludo_engine.dart` doc comments so it is not
  ambiguous in code, per task 01's own precedent. No points/score system of
  any kind (the product decision explicitly rejects the unverified
  third-party "race to 100 points" claim noted in the README's research).
- Current (wrong) implementation to replace, all in
  `apps-native/games/packages/ludo_rules/lib/src/ludo_config.dart`:
  `LudoRuleset.quick` sets `stepsToHomeEntry: 25` and
  `requiresYardExitRoll: false`. Both must change:
  `stepsToHomeEntry` becomes the same `51` as Classic (full track), and
  `requiresYardExitRoll` stays `true` (yard-exit still needs a 6 — only the
  *starting* token placement differs, not the exit rule). Add a new field
  to `LudoRuleset` for the pre-released-token count (e.g.
  `preReleasedTokensPerPlayer`, `0` for Classic, `2` for Quick) and a field
  or separate flag for the win-condition mode (e.g. an enum
  `LudoWinCondition.allTokensHome` for Classic vs
  `LudoWinCondition.oneHomeAndOneCapture` for Quick) so the engine branches
  on ruleset config, not a hardcoded `if (ruleset.id == 'quick')`.
- `ludo_engine.dart`'s `applyMove`/`_advanceTurn` currently detect the
  winner via `players[playerIndex].allFinished(state.ruleset)` accumulating
  into `state.winnerOrder`, and `rollDice`/`applyMove` end the match when
  `winnerOrder.length >= state.players.length - 1`. This logic is
  Classic-shaped and must be generalized to check the configured
  `LudoWinCondition` after every `tokenFinished` and `tokenCaptured` event,
  not just after `allFinished`. `ludo_models.dart`'s `LudoPlayerState`/
  `LudoMatchState` need per-player capture-count and home-token tracking
  (or derive them from existing token/replay-event state — prefer deriving
  from `LudoToken` states plus a new capture counter over duplicating
  state, to avoid two sources of truth going out of sync).
- Match setup (wherever `LudoMatchState` is initially constructed for a
  new match, in `ludo_engine.dart`/`ludo_models.dart` or the client's match
  controller under `apps-native/games/ludo/lib/src/state/`) must place the
  first `preReleasedTokensPerPlayer` tokens of each player at their start
  square (path position `0`) and the rest in the yard, for Quick only.
- **Replay fixture regeneration**: `apps-native/games/packages/ludo_rules/
  test/fixtures/quick_2p_dice.json`, `quick_2p_hardbot.json`,
  `quick_4p_dice.json`, `quick_4p_easybot.json` all encode outcomes under
  the old (wrong) Quick ruleset and must be regenerated via
  `bin/replay_fixture.dart` against the corrected engine — their recorded
  event logs/final states will differ. Any Classic-mode fixture files must
  be re-run too as a regression check but must come out **byte-identical**
  to their current committed content (Classic's config/engine behavior
  does not change in this task); add an explicit test or CI-style script
  step that fails loudly if a Classic fixture's regenerated output differs
  from what's committed, so a future engine change to Quick can never
  silently drift Classic.
- **Bots** (`apps-native/games/packages/ludo_rules/lib/src/ludo_bot.dart`):
  medium/hard bot strategies should weight captures more heavily when
  playing Quick and the acting player does not yet have `hasCaptured` true
  (a capture is the only thing standing between them and a win once they
  have a token home, or sets up the win the instant they next get a token
  home) — read the existing scoring/heuristic logic in this file before
  changing it; keep the change scoped to Quick-aware capture weighting,
  not a general bot rewrite.
- **Client surfaces referencing Quick** (grep confirmed): `apps-native/
  games/ludo/lib/src/screens/mode_setup_sheet.dart` (mode picker copy/
  description for Quick), `apps-native/games/ludo/lib/src/screens/
  how_to_play_screen.dart` (Quick rules section), `apps-native/games/ludo/
  lib/src/screens/game_board_screen.dart` (Quick-specific board/board-setup
  wiring), `apps-native/games/ludo/lib/src/audio/ludo_audio_service.dart`
  (any Quick-specific audio cue naming/logic — verify it's not
  win-condition-coupled in a way this task breaks). Also check the
  onboarding tutorial screens under `apps-native/games/ludo/lib/src/
  screens/` for any Quick mention (grep did not find one as of this task's
  authoring, but re-verify — tutorial copy may reference mode names
  generically).
- **Results screen ranking** (`apps-native/games/ludo/lib/src/screens/
  results_screen.dart`): must render Quick's winner-plus-ranked-remaining
  list using the new deterministic ranking (tokens home, then captures,
  then progress, then seat) rather than assuming Classic's finish-order
  `winnerOrder`, while leaving Classic's own results rendering unchanged.
- **HUD capture indicator**: the corner player card
  (`apps-native/games/ludo/lib/src/widgets/player_corner_card.dart`) needs
  a small per-player "capture ✓" indicator visible only in Quick matches,
  reflecting that player's `hasCaptured` flag live during the match (e.g.
  a small checkmark/badge on the card once that player has made their
  first capture), so a human watching the board can see who is one home
  token away from winning.
- **Server authority note**: the TS server-authoritative engine (task 17,
  not yet started) will port this Dart engine's rules for online play and
  must match this task's fixtures and win-condition semantics bit-for-bit
  once it lands — task 17 should treat this task's regenerated Quick
  fixtures as its parity target, not task 01's original (wrong) ones. This
  task does not touch any backend/TS code; it is a pure client/rules-package
  correction, recorded here so task 17 doesn't rediscover the same
  research.

## Implementation Checklist

- [ ] `ludo_config.dart`: replace `LudoRuleset.quick`'s
  `stepsToHomeEntry`/`requiresYardExitRoll` values, add
  `preReleasedTokensPerPlayer` and a `LudoWinCondition` field (or
  equivalent named config), update the class doc comment to cite this
  task and the Gametion source instead of the old invented rationale, bump
  `ludoRulesVersion` (e.g. to `LUDO-2`) since replay semantics change.
- [ ] `ludo_models.dart`: add whatever per-player state is needed to
  evaluate `LudoWinCondition.oneHomeAndOneCapture` incrementally (capture
  count and/or `hasCaptured`/`hasHomeToken` booleans), and match-setup
  logic (or a new factory) that pre-releases `preReleasedTokensPerPlayer`
  tokens per player for Quick.
- [ ] `ludo_engine.dart`: generalize win detection in `applyMove` (and
  `_advanceTurn`/`rollDice` as needed) to branch on `ruleset` win
  condition; restore yard-based capture reset for Quick (remove the
  Quick-specific "reset to path position 0" branch now that Quick has a
  real yard again); implement the deterministic non-winner ranking
  function and expose it (e.g. `rankRemainingPlayers(state)`) for the
  client results screen to consume.
- [ ] `ludo_replay.dart`: confirm `replay()` reproduces the new win/ranking
  logic exactly from the event log (no new event type should be strictly
  required if `tokenFinished`/`tokenCaptured` already carry enough
  information, but add one if the win-moment needs to be explicit in the
  log for replay fidelity — decide and document).
- [ ] `ludo_bot.dart`: adjust medium/hard strategy capture weighting for
  Quick when the acting player lacks `hasCaptured`.
- [ ] Regenerate `test/fixtures/quick_2p_dice.json`,
  `quick_2p_hardbot.json`, `quick_4p_dice.json`, `quick_4p_easybot.json`
  via `bin/replay_fixture.dart`; add a test/script step that re-runs every
  Classic fixture and asserts byte-identical output against the committed
  file (fails the task if Classic drifted).
- [ ] `test/ludo_engine_test.dart` (and/or a new
  `test/ludo_quick_mode_test.dart`): cover — home without any capture does
  not win; a capture followed later by a home-token arrival wins at the
  home-arrival moment; a token already home followed later by a capture
  wins at the capture moment; each player starts Quick with exactly 2
  tokens pre-released on their start square and 2 in the yard; a yard
  token in Quick still requires rolling a 6 to release; Classic's own win
  condition and starting placement are unaffected by any of this.
- [ ] `test/ludo_fixture_replay_test.dart`: extend/adjust for the
  regenerated Quick fixtures and the Classic-byte-identical check above.
- [ ] Client: `mode_setup_sheet.dart` and `how_to_play_screen.dart` copy
  updated to describe the real rule (2 tokens start released, win by
  getting one token home *and* capturing at least one opponent) instead
  of any shortened-track/no-yard description; grep the rest of
  `apps-native/games/ludo/lib` for stale Quick copy (`stepsToHomeEntry`,
  "shortened", "half the board", or similar) and fix any hit.
- [ ] `player_corner_card.dart`: add the per-player capture-status
  indicator, shown only when `LudoRuleset.quick` is active.
  `game_board_screen.dart`: wire the live `hasCaptured`/`hasHomeToken`
  state through to the HUD and results screen.
- [ ] `results_screen.dart`: render Quick's winner + deterministic
  remaining-player ranking; leave Classic's rendering path unchanged.
- [ ] Full-match controller tests (`apps-native/games/ludo/test/state/` or
  wherever the local match controller is tested) covering: a Quick match
  driven by bots always terminates and reaches the results screen; the
  displayed ranking matches the engine's `rankRemainingPlayers` output.
- [ ] Regenerate any golden(s) under `apps-native/games/ludo/test/
  goldens/` that render Quick-specific copy, the HUD capture indicator, or
  the results screen in a Quick match; diff old vs. new before committing.
- [ ] Update task `13-human-local-checkpoint.md`'s frontmatter
  `depends_on` to `[15-ludo-launch/12g-quick-mode-alignment]`.
- [ ] Add a `12g` row to `tasks/epics/15-ludo-launch/STATUS.md`.

## Files Touched

- `apps-native/games/packages/ludo_rules/lib/src/ludo_config.dart`
- `apps-native/games/packages/ludo_rules/lib/src/ludo_models.dart`
- `apps-native/games/packages/ludo_rules/lib/src/ludo_engine.dart`
- `apps-native/games/packages/ludo_rules/lib/src/ludo_replay.dart`
- `apps-native/games/packages/ludo_rules/lib/src/ludo_bot.dart`
- `apps-native/games/packages/ludo_rules/test/ludo_engine_test.dart`
- `apps-native/games/packages/ludo_rules/test/ludo_fixture_replay_test.dart`
- `apps-native/games/packages/ludo_rules/test/ludo_quick_mode_test.dart` (new,
  if not folded into `ludo_engine_test.dart`)
- `apps-native/games/packages/ludo_rules/test/fixtures/quick_2p_dice.json`
- `apps-native/games/packages/ludo_rules/test/fixtures/quick_2p_hardbot.json`
- `apps-native/games/packages/ludo_rules/test/fixtures/quick_4p_dice.json`
- `apps-native/games/packages/ludo_rules/test/fixtures/quick_4p_easybot.json`
- `apps-native/games/ludo/lib/src/screens/mode_setup_sheet.dart`
- `apps-native/games/ludo/lib/src/screens/how_to_play_screen.dart`
- `apps-native/games/ludo/lib/src/screens/game_board_screen.dart`
- `apps-native/games/ludo/lib/src/screens/results_screen.dart`
- `apps-native/games/ludo/lib/src/widgets/player_corner_card.dart`
- `apps-native/games/ludo/test/**` (controller tests + affected goldens)
- `tasks/epics/15-ludo-launch/13-human-local-checkpoint.md` (`depends_on`
  update only)
- `tasks/epics/15-ludo-launch/STATUS.md`

## Acceptance Criteria

- `LudoRuleset.quick` uses the full-length track (`stepsToHomeEntry`
  matching Classic's `51`), `requiresYardExitRoll: true`, and a
  `preReleasedTokensPerPlayer` of `2`; `LudoRuleset.classic` is untouched.
- Engine tests prove: home-without-capture is not a win; capture-then-home
  wins at the home-arrival event; home-then-later-capture wins at the
  capture event; Quick match setup places exactly 2 tokens per player on
  their start square and 2 in the yard; a yard token in Quick still
  requires a 6 to release.
- Every regenerated Quick fixture reflects the corrected rules; every
  Classic fixture re-run through `bin/replay_fixture.dart` is byte-identical
  to its committed content, verified by an explicit test/check.
- A full Quick match driven by bots (any difficulty mix) always terminates
  and reaches a deterministic winner + ranked remaining-player list,
  covered by a controller test.
- Medium/hard bots in Quick measurably favor available captures over
  non-capture moves when they do not yet have a capture (covered by a bot
  strategy test comparing move selection with/without an available
  capture).
- `mode_setup_sheet.dart`, `how_to_play_screen.dart`, and any other client
  copy describing Quick accurately state the real rule (2 pre-released
  tokens, win via one home token + one capture); no stale
  "shortened track" or "no yard" copy remains anywhere in
  `apps-native/games/ludo/lib`.
- The HUD shows a per-player capture-status indicator in Quick matches
  only, and the results screen renders Quick's winner + deterministic
  ranking (not Classic's finish-order list).
- `13-human-local-checkpoint.md`'s `depends_on` points at 12g;
  `STATUS.md` has a 12g row.
- A full all-bots Quick debug game still reaches the results screen on
  device (regression check).

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `cd apps-native/games/packages/ludo_rules && dart analyze && dart test`
- `bun run games:validate -- --strict`
- Device verification (physical device, serial `RZ8R32EAB7T`):
  1. `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
  2. `adb -s RZ8R32EAB7T install -r apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
  3. `adb -s RZ8R32EAB7T shell monkey -p app.w3dev.ludo.debug -c android.intent.category.LAUNCHER 1`
  4. Start a fresh Quick-mode debug game (2 players, mixed bot/human) and
     capture
     `adb -s RZ8R32EAB7T exec-out screencap -p > .agents/resources/2026-09-25/ludo-visual-qa/12g/quick-start.png`
     confirming 2 tokens per player already sit on their start square.
  5. Play until one player has made a capture but has no token home yet;
     capture
     `.agents/resources/2026-09-25/ludo-visual-qa/12g/quick-captured-not-home.png`
     and confirm the match has not ended and the HUD capture indicator is
     lit for that player.
  6. Continue until that player gets a token home and capture
     `.agents/resources/2026-09-25/ludo-visual-qa/12g/quick-win.png`,
     confirming the match ends immediately and the results screen shows a
     deterministic ranking for the remaining players.
  7. Run a full all-bots Quick debug game to completion and confirm it
     reaches the results screen.
  - If the device is not attached, report NOT RUN for all device steps
    (do not skip the step — mark it NOT RUN explicitly).

## Out of Scope

- Any change to Classic mode's rules, config, engine behavior, or
  fixtures beyond the byte-identical regression check.
- The "1 Kill Win" and "Mask" modes referenced in the Ludo King research
  doc — neither is in this epic's scope; do not add them.
- The server-authoritative TS engine port (task 17) — this task only
  leaves accurate fixtures and doc-comment context for it to consume
  later.
- Board geometry changes (`ludo_board.dart`) — Quick uses the same board
  as Classic; this task does not touch board/track/safe-cell geometry.
- Any monetization mechanic mentioned in the research (diamond-funded
  undo/re-roll) — not part of this product's Quick mode.
- Visual/paint restyling beyond the new capture indicator and results
  ranking text — this is a rules-correctness task, not a design pass.

## Commit message

`feat(ludo): align Quick mode with the product rules [15-ludo-launch/12g]`
