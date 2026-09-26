// Tests for task 26's `resolveLudoApiBaseUri`/`createLudoOnlineClient`: the
// production dependency-graph resolver that must degrade to `null` (never
// throw) whenever online play isn't actually available.
import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart'
    show AppContext, AppEnvironment;

import 'package:ludo/src/app.dart' show ludoIdentity;
import 'package:ludo/src/net/ludo_online_client.dart';

AppContext _context() => AppContext(
  identity: ludoIdentity,
  environment: AppEnvironment.debug,
  appVersion: '0.1.0',
  sessionId: 'test-session',
);

void main() {
  group('resolveLudoApiBaseUri', () {
    test('accepts a well-formed https URL', () {
      expect(
        resolveLudoApiBaseUri(apiBaseUrl: 'https://api.example.test'),
        Uri.parse('https://api.example.test'),
      );
    });

    test('rejects an empty string', () {
      expect(resolveLudoApiBaseUri(apiBaseUrl: ''), isNull);
    });

    test('rejects a non-http(s) scheme', () {
      expect(resolveLudoApiBaseUri(apiBaseUrl: 'ftp://example.test'), isNull);
    });

    test('rejects a URL carrying userinfo, query, or a fragment', () {
      expect(
        resolveLudoApiBaseUri(apiBaseUrl: 'https://u:p@example.test'),
        isNull,
      );
      expect(
        resolveLudoApiBaseUri(apiBaseUrl: 'https://example.test?x=1'),
        isNull,
      );
      expect(
        resolveLudoApiBaseUri(apiBaseUrl: 'https://example.test#frag'),
        isNull,
      );
    });
  });

  test('createLudoOnlineClient degrades to null with no Firebase config, never throwing', () async {
    // No platform-channel mock for `firebase_core` exists in this host
    // process, so `ensureLudoFirebaseInitialized` (which this function
    // calls first) takes the real "no config present" path regardless
    // of whether a base URL is configured.
    final client = await createLudoOnlineClient(_context());
    expect(client, isNull);
  });
}
