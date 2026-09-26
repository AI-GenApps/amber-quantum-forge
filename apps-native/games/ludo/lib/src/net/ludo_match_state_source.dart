/// Online match-state sources (task 25): gives `game_board_screen.dart` a
/// single [LudoMatchStateSource] interface for an online match's live
/// state, whether the concrete implementation behind it is a
/// `cloud_firestore` snapshot listener ([FirestoreMatchStateSource]) or
/// plain HTTP polling of task 22's `GET
/// /games/ludo/:environment/matches/:matchId/state` fallback route
/// ([PollingMatchStateSource]) — the screen never branches on which one is
/// active.
///
/// [FirestoreMatchStateSource] itself owns a [PollingMatchStateSource] as
/// its fallback and switches to it (permanently, for that instance) the
/// moment Firestore is unavailable at construction time or its snapshot
/// stream ever errors — never surfacing that error to the screen. This
/// keeps the "degrade gracefully when Firebase isn't configured" guarantee
/// task 24 established for auth true for match state too.
library;

import 'dart:async';

import 'ludo_command_models.dart';
import 'ludo_firebase_gateway.dart' show ludoFirestoreAvailable, ludoFirestore;
import 'ludo_gateway.dart';
import 'ludo_session_models.dart' show LudoMatchView;

/// A match's live online state, sourced either from Firestore or HTTP
/// polling. Never emits a stream error on [states] — every failure is
/// absorbed internally (a bad tick is simply skipped, or the source falls
/// back to polling), so `game_board_screen.dart` is never asked to handle
/// a match-state stream throwing.
abstract interface class LudoMatchStateSource {
  /// Broadcast stream of every state update this source produces.
  Stream<LudoMatchView> get states;

  /// Fetches the latest match state once via the ground-truth HTTP route
  /// (task 22's polling fallback is documented as the ground truth the
  /// Firestore doc merely mirrors), independent of whichever stream is
  /// currently active. Used for reconnect-on-resume, so a caller can await
  /// a fresh state rather than trusting whatever [states] last delivered
  /// before the app was backgrounded. Also re-emitted on [states].
  Future<LudoMatchView> refresh();

  /// Releases every resource (timers, subscriptions) this source holds.
  /// Safe to call more than once.
  void dispose();
}

/// Polls `GET /games/ludo/:environment/matches/:matchId/state` on a fixed
/// interval. A failed fetch is swallowed (logged nowhere — this class has
/// no logger dependency — but never thrown from the timer callback) so a
/// single dropped network call doesn't tear down the poll loop; the next
/// tick simply tries again.
final class PollingMatchStateSource implements LudoMatchStateSource {
  PollingMatchStateSource({
    required LudoGateway gateway,
    required String matchId,
    required String gameToken,
    this.pollInterval = const Duration(seconds: 3),
  }) : _gateway = gateway,
       _matchId = matchId,
       _gameToken = gameToken {
    _timer = Timer.periodic(pollInterval, (_) => _tick());
    _tick();
  }

  final LudoGateway _gateway;
  final String _matchId;
  final String _gameToken;
  final Duration pollInterval;

  final _controller = StreamController<LudoMatchView>.broadcast();
  Timer? _timer;
  bool _disposed = false;

  @override
  Stream<LudoMatchView> get states => _controller.stream;

  Future<void> _tick() async {
    try {
      await refresh();
    } on Object {
      // Transient network failure: this tick produces no update, and the
      // next timer tick tries again. The board screen keeps showing its
      // last-known state rather than crashing.
    }
  }

  @override
  Future<LudoMatchView> refresh() async {
    final view = await _gateway.getMatchView(
      matchId: _matchId,
      gameToken: _gameToken,
    );
    if (!_disposed) _controller.add(view);
    return view;
  }

  @override
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _timer?.cancel();
    unawaited(_controller.close());
  }
}

/// Narrow watcher over a single Firestore document's snapshot stream,
/// abstracted so tests can inject a fake without a real `cloud_firestore`
/// platform channel (which doesn't exist in a `flutter test` host
/// process, per `ludo_firebase_gateway.dart`'s doc comment).
abstract interface class LudoMatchDocumentWatcher {
  /// Emits the document's decoded wire map every time it changes. Emits a
  /// stream error if the document doesn't exist yet, the listener errors,
  /// or Firestore itself is unreachable — [FirestoreMatchStateSource]
  /// treats any of these identically (fall back to polling).
  Stream<Map<String, Object?>> watch();
}

/// Production [LudoMatchDocumentWatcher], reading the exact document path
/// `packages/api/src/games/ludo/firestore-match-view-publisher.ts`
/// (`ludoMatchViewCollectionPath`) publishes to:
/// `games/{appId}/{environment}/matches/{matchId}`.
final class FirestoreLudoMatchDocumentWatcher
    implements LudoMatchDocumentWatcher {
  FirestoreLudoMatchDocumentWatcher({
    required this.appId,
    required this.environment,
    required this.matchId,
  });

  final String appId;
  final String environment;
  final String matchId;

  @override
  Stream<Map<String, Object?>> watch() {
    final doc = ludoFirestore()
        .collection('games/$appId/$environment/matches')
        .doc(matchId);
    return doc.snapshots().map((snapshot) {
      final data = snapshot.data();
      if (data == null) {
        throw StateError(
          'Ludo match-view document $matchId does not exist yet',
        );
      }
      return data;
    });
  }
}

