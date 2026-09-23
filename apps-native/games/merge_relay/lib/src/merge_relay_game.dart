import 'dart:async';

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_board_art.dart';
import 'merge_relay_content.dart';
import 'merge_relay_content_validation.dart';
import 'merge_relay_models.dart';
import 'merge_relay_relay_controller.dart';
import 'platform/merge_relay_pgs_account.dart';
import 'platform/merge_relay_play_games.dart';

part 'merge_relay_game_actions.dart';
part 'merge_relay_game_preferences.dart';
part 'merge_relay_lifecycle.dart';
part 'merge_relay_game_persistence.dart';
part 'merge_relay_game_restore_parsing.dart';
part 'merge_relay_mode_actions.dart';
part 'merge_relay_platform_actions.dart';
part 'merge_relay_game_relay_actions.dart';
part 'merge_relay_save_state.dart';
part 'merge_relay_seed.dart';

final class MergeRelayGame extends FlameGame {
  MergeRelayGame({
    required this.context,
    required this.saveStore,
    this.relayController,
    MergeRelayPgsAccountController? pgsAccount,
    MergeRelayPlayGamesProvider? playGames,
    MergeRelayContentCatalog? content,
    Clock? clock,
  }) : _providedPgsAccount = pgsAccount,
       content = content ?? MergeRelayContentCatalog.fallback,
       clock = clock ?? const SystemClock(),
       playGames = playGames ?? MethodChannelMergeRelayPlayGamesProvider(),
       state = ValueNotifier(
         (content ?? MergeRelayContentCatalog.fallback).firstRescue.state,
       ),
       feedback = ValueNotifier(null),
       mode = ValueNotifier(MergeRelayMode.rescue),
       rescueId = ValueNotifier(
         (content ?? MergeRelayContentCatalog.fallback).firstRescue.id,
       ),
       preferences = ValueNotifier(const MergeRelayPreferences()),
       presentation = ValueNotifier(null),
       result = ValueNotifier(null),
       route = ValueNotifier(MergeRelayRoute.home),
       tutorialComplete = ValueNotifier(false),
       hasSavedSession = ValueNotifier(false),
       legacyOffer = ValueNotifier(false),
       isPaused = ValueNotifier(false),
       completedRescueIds = ValueNotifier(const {}),
       roundComplete = ValueNotifier(false),
       hydrated = ValueNotifier(false),
       restoreFailed = ValueNotifier(false),
       playGamesState = ValueNotifier(
         const MergeRelayPlayGamesState(
           status: MergeRelayPlayGamesStatus.unavailable,
           diagnosticCode: 'not_initialized',
         ),
       ),
       persistenceMessage = ValueNotifier(null) {
    pgsAccountController =
        _providedPgsAccount ??
        (relayController == null
            ? null
            : MergeRelayPgsAccountController(
                provider: this.playGames,
                gateway: relayController!.gateway,
                ensureGuest: relayController!.bootstrap,
              ));
  }

  final AppContext context;
  final MergeRelayPgsAccountController? _providedPgsAccount;
  final MergeRelayContentCatalog content;
  final SaveStore saveStore;
  final MergeRelayRelayController? relayController;
  final Clock clock;
  final MergeRelayPlayGamesProvider playGames;
  late final MergeRelayPgsAccountController? pgsAccountController;
  MergeRuleConfig _activeRuleConfig = const MergeRuleConfig.legacy();
  final MemoryTelemetrySink telemetrySink = MemoryTelemetrySink();
  final ValueNotifier<MergeGameState> state;
  final ValueNotifier<bool> hydrated;
  final ValueNotifier<String?> persistenceMessage;
  final ValueNotifier<String?> feedback;
  final ValueNotifier<MergeRelayMode> mode;
  final ValueNotifier<String?> rescueId;
  final ValueNotifier<MergeRelayPreferences> preferences;
  final ValueNotifier<MergeMovePresentation?> presentation;
  final ValueNotifier<MergeRelayResult?> result;
  final ValueNotifier<MergeRelayRoute> route;
  final ValueNotifier<bool> tutorialComplete;
  final ValueNotifier<bool> hasSavedSession;
  final ValueNotifier<bool> legacyOffer;
  final ValueNotifier<bool> isPaused;
  final ValueNotifier<Set<String>> completedRescueIds;
  final ValueNotifier<bool> roundComplete;
  final ValueNotifier<bool> restoreFailed;
  final ValueNotifier<MergeRelayPlayGamesState> playGamesState;

  Timer? _feedbackTimer;
  Future<void> _writeTail = Future<void>.value();
  String? _dailyDate;
  int _rescueMovesUsed = 0;
  MergeRelayMode? _tutorialMode;
  int? _tutorialRescueIndex;
  int _writeRevision = 0;
  final Map<String, _MergeRelaySession> _sessions = {};
  String? _activeSessionKey;
  String? _activeContentVersion;
  String? _activeGoalRevision;
  String? _activeObjective;
  int? _activeTargetScore;
  bool _playGamesInitializationStarted = false;
  bool _disposed = false;

  int? get movesRemaining {
    if (!mode.value.usesMoveBudget) return null;
    final used = mode.value == MergeRelayMode.rescue
        ? _rescueMovesUsed
        : state.value.moveCount;
    return (3 - used).clamp(0, 3).toInt();
  }

  bool get _readyForAction =>
      !_disposed && hydrated.value && !restoreFailed.value;

  MergeRescueBoard get currentRescue => content.rescues.firstWhere(
    (item) => item.id == rescueId.value,
    orElse: () => content.firstRescue,
  );

  MergeRules get rules => MergeRules(config: _activeRuleConfig);

  String get currentObjective =>
      _activeObjective ??
      (mode.value == MergeRelayMode.rescue
          ? 'Finish this rescue.'
          : mode.value.goal);

  int? get currentTargetScore => _activeTargetScore;

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
    mode.dispose();
    rescueId.dispose();
    preferences.dispose();
    presentation.dispose();
    result.dispose();
    route.dispose();
    tutorialComplete.dispose();
    hasSavedSession.dispose();
    legacyOffer.dispose();
    isPaused.dispose();
    completedRescueIds.dispose();
    roundComplete.dispose();
    restoreFailed.dispose();
    playGamesState.dispose();
    pgsAccountController?.dispose();
  }
}
