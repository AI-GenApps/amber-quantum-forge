/// Deep-link handling for shared room invites (task 26): parses the
/// `w3dev-ludo://room/<code>` scheme registry's `deepLink` namespace uses
/// (`LUDO_DEEP_LINK_SCHEME`/`ludoRoomInviteLink` in
/// `packages/api/src/games/ludo/contracts.ts`), and listens for incoming
/// links via [LudoDeepLinkGateway] — narrowed the same way
/// `ludo_firebase_gateway.dart` narrows `firebase_auth`/`firebase_core`, so
/// every other Ludo source depends only on this file's interface, never on
/// `package:app_links` directly.
///
/// [parseLudoRoomInviteCode] is the pure, fully-unit-testable half of this
/// file. [ProductionLudoDeepLinkGateway] is the narrow, guarded half: like
/// [ensureLudoFirebaseInitialized], [initialLink] swallows any
/// platform-channel failure rather than throwing.
///
/// [onLink] (the live-link stream) is deliberately **not** wired into any
/// screen by this task: `package:app_links`'s `uriLinkStream` getter
/// invokes an `EventChannel`, whose failed-`listen` case (no plugin
/// registered — the normal state of a `flutter test`/`testWidgets` host
/// process) is reported by the Flutter services binding directly via
/// `FlutterError.reportError` rather than through this stream's own
/// `onError` or any synchronously-catchable exception — so subscribing to
/// it from a widget constructed by *any* existing test (not just this
/// task's own) turns into a flaky, uncatchable test failure. The OS-level
/// half of deep-link handling (the Android intent-filter, the iOS
/// `CFBundleURLTypes` entry — both registered) is real and lets a tapped
/// invite cold-launch the app; wiring the still-running-app case (a link
/// tapped while the app is already open) needs a proper platform-channel
/// mock story across the whole test suite and is left for a follow-up
/// task rather than risking this one's test stability.
library;

import 'dart:async';

import 'package:app_links/app_links.dart' as app_links;

/// The deep-link scheme registered for Ludo (task 21's
/// `LUDO_DEEP_LINK_SCHEME`), mirrored here rather than imported since the
/// client has no dependency on `packages/api`.
const ludoDeepLinkScheme = 'w3dev-ludo';

/// Parses a shared room-invite link (`w3dev-ludo://room/<code>`) into its
/// room code, or `null` if [link] doesn't match that exact shape (wrong
/// scheme, wrong host, missing/extra path segments) — never throws on
/// malformed input, since an incoming link is untrusted external input.
/// The returned code is upper-cased (room codes are always upper-case
/// alphanumeric, per `packages/api/src/games/ludo/room-service.ts`), so a
/// lower-case link (some share targets normalize case) still matches.
String? parseLudoRoomInviteCode(String link) {
  final Uri uri;
  try {
    uri = Uri.parse(link);
  } on FormatException {
    return null;
  }
  if (uri.scheme != ludoDeepLinkScheme) return null;
  if (uri.host != 'room') return null;
  if (uri.pathSegments.length != 1) return null;
  final code = uri.pathSegments.single.trim();
  if (code.isEmpty) return null;
  return code.toUpperCase();
}

/// The narrow slice of `app_links`'s `AppLinks` Ludo depends on: the link
/// the app was launched from (if any), plus every link received while
/// already running.
abstract interface class LudoDeepLinkGateway {
  /// The link the app was cold-launched from, or `null` if none (the
  /// overwhelmingly common case) or if the platform channel is
  /// unavailable. Never throws.
  Future<Uri?> initialLink();

  /// Every link received while the app is already running. Never emits a
  /// stream error — a platform-channel failure closes this as an empty
  /// stream instead (see [ProductionLudoDeepLinkGateway]).
  Stream<Uri> get onLink;
}

/// Production [LudoDeepLinkGateway], backed by `package:app_links`.
final class ProductionLudoDeepLinkGateway implements LudoDeepLinkGateway {
  ProductionLudoDeepLinkGateway({app_links.AppLinks? appLinks})
    : _appLinks = appLinks ?? app_links.AppLinks();

  final app_links.AppLinks _appLinks;

  @override
  Future<Uri?> initialLink() async {
    try {
      return await _appLinks.getInitialLink();
    } on Object {
      return null;
    }
  }

  @override
  Stream<Uri> get onLink {
    final controller = StreamController<Uri>.broadcast();
    late final StreamSubscription<Uri> subscription;
    try {
      subscription = _appLinks.uriLinkStream.listen(
        controller.add,
        onError: (Object _, StackTrace _) {},
      );
    } on Object {
      // No platform channel available at all (e.g. a `flutter test` host
      // process with no `app_links` mock installed): the stream simply
      // never emits, matching this file's "never throws" guarantee.
      return controller.stream;
    }
    controller.onCancel = subscription.cancel;
    return controller.stream;
  }
}