/// A `cloud_firestore` snapshot listener on the match-view document,
/// falling back to HTTP polling ([fallback]) whenever Firestore is
/// unavailable at construction time or its stream errors. See this
/// library's doc comment.
final class FirestoreMatchStateSource implements LudoMatchStateSource {
  FirestoreMatchStateSource({
    required this.watcher,
    required this.fallback,
    bool firestoreAvailable = true,
  }) {
    if (firestoreAvailable) {
      _listen();
    } else {
      _useFallback();
    }
  }

  final LudoMatchDocumentWatcher watcher;
  final LudoMatchStateSource fallback;

  final _controller = StreamController<LudoMatchView>.broadcast();
  StreamSubscription<Map<String, Object?>>? _subscription;
  StreamSubscription<LudoMatchView>? _fallbackSubscription;
  bool _onFallback = false;
  bool _disposed = false;

  @override
  Stream<LudoMatchView> get states => _controller.stream;

  void _listen() {
    _subscription = watcher.watch().listen(
      (data) {
        if (_disposed || _onFallback) return;
        try {
          _controller.add(LudoMatchView.fromWire(data));
        } on Object {
          // A malformed document is treated the same as a stream error:
          // fall back rather than propagate a decode exception.
          _useFallback();
        }
      },
      onError: (Object _, StackTrace _) {
        if (!_disposed) _useFallback();
      },
      cancelOnError: true,
    );
  }

  void _useFallback() {
    if (_onFallback || _disposed) return;
    _onFallback = true;
    unawaited(_subscription?.cancel());
    _fallbackSubscription = fallback.states.listen((view) {
      if (!_disposed) _controller.add(view);
    });
  }

  /// Whether this source has fallen back to polling. Exposed for tests
  /// only — the screen never needs to know.
  bool get isOnFallbackForTest => _onFallback;

  @override
  Future<LudoMatchView> refresh() => fallback.refresh();

  @override
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    unawaited(_subscription?.cancel());
    unawaited(_fallbackSubscription?.cancel());
    fallback.dispose();
    unawaited(_controller.close());
  }
}

/// Builds the production online match-state source: Firestore-backed when
/// Firebase initialized successfully, plain polling otherwise. Always
/// constructs the [PollingMatchStateSource] fallback regardless (it is the
/// ground truth either way), and hands the caller a single object either
/// way.
LudoMatchStateSource createLudoMatchStateSource({
  required LudoGateway gateway,
  required String appId,
  required String environment,
  required String matchId,
  required String gameToken,
  Duration pollInterval = const Duration(seconds: 3),
}) {
  final polling = PollingMatchStateSource(
    gateway: gateway,
    matchId: matchId,
    gameToken: gameToken,
    pollInterval: pollInterval,
  );
  final available = ludoFirestoreAvailable();
  return FirestoreMatchStateSource(
    watcher: FirestoreLudoMatchDocumentWatcher(
      appId: appId,
      environment: environment,
      matchId: matchId,
    ),
    fallback: polling,
    firestoreAvailable: available,
  );
}

/// Everything `game_board_screen.dart` needs to drive an online match
/// beyond the state stream itself: enough gateway/identity plumbing to
/// send the surrender/claim-timeout command task 09 deferred to this
/// task's `PauseQuitDialog.onQuit` wiring.
final class LudoOnlineMatchSession {
  LudoOnlineMatchSession({
    required this.gateway,
    required this.matchId,
    required this.gameToken,
    required this.localSeat,
    required this.stateSource,
  });

  final LudoGateway gateway;
  final String matchId;
  final String gameToken;

  /// This device's own seat index (`players[seat]` on either the wire or
  /// engine match state).
  final int localSeat;

  final LudoMatchStateSource stateSource;

  /// Called from the pause/quit dialog's Quit action for an online match.
  /// Claims the opponent's timeout if it is *not* the local seat's turn
  /// and that turn's server deadline has already passed (ending the match
  /// in the local player's favor rather than framing it as their own
  /// surrender); sends an outright surrender otherwise. Takes only the
  /// primitives it needs (rather than a whole match-state object) because
  /// the caller's own state is shaped by whichever engine renders the
  /// board (`ludo_rules`'s `LudoMatchState`, not this library's wire DTO).
  Future<void> quit({
    required int currentPlayerIndex,
    required DateTime? turnDeadline,
  }) async {
    final opponentTurnExpired =
        currentPlayerIndex != localSeat &&
        turnDeadline != null &&
        DateTime.now().isAfter(turnDeadline);
    final command = opponentTurnExpired
        ? LudoClaimTimeoutCommand(
            idempotencyKey: _newIdempotencyKey(),
            matchId: matchId,
          )
        : LudoSurrenderCommand(
            idempotencyKey: _newIdempotencyKey(),
            matchId: matchId,
          );
    await gateway.sendCommand(command: command, gameToken: gameToken);
  }

  void dispose() => stateSource.dispose();
}

int _idempotencyCounter = 0;

String _newIdempotencyKey() {
  _idempotencyCounter += 1;
  return 'ludo-quit-${DateTime.now().microsecondsSinceEpoch}-$_idempotencyCounter';
}
