// Tests for task 26x's debug-only online preview mode
// (`ludo_preview_online.dart`): every scripted transition below still runs
// on a real `Timer` (never a manual/fake-clock tick, per this task's own
// Context/Decisions) — these tests just use millisecond-scale delays
// instead of the real device-walkthrough pacing so each case stays fast.
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_match_models.dart' show LudoMode;
import 'package:ludo/src/net/ludo_match_state_source.dart';
import 'package:ludo/src/net/ludo_preview_online.dart';
import 'package:ludo/src/net/ludo_wire_json.dart';

const _fastDelay = Duration(milliseconds: 30);

void main() {
  test('creating a room, waiting, and having a simulated friend join reaches '
      'a ready match', () async {
    final client = createLudoPreviewOnlineClient(
      roomFillDelay: _fastDelay,
      matchmakingDelay: _fastDelay,
    );
    final created = await client.onlineController.createRoom(
      mode: LudoMode.fromWire('classic'),
      seatTarget: 2,
    );
    expect(created.roomCode, isNotEmpty);
    expect(created.inviteLink, contains(created.roomCode));

    final wait = client.onlineController.awaitRoomFilled(
      roomCode: created.roomCode,
    );
    final ready = await wait.result;
    expect(ready.wireMatchState.players, hasLength(2));
    expect(ready.localSeat, 0);
  });

  test('joining an unknown room code surfaces the not-found error', () async {
    final client = createLudoPreviewOnlineClient();
    await expectLater(
      client.onlineController.joinRoom(roomCode: ludoPreviewInvalidRoomCode),
      throwsA(
        isA<LudoApiException>().having(
          (e) => e.code,
          'code',
          'ludo_room_not_found',
        ),
      ),
    );
  });

  test(
    'joining the scripted expired room code surfaces the expired error',
    () async {
      final client = createLudoPreviewOnlineClient();
      await expectLater(
        client.onlineController.joinRoom(roomCode: ludoPreviewExpiredRoomCode),
        throwsA(
          isA<LudoApiException>().having(
            (e) => e.code,
            'code',
            'ludo_room_expired',
          ),
        ),
      );
    },
  );

  test('joining a fresh room code reaches a ready 2-seat match', () async {
    final client = createLudoPreviewOnlineClient();
    final ready = await client.onlineController.joinRoom(roomCode: 'FRESH01');
    expect(ready.wireMatchState.players, hasLength(2));
  });

  test('a matchmaking search resolves to a ready match after the scripted '
      'delay, either with a human opponent or a bot-filled seat', () async {
    final client = createLudoPreviewOnlineClient(
      roomFillDelay: _fastDelay,
      matchmakingDelay: _fastDelay,
    );
    final wait = client.onlineController.startMatchmaking(
      mode: LudoMode.fromWire('classic'),
      seatTarget: 4,
    );
    final ready = await wait.result;
    expect(ready.wireMatchState.players, hasLength(4));
  });

  test('a cancelled matchmaking search never resolves as matched', () async {
    final client = createLudoPreviewOnlineClient(
      roomFillDelay: _fastDelay,
      matchmakingDelay: _fastDelay,
    );
    final wait = client.onlineController.startMatchmaking(
      mode: LudoMode.fromWire('classic'),
      seatTarget: 4,
    );
    await wait.cancel();
    await expectLater(wait.result, throwsA(isA<StateError>()));
  });

  test('a preview match\'s /state polling delivers turn hand-offs and a '
      'one-time disconnect/reconnect blip (task 26x)', () async {
    // Regression coverage for the bug this task's own device walkthrough
    // surfaced: `_getMatchView` previously returned its view fields at
    // the response body's top level instead of nested under a
    // `match_view` key, so `LudoGateway.getMatchView` threw on *every*
    // poll — silently, since `PollingMatchStateSource._tick` swallows
    // fetch failures — meaning a preview match's board never actually
    // received a single live `/state` update (no turn hand-off, no
    // server-driven timer deadline) after its initial snapshot. This
    // test drives `createLudoMatchStateSource` (the same factory
    // `home_lobby_screen.dart` uses for a real online match) against the
    // preview transport directly, so a regression here fails loudly
    // instead of being swallowed again.
    final client = createLudoPreviewOnlineClient(
      roomFillDelay: _fastDelay,
      matchmakingDelay: _fastDelay,
      pollInterval: const Duration(milliseconds: 15),
    );
    final wait = client.onlineController.startMatchmaking(
      mode: LudoMode.fromWire('classic'),
      seatTarget: 2,
    );
    final ready = await wait.result;

    final source = createLudoMatchStateSource(
      gateway: client.gateway,
      appId: 'ludo',
      environment: 'debug',
      matchId: ready.matchId,
      gameToken: ready.gameToken,
      pollInterval: const Duration(milliseconds: 15),
    );
    addTearDown(source.dispose);

    final connectedEvents = <bool>[];
    final connectedSub = source.connected.listen(connectedEvents.add);
    addTearDown(connectedSub.cancel);

    var sawTurnAdvance = false;
    final firstPlayerIndex = ready.wireMatchState.currentPlayerIndex;
    final statesSub = source.states.listen((view) {
      if (view.matchState.currentPlayerIndex != firstPlayerIndex) {
        sawTurnAdvance = true;
      }
    });
    addTearDown(statesSub.cancel);

    // pollCount 5 triggers the blip, 6 the second failure, 7 recovers;
    // pollCount 3/6/9... advance the turn — comfortably reached well
    // within this wait at a 15ms poll interval.
    await Future<void>.delayed(const Duration(milliseconds: 400));

    expect(
      sawTurnAdvance,
      isTrue,
      reason:
          'a live /state update must actually reach the board — this is '
          'exactly what silently never happened before the match_view '
          'wrapper fix',
    );
    expect(
      connectedEvents,
      [false, true],
      reason:
          'exactly one disconnect/reconnect blip, never a permanent '
          'reconnecting state',
    );
  });
}
