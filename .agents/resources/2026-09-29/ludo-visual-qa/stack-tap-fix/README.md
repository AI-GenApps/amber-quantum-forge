# Stack-tap-doesn't-move bug (task 26, device repro)

## Repro

Reported on device: when 2+ of the current player's own tokens share one
board cell (a "stack" — task 12h's fan-out rendering, e.g. Quick mode's two
pre-released start-square tokens, or two tokens that land on the same
mid-track cell later in a match), tapping the stack does not select/move a
token, even though a legal move exists.

Reproduced first with a real Flutter widget test driving the actual
`GameBoardScreen` -> `GameWidget<LudoGame>` -> Flame tap-dispatch ->
`LudoTokenComponent.containsLocalPoint` pipeline (not the shortcut every
prior test used — calling `LudoTokenComponent.onTap` or `game.onTokenTap`
directly, which bypasses hit-testing entirely). A `WidgetTester.tapAt` a
mere **7 logical pixels** off a stacked token's exact rendered center
failed to register any move, for both:

- The Quick-mode pre-released 2-token start-square stack.
- A mid-match stack (two of the local player's own tokens landing on the
  same mid-track cell, Classic ruleset).

An exact-center tap (as the pre-existing `ludo_game_test.dart` and
`ludo_board_golden_test.dart` coverage used) still worked, which is why
this bug shipped past the existing suite.

## Root cause

`apps-native/games/ludo/lib/src/game/ludo_token_component.dart`,
`LudoTokenComponent.containsLocalPoint`: for a *stacked* token, task 12h
shrank the tap hit-test region from the token's full rendered rect down to
a small circle of radius `_stackedTapHitRadiusFraction` (`0.16` of one
board cell), specifically so two stacked tokens' hit regions would never
overlap.

That constraint was real but the value satisfying it was picked far more
conservatively than necessary. On a typical board (cell size ~25-30
logical px), `0.16 * cellSize` is a hit-test **circle under 10px across**
— smaller than the visually-rendered pin itself, and far smaller than any
real fingertip's contact area. A precise, pixel-perfect tap (what every
existing automated test used, directly or indirectly) always landed
inside it; almost any real human tap did not.

The actual constraint that must hold is looser: the hit radius only needs
to stay under **half the minimum center-to-center distance between any
two tokens in a stack** (`2 * ludoTokenStackFanOutFraction`, which
`LudoGame._fanOutOffset` guarantees for every 2/3/4-token layout) for a
token's own exact center to never also fall inside a stack-mate's circle.
The old value used a much tighter, unnecessary bound
(`< ludoTokenStackFanOutFraction`, i.e. guaranteeing the two circles never
even touch) instead of the actual required bound.

## Fix

`_stackedTapHitRadiusFraction` is now `ludoTokenStackFanOutFraction * 1.8`
(~0.40, up from 0.16) — safely under the `2x` bound so a precise tap on a
token's own center is still guaranteed to resolve only to that token (the
existing exact-center stacked-tap test in `ludo_game_test.dart` stays
green unmodified), while covering nearly a full token's width instead of a
third of it. An imprecise tap that now lands in the (intentionally
widened) overlap between two stack-mates' circles resolves to whichever
Flame's tap dispatcher ranks topmost — acceptable per this task's spec:
"if multiple stacked tokens have identical legal moves, selecting either
is fine," matching Ludo King's forgiving "tap the stack, one token moves"
behavior.

Files changed:
- `apps-native/games/ludo/lib/src/game/ludo_token_component.dart` —
  `_stackedTapHitRadiusFraction` value + doc-comment rewrite (both there
  and on `ludoTokenStackFanOutFraction`, which cross-references it).

## New regression tests

- `apps-native/games/ludo/test/screens/game_board_screen_stack_tap_test.dart`
  (new file): two widget tests driving the *real* `GameBoardScreen` tap
  path via `WidgetTester.tapAt`, each tapping 7px off a stacked token's
  exact center — one for the Quick-mode start-square stack, one for a
  mid-match stack constructed directly via `LudoMatchState`/`LudoToken`.
  Both assert `matchState` actually changes (a move was applied). Verified
  both fail against the pre-fix `0.16` radius and pass against the fix.
- Existing `apps-native/games/ludo/test/game/ludo_game_test.dart` and
  `test/goldens/ludo_board_golden_test.dart` stacked-token coverage was
  re-run unmodified and stays green (confirms no regression to the
  no-cross-token-hit-overlap invariant at exact-center points, and no
  visual/golden change since hit-test radius doesn't affect rendering).

## Device verification (RZ8R32EAB7T, debug APK, real human taps)

1. Built and installed `apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
   (`app.w3dev.ludo.debug`) via `flutter build apk --debug` + `adb install -r`.
2. Started a **Quick, 2-player, vs Computer** match (`00-setup-quick-2p.png`).
   Red's two pre-released tokens sit stacked on the start square
   (`01-quick-start-stack.png`).
3. Rolled a 5 — both stacked tokens have a legal move
   (`02-before-stack-tap-rolled-5.png`). Tapped the stack by hand at a
   point offset from the fan-out center (not the mathematically exact
   pixel), same as a real finger would land. One token moved off the
   start square and the turn passed to the bot
   (`03-after-stack-tap-token-moved.png`).
4. Played on; the two remaining red tokens re-stacked on a mid-track cell
   a couple of turns later (`04-before-midgame-stack-tap.png`). Tapped
   that stack by hand (again off-center) — one token moved
   (`05-after-midgame-stack-tap-token-moved.png`), confirming the fix
   holds for a stack formed mid-match, not only the Quick-mode start
   square.
5. Continued play; used the lobby's **Debug: All Bots Demo** (all 4 seats
   bot-controlled, per this task's allowance — the stack taps above were
   the only human-performed taps) to carry the match through to a finish
   without further manual turns. The match reached the results screen
   (`06-match-results.png`: Bot 2 wins, 2nd Bot 3, 3rd You, 4th Bot 1).

## Verification commands (all green)

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo` (no issues)
- `cd apps-native/games/ludo && flutter test --timeout 90s` (369 tests, all pass)
- `bun run games:validate -- --strict` (passed)
