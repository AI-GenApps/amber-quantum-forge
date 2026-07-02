import 'package:flutter_test/flutter_test.dart';
import 'package:starter_auth/starter_auth.dart';

void main() {
  test('AuthToken round-trips through JSON', () {
    final token = AuthToken(
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: DateTime.utc(2026, 1, 1),
    );
    final restored = AuthToken.fromJson(token.toJson());
    expect(restored.accessToken, token.accessToken);
    expect(restored.refreshToken, token.refreshToken);
    expect(restored.expiresAt, token.expiresAt);
  });

  test('isExpired reflects expiresAt', () {
    final expired = AuthToken(
      accessToken: 'a',
      refreshToken: 'r',
      expiresAt: DateTime.now().subtract(const Duration(minutes: 1)),
    );
    expect(expired.isExpired, isTrue);
  });
}
