import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_client.dart';

void main() {
  test('client config allows API access without a public HTTPS origin', () {
    final config = mergeRelayClientConfig(
      apiBaseUrl: 'https://relay.example/api/',
      publicOrigin: '',
    );

    expect(config, isNotNull);
    expect(config!.publicOrigin, isNull);
  });

  test('client config requires a usable API URL', () {
    expect(mergeRelayClientConfig(apiBaseUrl: '', publicOrigin: ''), isNull);
    expect(
      mergeRelayClientConfig(
        apiBaseUrl: 'https://relay.example/api/?token=bad',
        publicOrigin: '',
      ),
      isNull,
    );
  });

  test('client config accepts only a pathless HTTPS public origin', () {
    final config = mergeRelayClientConfig(
      apiBaseUrl: 'https://relay.example/api/',
      publicOrigin: 'https://relay.example',
    );
    expect(config?.publicOrigin?.host, 'relay.example');

    for (final origin in [
      'http://relay.example',
      'https://relay.example/games',
      'https://relay.example?redirect=bad',
      'https://user:pass@relay.example',
    ]) {
      expect(
        mergeRelayClientConfig(
          apiBaseUrl: 'https://relay.example/api/',
          publicOrigin: origin,
        ),
        isNull,
        reason: origin,
      );
    }
  });
}
