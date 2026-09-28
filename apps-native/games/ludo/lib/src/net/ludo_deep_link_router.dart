/// Bridges a routed room-invite code (parsed by [parseLudoRoomInviteCode]
/// from either a cold-launch `initialLink()` or a warm-start `onLink`
/// event) to whichever `HomeLobbyScreen` instance is currently mounted,
/// without `main.dart` (which resolves the link, outside the widget tree)
/// depending on the widget tree, and without `HomeLobbyScreen` depending on
/// `main.dart`'s bootstrap sequence (task 26x).
///
/// [routeRoomCode] is safe to call before any screen has registered a
/// handler (the common cold-launch race: the link resolves before
/// `HomeLobbyScreen.initState` runs) — the code is held as [_pending] and
/// delivered to the next [register] call instead of being dropped.
library;

/// Process-wide singleton; a plain `final class` (not a `Provider`/
/// `InheritedWidget`) since exactly one thing routes into it
/// (`wireLudoDeepLinks`) and exactly one thing ever listens
/// (`HomeLobbyScreen`) — see this file's doc comment.
final class LudoDeepLinkRouter {
  LudoDeepLinkRouter._();

  static final LudoDeepLinkRouter instance = LudoDeepLinkRouter._();

  void Function(String roomCode)? _handler;
  String? _pending;

  /// Registers the handler a mounted `HomeLobbyScreen` invokes a routed
  /// room code with. Pass `null` on dispose to stop receiving codes (a
  /// code routed while unregistered is held, not delivered to a stale
  /// handler). Registering a non-null handler while a code is already
  /// pending (from a cold-launch link resolved before this screen mounted)
  /// delivers it immediately.
  void register(void Function(String roomCode)? handler) {
    _handler = handler;
    final pending = _pending;
    if (handler != null && pending != null) {
      _pending = null;
      handler(pending);
    }
  }

  /// Routes a room code from either the cold-launch or warm-start path.
  /// Delivered immediately if a handler is registered, held as [_pending]
  /// (replacing any earlier still-undelivered code) otherwise.
  void routeRoomCode(String roomCode) {
    final handler = _handler;
    if (handler != null) {
      handler(roomCode);
    } else {
      _pending = roomCode;
    }
  }

  /// Test-only reset between cases; production code never calls this.
  void resetForTesting() {
    _handler = null;
    _pending = null;
  }
}
