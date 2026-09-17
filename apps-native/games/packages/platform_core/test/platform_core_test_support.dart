import 'package:platform_core/platform_core.dart';

const identity = AppIdentity(
  stableId: 'merge_relay',
  canonicalName: 'Merge Relay',
  publicTitle: 'Merge Relay',
  subtitle: 'Merge tiles. Challenge friends',
);

AppContext context(AppEnvironment environment) {
  return AppContext(
    identity: identity,
    environment: environment,
    appVersion: '0.1.0',
    sessionId: 'test-session',
  );
}
