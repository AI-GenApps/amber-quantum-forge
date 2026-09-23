import 'package:flutter/services.dart';

import 'merge_relay_http.dart';

final class MergeRelayAuthStoreException implements Exception {
  const MergeRelayAuthStoreException(this.message);

  final String message;

  @override
  String toString() => 'MergeRelayAuthStoreException: $message';
}

final class MethodChannelMergeRelayAuthStore implements MergeRelayAuthStore {
  MethodChannelMergeRelayAuthStore({MethodChannel? channel})
    : _channel = channel ?? _defaultChannel;

  static const _defaultChannel = MethodChannel(
    'app.w3dev.mergerelay/secure_storage',
  );

  final MethodChannel _channel;

  @override
  Future<String?> readAccessToken() => _read('access_token');

  @override
  Future<String?> readRecoveryToken() => _read('recovery_token');

  @override
  Future<void> saveGuest({
    required String recoveryToken,
    String? accessToken,
  }) async {
    await _write('recovery_token', recoveryToken);
    await _write('access_token', accessToken);
  }

  @override
  Future<void> saveAccessToken(String? accessToken) =>
      _write('access_token', accessToken);

  @override
  Future<void> clearAccessToken() => _write('access_token', null);

  Future<String?> _read(String key) async {
    try {
      final value = await _channel.invokeMethod<Object?>('read', {'key': key});
      return value is String && value.isNotEmpty ? value : null;
    } on MissingPluginException {
      throw const MergeRelayAuthStoreException('plugin_missing');
    } on PlatformException catch (error) {
      throw MergeRelayAuthStoreException(error.code);
    }
  }

  Future<void> _write(String key, String? value) async {
    try {
      await _channel.invokeMethod<void>('write', {'key': key, 'value': value});
    } on MissingPluginException {
      throw const MergeRelayAuthStoreException('plugin_missing');
    } on PlatformException catch (error) {
      throw MergeRelayAuthStoreException(error.code);
    }
  }
}
