/// `main.dart`'s lazy, guarded deep-link bootstrap (task 26x): resolves the
/// cold-launch link (if any) and subscribes to the warm-start stream, both
/// through [LudoDeepLinkGateway] (never `package:app_links` directly), and
/// funnels any `w3dev-ludo://room/<code>` link through
/// [LudoDeepLinkRouter.routeRoomCode].
///
/// Called `unawaited` from `main()`, after `runApp`, mirroring
/// `ensureLudoFirebaseInitialized()`'s own "never gates startup, never
/// throws" contract — nothing about booting to the lobby depends on this
/// resolving, and a platform-channel failure (already swallowed inside
/// [LudoDeepLinkGateway]'s production implementation) never surfaces here
/// either.
library;

import 'dart:async';

import 'ludo_deep_link.dart';
import 'ludo_deep_link_router.dart';

/// Resolves [gateway]'s cold-launch link (if any) and subscribes to its
/// live stream, routing every well-formed `w3dev-ludo://room/<code>` link
/// through [LudoDeepLinkRouter.instance]. A malformed or unrelated link
/// (wrong scheme/host/shape) is silently ignored, matching
/// [parseLudoRoomInviteCode]'s own "never throws on untrusted input"
/// contract.
///
/// [gateway] defaults to [ProductionLudoDeepLinkGateway] in production;
/// tests pass a fake (or the [NoOpLudoDeepLinkGateway] default) so this
/// function never touches a real platform channel.
Future<void> wireLudoDeepLinks({LudoDeepLinkGateway? gateway}) async {
  final effectiveGateway = gateway ?? ProductionLudoDeepLinkGateway();
  final initial = await effectiveGateway.initialLink();
  if (initial != null) _routeIfRoomInvite(initial);
  effectiveGateway.onLink.listen(_routeIfRoomInvite);
}

void _routeIfRoomInvite(Uri link) {
  final code = parseLudoRoomInviteCode(link.toString());
  if (code != null) LudoDeepLinkRouter.instance.routeRoomCode(code);
}
