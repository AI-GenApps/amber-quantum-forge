import 'dart:async';

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_board_art.dart';
import 'merge_relay_ui.dart';

final mergeRelayIdentity = appIdentityFor(
  'merge_relay',
  subtitle: 'Merge tiles. Challenge friends',
);

final class MergeRelayApp extends StatefulWidget {
  const MergeRelayApp({this.saveStore, super.key});

  final SaveStore? saveStore;

  @override
  State<MergeRelayApp> createState() => _MergeRelayAppState();
}

final class _MergeRelayAppState extends State<MergeRelayApp> {
  late final MergeRelayGame game;

  @override
  void initState() {
    super.initState();
    game = MergeRelayGame(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      saveStore: widget.saveStore ?? MemorySaveStore(),
    );
    unawaited(game.restore());
  }

  @override
  void dispose() {
    game.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: mergeRelayIdentity.publicTitle,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
      home: MergeRelayScreen(game: game),
    );
  }
}

final class MergeRelayGame extends FlameGame {
  MergeRelayGame({required this.context, required this.saveStore})
    : state = ValueNotifier(MergeGameState.newGame(seed: 0x4d52)),
      clock = const SystemClock(),
      feedback = ValueNotifier(null);

  final AppContext context;
  final ValueNotifier<MergeGameState> state;
  final MergeRules rules = const MergeRules();
  final SaveStore saveStore;
  final Clock clock;
  final MemoryTelemetrySink telemetrySink = MemoryTelemetrySink();
  final ValueNotifier<bool> hydrated = ValueNotifier(false);
  final ValueNotifier<String?> persistenceMessage = ValueNotifier(null);
  final ValueNotifier<String?> feedback;
  Timer? _feedbackTimer;
  bool _disposed = false;

  Future<void> restore() async {
    try {
      final envelope = await saveStore.read(context);
      if (_disposed) return;
      if (envelope != null) {
        if (envelope.schemaVersion != 1) {
          throw const FormatException('Unsupported merge save schema');
        }
        final restored = MergeGameState.fromJson(envelope.payload);
        if (restored.ruleVersion != mergeRuleVersion) {
          throw const FormatException('Unsupported merge rule version');
        }
        state.value = restored;
      }
    } catch (_) {
      if (!_disposed) {
        persistenceMessage.value = 'This relay needs a fresh start.';
      }
    } finally {
      if (!_disposed) hydrated.value = true;
    }
  }

  void move(MergeDirection direction) {
    if (_disposed || !hydrated.value) return;
    final result = rules.apply(state.value, direction);
    if (!result.changed) {
      telemetry.record('merge_move_ignored', fields: {'reason': result.reason});
      _announce(
        result.reason == 'terminal'
            ? 'No moves left. Start a new relay.'
            : 'That lane is blocked.',
      );
      return;
    }
    state.value = result.state;
    _announce(
      result.scoreDelta > 0
          ? 'Merged for ${result.scoreDelta} points.'
          : 'Relay moved.',
    );
    telemetry.record(
      'merge_move_completed',
      fields: {
        'move_count': result.state.moveCount,
        'score_delta': result.scoreDelta,
        'rng_draws': result.rngDraws,
      },
    );
    final envelope = SaveEnvelope.create(
      context: context,
      schemaVersion: 1,
      savedAt: clock.now(),
      payload: result.state.toJson(),
    );
    unawaited(_write(envelope));
  }

  void newRound() {
    if (_disposed || !hydrated.value) return;
    final nextSeed = state.value.seed == 0x4d52 ? 0x4d53 : 0x4d52;
    state.value = MergeGameState.newGame(seed: nextSeed);
    _announce('Fresh board ready.');
    final envelope = SaveEnvelope.create(
      context: context,
      schemaVersion: 1,
      savedAt: clock.now(),
      payload: state.value.toJson(),
    );
    unawaited(_write(envelope));
  }

  Future<void> _write(SaveEnvelope envelope) async {
    try {
      await saveStore.write(context, envelope);
    } catch (_) {
      if (!_disposed) persistenceMessage.value = "Couldn't save the board.";
    }
  }

  void _announce(String message) {
    if (_disposed) return;
    _feedbackTimer?.cancel();
    feedback.value = message;
    _feedbackTimer = Timer(const Duration(milliseconds: 1600), () {
      if (!_disposed) feedback.value = null;
    });
  }

  TelemetryRecorder get telemetry =>
      TelemetryRecorder(context: context, clock: clock, sink: telemetrySink);

  @override
  void dispose() {
    _disposeResources();
    super.dispose();
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);
    MergeRelayBoardArt.paint(canvas, state.value.board, size: size.toSize());
  }

  @override
  void onRemove() {
    _disposeResources();
    super.onRemove();
  }

  void _disposeResources() {
    if (_disposed) return;
    _disposed = true;
    _feedbackTimer?.cancel();
    state.dispose();
    hydrated.dispose();
    persistenceMessage.dispose();
    feedback.dispose();
  }
}
