import 'package:flutter/foundation.dart';

import '../merge_relay_gateway.dart';
import 'merge_relay_play_games.dart';

enum MergeRelayPgsAccountPhase {
  idle,
  loading,
  linking,
  unlinked,
  linked,
  reauthorizationRequired,
  revoked,
  unavailable,
  declined,
  cancelled,
  offline,
  conflict,
  error,
}

final class MergeRelayPgsAccountState {
  const MergeRelayPgsAccountState({
    required this.phase,
    this.configured = false,
    this.diagnosticCode,
  });

  final MergeRelayPgsAccountPhase phase;
  final bool configured;
  final String? diagnosticCode;

  bool get isBusy =>
      phase == MergeRelayPgsAccountPhase.loading ||
      phase == MergeRelayPgsAccountPhase.linking;

  bool get isLinked => phase == MergeRelayPgsAccountPhase.linked;
}

final class MergeRelayPgsAccountController {
  MergeRelayPgsAccountController({
    required this.provider,
    required this.gateway,
    required this.ensureGuest,
  }) : state = ValueNotifier(
         const MergeRelayPgsAccountState(phase: MergeRelayPgsAccountPhase.idle),
       );

  final MergeRelayPlayGamesProvider provider;
  final MergeRelayGateway gateway;
  final Future<void> Function() ensureGuest;
  final ValueNotifier<MergeRelayPgsAccountState> state;
  bool _disposed = false;
  int _operationGeneration = 0;
  Future<MergeRelayPgsAccountState>? _operation;
  bool _operationIsRefresh = false;

  MergeRelayPgsAccountState get currentState => state.value;

  Future<MergeRelayPgsAccountState> refreshStatus() {
    if (_disposed) return Future.value(currentState);
    final existing = _operation;
    if (existing != null) return existing;
    final generation = ++_operationGeneration;
    _setState(
      const MergeRelayPgsAccountState(phase: MergeRelayPgsAccountPhase.loading),
    );
    final operation = _refreshStatus(generation);
    _operationIsRefresh = true;
    _operation = operation;
    return operation.whenComplete(() => _clearOperation(operation));
  }

  Future<MergeRelayPgsAccountState> _refreshStatus(int generation) async {
    try {
      await ensureGuest();
      if (!_isCurrent(generation)) return currentState;
      final snapshot = await gateway.getPgsIdentityStatus();
      if (!_isCurrent(generation)) return currentState;
      return _setState(_statusState(snapshot));
    } on Object catch (error) {
      if (!_isCurrent(generation)) return currentState;
      return _setState(_errorState(error));
    }
  }

  Future<MergeRelayPgsAccountState> link() {
    if (_disposed) return Future.value(currentState);
    final existing = _operation;
    if (existing != null) {
      if (!_operationIsRefresh) return existing;
      return existing.then((_) => link());
    }
    final generation = ++_operationGeneration;
    _setState(
      const MergeRelayPgsAccountState(phase: MergeRelayPgsAccountPhase.linking),
    );
    final operation = _link(generation);
    _operationIsRefresh = false;
    _operation = operation;
    return operation.whenComplete(() => _clearOperation(operation));
  }

  Future<MergeRelayPgsAccountState> _link(int generation) async {
    try {
      await ensureGuest();
      if (!_isCurrent(generation)) return currentState;
      var platformState = await provider.initialize();
      if (!_isCurrent(generation)) return currentState;
      if (platformState.status == MergeRelayPlayGamesStatus.signedOut) {
        platformState = await provider.signIn();
        if (!_isCurrent(generation)) return currentState;
      }
      if (!platformState.isAuthenticated) {
        return _setState(_platformState(platformState));
      }
      final access = await provider.requestServerAccess();
      if (!_isCurrent(generation)) return currentState;
      if (!access.granted || access.authCode == null) {
        return _setState(_accessState(access));
      }
      final identity = await gateway.linkPgsIdentity(access.authCode!);
      if (!_isCurrent(generation)) return currentState;
      return _setState(_identityState(identity));
    } on Object catch (error) {
      if (!_isCurrent(generation)) return currentState;
      return _setState(_errorState(error));
    }
  }

  Future<MergeRelayPlayGamesActionResult> showAchievements() =>
      _showAction(provider.showAchievements);

  Future<MergeRelayPlayGamesActionResult> showLeaderboards() =>
      _showAction(provider.showLeaderboards);

  Future<MergeRelayPlayGamesActionResult> _showAction(
    Future<MergeRelayPlayGamesActionResult> Function() action,
  ) {
    if (_disposed) {
      return Future.value(
        const MergeRelayPlayGamesActionResult(
          status: MergeRelayPlayGamesActionStatus.unavailable,
          diagnosticCode: 'controller_disposed',
        ),
      );
    }
    return action();
  }

