// Fixture-based tests for `LudoGateway`: never touches the network (a
// [FixtureLudoTransport]/[QueueLudoTransport] stands in for the real
// `dart:io` transport), and every response decoded here is built from
// `test/fixtures/ludo_route_fixture.json` — a field-for-field copy of the
// server-side fixture data in `packages/api/src/games/ludo/
// contract-regressions.test.ts`/`routes.test.ts` — so a server-side field
// rename would fail this test's decode rather than only `apps/web`'s
// TypeScript build.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_command_models.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/net/ludo_match_models.dart';
import 'package:ludo/src/net/ludo_session_models.dart';
import 'package:ludo/src/net/ludo_wire_json.dart';

import 'ludo_test_support.dart';

Map<String, Object?> _fixture = {};

Map<String, Object?> _envelope(String key) =>
    (_fixture[key] as Map).cast<String, Object?>();

LudoNetworkConfig _config() => LudoNetworkConfig(
  apiBaseUri: Uri.parse('https://api.example.test/'),
  environment: 'debug',
);

void main() {
  setUpAll(() {
    final raw = File('test/fixtures/ludo_route_fixture.json')
        .readAsStringSync();
    _fixture = jsonDecode(raw) as Map<String, Object?>;
  });

  group('LudoGateway request shaping', () {
    test(
      'exchangeFirebaseIdToken posts idToken to /api/auth/exchange',
      () async {
        final transport = FixtureLudoTransport({
          'POST api/auth/exchange': jsonResponse(
            _envelope('auth_exchange_response'),
          ),
        });
        final gateway = LudoGateway(config: _config(), transport: transport);
        final result = await gateway.exchangeFirebaseIdToken(
          'firebase-id-token',
        );
        expect(result.accessToken, 'fixture-access-token');
        expect(result.refreshToken, 'fixture-refresh-token');
        expect(result.uid, 'player-a');
        final sent = transport.requests.single;
        expect(sent.$1, 'POST api/auth/exchange');
        expect(sent.$2, {'idToken': 'firebase-id-token'});
      },
    );

    test(
      'refreshApiAccessToken decodes a response with no user field',
      () async {
        final transport = FixtureLudoTransport({
          'POST api/auth/refresh': jsonResponse(
            _envelope('auth_refresh_response'),
          ),
        });
        final gateway = LudoGateway(config: _config(), transport: transport);
        final result = await gateway.refreshApiAccessToken('old-refresh-token');
        expect(result.accessToken, 'fixture-access-token-2');
        expect(result.uid, isNull);
      },
    );

    test(
      'exchangeSession sends the API access token as Authorization',
      () async {
        final responses = QueueLudoTransport({
          'POST session': [jsonResponse(_envelope('session_response'))],
        });
        final gateway = LudoGateway(config: _config(), transport: responses);
        final result = await gateway.exchangeSession(
          apiAccessToken: 'api-access-token',
        );
        expect(result.gameToken, 'fixture-game-token');
        expect(result.subject, 'player-a');
        expect(result.expiresIn, 300);
        expect(responses.requests.single.$3, 'Bearer api-access-token');
      },
    );

    test(
      'createMatch posts the create_match command and decodes match_state',
      () async {
        final transport = FixtureLudoTransport({
          'POST matches': jsonResponse({
            'match_state': _envelope('match_state'),
            'idempotent': false,
          }),
        });
        final gateway = LudoGateway(config: _config(), transport: transport);
        final result = await gateway.createMatch(
          command: const LudoCreateMatchCommand(
            idempotencyKey: 'idem-1',
            mode: LudoMode.quick,
            seats: 4,
          ),
          gameToken: 'game-token',
        );
        expect(result.idempotent, isFalse);
        expect(result.matchState.matchId, 'match-1');
        expect(result.matchState.mode, LudoMode.quick);
        expect(result.matchState.players, hasLength(2));
        expect(result.matchState.players.first.tokens.first.pathPosition, -1);
        final sentBody = transport.requests.single.$2 as Map;
        expect(sentBody['type'], 'create_match');
        expect(sentBody['idempotency_key'], 'idem-1');
        expect(sentBody['mode'], 'quick');
        expect(sentBody['seats'], 4);
      },
    );

    test('getMatchState decodes a plain match_state response', () async {
      final transport = FixtureLudoTransport({
        'GET matches/match-1': jsonResponse({
          'match_state': _envelope('match_state'),
        }),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final state = await gateway.getMatchState(
        matchId: 'match-1',
        gameToken: 'game-token',
      );
      expect(state.status, LudoMatchStatus.active);
      expect(state.winnerOrder, isEmpty);
      expect(state.deadlineAt, '2026-01-01T00:00:30.000Z');
    });

    test('getMatchView decodes match_state plus recent_events', () async {
      final transport = FixtureLudoTransport({
        'GET matches/match-1/state': jsonResponse({
          'match_view': {
            'match_id': 'match-1',
            'environment': 'debug',
            'match_state': _envelope('match_state'),
            'recent_events': _fixture['events'],
            'published_at': '2026-01-01T00:00:02.000Z',
          },
        }),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final view = await gateway.getMatchView(
        matchId: 'match-1',
        gameToken: 'game-token',
      );
      expect(view.recentEvents, hasLength(12));
      expect(view.recentEvents.first.type, 'dice_rolled');
      expect(view.recentEvents.last.type, 'match_abandoned');
      expect(view.publishedAt, '2026-01-01T00:00:02.000Z');
    });

    test('sendCommand posts roll_dice to matches/:id/commands', () async {
      final transport = FixtureLudoTransport({
        'POST matches/match-1/commands': jsonResponse({
          'match_state': _envelope('match_state'),
          'idempotent': true,
        }),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final result = await gateway.sendCommand(
        command: const LudoRollDiceCommand(
          idempotencyKey: 'idem-2',
          matchId: 'match-1',
        ),
        gameToken: 'game-token',
      );
      expect(result.idempotent, isTrue);
      final sentBody = transport.requests.single.$2 as Map;
      expect(sentBody['type'], 'roll_dice');
      expect(sentBody['match_id'], 'match-1');
    });

    test(
      'createMatchmakingTicket posts mode/seat_target/idempotency_key',
      () async {
        final transport = FixtureLudoTransport({
          'POST matchmaking/tickets': jsonResponse({
            'ticket': _envelope('matchmaking_ticket'),
            'idempotent': false,
          }),
        });
        final gateway = LudoGateway(config: _config(), transport: transport);
        final result = await gateway.createMatchmakingTicket(
          mode: LudoMode.classic,
          seatTarget: 4,
          idempotencyKey: 'idem-3',
          gameToken: 'game-token',
        );
        expect(result.ticket.ticketId, 'ticket-1');
        expect(result.ticket.status, LudoMatchmakingTicketStatus.searching);
        final sentBody = transport.requests.single.$2 as Map;
        expect(sentBody, {
          'mode': 'classic',
          'seat_target': 4,
          'idempotency_key': 'idem-3',
        });
      },
    );

    test(
      'cancelMatchmakingTicket sends DELETE and decodes the ticket',
      () async {
        final transport = FixtureLudoTransport({
          'DELETE matchmaking/tickets/ticket-1': jsonResponse({
            'ticket': _envelope('matchmaking_ticket'),
          }),
        });
        final gateway = LudoGateway(config: _config(), transport: transport);
        final ticket = await gateway.cancelMatchmakingTicket(
          ticketId: 'ticket-1',
          gameToken: 'game-token',
        );
        expect(ticket.ticketId, 'ticket-1');
      },
    );

    test('getMatchmakingTicket sends GET and decodes the ticket', () async {
      final transport = FixtureLudoTransport({
        'GET matchmaking/tickets/ticket-1': jsonResponse({
          'ticket': _envelope('matchmaking_ticket'),
        }),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final ticket = await gateway.getMatchmakingTicket(
        ticketId: 'ticket-1',
        gameToken: 'game-token',
      );
      expect(ticket.ticketId, 'ticket-1');
      expect(ticket.status, LudoMatchmakingTicketStatus.searching);
    });

    test('createRoom decodes room + invite_link', () async {
      final transport = FixtureLudoTransport({
        'POST rooms': jsonResponse({
          'room': _envelope('room'),
          'invite_link': 'w3dev-ludo://room/ABC123',
          'idempotent': false,
        }),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final result = await gateway.createRoom(
        mode: LudoMode.classic,
        seatTarget: 4,
        idempotencyKey: 'idem-4',
        gameToken: 'game-token',
      );
      expect(result.room.roomCode, 'ABC123');
      expect(result.inviteLink, 'w3dev-ludo://room/ABC123');
    });

    test('getRoom sends GET and decodes the room', () async {
      final transport = FixtureLudoTransport({
        'GET rooms/ABC123': jsonResponse({'room': _envelope('room')}),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final room = await gateway.getRoom(
        roomCode: 'ABC123',
        gameToken: 'game-token',
      );
      expect(room.roomCode, 'ABC123');
    });

    test('joinRoom decodes room + match_state', () async {
      final transport = FixtureLudoTransport({
        'POST rooms/ABC123/join': jsonResponse({
          'room': _envelope('room'),
          'match_state': _envelope('match_state'),
          'idempotent': false,
        }),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final result = await gateway.joinRoom(
        roomCode: 'ABC123',
        idempotencyKey: 'idem-5',
        gameToken: 'game-token',
      );
      expect(result.room.roomCode, 'ABC123');
      expect(result.matchState.matchId, 'match-1');
    });
  });

  group('LudoGateway error decoding', () {
    test('a non-2xx response decodes into a LudoApiException', () async {
      final transport = FixtureLudoTransport({
        'GET matches/missing': jsonResponse(
          ludoFixtureError('ludo_match_not_found'),
          statusCode: 404,
        ),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      await expectLater(
        gateway.getMatchState(matchId: 'missing', gameToken: 'game-token'),
        throwsA(
          isA<LudoApiException>()
              .having((e) => e.statusCode, 'statusCode', 404)
              .having((e) => e.code, 'code', 'ludo_match_not_found'),
        ),
      );
    });

    test('a 401 response is flagged isUnauthorized', () async {
      final transport = FixtureLudoTransport({
        'GET matches/match-1': jsonResponse(
          ludoFixtureError('ludo_authentication_required'),
          statusCode: 401,
        ),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      await expectLater(
        gateway.getMatchState(matchId: 'match-1', gameToken: 'stale-token'),
        throwsA(
          isA<LudoApiException>().having(
            (e) => e.isUnauthorized,
            'isUnauthorized',
            true,
          ),
        ),
      );
    });

    test('a malformed success body throws LudoProtocolException', () async {
      final transport = FixtureLudoTransport({
        'GET matches/match-1': jsonResponse({'unexpected': true}),
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      await expectLater(
        gateway.getMatchState(matchId: 'match-1', gameToken: 'game-token'),
        throwsA(isA<LudoProtocolException>()),
      );
    });
  });
}
