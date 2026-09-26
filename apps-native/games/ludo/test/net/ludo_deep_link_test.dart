// Tests for task 26's deep-link parsing
// (`w3dev-ludo://room/<code>`, task 21's `LUDO_DEEP_LINK_SCHEME`/
// `ludoRoomInviteLink` — see `packages/api/src/games/ludo/contracts.ts`).
// `ProductionLudoDeepLinkGateway` (the `app_links`-backed half) is not
// exercised here: there is no platform channel to talk to in a
// `flutter test` host process, matching every other guarded-gateway file
// in this app (`ludo_firebase_gateway.dart`'s own doc comment).
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_deep_link.dart';

void main() {
  test('parses a well-formed room invite link, upper-casing the code', () {
    expect(parseLudoRoomInviteCode('w3dev-ludo://room/abc123'), 'ABC123');
    expect(parseLudoRoomInviteCode('w3dev-ludo://room/ABC123'), 'ABC123');
  });

  test('returns null for a malformed link', () {
    expect(parseLudoRoomInviteCode('not a uri at all: <>'), isNull);
  });

  test('returns null for the wrong scheme', () {
    expect(parseLudoRoomInviteCode('https://example.com/room/ABC123'), isNull);
  });

  test('returns null for the wrong host', () {
    expect(parseLudoRoomInviteCode('w3dev-ludo://match/ABC123'), isNull);
  });

  test('returns null for a missing room code', () {
    expect(parseLudoRoomInviteCode('w3dev-ludo://room/'), isNull);
  });

  test('returns null for extra path segments', () {
    expect(parseLudoRoomInviteCode('w3dev-ludo://room/ABC123/extra'), isNull);
  });

  test('returns null for an empty string', () {
    expect(parseLudoRoomInviteCode(''), isNull);
  });
}
