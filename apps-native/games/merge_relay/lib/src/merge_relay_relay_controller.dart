import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_gateway.dart';
import 'merge_relay_models.dart';
import 'merge_relay_pending_create.dart';
import 'merge_relay_relay_link.dart';
import 'merge_relay_relay_models.dart';
import 'merge_relay_relay_persistence.dart';
import 'merge_relay_relay_share.dart';
import 'merge_relay_replay.dart';
import 'merge_relay_service_outcome.dart';

part 'merge_relay_relay_actions.dart';
part 'merge_relay_relay_moves.dart';
part 'merge_relay_relay_creator.dart';
part 'merge_relay_relay_replay.dart';
part 'merge_relay_relay_result_actions.dart';
part 'merge_relay_relay_reconnect.dart';

final class MergeRelayRelayController extends ChangeNotifier {
  MergeRelayRelayController({
    required this.context,
    required this.gateway,
    required this.authStore,
    required this.stateStore,
    this.clock = const SystemClock(),
    this.publicOrigin,
    this.shareProvider,
    this._keyFactory,
  }) {
    snapshot = MergeRelayRelaySnapshot();
  }

  final AppContext context;
  final MergeRelayGateway gateway;
  final MergeRelayAuthStore authStore;
  final MergeRelayRelayStateStore stateStore;
  final Clock clock;
  final Uri? publicOrigin;
  final MergeRelayShareProvider? shareProvider;
  final String Function(String prefix)? _keyFactory;
  late final MergeRelayRelaySnapshot snapshot;

  MergeRelayRelayLocalState _local = const MergeRelayRelayLocalState();
  MergeRelayGuestSession? _guest;
  Future<MergeRelayGuestSession>? _guestFuture;
  Future<void>? _bootstrapFuture;
  bool _disposed = false;
  bool _finalizeInFlight = false;
  Timer? _replayTimer;
  int _keyCount = 0;
  int _challengeRequest = 0;
  int _operationGeneration = 0;
  int _replayGeneration = 0;

  bool get isDisposed => _disposed;

  void _emit() {
    if (!_disposed) notifyListeners();
  }

  bool _isCurrentOperation(int generation) =>
      !_disposed && generation == _operationGeneration;

  Future<void> bootstrap() {
    return _bootstrapFuture ??= _bootstrap();
  }

  Future<void> retry() async {
    if (isDisposed) return;
    if (_local.pendingCreate != null) {
      await _resumeCreate();
      return;
    }
    if (_local.pendingChallengeId != null) {
      await openChallenge(_local.pendingChallengeId!);
      return;
    }
    if (_local.createdChallengeId != null && !_local.hasAttempt) {
      await _restoreCreatedChallenge();
      return;
    }
    if (_local.finalizeKey != null && _local.resultId == null) {
      await finalize();
      return;
    }
    if (_local.hasAttempt) {
      await reconnect();
      return;
    }
    _bootstrapFuture = null;
    await bootstrap();
  }

  void _setPhase(MergeRelayRelayPhase phase) {
    if (_disposed) return;
    snapshot.phase = phase;
    notifyListeners();
  }

  void _setError(Object error, {String? fallbackCode}) {
    if (_disposed) return;
    final outcome = mergeRelayOutcomeFor(error, fallbackCode: fallbackCode);
    snapshot
      ..phase = outcome.phase
      ..errorCode = outcome.code
      ..message = outcome.message
      ..outcome = outcome;
    notifyListeners();
  }

  Future<bool> _persist() async {
    try {
      await stateStore.writeRelay(context, _local);
      return true;
    } on Object {
      if (!_disposed) {
        snapshot
          ..phase = MergeRelayRelayPhase.error
          ..errorCode = 'local_save_failed'
          ..message = 'Your relay checkpoint could not be saved.';
        notifyListeners();
      }
      return false;
    }
  }

  String _key(String prefix) {
    final supplied = _keyFactory?.call(prefix);
    if (supplied != null && supplied.isNotEmpty) return supplied;
    _keyCount += 1;
    return '$prefix-${clock.now().microsecondsSinceEpoch}-$_keyCount';
  }

  @override
  void dispose() {
    _disposed = true;
    _operationGeneration += 1;
    _replayGeneration += 1;
    _replayTimer?.cancel();
    _replayTimer = null;
    super.dispose();
  }
}
