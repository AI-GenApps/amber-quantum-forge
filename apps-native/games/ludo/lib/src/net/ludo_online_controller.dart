/// Orchestrates every online flow task 26's UI drives: room create/join and
/// random-matchmaking search. Pure net/domain layer — no widget or screen
/// type is imported here, so `home_lobby_screen.dart`/`mode_setup_sheet.dart`
/// (the only callers) own all navigation and `LudoLocalMatchConfig`/seat-
/// identity construction from the wire data this file hands back.
///
/// Matchmaking-search detection: `POST .../matchmaking/tickets`'s own
/// idempotent-replay lookup only ever finds a still-`searching` ticket (see
/// `matchmaking-service.ts`'s `createTicket` docstring), so a search polls
/// the ticket-status GET route this task adds
/// (`LudoGateway.getMatchmakingTicket`) instead. Room discovery mirrors the
/// same shape via `LudoGateway.getRoom` for the room *creator* waiting on
/// someone else to join (a joining caller gets `match_state` back
/// synchronously from `joinRoom` and never needs to poll).
library;

import 'dart:async';

import 'package:platform_core/platform_core.dart' show Clock, SystemClock;

import '../telemetry/ludo_telemetry.dart';
import 'ludo_auth_controller.dart';
import 'ludo_engine_state_codec.dart' show ludoSubjectIsBot;
import 'ludo_gateway.dart';
import 'ludo_match_models.dart' as ludo_wire;
import 'ludo_session_models.dart'
    show LudoMatchmakingTicketStatus, LudoRoomStatus;

int _idempotencyCounter = 0;

String _newIdempotencyKey(String prefix) {
  _idempotencyCounter += 1;
  return '$prefix-${DateTime.now().microsecondsSinceEpoch}-$_idempotencyCounter';
}

/// A room just created by this device, still `waiting` for someone else to
/// join it.
final class LudoCreatedRoom {
  const LudoCreatedRoom({
    required this.roomCode,
    required this.inviteLink,
    required this.mode,
    required this.seatTarget,
  });

  final String roomCode;
  final String inviteLink;
  final ludo_wire.LudoMode mode;
  final int seatTarget;
}

/// Everything needed to build an online match launch: the caller's own
/// seat and the wire match state a screen converts (via
/// `ludoEngineStateFromWire`) into the `ludo_rules` state
/// `GameBoardScreen.initialState` takes.
final class LudoOnlineMatchReadyResult {
  const LudoOnlineMatchReadyResult({
    required this.matchId,
    required this.gameToken,
    required this.wireMatchState,
    required this.localSeat,
  });

  final String matchId;
  final String gameToken;
  final ludo_wire.LudoMatchState wireMatchState;
  final int localSeat;
}

/// A cancelable, awaitable handle on a room-fill or matchmaking-search
/// wait: [result] resolves once matched, or throws if cancelled or the
/// wait otherwise failed (an expired room, a cancelled/expired ticket, a
/// network error) — every failure path is a normal, displayable UI state,
/// never an unhandled exception.
final class LudoOnlineWait {
  LudoOnlineWait._(this._onCancel);

  final Future<void> Function() _onCancel;
  final _completer = Completer<LudoOnlineMatchReadyResult>();
  bool _cancelled = false;

  /// The eventual outcome: the ready match, or a thrown error (including
  /// [StateError]("cancelled") if [cancel] was called first).
  Future<LudoOnlineMatchReadyResult> get result => _completer.future;

  /// Cancels this wait: stops polling and (for a matchmaking search) sends
  /// the ticket-cancel gateway call, so no ticket is left `searching` on
  /// the server. Safe to call more than once; a no-op once [result] has
  /// already resolved.
  Future<void> cancel() async {
    if (_cancelled || _completer.isCompleted) return;
    _cancelled = true;
    await _onCancel();
    if (!_completer.isCompleted) {
      _completer.completeError(StateError('cancelled'));
    }
  }

  void _complete(LudoOnlineMatchReadyResult value) {
    if (!_completer.isCompleted) _completer.complete(value);
  }

  void _fail(Object error) {
    if (!_completer.isCompleted) _completer.completeError(error);
  }
}

final class LudoOnlineController {
  LudoOnlineController({
    required this.gateway,
    required this.authController,
    required this.telemetry,
    this.pollInterval = const Duration(seconds: 2),
    Clock? clock,
  }) : clock = clock ?? const SystemClock();

  final LudoGateway gateway;
  final LudoAuthController authController;
  final LudoTelemetry telemetry;
  final Duration pollInterval;
  final Clock clock;

  Future<String> _gameToken() => authController.ensureGameToken();

  String get _subject {
    final state = authController.state;
    if (state == null) {
      throw StateError(
        "LudoAuthController.state is null — ensureGameToken() must "
        "succeed before reading the caller's own subject",
      );
    }
    return state.uid;
  }

  /// Creates a private room and records `ludo_room_created`. The returned
  /// [LudoCreatedRoom] is `waiting`; pass its `roomCode` to
  /// [awaitRoomFilled] to learn once another player joins.
  Future<LudoCreatedRoom> createRoom({
    required ludo_wire.LudoMode mode,
    required int seatTarget,
  }) async {
    final token = await _gameToken();
    final result = await gateway.createRoom(
      mode: mode,
      seatTarget: seatTarget,
      idempotencyKey: _newIdempotencyKey('room-create'),
      gameToken: token,
    );
    telemetry.roomCreated(mode: mode.toWire(), seatTarget: seatTarget);
    return LudoCreatedRoom(
      roomCode: result.room.roomCode,
      inviteLink: result.inviteLink,
      mode: mode,
      seatTarget: seatTarget,
    );
  }

