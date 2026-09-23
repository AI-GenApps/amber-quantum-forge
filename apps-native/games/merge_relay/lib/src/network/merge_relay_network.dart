import 'package:platform_core/platform_core.dart';

import '../merge_relay_gateway.dart';
import 'merge_relay_parsers.dart';
import 'merge_relay_parsers_data.dart';
import 'merge_relay_parsers_receipts.dart';
import 'merge_relay_pgs_parsers.dart';
import 'merge_relay_response_validation.dart';
import 'merge_relay_wire.dart';

export 'merge_relay_wire.dart'
    show MergeRelayApiException, MergeRelayProtocolException;
export 'merge_relay_response_validation.dart'
    show validateFinalizedResultCorrelation;
export 'merge_relay_save_receipts.dart'
    show
        MergeRelaySaveWriteReceipt,
        MergeRelaySaveWriteResult,
        mergeRelayCanonicalJson,
        mergeRelaySavePayloadFingerprint;

part 'merge_relay_network_operations.dart';
part 'merge_relay_network_pgs.dart';

abstract base class _MergeRelayHttpGatewayBase {
  _MergeRelayHttpGatewayBase({
    required this.config,
    required this.transport,
    required this.authStore,
    this.clock = const SystemClock(),
  });

  final MergeRelayNetworkConfig config;
  final MergeRelayHttpTransport transport;
  final MergeRelayAuthStore authStore;
  final Clock clock;

  Future<MergeRelayGuestSession> recoverGuest(String recoveryToken);

  Future<T> _request<T>({
    required String method,
    required String path,
    required T Function(MergeRelayJson data) parser,
    Object? body,
    bool authenticated = false,
    bool allowRecovery = true,
  }) async {
    final token = authenticated ? await authStore.readAccessToken() : null;
    if (authenticated && token == null) {
      throw const MergeRelayApiException(
        statusCode: 401,
        code: 'game_token_required',
        message: 'A verified game token is required',
        diagnosticId: 'client',
      );
    }
    final headers = <String, String>{
      'Accept': 'application/json',
      'X-App-Id': 'merge_relay',
      if (body != null) 'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
    final response = await transport.send(
      method: method,
      uri: config.endpoint(path),
      headers: headers,
      body: body,
      timeout: config.timeout,
      maxRequestBytes: config.maxRequestBytes,
      maxResponseBytes: config.maxResponseBytes,
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        return parser(
          decodeSuccessEnvelope(
            response.body,
            maxBytes: config.maxResponseBytes,
          ),
        );
      } on MergeRelayProtocolException {
        rethrow;
      } on Object {
        throw const MergeRelayProtocolException('Invalid Merge Relay response');
      }
    }
    final error = decodeApiError(response.statusCode, response.body);
    if (authenticated && allowRecovery && error.isUnauthorized) {
      final recovered = await _recoverExpiredGuest();
      if (recovered) {
        return _request(
          method: method,
          path: path,
          parser: parser,
          body: body,
          authenticated: true,
          allowRecovery: false,
        );
      }
      await authStore.clearAccessToken();
    }
    throw error;
  }

  Future<bool> _recoverExpiredGuest() async {
    final recoveryToken = await authStore.readRecoveryToken();
    if (recoveryToken == null) return false;
    try {
      final session = await recoverGuest(recoveryToken);
      return session.accessToken != null;
    } on Object {
      return false;
    }
  }
}

final class MergeRelayHttpGateway extends _MergeRelayHttpGatewayBase
    with _MergeRelayGatewayOperations, _MergeRelayPgsOperations
    implements MergeRelayGateway {
  MergeRelayHttpGateway({
    required super.config,
    required super.transport,
    required super.authStore,
    super.clock,
  });
}

Map<String, Object?> _challengeBody(MergeRelayChallengeRequest request) => {
  'idempotency_key': request.idempotencyKey,
  'creator_alias': request.creatorAlias,
  'checkpoint': MergeRelayCheckpoint.fromDomain(request.checkpoint)
      .toWireJson(),
  'mode': request.mode.name,
  if (request.maxLegalMoves != null) 'max_legal_moves': request.maxLegalMoves,
  if (request.contentId != null) 'content_id': request.contentId,
  if (request.contentVersion != null) 'content_version': request.contentVersion,
  if (request.parentChallengeId != null)
    'parent_challenge_id': request.parentChallengeId,
};

MergeRelayJson _nested(MergeRelayJson data, String name, Set<String> fields) {
  requireFields(data, fields, name);
  return data;
}

String _pathId(String value, String name) {
  validateId(value, name);
  return Uri.encodeComponent(value);
}

String _requestKey(String value, String name) {
  if (value.isEmpty ||
      value.length > 128 ||
      !RegExp(r'^[A-Za-z0-9._:-]+$').hasMatch(value)) {
    throw ArgumentError.value(value, name);
  }
  return value;
}

String _datePath(String value) {
  if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(value)) {
    throw ArgumentError.value(value, 'date');
  }
  final parsed = DateTime.tryParse('${value}T00:00:00Z');
  if (parsed == null ||
      parsed.toUtc().toIso8601String().substring(0, 10) != value) {
    throw ArgumentError.value(value, 'date');
  }
  return value;
}
