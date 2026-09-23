import 'package:flutter/services.dart';

enum MergeRelayPlayGamesStatus {
  authenticated,
  signedOut,
  declined,
  cancelled,
  offline,
  unavailable,
  error,
}

final class MergeRelayPlayGamesState {
  const MergeRelayPlayGamesState({required this.status, this.diagnosticCode});

  final MergeRelayPlayGamesStatus status;
  final String? diagnosticCode;

  bool get isAuthenticated => status == MergeRelayPlayGamesStatus.authenticated;

  bool get guestFallbackAllowed => !isAuthenticated;

  factory MergeRelayPlayGamesState.fromPlatform(Object? value) {
    final map = _stringMap(value);
    final status = switch (map['status']) {
      'authenticated' => MergeRelayPlayGamesStatus.authenticated,
      'signed_out' => MergeRelayPlayGamesStatus.signedOut,
      'declined' => MergeRelayPlayGamesStatus.declined,
      'cancelled' => MergeRelayPlayGamesStatus.cancelled,
      'offline' => MergeRelayPlayGamesStatus.offline,
      'unavailable' => MergeRelayPlayGamesStatus.unavailable,
      'error' => MergeRelayPlayGamesStatus.error,
      _ => MergeRelayPlayGamesStatus.error,
    };
    final diagnosticCode = map['diagnostic_code'];
    return MergeRelayPlayGamesState(
      status: status,
      diagnosticCode: diagnosticCode is String ? diagnosticCode : null,
    );
  }
}

final class MergeRelayPlayGamesServerAccess {
  const MergeRelayPlayGamesServerAccess({
    required this.granted,
    this.authCode,
    this.diagnosticCode,
  });

  final bool granted;
  final String? authCode;
  final String? diagnosticCode;

  factory MergeRelayPlayGamesServerAccess.fromPlatform(Object? value) {
    final map = _stringMap(value);
    final granted = map['granted'];
    final authCode = map['server_auth_code'];
    final diagnosticCode = map['diagnostic_code'];
    final usableCode =
        granted is bool &&
        granted &&
        authCode is String &&
        authCode.trim().isNotEmpty;
    return MergeRelayPlayGamesServerAccess(
      granted: usableCode,
      authCode: usableCode ? authCode : null,
      diagnosticCode: usableCode
          ? diagnosticCode is String
                ? diagnosticCode
                : null
          : granted == true
          ? 'invalid_server_auth_code'
          : diagnosticCode is String
          ? diagnosticCode
          : null,
    );
  }
}

enum MergeRelayPlayGamesActionStatus {
  completed,
  cancelled,
  declined,
  offline,
  unavailable,
  error,
}

final class MergeRelayPlayGamesActionResult {
  const MergeRelayPlayGamesActionResult({
    required this.status,
    this.diagnosticCode,
  });

  final MergeRelayPlayGamesActionStatus status;
  final String? diagnosticCode;

  factory MergeRelayPlayGamesActionResult.fromPlatform(Object? value) {
    final map = _stringMap(value);
    final status = switch (map['status']) {
      'completed' => MergeRelayPlayGamesActionStatus.completed,
      'cancelled' => MergeRelayPlayGamesActionStatus.cancelled,
      'declined' => MergeRelayPlayGamesActionStatus.declined,
      'offline' => MergeRelayPlayGamesActionStatus.offline,
      'unavailable' => MergeRelayPlayGamesActionStatus.unavailable,
      _ => MergeRelayPlayGamesActionStatus.error,
    };
    final diagnosticCode = map['diagnostic_code'];
    return MergeRelayPlayGamesActionResult(
      status: status,
      diagnosticCode: diagnosticCode is String ? diagnosticCode : null,
    );
  }
}

abstract interface class MergeRelayPlayGamesProvider {
  Future<MergeRelayPlayGamesState> initialize();

  Future<MergeRelayPlayGamesState> signIn();

  Future<MergeRelayPlayGamesServerAccess> requestServerAccess();

  Future<MergeRelayPlayGamesActionResult> showAchievements();

  Future<MergeRelayPlayGamesActionResult> showLeaderboards();
}

