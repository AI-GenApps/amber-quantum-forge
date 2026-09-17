import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:heist_rules/heist_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'heist_content.dart';
import 'heist_board_art.dart';

final sixtySecondHeistIdentity = appIdentityFor(
  'sixty_second_heist',
  subtitle: 'Plan the perfect escape',
);

final class HeistGame extends FlameGame {
  HeistGame({required this.context, required this.saveStore})
    : actions = ValueNotifier(const []),
      outcome = ValueNotifier(null),
      clock = const SystemClock();

  final AppContext context;
  final SaveStore saveStore;
  final Clock clock;
  final HeistRules rules = const HeistRules();
  final HeistLevel level = sixtySecondHeistLevel;
  final ValueNotifier<List<HeistAction>> actions;
  final ValueNotifier<HeistOutcome?> outcome;
  final MemoryTelemetrySink telemetrySink = MemoryTelemetrySink();
  final ValueNotifier<bool> hydrated = ValueNotifier(false);
  final ValueNotifier<String?> persistenceMessage = ValueNotifier(null);
  Future<void> _writeQueue = Future<void>.value();
  bool _disposed = false;

  Future<void> restore() async {
    try {
      final envelope = await saveStore.read(context);
      if (_disposed) return;
      if (envelope != null) {
        if (envelope.schemaVersion != 1) {
          throw const FormatException('Unsupported heist save schema');
        }
        final version = envelope.payload['rule_version'];
        final rawActions = envelope.payload['actions'];
        final rawOutcome = envelope.payload['outcome'];
        if (version != heistRuleVersion ||
            rawActions is! List ||
            (rawOutcome != null && rawOutcome is! Map)) {
          throw const FormatException('Unsupported heist save');
        }
        final restored = rawActions
            .map(HeistAction.fromJson)
            .toList(growable: false);
        if (restored.length > level.maxTicks) {
          throw const FormatException('Heist route exceeds tick limit');
        }
        actions.value = restored;
        outcome.value = rawOutcome == null
            ? null
            : rules.run(level: level, actions: restored);
      }
    } catch (_) {
      if (!_disposed) {
        persistenceMessage.value = 'Couldn\'t reopen the plan. Starting fresh.';
      }
    } finally {
      if (!_disposed) hydrated.value = true;
    }
  }

  void addAction(HeistActionType action) {
    if (_disposed ||
        !hydrated.value ||
        actions.value.length >= level.maxTicks) {
      return;
    }
    actions.value = [...actions.value, HeistAction(action)];
    outcome.value = null;
    _enqueueSave();
  }

  void reset() {
    if (_disposed || !hydrated.value) return;
    actions.value = const [];
    outcome.value = null;
    _enqueueSave();
  }

  void runPlan() {
    if (_disposed || !hydrated.value) return;
    final result = rules.run(level: level, actions: actions.value);
    outcome.value = result;
    TelemetryRecorder(
      context: context,
      clock: clock,
      sink: telemetrySink,
    ).record(
      'heist_plan_completed',
      fields: {
        'status': result.status.name,
        'ticks': result.finalTick,
        'loot_collected': result.lootCollected,
      },
    );
    _enqueueSave(result);
  }

  void _enqueueSave([HeistOutcome? result]) {
    if (_disposed) return;
    final envelope = SaveEnvelope.create(
      context: context,
      schemaVersion: 1,
      savedAt: clock.now(),
      payload: {
        'rule_version': heistRuleVersion,
        'actions': actions.value
            .map((action) => action.toJson())
            .toList(growable: false),
        'outcome': result?.toJson(),
      },
    );
    _writeQueue = _writeQueue.then<void>((_) => _write(envelope));
  }

  Future<void> _write(SaveEnvelope envelope) async {
    try {
      await saveStore.write(context, envelope);
    } catch (_) {
      if (!_disposed) persistenceMessage.value = "Couldn't save the plan.";
    }
  }

  HeistPoint plannedPlayer() {
    return outcome.value?.player ??
        rules.previewPlayer(level: level, actions: actions.value);
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);
    HeistBoardArt.paint(
      canvas,
      size: size.toSize(),
      level: level,
      actions: actions.value,
      player: plannedPlayer(),
      outcome: outcome.value,
    );
  }

  @override
  void dispose() {
    _disposeResources();
    super.dispose();
  }

  @override
  void onRemove() {
    _disposeResources();
    super.onRemove();
  }

  void _disposeResources() {
    if (_disposed) return;
    _disposed = true;
    actions.dispose();
    outcome.dispose();
    hydrated.dispose();
    persistenceMessage.dispose();
  }
}
