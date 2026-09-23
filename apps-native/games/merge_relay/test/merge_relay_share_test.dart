import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_relay_share.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = MethodChannel('test.merge_relay/share');
  const payload = MergeRelaySharePayload(
    challengeId: 'ch_123',
    creatorAlias: 'Ada',
    code: 'ch_123',
    appLink: 'mergerelay://challenge/ch_123',
    httpsLink: null,
  );

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  test('share provider reports an opened chooser', () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          expect(call.method, 'share');
          final arguments = (call.arguments as Map).cast<String, Object?>();
          expect(arguments['title'], 'Merge Relay');
          expect(arguments['message'], payload.message);
          return {'status': 'opened'};
        });

    final provider = MethodChannelMergeRelayShareProvider(channel: channel);

    expect(await provider.share(payload), MergeRelayShareStatus.opened);
  });

  test('share provider preserves unavailable status', () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          channel,
          (call) async => {'status': 'unavailable'},
        );

    final provider = MethodChannelMergeRelayShareProvider(channel: channel);

    expect(await provider.share(payload), MergeRelayShareStatus.unavailable);
  });

  test('missing native share bridge is unavailable', () async {
    final provider = MethodChannelMergeRelayShareProvider(channel: channel);

    expect(await provider.share(payload), MergeRelayShareStatus.unavailable);
  });

  test('share provider reports failed for malformed native status', () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          channel,
          (call) async => {'status': 'cancelled'},
        );

    final provider = MethodChannelMergeRelayShareProvider(channel: channel);

    expect(await provider.share(payload), MergeRelayShareStatus.failed);
  });

  test('share provider maps a native no-target error to unavailable', () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          channel,
          (call) async => throw PlatformException(code: 'share_unavailable'),
        );

    final provider = MethodChannelMergeRelayShareProvider(channel: channel);

    expect(await provider.share(payload), MergeRelayShareStatus.unavailable);
  });
}
