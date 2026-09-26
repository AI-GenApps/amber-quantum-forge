// Tests for task 25's online match-state sources: `PollingMatchStateSource`
// fetching on a fixed interval, `FirestoreMatchStateSource` falling back to
// polling on a stream error (the core acceptance criterion — the board
// screen must never see which implementation is active), and
// `LudoOnlineMatchSession.quit()`'s surrender/claim-timeout branching.
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/net/ludo_match_state_source.dart';
import 'package:ludo/src/net/ludo_session_models.dart';

import 'ludo_test_support.dart';

Map<String, Object?> _fixture = {};

LudoNetworkConfig _config() => LudoNetworkConfig(
  apiBaseUri: Uri.parse('https://api.example.test/'),
  environment: 'debug',
);

/// Builds a `match_view` wire map from the shared match-state fixture, so
/// this file never hand-rolls a parallel match-state shape.
Map<String, Object?> _matchViewWire({String matchId = 'match-1'}) => {
  'match_id': matchId,
  'environment': 'debug',
  'match_state': {
    ...(_fixture['match_state'] as Map).cast<String, Object?>(),
    'match_id': matchId,
  },
  'recent_events': const <Object?>[],
  'published_at': '2026-01-01T00:00:02.000Z',
};

final class _FakeMatchDocumentWatcher implements LudoMatchDocumentWatcher {
  _FakeMatchDocumentWatcher(this.controller);

  final StreamController<Map<String, Object?>> controller;

  @override
  Stream<Map<String, Object?>> watch() => controller.stream;
}

