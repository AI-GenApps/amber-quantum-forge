import 'dart:convert';
import 'dart:io';

import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_network_test_support.dart';

const _fixtureDir = '../../../packages/api/src/games/merge-relay/fixtures';

typedef Json = Map<String, Object?>;
typedef GatewayCall = Future<Object?> Function(MergeRelayHttpGateway gateway);

Json _load(String name) =>
    jsonDecode(File('$_fixtureDir/$name').readAsStringSync()) as Json;

Json loadRouteFixture() => _load('merge-relay-v1-http.json');

Json loadRouteMatrix() => _load('merge-relay-v1-http-matrix.json');

Object? deepCopy(Object? value) => jsonDecode(jsonEncode(value));

MergeRelayHttpGateway gatewayFor(Object? body, int status) =>
    MergeRelayHttpGateway(
      config: MergeRelayNetworkConfig(
        apiBaseUri: Uri.parse('https://relay.example/api/'),
        environment: 'debug',
      ),
      transport: FixtureTransport({
        '': fixtureResponse(body, statusCode: status),
      }),
      authStore: MemoryMergeRelayAuthStore()..accessToken = 'guest-token',
    );

final class RouteCase {
  const RouteCase(this.name, this.status, this.body, this.call);

  final String name;
  final int status;
  final Json body;
  final GatewayCall call;
}

String _id(Json body, String key, [String? nested]) {
  final data = body['data']! as Json;
  final source = nested == null ? data : data[nested]! as Json;
  return source[key]! as String;
}

MergeCheckpoint _provisioned(Json body) => MergeCheckpoint.fromJson(
  (((body['data']! as Json)['challenge']! as Json)['checkpoint']! as Map)
      .cast<String, Object?>(),
);

MergeCheckpoint _checkpoint([List<int>? board]) => MergeCheckpoint.fromState(
  MergeGameState(
    board: MergeBoard(board ?? [2, 2, ...List<int>.filled(14, 0)]),
    score: 0,
    moveCount: 0,
    seed: 7,
    rngState: 123,
  ),
);

const _terminalBoard = [4, 8, 4, 8, 8, 4, 8, 4, 4, 8, 4, 8, 8, 4, 16, 16];

GatewayCall _create(
  String key,
  MergeRelayMode mode, {
  String? parent,
  List<int>? board,
  Json? provisioned,
}) =>
    (gateway) => gateway.createChallenge(
      MergeRelayChallengeRequest(
        idempotencyKey: key,
        creatorAlias: 'Ada',
        checkpoint: provisioned == null
            ? _checkpoint(board)
            : _provisioned(provisioned),
        mode: mode,
        parentChallengeId: parent,
      ),
    );

GatewayCall _finalize(Json body, {bool early = false, String? alias}) {
  final attempt = _attemptFor(body);
  return (gateway) => gateway.finalizeAttempt(
    attempt,
    MergeRelayFinalizeRequest(
      idempotencyKey: 'fixture',
      finishEarly: early,
      returnAlias: alias,
    ),
  );
}

String _attemptFor(Json body) {
  final result = (body['data']! as Json)['result']! as Json;
  return result['attempt_id']! as String;
}

List<RouteCase> routeCases() {
  final http = loadRouteFixture();
  final matrix = loadRouteMatrix();
  final outcomes = (matrix['outcomes']! as Json).cast<String, Json>();
  final cases = <RouteCase>[];
  void add(String name, int status, Json body, GatewayCall call) =>
      cases.add(RouteCase(name, status, body, call));
  final rootId = _id(
    http['create_challenge']! as Json,
    'challenge_id',
    'challenge',
  );

  add(
    'create_challenge',
    201,
    http['create_challenge']! as Json,
    _create(
      'fixture-create',
      MergeRelayMode.daily,
      provisioned: http['create_challenge']! as Json,
    ),
  );
  add(
    'resolve_challenge',
    200,
    http['resolve_challenge']! as Json,
    (g) => g.resolveChallenge(rootId),
  );
  add(
    'reserve_attempt',
    201,
    http['reserve_attempt']! as Json,
    (g) => g.reserveAttempt(rootId, 'fixture-reservation'),
  );
  add(
    'submit_moves',
    200,
    http['submit_moves']! as Json,
    (g) => g.submitMoves(
      'att_fixture_1',
      MergeRelayMoveRequest(expectedVersion: 0, moves: [MergeDirection.left]),
    ),
  );
  add(
    'finalize_attempt',
    200,
    http['finalize_attempt']! as Json,
    _finalize(http['finalize_attempt']! as Json, early: true),
  );
  add('daily', 200, http['daily']! as Json, (g) => g.getDaily('2026-01-01'));

  final creates = <String, (MergeRelayMode, String?, List<int>?)>{
    'create_rescue': (MergeRelayMode.rescue, null, null),
    'create_replay': (MergeRelayMode.rescue, null, null),
    'create_daily_origin': (MergeRelayMode.daily, null, null),
    'create_endless_origin': (MergeRelayMode.endless, null, null),
    'create_child': (MergeRelayMode.rescue, 'ch_fixture_1', null),
    'create_near_terminal': (MergeRelayMode.rescue, null, _terminalBoard),
  };
  creates.forEach(
    (name, spec) => add(
      name,
      201,
      outcomes[name]!,
      _create(
        name,
        spec.$1,
        parent: spec.$2,
        board: spec.$3,
        provisioned: name == 'create_daily_origin' ? outcomes[name] : null,
      ),
    ),
  );
  add(
    'reserve_attempt_outcome',
    201,
    outcomes['reserve_attempt']!,
    (g) => g.reserveAttempt(rootId, 'outcome-reserve'),
  );
  add(
    'submit_to_terminal',
    200,
    outcomes['submit_to_terminal']!,
    (g) => g.submitMoves(
      _id(outcomes['submit_to_terminal']!, 'attempt_id', 'attempt'),
      MergeRelayMoveRequest(expectedVersion: 0, moves: [MergeDirection.left]),
    ),
  );
  add(
    'challenge_private',
    200,
    outcomes['challenge_private']!,
    (g) => g.getChallenge(rootId),
  );
  add(
    'challenge_retired',
    200,
    outcomes['challenge_retired']!,
    (g) => g.getChallenge(
      _id(outcomes['challenge_retired']!, 'challenge_id', 'challenge'),
    ),
  );
  add(
    'reserve_replay',
    201,
    outcomes['reserve_replay']!,
    (g) => g.reserveAttempt(rootId, 'outcome-reserve'),
  );
  add(
    'attempt_private',
    200,
    outcomes['attempt_private']!,
    (g) => g.getAttempt('att_fixture_1'),
  );
  add(
    'submit_three_moves',
    200,
    outcomes['submit_three_moves']!,
    (g) => g.submitMoves(
      'att_fixture_1',
      MergeRelayMoveRequest(
        expectedVersion: 0,
        moves: [MergeDirection.left, MergeDirection.down, MergeDirection.right],
      ),
    ),
  );
  for (final name in [
    'finalize_complete_with_return',
    'finalize_replay',
    'finalize_terminal',
    'finalize_early_finish',
  ]) {
    add(name, 200, outcomes[name]!, _finalize(outcomes[name]!, early: true));
  }
  for (final name in ['result_private', 'result_owner_view']) {
    add(
      name,
      200,
      outcomes[name]!,
      (g) => g.getResult(_id(outcomes[name]!, 'result_id', 'result')),
    );
  }
  return cases;
}