  /// Joins an existing room by code, records `ludo_room_joined`, and
  /// returns the resulting match — always ready immediately (a room's
  /// underlying match is created on its first join and every join fills a
  /// seat, so `joinRoom` itself always returns a fresh `match_state`).
  Future<LudoOnlineMatchReadyResult> joinRoom({
    required String roomCode,
  }) async {
    final token = await _gameToken();
    final result = await gateway.joinRoom(
      roomCode: roomCode,
      idempotencyKey: _newIdempotencyKey('room-join'),
      gameToken: token,
    );
    telemetry.roomJoined(
      mode: result.room.mode.toWire(),
      seatTarget: result.room.seatTarget,
    );
    return LudoOnlineMatchReadyResult(
      matchId: result.matchState.matchId,
      gameToken: token,
      wireMatchState: result.matchState,
      localSeat: _seatForSubject(result.matchState),
    );
  }

  /// Polls `GET /rooms/:roomCode` until it is `matched` (resolves the
  /// returned wait) or [LudoOnlineWait.cancel] is called. A room has no
  /// cancel-on-server semantics (unlike a matchmaking ticket) — cancelling
  /// only stops this device's own poll loop; an unfilled room simply
  /// expires server-side per task 21's sweep.
  LudoOnlineWait awaitRoomFilled({required String roomCode}) {
    final wait = LudoOnlineWait._(() async {});
    unawaited(_pollRoom(roomCode: roomCode, wait: wait));
    return wait;
  }

  Future<void> _pollRoom({
    required String roomCode,
    required LudoOnlineWait wait,
  }) async {
    try {
      final token = await _gameToken();
      while (!wait._cancelled) {
        final room = await gateway.getRoom(
          roomCode: roomCode,
          gameToken: token,
        );
        if (room.status == LudoRoomStatus.matched && room.matchId != null) {
          final matchState = await gateway.getMatchState(
            matchId: room.matchId!,
            gameToken: token,
          );
          wait._complete(
            LudoOnlineMatchReadyResult(
              matchId: room.matchId!,
              gameToken: token,
              wireMatchState: matchState,
              localSeat: _seatForSubject(matchState),
            ),
          );
          return;
        }
        if (room.status == LudoRoomStatus.expired) {
          wait._fail(StateError('Room $roomCode expired before it filled'));
          return;
        }
        await Future<void>.delayed(pollInterval);
      }
    } on Object catch (error) {
      if (!wait._cancelled) wait._fail(error);
    }
  }

  /// Submits a matchmaking ticket, records `ludo_matchmaking_started`, and
  /// returns a wait handle: [LudoOnlineWait.cancel] sends the
  /// ticket-cancel gateway call, so no ticket is left `searching` on the
  /// server (this task's "no orphaned ticket state" acceptance criterion).
  LudoOnlineWait startMatchmaking({
    required ludo_wire.LudoMode mode,
    required int seatTarget,
  }) {
    late final LudoOnlineWait wait;
    String? ticketId;
    wait = LudoOnlineWait._(() async {
      final id = ticketId;
      if (id == null) return;
      final token = await _gameToken();
      await gateway.cancelMatchmakingTicket(ticketId: id, gameToken: token);
    });
    unawaited(
      _runMatchmaking(
        mode: mode,
        seatTarget: seatTarget,
        wait: wait,
        onTicketCreated: (id) => ticketId = id,
      ),
    );
    return wait;
  }

  Future<void> _runMatchmaking({
    required ludo_wire.LudoMode mode,
    required int seatTarget,
    required LudoOnlineWait wait,
    required void Function(String ticketId) onTicketCreated,
  }) async {
    final startedAt = clock.now();
    try {
      final token = await _gameToken();
      final created = await gateway.createMatchmakingTicket(
        mode: mode,
        seatTarget: seatTarget,
        idempotencyKey: _newIdempotencyKey('ticket-create'),
        gameToken: token,
      );
      onTicketCreated(created.ticket.ticketId);
      if (wait._cancelled) return;
      telemetry.matchmakingStarted(mode: mode.toWire(), seatTarget: seatTarget);

      while (!wait._cancelled) {
        final ticket = await gateway.getMatchmakingTicket(
          ticketId: created.ticket.ticketId,
          gameToken: token,
        );
        if (ticket.status == LudoMatchmakingTicketStatus.matched &&
            ticket.matchedMatchId != null) {
          final matchState = await gateway.getMatchState(
            matchId: ticket.matchedMatchId!,
            gameToken: token,
          );
          final botCount = matchState.players
              .where((player) => ludoSubjectIsBot(player.subject))
              .length;
          telemetry.matchmakingMatched(
            mode: mode.toWire(),
            seatCount: matchState.players.length,
            searchDuration: clock.now().difference(startedAt),
          );
          if (botCount > 0) {
            telemetry.botFillTriggered(mode: mode.toWire(), botCount: botCount);
          }
          wait._complete(
            LudoOnlineMatchReadyResult(
              matchId: ticket.matchedMatchId!,
              gameToken: token,
              wireMatchState: matchState,
              localSeat: _seatForSubject(matchState),
            ),
          );
          return;
        }
        if (ticket.status == LudoMatchmakingTicketStatus.cancelled ||
            ticket.status == LudoMatchmakingTicketStatus.expired) {
          wait._fail(StateError('Matchmaking ticket ${ticket.status.name}'));
          return;
        }
        await Future<void>.delayed(pollInterval);
      }
    } on Object catch (error) {
      if (!wait._cancelled) wait._fail(error);
    }
  }

  int _seatForSubject(ludo_wire.LudoMatchState wireMatchState) {
    final subject = _subject;
    for (final player in wireMatchState.players) {
      if (player.subject == subject) return player.seat;
    }
    throw StateError('Local subject $subject is not seated in this match');
  }
}
