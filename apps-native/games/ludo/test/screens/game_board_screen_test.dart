import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';

import 'package:ludo/src/game/ludo_game.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/net/ludo_match_state_source.dart';
import 'package:ludo/src/net/ludo_session_models.dart' show LudoMatchView;
import 'package:ludo/src/screens/game_board_screen.dart';
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo/src/widgets/dice_zone.dart';
import 'package:ludo/src/widgets/player_corner_card.dart';

/// A [LudoMatchStateSource] test double: [emit] pushes a view directly
/// onto [states] (standing in for either a Firestore snapshot or a
/// polling tick), and [refresh] both records how many times it was
/// called and, when [refreshResult] is set, emits that view too — so a
/// reconnect test can assert the board screen actually asked for a fresh
/// fetch rather than trusting stale in-memory state.
final class _FakeMatchStateSource implements LudoMatchStateSource {
  final _controller = StreamController<LudoMatchView>.broadcast();
  int refreshCallCount = 0;
  LudoMatchView? refreshResult;

  @override
  Stream<LudoMatchView> get states => _controller.stream;

  void emit(LudoMatchView view) => _controller.add(view);

  @override
  Future<LudoMatchView> refresh() async {
    refreshCallCount += 1;
    final view = refreshResult;
    if (view == null) {
      throw StateError('_FakeMatchStateSource.refreshResult was not set');
    }
    _controller.add(view);
    return view;
  }

  @override
  void dispose() => unawaited(_controller.close());
}

Map<String, Object?> _fixture = {};

/// Builds a `match_view` wire map from the shared fixture, overriding
/// just the fields a given test cares about.
Map<String, Object?> _matchViewWire({
  String matchId = 'match-1',
  required int currentPlayerIndex,
  required String deadlineAt,
}) => {
  'match_id': matchId,
  'environment': 'debug',
  'match_state': {
    ...(_fixture['match_state'] as Map).cast<String, Object?>(),
    'match_id': matchId,
    'current_player_index': currentPlayerIndex,
    'deadline_at': deadlineAt,
  },
  'recent_events': const <Object?>[],
  'published_at': '2026-01-01T00:00:02.000Z',
};

LudoGateway _unusedGateway() => LudoGateway(
  config: LudoNetworkConfig(
    apiBaseUri: Uri.parse('https://api.example.test/'),
    environment: 'debug',
  ),
  transport: _ThrowingTransport(),
);

/// Never actually invoked by either test below — `_FakeMatchStateSource`
/// never delegates to a real gateway — but `LudoOnlineMatchSession`
/// requires one to construct, so this stands in for "no network calls
/// expected here".
final class _ThrowingTransport implements LudoHttpTransport {
  @override
  Future<LudoHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    required Object? body,
    required Duration timeout,
    required int maxRequestBytes,
    required int maxResponseBytes,
  }) async => throw StateError('Unexpected network call in this test');
}

/// A dice seed whose first roll (via `DeterministicRng(1).nextInt(6) + 1`)
/// is deterministically 4 (verified out-of-band), i.e. never a 6 — so a
/// roll never grants a bonus turn and the turn always advances after one
/// move, which every test below relies on.
const _seedRollingFour = 1;

LudoLocalMatchConfig _twoPlayerComputerConfig() => const LudoLocalMatchConfig(
  ruleset: LudoRuleset.quick,
  isComputerMatch: true,
  seats: [
    LudoSeatConfig(color: LudoColor.red, isBot: false),
    LudoSeatConfig(color: LudoColor.green, isBot: true, botDifficulty: 'easy'),
  ],
);

const _identities = [
  LudoSeatIdentity(name: 'You', avatarId: 'red-face'),
  LudoSeatIdentity(name: 'Bot', avatarId: 'green-face'),
];

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

/// Pumps past the game widget's own render loop without ever waiting for
/// it to go idle (a live `FlameGame` reschedules every frame, so
/// `pumpAndSettle` would hang) — mirrors
/// `onboarding_flow_test.dart`'s `_pumpTutorial` helper.
Future<void> _pumpGame(WidgetTester tester) async {
  const step = Duration(milliseconds: 50);
  const total = Duration(milliseconds: 300);
  var elapsed = Duration.zero;
  while (elapsed < total) {
    await tester.pump(step);
    elapsed += step;
  }
}

