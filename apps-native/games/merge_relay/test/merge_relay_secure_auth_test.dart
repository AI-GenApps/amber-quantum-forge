import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('secure auth store writes and reads only typed token keys', () async {
    const channel = MethodChannel('test.merge_relay/secure_storage');
    final values = <String, String?>{};
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          final arguments = (call.arguments as Map).cast<String, Object?>();
          final key = arguments['key'] as String;
          if (call.method == 'read') return values[key];
          if (call.method == 'write') {
            values[key] = arguments['value'] as String?;
            return null;
          }
          return null;
        });

    final store = MethodChannelMergeRelayAuthStore(channel: channel);
    await store.saveGuest(
      recoveryToken: 'recovery-token',
      accessToken: 'access-token',
    );
    expect(await store.readRecoveryToken(), 'recovery-token');
    expect(await store.readAccessToken(), 'access-token');
    await store.clearAccessToken();
    expect(await store.readAccessToken(), isNull);
    expect(values.keys, containsAll({'recovery_token', 'access_token'}));

    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  test('missing native secure storage fails token persistence', () async {
    const channel = MethodChannel('test.merge_relay/secure_storage_missing');
    final store = MethodChannelMergeRelayAuthStore(channel: channel);

    await expectLater(
      store.saveGuest(recoveryToken: 'recovery-token'),
      throwsA(
        isA<MergeRelayAuthStoreException>().having(
          (error) => error.message,
          'message',
          'plugin_missing',
        ),
      ),
    );
  });
}
