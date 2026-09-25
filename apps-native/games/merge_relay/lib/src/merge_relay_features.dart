/// Compile-time gate for Merge Relay's social surface (friend relays, Play
/// Games Services, and every HTTP call to the Merge Relay backend).
///
/// v1 ships offline solo-only: Rescue, Daily, and Endless with local save.
/// The relay, PGS, and network code stays in the codebase for v1.1, but it
/// must be unreachable while this constant is false — the app must never
/// construct the gateway or PGS bridge, never make a network call, and must
/// hide every relay, share, and PGS control.
///
/// [MergeRelayFeatures] wraps the constant behind an injectable seam so
/// tests can force the gate on to keep exercising the relay/PGS code paths
/// without deleting or skipping any assertion.
const mergeRelaySocialEnabled = bool.fromEnvironment('MERGE_RELAY_SOCIAL');

final class MergeRelayFeatures {
  const MergeRelayFeatures({this.socialEnabled = mergeRelaySocialEnabled});

  /// Friend relays, challenge links/sharing, Play Games Services sign-in,
  /// and the HTTP gateway to the Merge Relay backend.
  final bool socialEnabled;
}
