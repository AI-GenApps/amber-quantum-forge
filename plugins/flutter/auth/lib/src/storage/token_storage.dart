import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/auth_token.dart';

/// Secure-storage-backed token persistence. Mirrors `KeychainHelper.swift`,
/// using the platform Keychain (iOS) / Keystore-backed EncryptedSharedPreferences
/// (Android) under the hood via `flutter_secure_storage`.
class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage})
    : _storage =
          storage ??
          const FlutterSecureStorage(
            aOptions: AndroidOptions(encryptedSharedPreferences: true),
            iOptions: IOSOptions(
              accessibility: KeychainAccessibility.first_unlock_this_device,
            ),
          );

  final FlutterSecureStorage _storage;

  static const _accessTokenKey = 'app.w3dev.starter.auth.accessToken';
  static const _refreshTokenKey = 'app.w3dev.starter.auth.refreshToken';
  static const _expiresAtKey = 'app.w3dev.starter.auth.tokenExpiresAt';

  Future<void> save(AuthToken token) async {
    await _storage.write(key: _accessTokenKey, value: token.accessToken);
    await _storage.write(key: _refreshTokenKey, value: token.refreshToken);
    await _storage.write(
      key: _expiresAtKey,
      value: token.expiresAt.toIso8601String(),
    );
  }

  Future<AuthToken?> load() async {
    final accessToken = await _storage.read(key: _accessTokenKey);
    final refreshToken = await _storage.read(key: _refreshTokenKey);
    final expiresAtString = await _storage.read(key: _expiresAtKey);
    if (accessToken == null || refreshToken == null || expiresAtString == null) {
      return null;
    }
    final expiresAt = DateTime.tryParse(expiresAtString);
    if (expiresAt == null) return null;
    return AuthToken(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: expiresAt,
    );
  }

  Future<void> delete() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _expiresAtKey);
  }
}