void main() {
  setUpAll(() {
    final raw = File('test/fixtures/ludo_route_fixture.json')
        .readAsStringSync();
    _fixture = jsonDecode(raw) as Map<String, Object?>;
  });

  group('PollingMatchStateSource', () {
    test('fetches immediately and again on the next interval', () async {
      final transport = QueueLudoTransport({
        'GET matches/match-1/state': [
          jsonResponse({'match_view': _matchViewWire()}),
          jsonResponse({'match_view': _matchViewWire()}),
        ],
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final source = PollingMatchStateSource(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        pollInterval: const Duration(milliseconds: 20),
      );
      addTearDown(source.dispose);

      final views = <LudoMatchView>[];
      final subscription = source.states.listen(views.add);
      addTearDown(subscription.cancel);

      await Future<void>.delayed(const Duration(milliseconds: 80));
      expect(views, isNotEmpty);
      expect(views.first.matchId, 'match-1');
      expect(transport.requests.length, greaterThanOrEqualTo(2));
    });

    test('a failed fetch is swallowed, not thrown from the timer', () async {
      final transport = QueueLudoTransport({
        'GET matches/match-1/state': [
          jsonResponse(ludoFixtureError('internal_error'), statusCode: 500),
          jsonResponse({'match_view': _matchViewWire()}),
        ],
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final source = PollingMatchStateSource(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        pollInterval: const Duration(milliseconds: 20),
      );
      addTearDown(source.dispose);

      final views = <LudoMatchView>[];
      final subscription = source.states.listen(views.add);
      addTearDown(subscription.cancel);

      await Future<void>.delayed(const Duration(milliseconds: 80));
      // The first tick's 500 never reached the stream as an error; the
      // second tick's success did reach it as a value.
      expect(views, isNotEmpty);
    });

    test('refresh() fetches once and re-emits on states', () async {
      // Two queued fixtures: the constructor's own eager first fetch
      // consumes one, then the explicit refresh() call below consumes the
      // other — a 5-minute interval keeps the periodic timer from ever
      // firing during this test.
      final transport = QueueLudoTransport({
        'GET matches/match-1/state': [
          jsonResponse({'match_view': _matchViewWire()}),
          jsonResponse({'match_view': _matchViewWire()}),
        ],
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final source = PollingMatchStateSource(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        pollInterval: const Duration(minutes: 5),
      );
      addTearDown(source.dispose);

      final view = await source.refresh();
      expect(view.matchId, 'match-1');
    });
  });

  group('FirestoreMatchStateSource', () {
    test(
      'constructed unavailable delegates straight to the polling fallback',
      () async {
        final transport = QueueLudoTransport({
          'GET matches/match-1/state': [
            jsonResponse({'match_view': _matchViewWire()}),
          ],
        });
        final gateway = LudoGateway(config: _config(), transport: transport);
        final fallback = PollingMatchStateSource(
          gateway: gateway,
          matchId: 'match-1',
          gameToken: 'game-token',
          pollInterval: const Duration(minutes: 5),
        );
        final watcherController = StreamController<Map<String, Object?>>();
        addTearDown(() {
          unawaited(watcherController.close());
        });
        final source = FirestoreMatchStateSource(
          watcher: _FakeMatchDocumentWatcher(watcherController),
          fallback: fallback,
          firestoreAvailable: false,
        );
        addTearDown(source.dispose);

        expect(source.isOnFallbackForTest, isTrue);
        final views = <LudoMatchView>[];
        final subscription = source.states.listen(views.add);
        addTearDown(subscription.cancel);
        await Future<void>.delayed(const Duration(milliseconds: 40));
        expect(views, isNotEmpty);
      },
    );

    test('a Firestore stream value is decoded and forwarded as-is', () async {
      final transport = QueueLudoTransport({'GET matches/match-1/state': []});
      final gateway = LudoGateway(config: _config(), transport: transport);
      final fallback = PollingMatchStateSource(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        pollInterval: const Duration(minutes: 5),
      );
      final watcherController = StreamController<Map<String, Object?>>();
      addTearDown(() {
        unawaited(watcherController.close());
      });
      final source = FirestoreMatchStateSource(
        watcher: _FakeMatchDocumentWatcher(watcherController),
        fallback: fallback,
      );
      addTearDown(source.dispose);

      final views = <LudoMatchView>[];
      final subscription = source.states.listen(views.add);
      addTearDown(subscription.cancel);

      watcherController.add(_matchViewWire());
      await Future<void>.delayed(Duration.zero);

      expect(views, hasLength(1));
      expect(views.single.matchId, 'match-1');
      expect(source.isOnFallbackForTest, isFalse);
    });

    test('falls back to polling once the Firestore stream errors, without '
        'the caller needing to know the switch happened', () async {
      // Queued generously: the fallback starts polling immediately on
      // construction (in parallel with the still-healthy Firestore
      // listener, so it always has fresh data ready the moment a
      // fallback is needed) — that first tick's result is lost (no
      // subscriber yet), and every 20ms tick after it needs its own
      // fixture entry too.
      final transport = QueueLudoTransport({
        'GET matches/match-1/state': List.generate(
          8,
          (_) =>
              jsonResponse({'match_view': _matchViewWire(matchId: 'match-1')}),
        ),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final fallback = PollingMatchStateSource(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        pollInterval: const Duration(milliseconds: 20),
      );
      final watcherController = StreamController<Map<String, Object?>>();
      addTearDown(() {
        unawaited(watcherController.close());
      });
      final source = FirestoreMatchStateSource(
        watcher: _FakeMatchDocumentWatcher(watcherController),
        fallback: fallback,
      );
      addTearDown(source.dispose);

      final views = <LudoMatchView>[];
      final subscription = source.states.listen(views.add);
      addTearDown(subscription.cancel);

      expect(source.isOnFallbackForTest, isFalse);
      watcherController.addError(StateError('permission-denied'));
      await Future<void>.delayed(Duration.zero);
      expect(source.isOnFallbackForTest, isTrue);

      await Future<void>.delayed(const Duration(milliseconds: 150));
      expect(
        views,
        isNotEmpty,
        reason: 'polling fallback should have delivered at least one view',
      );
    });

    test('a malformed Firestore document is treated the same as a stream '
        'error and falls back rather than throwing', () async {
      final transport = QueueLudoTransport({
        'GET matches/match-1/state': [
          jsonResponse({'match_view': _matchViewWire()}),
        ],
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final fallback = PollingMatchStateSource(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        pollInterval: const Duration(milliseconds: 20),
      );
      final watcherController = StreamController<Map<String, Object?>>();
      addTearDown(() {
        unawaited(watcherController.close());
      });
      final source = FirestoreMatchStateSource(
        watcher: _FakeMatchDocumentWatcher(watcherController),
        fallback: fallback,
      );
      addTearDown(source.dispose);

      final errors = <Object>[];
      final subscription = source.states.listen((_) {}, onError: errors.add);
      addTearDown(subscription.cancel);

      watcherController.add(const {'not': 'a valid match view'});
      await Future<void>.delayed(const Duration(milliseconds: 60));

      expect(errors, isEmpty);
      expect(source.isOnFallbackForTest, isTrue);
    });

    test('refresh() always uses the ground-truth polling fetch', () async {
      // Two queued fixtures: the fallback's own eager first-tick fetch
      // (started in parallel the moment it's constructed, whether or not
      // Firestore is currently healthy) consumes one; the explicit
      // refresh() call below consumes the other.
      final transport = QueueLudoTransport({
        'GET matches/match-1/state': [
          jsonResponse({'match_view': _matchViewWire()}),
          jsonResponse({'match_view': _matchViewWire()}),
        ],
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final fallback = PollingMatchStateSource(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        pollInterval: const Duration(minutes: 5),
      );
      final source = FirestoreMatchStateSource(
        watcher: _FakeMatchDocumentWatcher(
          StreamController<Map<String, Object?>>(),
        ),
        fallback: fallback,
      );
      addTearDown(source.dispose);

      final view = await source.refresh();
      expect(view.matchId, 'match-1');
    });
  });

  group('LudoOnlineMatchSession.quit', () {
    test('surrenders when it is the local seat\'s own turn', () async {
      final transport = QueueLudoTransport({
        'POST matches/match-1/commands': [
          jsonResponse({
            'match_state': _fixture['match_state'],
            'idempotent': false,
          }),
        ],
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final fallback = PollingMatchStateSource(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        pollInterval: const Duration(minutes: 5),
      );
      final session = LudoOnlineMatchSession(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        localSeat: 0,
        stateSource: fallback,
      );
      addTearDown(session.dispose);

      await session.quit(
        currentPlayerIndex: 0,
        turnDeadline: DateTime.now().add(const Duration(seconds: 30)),
      );

      final sent = transport.requests.singleWhere(
        (r) => r.$1 == 'POST matches/match-1/commands',
      );
      final body = sent.$2 as Map<String, Object?>;
      expect(body['type'], 'surrender');
    });

    test('claims the opponent\'s timeout when it is not the local seat\'s '
        'turn and their deadline already passed', () async {
      final transport = QueueLudoTransport({
        'POST matches/match-1/commands': [
          jsonResponse({
            'match_state': _fixture['match_state'],
            'idempotent': false,
          }),
        ],
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final fallback = PollingMatchStateSource(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        pollInterval: const Duration(minutes: 5),
      );
      final session = LudoOnlineMatchSession(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        localSeat: 0,
        stateSource: fallback,
      );
      addTearDown(session.dispose);

      await session.quit(
        currentPlayerIndex: 1,
        turnDeadline: DateTime.now().subtract(const Duration(seconds: 5)),
      );

      final sent = transport.requests.singleWhere(
        (r) => r.$1 == 'POST matches/match-1/commands',
      );
      final body = sent.$2 as Map<String, Object?>;
      expect(body['type'], 'claim_timeout');
    });

    test('surrenders (not claim_timeout) when it is not the local seat\'s '
        'turn but their deadline has not passed yet', () async {
      final transport = QueueLudoTransport({
        'POST matches/match-1/commands': [
          jsonResponse({
            'match_state': _fixture['match_state'],
            'idempotent': false,
          }),
        ],
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final fallback = PollingMatchStateSource(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        pollInterval: const Duration(minutes: 5),
      );
      final session = LudoOnlineMatchSession(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token',
        localSeat: 0,
        stateSource: fallback,
      );
      addTearDown(session.dispose);

      await session.quit(
        currentPlayerIndex: 1,
        turnDeadline: DateTime.now().add(const Duration(seconds: 30)),
      );

      final sent = transport.requests.singleWhere(
        (r) => r.$1 == 'POST matches/match-1/commands',
      );
      final body = sent.$2 as Map<String, Object?>;
      expect(body['type'], 'surrender');
    });
  });
}
