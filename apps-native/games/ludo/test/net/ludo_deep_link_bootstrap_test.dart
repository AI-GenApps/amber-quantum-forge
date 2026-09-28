// Tests for task 26x's `wireLudoDeepLinks()` — the lazy, guarded bootstrap
// `main.dart` calls `unawaited`. Uses a fake `LudoDeepLinkGateway` (never a
// real `app_links`/platform channel) to exercise both the cold-launch
// (`initialLink`) and warm-start (`onLink`) paths.
import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_deep_link.dart';
import 'package:ludo/src/net/ludo_deep_link_bootstrap.dart';
import 'package:ludo/src/net/ludo_deep_link_router.dart';

final class _FakeDeepLinkGateway implements LudoDeepLinkGateway {
  _FakeDeepLinkGateway({this.initial, Stream<Uri>? live})
    : _live = live ?? const Stream<Uri>.empty();

  final Uri? initial;
  final Stream<Uri> _live;

  @override
  Future<Uri?> initialLink() async => initial;

  @override
  Stream<Uri> get onLink => _live;
}

void main() {
  setUp(LudoDeepLinkRouter.instance.resetForTesting);
  tearDown(LudoDeepLinkRouter.instance.resetForTesting);

  test('the no-op gateway never routes any code', () async {
    final received = <String>[];
    LudoDeepLinkRouter.instance.register(received.add);

    await wireLudoDeepLinks(gateway: const NoOpLudoDeepLinkGateway());
    // Let any (nonexistent) stream event settle.
    await Future<void>.delayed(Duration.zero);

    expect(received, isEmpty);
  });

  test('routes a well-formed cold-launch initial link', () async {
    final received = <String>[];
    LudoDeepLinkRouter.instance.register(received.add);

    await wireLudoDeepLinks(
      gateway: _FakeDeepLinkGateway(
        initial: Uri.parse('w3dev-ludo://room/coldabc'),
      ),
    );

    expect(received, ['COLDABC']);
  });

  test('ignores a malformed/unrelated cold-launch link', () async {
    final received = <String>[];
    LudoDeepLinkRouter.instance.register(received.add);

    await wireLudoDeepLinks(
      gateway: _FakeDeepLinkGateway(
        initial: Uri.parse('https://example.com/not-ludo'),
      ),
    );

    expect(received, isEmpty);
  });

  test('routes a warm-start link delivered on the live stream', () async {
    final received = <String>[];
    LudoDeepLinkRouter.instance.register(received.add);
    final controller = StreamController<Uri>();

    await wireLudoDeepLinks(
      gateway: _FakeDeepLinkGateway(live: controller.stream),
    );
    controller.add(Uri.parse('w3dev-ludo://room/warmxyz'));
    await Future<void>.delayed(Duration.zero);

    expect(received, ['WARMXYZ']);
    await controller.close();
  });
}
