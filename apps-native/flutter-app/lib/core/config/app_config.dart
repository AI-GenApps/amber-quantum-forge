/// Compile-time app configuration, injected via `--dart-define`.
///
/// Mirrors `apps-native/ios-app/Starter/AppConfig.swift`, which reads
/// equivalent values from Info.plist. Flutter has no Info.plist-style
/// indirection for arbitrary app config, so `String.fromEnvironment` /
/// `--dart-define` is the natural analog.
///
/// Example:
/// ```
/// flutter run \
///   --dart-define=API_BASE_URL=http://localhost:4001 \
///   --dart-define=REVENUECAT_API_KEY=appl_xxx
/// ```
class AppConfig {
  const AppConfig._();

  /// Base URL of the Hono API (`@repo/api`, mounted under `apps/web`'s
  /// `/api/*` catch-all route). Defaults to the local web dev server.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4001',
  );

  /// RevenueCat public SDK key. Mirrors `AppConfig.revenueCatKey` in
  /// `AppConfig.swift`. Empty string is a valid "unconfigured" default —
  /// callers should treat it the same way the iOS app does.
  static const String revenueCatApiKey = String.fromEnvironment(
    'REVENUECAT_API_KEY',
    defaultValue: '',
  );

  /// URL scheme registered for deep links / OAuth redirects.
  /// Mirrors `starter://` from `Info.plist` (`CFBundleURLSchemes`).
  static const String urlScheme = 'starter';
}