LudoGame _gameOf(WidgetTester tester) => tester
    .widget<GameWidget<LudoGame>>(find.byType(GameWidget<LudoGame>))
    .game!;

/// Pumps enough frames for a modal route push/pop (dialog, page transition)
/// to fully finish, without ever calling `pumpAndSettle` — which would hang
/// forever while a live `FlameGame` is anywhere in the tree, since it
/// reschedules a frame every tick.
Future<void> _pumpUntilSettled(WidgetTester tester) async {
  for (var i = 0; i < 20; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

void main() {
  setUpAll(() {
    final raw = File('test/fixtures/ludo_route_fixture.json')
        .readAsStringSync();
    _fixture = jsonDecode(raw) as Map<String, Object?>;
  });

  testWidgets('dice zone is disabled outside the local player\'s roll phase', (
    tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        GameBoardScreen(
          config: _twoPlayerComputerConfig(),
          seatIdentities: _identities,
          soundSettings: LudoSoundSettings(),
          diceSeed: _seedRollingFour,
          reducedMotion: ReducedMotionSetting(enabled: true),
        ),
      ),
    );
    await _pumpGame(tester);

    // Seat 0 (You)'s turn to roll: enabled.
    var diceZone = tester.widget<DiceZone>(find.byType(DiceZone));
    expect(diceZone.enabled, isTrue);

    await tester.tap(find.byType(DiceZone));
    await _pumpGame(tester);
    // The roll (4) had a legal move for every pre-placed Quick token;
    // tap the first one to complete the move and hand the turn to the
    // bot seat.
    final game = _gameOf(tester);
    final legal = legalMoves(game.matchState!);
    expect(legal, isNotEmpty);
    final localColor = game.matchState!.players[0].color;
    final token = game.tokens.firstWhere(
      (t) => t.color == localColor && t.tokenId == legal.first,
    );
    token.onTap?.call(localColor, legal.first);
    await _pumpGame(tester);

    // Now it's the bot seat's turn: dice zone must be disabled.
    diceZone = tester.widget<DiceZone>(find.byType(DiceZone));
    expect(diceZone.enabled, isFalse);

    // An out-of-turn tap attempt must not roll (no state change): the
    // disabled zone has no tap handler at all, so tapping it is a
    // silent no-op rather than a crash or a new roll.
    final stateBeforeTap = _gameOf(tester).matchState;
    await tester.tap(find.byType(DiceZone), warnIfMissed: false);
    await _pumpGame(tester);
    expect(_gameOf(tester).matchState, same(stateBeforeTap));
  });

  testWidgets(
    'tappable-token highlight matches legalMoves(state) for a constructed '
    'state',
    (tester) async {
      await tester.pumpWidget(
        _wrap(
          GameBoardScreen(
            config: _twoPlayerComputerConfig(),
            seatIdentities: _identities,
            soundSettings: LudoSoundSettings(),
            diceSeed: _seedRollingFour,
            reducedMotion: ReducedMotionSetting(enabled: true),
          ),
        ),
      );
      await _pumpGame(tester);

      await tester.tap(find.byType(DiceZone));
      await _pumpGame(tester);

      final game = _gameOf(tester);
      final state = game.matchState!;
      expect(state.phase, LudoMatchPhase.awaitingMove);
      expect(
        game.legalMoveHighlight.highlightedCellCount,
        legalMoves(state).length,
      );
    },
  );

  testWidgets(
    'the timer ring renders the correct remaining-time fraction for a '
    'given deadline',
    (tester) async {
      final now = DateTime(2026, 1, 1, 12, 0, 0);
      const turnDuration = Duration(seconds: 30);

      // Half of the turn has elapsed: 15s remaining out of 30s.
      await tester.pumpWidget(
        _wrap(
          Scaffold(
            body: Center(
              child: PlayerCornerCard(
                name: 'You',
                avatarId: 'red-face',
                color: LudoColor.red,
                isActive: true,
                deadline: now.add(const Duration(seconds: 15)),
                turnDuration: turnDuration,
                now: now,
              ),
            ),
          ),
        ),
      );

      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      expect(indicator.value, closeTo(0.5, 0.001));
    },
  );

  testWidgets('toggling reduced motion in Settings (reached through the pause '
      'dialog) makes the very next roll resolve instantly, with no '
      'multi-frame tumble observed — task 10\'s follow-up to task 04/05\'s '
      'reduced-motion seam', (tester) async {
    final reducedMotion = ReducedMotionSetting();
    await tester.pumpWidget(
      _wrap(
        GameBoardScreen(
          config: _twoPlayerComputerConfig(),
          seatIdentities: _identities,
          soundSettings: LudoSoundSettings(),
          diceSeed: _seedRollingFour,
          reducedMotion: reducedMotion,
        ),
      ),
    );
    await _pumpGame(tester);

    // Baseline: motion is enabled by default, so a roll does not resolve
    // within a single frame — the tumble is still mid-flight.
    await tester.tap(find.byType(DiceZone));
    await tester.pump();
    expect(
      _gameOf(tester).dice.isRolling,
      isTrue,
      reason:
          'a motion-enabled roll must still be mid-tumble after one '
          'frame',
    );
    // Let the in-flight animated roll run its course (well past the dice
    // component's own >=600ms tumble) before discarding this tree, so no
    // pending animation future is left dangling across the rebuild below.
    for (var i = 0; i < 20; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }

    // Force a full teardown (an un-keyed rebuild would otherwise just
    // update the existing `State`, leaving the first roll's now-disabled
    // `DiceZone` — awaiting a move, not a fresh roll — in place) before
    // rebuilding a fresh board with the same seed/instance so the next
    // roll below is directly comparable — the seed always rolls 4 first,
    // deterministically.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump();
    await tester.pumpWidget(
      _wrap(
        GameBoardScreen(
          config: _twoPlayerComputerConfig(),
          seatIdentities: _identities,
          soundSettings: LudoSoundSettings(),
          diceSeed: _seedRollingFour,
          reducedMotion: reducedMotion,
        ),
      ),
    );
    await _pumpGame(tester);

    // Reach Settings through the pause dialog and flip reduced motion on
    // — the *same* [reducedMotion] instance this running board's
    // `LudoGame` was constructed with (see `GameBoardScreen`'s
    // `_reducedMotion` field), not a throwaway copy.
    await tester.tap(find.byKey(const Key('game-board-menu-button')));
    await _pumpUntilSettled(tester);
    await tester.tap(find.byKey(const Key('pause-dialog-settings-button')));
    await _pumpUntilSettled(tester);

    expect(reducedMotion.value, isFalse);
    await tester.tap(find.byKey(const Key('settings-reduced-motion-switch')));
    await tester.pump();
    expect(reducedMotion.value, isTrue);

    await tester.tap(find.byIcon(Icons.arrow_back));
    await _pumpUntilSettled(tester);
    await tester.tap(find.text('Resume'));
    await _pumpUntilSettled(tester);

    // The very next roll on this same board must now resolve within a
    // single frame — no multi-frame tumble observed.
    await tester.tap(find.byType(DiceZone));
    await tester.pump();

    final game = _gameOf(tester);
    expect(game.dice.isRolling, isFalse);
    expect(game.dice.isSettling, isFalse);
    expect(game.dice.distinctFacesFlickered, 0);
    expect(game.dice.displayFace, 4);
  });

  testWidgets(
    'task 25: the timer ring renders using the server-provided deadline '
    'when an online state source is supplied',
    (tester) async {
      final config = _twoPlayerComputerConfig();
      final fakeSource = _FakeMatchStateSource();
      final session = LudoOnlineMatchSession(
        gateway: _unusedGateway(),
        matchId: 'match-1',
        gameToken: 'game-token',
        localSeat: 0,
        stateSource: fakeSource,
      );

      await tester.pumpWidget(
        _wrap(
          GameBoardScreen(
            config: config,
            seatIdentities: _identities,
            soundSettings: LudoSoundSettings(),
            reducedMotion: ReducedMotionSetting(enabled: true),
            initialState: LudoMatchState.initial(
              ruleset: config.ruleset,
              subjects: const ['local-0', 'local-1'],
            ),
            onlineMatch: session,
          ),
        ),
      );
      await _pumpGame(tester);

      // Seat 0 (config's red seat) is the currently-active seat, with 20
      // of a 30s turn remaining — a server-provided deadline this screen
      // never computed locally (no local turn timer runs at all for an
      // online match; see `GameBoardScreen._armDeadlineForCurrentTurn`'s
      // early return when `onlineMatch != null`).
      final deadline = DateTime.now().add(const Duration(seconds: 20));
      fakeSource.emit(
        LudoMatchView.fromWire(
          _matchViewWire(
            currentPlayerIndex: 0,
            deadlineAt: deadline.toIso8601String(),
          ),
        ),
      );
      await _pumpGame(tester);

      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      // Comfortably more than half the turn remains (20 of 30s): a stale
      // or absent deadline would instead render `1.0` (see
      // `PlayerCornerCard._remainingFraction`'s "nothing to track"
      // fallback) or, if this screen wrongly still ran a fresh *local*
      // 30s timer instead of using the server's deadline, would also read
      // very close to `1.0` rather than this test's ~0.67.
      expect(indicator.value, greaterThan(0.55));
      expect(indicator.value, lessThan(0.75));
    },
  );

  testWidgets(
    'task 25: an app-resume lifecycle event refetches online match state '
    'rather than trusting stale in-memory state',
    (tester) async {
      final config = _twoPlayerComputerConfig();
      final fakeSource = _FakeMatchStateSource();
      final session = LudoOnlineMatchSession(
        gateway: _unusedGateway(),
        matchId: 'match-1',
        gameToken: 'game-token',
        localSeat: 0,
        stateSource: fakeSource,
      );

      await tester.pumpWidget(
        _wrap(
          GameBoardScreen(
            config: config,
            seatIdentities: _identities,
            soundSettings: LudoSoundSettings(),
            reducedMotion: ReducedMotionSetting(enabled: true),
            initialState: LudoMatchState.initial(
              ruleset: config.ruleset,
              subjects: const ['local-0', 'local-1'],
            ),
            onlineMatch: session,
          ),
        ),
      );
      await _pumpGame(tester);
      expect(fakeSource.refreshCallCount, 0);

      // The state a stale in-memory screen would otherwise still be
      // showing after backgrounding: seat 1's turn, deadline already
      // passed.
      fakeSource.emit(
        _staleView(currentPlayerIndex: 1, secondsFromNowDeadline: -60),
      );
      await _pumpGame(tester);

      // The genuinely fresh state the reconnect fetch returns: seat 0's
      // turn again, a brand-new deadline.
      fakeSource.refreshResult = _staleView(
        currentPlayerIndex: 0,
        secondsFromNowDeadline: 30,
      );

      // Simulate the app returning to the foreground.
      final binding = TestWidgetsFlutterBinding.instance;
      binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
      binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      await _pumpGame(tester);

      expect(
        fakeSource.refreshCallCount,
        1,
        reason:
            'resuming must trigger exactly one refetch via the gateway, '
            'never trust whatever was last on the stream before '
            'backgrounding',
      );
    },
  );
}

/// Builds a `LudoMatchView` wire object for the reconnect test above, so
/// it never hand-rolls match-state JSON directly.
LudoMatchView _staleView({
  required int currentPlayerIndex,
  required int secondsFromNowDeadline,
}) {
  final deadline = DateTime.now()
      .add(Duration(seconds: secondsFromNowDeadline))
      .toIso8601String();
  return LudoMatchView.fromWire(
    _matchViewWire(
      currentPlayerIndex: currentPlayerIndex,
      deadlineAt: deadline,
    ),
  );
}
