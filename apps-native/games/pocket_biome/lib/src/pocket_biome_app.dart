import 'dart:async';

import 'package:biome_rules/biome_rules.dart';
import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:platform_core/platform_core.dart';

import 'biome_content.dart';
import 'pocket_biome_art.dart';
import 'pocket_biome_typography.dart';
import 'pocket_biome_ui.dart';

part 'pocket_biome_persistence.dart';

final pocketBiomeIdentity = appIdentityFor(
  'pocket_biome',
  subtitle: 'Grow tiny worlds',
);

final class PocketBiomeApp extends StatefulWidget {
  const PocketBiomeApp({this.saveStore, super.key});

  final SaveStore? saveStore;

  @override
  State<PocketBiomeApp> createState() => _PocketBiomeAppState();
}

final class _PocketBiomeAppState extends State<PocketBiomeApp>
    with WidgetsBindingObserver {
  late final PocketBiomeGame game;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    game = PocketBiomeGame(
      context: runtimeAppContext(identity: pocketBiomeIdentity),
      saveStore: widget.saveStore ?? MemorySaveStore(),
    );
    unawaited(game.restore());
    _startTicker();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _stopTicker();
    game.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final resumed = state == AppLifecycleState.resumed;
    game.settleNow(persist: !resumed);
    if (resumed) {
      _startTicker();
    } else {
      _stopTicker();
    }
  }

  void _startTicker() {
    _timer ??= Timer.periodic(const Duration(seconds: 1), (_) {
      game.settleNow();
    });
  }

  void _stopTicker() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: pocketBiomeIdentity.publicTitle,
      debugShowCheckedModeBanner: false,
      theme: PocketBiomeTypography.theme(seedColor: Colors.teal),
      home: PocketBiomeScreen(game: game),
    );
  }
}

final class PocketBiomeGame extends FlameGame with PocketBiomePersistence {
  PocketBiomeGame({
    required this.context,
    required this.saveStore,
    Clock? clock,
    BiomeRules? rules,
  }) : clock = clock ?? const SystemClock(),
       rules = rules ?? BiomeRules(pocketBiomeSpecies),
       state = ValueNotifier(BiomeState.empty()),
       feedback = ValueNotifier(null),
       selectedSlot = ValueNotifier(null);

  @override
  final AppContext context;
  @override
  final SaveStore saveStore;
  @override
  final Clock clock;
  final BiomeRules rules;
  @override
  final ValueNotifier<BiomeState> state;
  @override
  final MemoryTelemetrySink telemetrySink = MemoryTelemetrySink();
  final ValueNotifier<bool> hydrated = ValueNotifier(false);
  @override
  final ValueNotifier<String?> persistenceMessage = ValueNotifier(null);
  final ValueNotifier<String?> feedback;
  final ValueNotifier<int?> selectedSlot;
  Timer? _feedbackTimer;
  bool _disposed = false;
  @override
  bool get isDisposed => _disposed;

  Future<void> restore() async {
    try {
      final envelope = await saveStore.read(context);
      if (_disposed) return;
      if (envelope != null) {
        if (envelope.schemaVersion != 1) {
          throw const FormatException('Unsupported biome save schema');
        }
        final restored = BiomeState.fromJson(envelope.payload);
        if (restored.ruleVersion != biomeRuleVersion) {
          throw const FormatException('Unsupported biome rule version');
        }
        state.value = restored;
      }
    } catch (_) {
      if (!_disposed) {
        persistenceMessage.value =
            'Couldn\'t reopen that habitat. Starting fresh.';
      }
    } finally {
      if (!_disposed) hydrated.value = true;
    }
  }

  void settleNow({bool persist = false}) {
    if (_disposed || !hydrated.value) return;
    final previous = state.value;
    final next = rules.settle(previous, clock.now());
    if (identical(previous, next)) return;
    state.value = next;
    final clockStateChanged = previous.lastClockSkewAt != next.lastClockSkewAt;
    if (persist || previous.lastTrustedAt == null || clockStateChanged) {
      _commit(next, 'settle', announce: false);
    }
  }

  void plantMossling() {
    if (_disposed || !hydrated.value) return;
    final slot = state.value.slots.indexWhere((item) => item == null);
    if (slot == -1) {
      _record('plant_rejected', 'habitat_full');
      return;
    }
    final operation = rules.plant(
      state: state.value,
      slotIndex: slot,
      speciesId: 'moss',
      specimenId: 'moss-${state.value.completedClaims.length}',
      claimId: 'local-plant-${state.value.completedClaims.length}',
      now: clock.now(),
    );
    _commit(
      operation.state,
      'plant',
      accepted: operation.accepted,
      reason: operation.reason,
    );
  }

  void harvest(int slotIndex) {
    if (_disposed || !hydrated.value) return;
    final operation = rules.harvest(
      state: state.value,
      slotIndex: slotIndex,
      now: clock.now(),
    );
    _commit(
      operation.state,
      'harvest',
      accepted: operation.accepted,
      reason: operation.reason,
    );
  }

  void inspectSlot(int index) {
    if (_disposed || index < 0 || index >= state.value.slots.length) return;
    selectedSlot.value = index;
    final slot = state.value.slots[index];
    if (slot == null) {
      _announce('Empty pot. Plant a Mossling to start growing.');
      return;
    }
    final name = speciesName(rules.speciesById.values, slot.speciesId);
    _announce(
      slot.isReadyAt(clock.now())
          ? '$name is ready to harvest.'
          : '$name is growing in pot ${index + 1}.',
    );
  }

  void inspectHabitat() {
    if (_disposed) return;
    final index = state.value.slots.indexWhere((slot) => slot != null);
    if (index == -1) {
      _announce('Your terrarium is empty. Plant a Mossling to begin.');
    } else {
      inspectSlot(index);
    }
  }

  void _commit(
    BiomeState next,
    String action, {
    bool accepted = true,
    String reason = 'updated',
    bool announce = true,
  }) {
    state.value = next;
    if (announce) {
      _announce(
        accepted
            ? action == 'plant'
                  ? 'Mossling planted. Check back when it glows.'
                  : 'Specimen added to your album.'
            : reason == 'not_ready'
            ? 'Still growing. Give it a little more time.'
            : 'That pot is already occupied.',
      );
    }
    _record(action, reason, accepted: accepted);
    final envelope = SaveEnvelope.create(
      context: context,
      schemaVersion: 1,
      savedAt: clock.now(),
      payload: next.toJson(),
    );
    unawaited(_write(envelope));
  }

  void _announce(String message) {
    if (_disposed) return;
    _feedbackTimer?.cancel();
    feedback.value = message;
    _feedbackTimer = Timer(const Duration(milliseconds: 2200), () {
      if (!_disposed) feedback.value = null;
    });
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);
    PocketBiomeArt.paint(
      canvas,
      size: size.toSize(),
      state: state.value,
      now: clock.now(),
      selectedSlot: selectedSlot.value,
      species: rules.speciesById,
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
    _feedbackTimer?.cancel();
    state.dispose();
    hydrated.dispose();
    persistenceMessage.dispose();
    feedback.dispose();
    selectedSlot.dispose();
  }
}
