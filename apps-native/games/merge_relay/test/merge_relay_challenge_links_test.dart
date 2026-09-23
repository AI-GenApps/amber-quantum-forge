import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:merge_relay/src/platform/merge_relay_challenge_links.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('returns cold links and delivers later warm links', () async {
    const channel = MethodChannel('test.merge_relay/challenge_links');
    final calls = <String>[];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          calls.add(call.method);
          if (call.method == 'take_pending_links') {
            return const ['mergerelay://challenge/ch_123'];
          }
          return null;
        });
    final source = MethodChannelMergeRelayChallengeLinkSource(channel: channel);
    final warm = <String>[];
    final subscription = source.links.listen(warm.add);

    expect(await source.initialize(), ['mergerelay://challenge/ch_123']);
    await TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .handlePlatformMessage(
          channel.name,
          const StandardMethodCodec().encodeMethodCall(
            const MethodCall('link_received', 'mergerelay://challenge/ch_456'),
          ),
          (_) {},
        );
    await Future<void>.delayed(Duration.zero);

    expect(warm, ['mergerelay://challenge/ch_456']);
    expect(calls, ['take_pending_links']);
    await subscription.cancel();
    source.dispose();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  test('filters blank and oversized platform values', () async {
    const channel = MethodChannel('test.merge_relay/challenge_links_filter');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          return ['', '  ', 'x' * 513, 'ch_valid'];
        });
    final source = MethodChannelMergeRelayChallengeLinkSource(channel: channel);

    expect(await source.initialize(), ['ch_valid']);

    source.dispose();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  test('missing native bridge is an empty optional capability', () async {
    const channel = MethodChannel('test.merge_relay/challenge_links_missing');
    final source = MethodChannelMergeRelayChallengeLinkSource(channel: channel);

    expect(await source.initialize(), isEmpty);

    source.dispose();
  });
}