final class MethodChannelMergeRelayPlayGamesProvider
    implements MergeRelayPlayGamesProvider {
  MethodChannelMergeRelayPlayGamesProvider({MethodChannel? channel})
    : _channel = channel ?? _defaultChannel;

  static const _defaultChannel = MethodChannel(
    'app.w3dev.mergerelay/play_games',
  );

  final MethodChannel _channel;

  @override
  Future<MergeRelayPlayGamesState> initialize() => _stateCall('initialize');

  @override
  Future<MergeRelayPlayGamesState> signIn() => _stateCall('sign_in');

  @override
  Future<MergeRelayPlayGamesServerAccess> requestServerAccess() async {
    try {
      final value = await _channel.invokeMethod<Object?>(
        'request_server_access',
      );
      return MergeRelayPlayGamesServerAccess.fromPlatform(value);
    } on MissingPluginException {
      return const MergeRelayPlayGamesServerAccess(
        granted: false,
        diagnosticCode: 'plugin_missing',
      );
    } on PlatformException catch (error) {
      return MergeRelayPlayGamesServerAccess(
        granted: false,
        diagnosticCode: _platformCode(error.code),
      );
    }
  }

  @override
  Future<MergeRelayPlayGamesActionResult> showAchievements() =>
      _actionCall('show_achievements');

  @override
  Future<MergeRelayPlayGamesActionResult> showLeaderboards() =>
      _actionCall('show_leaderboards');

  Future<MergeRelayPlayGamesState> _stateCall(String method) async {
    try {
      final value = await _channel.invokeMethod<Object?>(method);
      return MergeRelayPlayGamesState.fromPlatform(value);
    } on MissingPluginException {
      return const MergeRelayPlayGamesState(
        status: MergeRelayPlayGamesStatus.unavailable,
        diagnosticCode: 'plugin_missing',
      );
    } on PlatformException catch (error) {
      return MergeRelayPlayGamesState(
        status: MergeRelayPlayGamesStatus.error,
        diagnosticCode: _platformCode(error.code),
      );
    }
  }

  Future<MergeRelayPlayGamesActionResult> _actionCall(String method) async {
    try {
      final value = await _channel.invokeMethod<Object?>(method);
      return MergeRelayPlayGamesActionResult.fromPlatform(value);
    } on MissingPluginException {
      return const MergeRelayPlayGamesActionResult(
        status: MergeRelayPlayGamesActionStatus.unavailable,
        diagnosticCode: 'plugin_missing',
      );
    } on PlatformException catch (error) {
      return MergeRelayPlayGamesActionResult(
        status: MergeRelayPlayGamesActionStatus.error,
        diagnosticCode: _platformCode(error.code),
      );
    }
  }
}

final class FakeMergeRelayPlayGamesProvider
    implements MergeRelayPlayGamesProvider {
  FakeMergeRelayPlayGamesProvider({
    this.state = const MergeRelayPlayGamesState(
      status: MergeRelayPlayGamesStatus.signedOut,
    ),
    this.serverAccess = const MergeRelayPlayGamesServerAccess(granted: false),
    this.achievementsResult = const MergeRelayPlayGamesActionResult(
      status: MergeRelayPlayGamesActionStatus.unavailable,
      diagnosticCode: 'feature_id_missing',
    ),
    this.leaderboardsResult = const MergeRelayPlayGamesActionResult(
      status: MergeRelayPlayGamesActionStatus.unavailable,
      diagnosticCode: 'feature_id_missing',
    ),
  });

  MergeRelayPlayGamesState state;
  MergeRelayPlayGamesServerAccess serverAccess;
  MergeRelayPlayGamesActionResult achievementsResult;
  MergeRelayPlayGamesActionResult leaderboardsResult;
  Future<MergeRelayPlayGamesServerAccess>? serverAccessFuture;

  @override
  Future<MergeRelayPlayGamesState> initialize() async => state;

  @override
  Future<MergeRelayPlayGamesState> signIn() async => state;

  @override
  Future<MergeRelayPlayGamesServerAccess> requestServerAccess() async =>
      serverAccessFuture ?? Future.value(serverAccess);

  @override
  Future<MergeRelayPlayGamesActionResult> showAchievements() async =>
      achievementsResult;

  @override
  Future<MergeRelayPlayGamesActionResult> showLeaderboards() async =>
      leaderboardsResult;
}

Map<String, Object?> _stringMap(Object? value) {
  if (value is! Map) return const {};
  return {
    for (final entry in value.entries)
      if (entry.key is String) entry.key as String: entry.value,
  };
}

String _platformCode(String code) => switch (code) {
  'bridge_disposed' => 'bridge_disposed',
  _ => 'platform_error',
};
