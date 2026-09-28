// Tests for task 26x's warm-start/cold-launch routing plumbing
// (`ludo_deep_link_router.dart`) — pure Dart, no platform channel involved.
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_deep_link_router.dart';

void main() {
  setUp(LudoDeepLinkRouter.instance.resetForTesting);
  tearDown(LudoDeepLinkRouter.instance.resetForTesting);

  test('delivers a routed code immediately to a registered handler', () {
    final received = <String>[];
    LudoDeepLinkRouter.instance.register(received.add);

    LudoDeepLinkRouter.instance.routeRoomCode('ABC123');

    expect(received, ['ABC123']);
  });

  test('holds a code routed before any handler registers, then delivers it '
      'once one does (the cold-launch race)', () {
    LudoDeepLinkRouter.instance.routeRoomCode('EARLY01');

    final received = <String>[];
    LudoDeepLinkRouter.instance.register(received.add);

    expect(received, ['EARLY01']);
  });

  test(
    'a code routed while unregistered replaces any earlier pending code',
    () {
      LudoDeepLinkRouter.instance.routeRoomCode('FIRST01');
      LudoDeepLinkRouter.instance.routeRoomCode('SECOND1');

      final received = <String>[];
      LudoDeepLinkRouter.instance.register(received.add);

      expect(received, ['SECOND1']);
    },
  );

  test(
    'unregistering (passing null) stops delivery and holds the next code',
    () {
      final received = <String>[];
      LudoDeepLinkRouter.instance.register(received.add);
      LudoDeepLinkRouter.instance.register(null);

      LudoDeepLinkRouter.instance.routeRoomCode('AFTER01');
      expect(received, isEmpty);

      final receivedAgain = <String>[];
      LudoDeepLinkRouter.instance.register(receivedAgain.add);
      expect(receivedAgain, ['AFTER01']);
    },
  );
}
