import 'merge_relay_relay_models.dart';
import 'network/merge_relay_http.dart';
import 'network/merge_relay_wire.dart';

enum MergeRelayOutcomeKind {
  offline,
  serviceUnavailable,
  missingConfig,
  tokenExpired,
  providerDisabled,
  challengeRetired,
  windowClosed,
  syncConflict,
  unsupportedClient,
  rejected,
  unknown,
}

enum MergeRelayOutcomeAction { retry, reconnect, home, updateApp }

final class MergeRelayServiceOutcome {
  const MergeRelayServiceOutcome({
    required this.kind,
    required this.phase,
    required this.code,
    required this.title,
    required this.message,
    required this.action,
    required this.actionLabel,
  });

  final MergeRelayOutcomeKind kind;
  final MergeRelayRelayPhase phase;
  final String code;
  final String title;
  final String message;
  final MergeRelayOutcomeAction action;
  final String actionLabel;
}

const _practiceNote = 'Solo play still works without a connection.';

const _configCodes = {
  'config_revision_not_found',
  'config_unavailable',
  'relay_config_missing',
  'daily_unavailable',
  'relay_disabled',
};

const _providerCodes = {
  'rewards_disabled',
  'pgs_identity_unavailable',
  'pgs_credential_unavailable',
  'purchase_verification_unavailable',
  'reauthorization_required',
  'provider_disabled',
};

const _tokenCodes = {
  'game_token_required',
  'game_token_invalid',
  'game_token_expired',
  'guest_recovery_not_found',
};

const _retiredCodes = {'challenge_retired', 'challenge_not_found'};

const _closedCodes = {'reservation_expired', 'attempt_not_playable'};

const _clientCodes = {
  'client_app_scope_mismatch',
  'unsupported_contract',
  'invalid_error_response',
};

MergeRelayServiceOutcome mergeRelayOutcomeFor(
  Object error, {
  String? fallbackCode,
}) {
  if (error is MergeRelayTransportException) {
    return const MergeRelayServiceOutcome(
      kind: MergeRelayOutcomeKind.offline,
      phase: MergeRelayRelayPhase.offline,
      code: 'offline',
      title: 'You are offline.',
      message: 'Connection lost. Your checkpoint is waiting to retry.',
      action: MergeRelayOutcomeAction.reconnect,
      actionLabel: 'Reconnect',
    );
  }
  if (error is MergeRelayProtocolException) {
    return const MergeRelayServiceOutcome(
      kind: MergeRelayOutcomeKind.unsupportedClient,
      phase: MergeRelayRelayPhase.error,
      code: 'protocol_mismatch',
      title: 'Update needed.',
      message:
          'This version cannot read the relay service. Update the app to join relays. $_practiceNote',
      action: MergeRelayOutcomeAction.updateApp,
      actionLabel: 'Back to home',
    );
  }
  if (error is! MergeRelayApiException) return _unknown(fallbackCode);
  final code = error.code;
  if (_closedCodes.contains(code)) {
    return _outcome(
      MergeRelayOutcomeKind.windowClosed,
      MergeRelayRelayPhase.expired,
      error,
      'The relay window closed.',
      'This relay window has closed.',
      MergeRelayOutcomeAction.home,
      'Home',
    );
  }
  if (_configCodes.contains(code)) {
    return _outcome(
      MergeRelayOutcomeKind.missingConfig,
      MergeRelayRelayPhase.error,
      error,
      'Relays are not available yet.',
      'The relay service has no active configuration. $_practiceNote',
      MergeRelayOutcomeAction.home,
      'Back to home',
    );
  }
  if (_retiredCodes.contains(code) || error.statusCode == 404) {
    return _outcome(
      MergeRelayOutcomeKind.challengeRetired,
      MergeRelayRelayPhase.error,
      error,
      'This challenge is gone.',
      'This challenge was retired or does not exist. Ask for a fresh link.',
      MergeRelayOutcomeAction.home,
      'Back to home',
    );
  }
  if (error.isConflict) {
    return _outcome(
      MergeRelayOutcomeKind.syncConflict,
      MergeRelayRelayPhase.conflict,
      error,
      'This relay changed.',
      'This relay changed. Reconnect before playing again.',
      MergeRelayOutcomeAction.reconnect,
      'Reconnect',
    );
  }
  if (_tokenCodes.contains(code) || error.isUnauthorized) {
    return _outcome(
      MergeRelayOutcomeKind.tokenExpired,
      MergeRelayRelayPhase.error,
      error,
      'Your session expired.',
      'Your guest session could not be renewed. Retry to start a new one. $_practiceNote',
      MergeRelayOutcomeAction.retry,
      'Retry',
    );
  }
  if (_clientCodes.contains(code)) {
    return _outcome(
      MergeRelayOutcomeKind.unsupportedClient,
      MergeRelayRelayPhase.error,
      error,
      'Update needed.',
      'This version cannot join relays on this service. $_practiceNote',
      MergeRelayOutcomeAction.updateApp,
      'Back to home',
    );
  }
  if (_providerCodes.contains(code) || error.statusCode == 403) {
    return _outcome(
      MergeRelayOutcomeKind.providerDisabled,
      MergeRelayRelayPhase.error,
      error,
      'Not available right now.',
      'This feature is switched off or needs another sign-in. $_practiceNote',
      MergeRelayOutcomeAction.home,
      'Back to home',
    );
  }
  if (error.statusCode >= 500) {
    return _outcome(
      MergeRelayOutcomeKind.serviceUnavailable,
      MergeRelayRelayPhase.error,
      error,
      'The relay service is down.',
      'The service is unavailable. Try again shortly. $_practiceNote',
      MergeRelayOutcomeAction.retry,
      'Retry',
    );
  }
  return _outcome(
    MergeRelayOutcomeKind.rejected,
    MergeRelayRelayPhase.error,
    error,
    'The relay paused.',
    error.message,
    MergeRelayOutcomeAction.retry,
    'Retry',
  );
}

MergeRelayServiceOutcome _outcome(
  MergeRelayOutcomeKind kind,
  MergeRelayRelayPhase phase,
  MergeRelayApiException error,
  String title,
  String message,
  MergeRelayOutcomeAction action,
  String label,
) => MergeRelayServiceOutcome(
  kind: kind,
  phase: phase,
  code: error.code,
  title: title,
  message: message,
  action: action,
  actionLabel: label,
);

MergeRelayServiceOutcome _unknown(String? fallbackCode) =>
    MergeRelayServiceOutcome(
      kind: MergeRelayOutcomeKind.unknown,
      phase: MergeRelayRelayPhase.error,
      code: fallbackCode ?? 'relay_error',
      title: 'The relay paused.',
      message: 'The relay could not continue.',
      action: MergeRelayOutcomeAction.retry,
      actionLabel: 'Retry',
    );
