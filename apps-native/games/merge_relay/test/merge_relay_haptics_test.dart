import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

/// Mocks `SystemChannels.platform` (what `HapticFeedback.*Impact()` and
/// `.selectionClick()` call through to) and checks each event fires the
/// haptic task 09's decisions assign it, exactly once, gated by the
/// `hapticsEnabled` preference.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late List<MethodCall> calls;

  setUp(() {
    calls = [];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(SystemChannels.platform, (call) async {
          calls.add(call);
          return null;
        });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(SystemChannels.platform, null);
  });

  int vibrateCount(String hapticType) => calls
      .where(
        (call) =>
            call.method == 'HapticFeedback.vibrate' &&
            call.arguments == hapticType,
      )
      .length;

  Future<MergeRelayGame> readyGame(MergeRelayContentCatalog content) async {
    final game = MergeRelayGame(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      saveStore: MemorySaveStore(),
      content: content,
    );
    await game.restore();
    return game;
  }

  MergeRelayContentCatalog catalogFor(MergeGameState state) {
    return MergeRelayContentCatalog([
      MergeRescueBoard(
        id: 'haptics-fixture',
        title: 'Fixture',
        subtitle: 'Fixture',
        state: state,
        originSeed: state.seed,
        originMoves: const [],
        moveBudget: 6,
      ),
    ]);
  }

  test('a plain slide (no merge, no new best tile) fires only the light '
      'haptic once', () async {
    final game = await readyGame(
      catalogFor(
        MergeGameState(
          board: MergeBoard([0, 0, 0, 4, ...List<int>.filled(12, 0)]),
          score: 0,
          moveCount: 0,
          seed: 1,
          rngState: 11,
        ),
      ),
    );
    addTearDown(game.dispose);

    game.move(MergeDirection.left);

    expect(vibrateCount('HapticFeedbackType.lightImpact'), 1);
    expect(vibrateCount('HapticFeedbackType.mediumImpact'), 0);
    expect(vibrateCount('HapticFeedbackType.heavyImpact'), 0);
  });

  test('a merge that does not beat the existing best tile fires light + '
      'medium, no heavy', () async {
    final game = await readyGame(
      catalogFor(
        MergeGameState(
          board: MergeBoard([
            2, 2, 0, 0, //
            0, 0, 0, 8, //
            0, 0, 0, 0, //
            0, 0, 0, 0, //
          ]),
          score: 0,
          moveCount: 0,
          seed: 1,
          rngState: 11,
        ),
      ),
    );
    addTearDown(game.dispose);

    game.move(MergeDirection.left);

    expect(vibrateCount('HapticFeedbackType.lightImpact'), 1);
    expect(vibrateCount('HapticFeedbackType.mediumImpact'), 1);
    expect(vibrateCount('HapticFeedbackType.heavyImpact'), 0);
  });

  test(
    'a merge that sets a new best tile fires light + medium + heavy',
    () async {
      final game = await readyGame(
        catalogFor(
          MergeGameState(
            board: MergeBoard([2, 2, 0, ...List<int>.filled(13, 0)]),
            score: 0,
            moveCount: 0,
            seed: 1,
            rngState: 11,
          ),
        ),
      );
      addTearDown(game.dispose);

      game.move(MergeDirection.left);

      expect(vibrateCount('HapticFeedbackType.lightImpact'), 1);
      expect(vibrateCount('HapticFeedbackType.mediumImpact'), 1);
      expect(vibrateCount('HapticFeedbackType.heavyImpact'), 1);
      expect(game.presentation.value?.isNewBestTile, isTrue);
    },
  );

  test('a blocked move fires no haptic at all', () async {
    final game = await readyGame(
      catalogFor(
        MergeGameState(
          board: MergeBoard([
            2, 4, 2, 4, //
            4, 2, 4, 2, //
            2, 4, 2, 4, //
            4, 2, 4, 2, //
          ]),
          score: 0,
          moveCount: 0,
          seed: 1,
          rngState: 11,
        ),
      ),
    );
    addTearDown(game.dispose);

    final before = game.blockedMoveSignal.value;
    game.move(MergeDirection.up);

    expect(calls, isEmpty);
    expect(game.blockedMoveSignal.value, before + 1);
  });

  test('disabling haptics silences every event', () async {
    final game = await readyGame(
      catalogFor(
        MergeGameState(
          board: MergeBoard([2, 2, 0, ...List<int>.filled(13, 0)]),
          score: 0,
          moveCount: 0,
          seed: 1,
          rngState: 11,
        ),
      ),
    );
    addTearDown(game.dispose);
    game.setHapticsEnabled(false);

    game.move(MergeDirection.left);

    expect(calls, isEmpty);
  });

  test('hapticSelect fires a selection click, gated by the toggle', () async {
    final game = await readyGame(
      catalogFor(MergeRelayContentCatalog.fallback.firstRescue.state),
    );
    addTearDown(game.dispose);

    game.hapticSelect();
    expect(
      calls.where(
        (call) =>
            call.method == 'HapticFeedback.vibrate' &&
            call.arguments == 'HapticFeedbackType.selectionClick',
      ),
      hasLength(1),
    );

    game.setHapticsEnabled(false);
    game.hapticSelect();
    expect(
      calls.where(
        (call) =>
            call.method == 'HapticFeedback.vibrate' &&
            call.arguments == 'HapticFeedbackType.selectionClick',
      ),
      hasLength(1),
    );
  });
}