  MergeRelayPgsAccountState _statusState(
    MergeRelayPgsIdentitySnapshot snapshot,
  ) {
    if (!snapshot.configured) {
      return const MergeRelayPgsAccountState(
        phase: MergeRelayPgsAccountPhase.unavailable,
        diagnosticCode: 'pgs_unconfigured',
      );
    }
    return switch (snapshot.status) {
      MergeRelayPgsIdentityLinkStatus.unlinked =>
        const MergeRelayPgsAccountState(
          phase: MergeRelayPgsAccountPhase.unlinked,
          configured: true,
        ),
      MergeRelayPgsIdentityLinkStatus.active => const MergeRelayPgsAccountState(
        phase: MergeRelayPgsAccountPhase.linked,
        configured: true,
      ),
      MergeRelayPgsIdentityLinkStatus.reauthorizationRequired =>
        const MergeRelayPgsAccountState(
          phase: MergeRelayPgsAccountPhase.reauthorizationRequired,
          configured: true,
        ),
      MergeRelayPgsIdentityLinkStatus.revoked =>
        const MergeRelayPgsAccountState(
          phase: MergeRelayPgsAccountPhase.revoked,
          configured: true,
        ),
    };
  }

  MergeRelayPgsAccountState _identityState(MergeRelayPgsIdentity identity) {
    return switch (identity.status) {
      MergeRelayPgsIdentityLinkStatus.active => const MergeRelayPgsAccountState(
        phase: MergeRelayPgsAccountPhase.linked,
        configured: true,
      ),
      MergeRelayPgsIdentityLinkStatus.reauthorizationRequired =>
        const MergeRelayPgsAccountState(
          phase: MergeRelayPgsAccountPhase.reauthorizationRequired,
          configured: true,
        ),
      MergeRelayPgsIdentityLinkStatus.revoked =>
        const MergeRelayPgsAccountState(
          phase: MergeRelayPgsAccountPhase.revoked,
          configured: true,
        ),
      MergeRelayPgsIdentityLinkStatus.unlinked =>
        const MergeRelayPgsAccountState(
          phase: MergeRelayPgsAccountPhase.unlinked,
          configured: true,
        ),
    };
  }

  MergeRelayPgsAccountState _platformState(MergeRelayPlayGamesState value) {
    return MergeRelayPgsAccountState(
      phase: switch (value.status) {
        MergeRelayPlayGamesStatus.declined =>
          MergeRelayPgsAccountPhase.declined,
        MergeRelayPlayGamesStatus.cancelled =>
          MergeRelayPgsAccountPhase.cancelled,
        MergeRelayPlayGamesStatus.offline => MergeRelayPgsAccountPhase.offline,
        MergeRelayPlayGamesStatus.unavailable =>
          MergeRelayPgsAccountPhase.unavailable,
        MergeRelayPlayGamesStatus.signedOut =>
          MergeRelayPgsAccountPhase.declined,
        MergeRelayPlayGamesStatus.authenticated =>
          MergeRelayPgsAccountPhase.error,
        MergeRelayPlayGamesStatus.error => MergeRelayPgsAccountPhase.error,
      },
      diagnosticCode: value.diagnosticCode,
    );
  }

  MergeRelayPgsAccountState _accessState(
    MergeRelayPlayGamesServerAccess value,
  ) {
    final code = value.diagnosticCode;
    final phase = switch (code) {
      'cancelled' => MergeRelayPgsAccountPhase.cancelled,
      'declined' => MergeRelayPgsAccountPhase.declined,
      'offline' => MergeRelayPgsAccountPhase.offline,
      'plugin_missing' ||
      'application_id_missing' ||
      'server_client_id_missing' => MergeRelayPgsAccountPhase.unavailable,
      _ => MergeRelayPgsAccountPhase.error,
    };
    return MergeRelayPgsAccountState(phase: phase, diagnosticCode: code);
  }

  MergeRelayPgsAccountState _errorState(Object error) {
    if (error is MergeRelayTransportException) {
      return const MergeRelayPgsAccountState(
        phase: MergeRelayPgsAccountPhase.offline,
        diagnosticCode: 'offline',
      );
    }
    if (error is MergeRelayApiException) {
      final phase = switch (error.code) {
        'pgs_unconfigured' => MergeRelayPgsAccountPhase.unavailable,
        'pgs_identity_conflict' ||
        'pgs_identity_already_linked' => MergeRelayPgsAccountPhase.conflict,
        'invalid_pgs_auth_code' || 'game_token_required' =>
          MergeRelayPgsAccountPhase.reauthorizationRequired,
        _ when error.statusCode == 409 => MergeRelayPgsAccountPhase.conflict,
        _ when error.statusCode == 401 =>
          MergeRelayPgsAccountPhase.reauthorizationRequired,
        _ => MergeRelayPgsAccountPhase.error,
      };
      return MergeRelayPgsAccountState(
        phase: phase,
        diagnosticCode: error.code,
      );
    }
    if (error is MergeRelayProtocolException) {
      return const MergeRelayPgsAccountState(
        phase: MergeRelayPgsAccountPhase.error,
        diagnosticCode: 'protocol',
      );
    }
    return const MergeRelayPgsAccountState(
      phase: MergeRelayPgsAccountPhase.error,
      diagnosticCode: 'pgs_error',
    );
  }

  MergeRelayPgsAccountState _setState(MergeRelayPgsAccountState value) {
    if (!_disposed) state.value = value;
    return value;
  }

  bool _isCurrent(int generation) =>
      !_disposed && generation == _operationGeneration;

  void _clearOperation(Future<MergeRelayPgsAccountState> operation) {
    if (identical(_operation, operation)) {
      _operation = null;
      _operationIsRefresh = false;
    }
  }

  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _operationGeneration += 1;
    state.dispose();
  }
}
