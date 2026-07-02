/// Two-stage Firebase -> API JWT auth for the Flutter app.
///
/// Mirrors `plugins/ios/auth` (StarterAuth). See docs-internal/architecture/auth.md
/// for the exact wire contract this package implements.
library starter_auth;

export 'src/auth_error.dart';
export 'src/auth_manager.dart';
export 'src/auth_provider.dart';
export 'src/models/auth_token.dart';
export 'src/models/exchange_response.dart';
export 'src/models/refresh_response.dart';
export 'src/providers/apple_auth_provider.dart';
export 'src/providers/google_auth_provider.dart';
export 'src/storage/token_storage.dart';
