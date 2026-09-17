import 'generated/game_app_registry.dart';

enum AppEnvironment { debug, staging, production }

const gameEnvironmentDefine = String.fromEnvironment(
  'GAME_ENVIRONMENT',
  defaultValue: 'debug',
);
const appVersionDefine = String.fromEnvironment(
  'APP_VERSION',
  defaultValue: '0.1.0',
);

AppEnvironment parseAppEnvironment(String value) {
  return switch (value) {
    'debug' => AppEnvironment.debug,
    'staging' => AppEnvironment.staging,
    'production' => AppEnvironment.production,
    _ => throw ArgumentError.value(
      value,
      'GAME_ENVIRONMENT',
      'Expected debug, staging, or production',
    ),
  };
}

AppEnvironment runtimeAppEnvironment() =>
    parseAppEnvironment(gameEnvironmentDefine);

AppIdentity appIdentityFor(String stableId, {String? subtitle}) {
  final definition = GeneratedGameRegistry.byId(stableId);
  if (definition == null) {
    throw StateError('Unknown generated game identity: $stableId');
  }
  final identity = AppIdentity(
    stableId: definition.id,
    canonicalName: definition.canonicalName,
    publicTitle: definition.publicTitle,
    subtitle: subtitle ?? definition.publicTitle,
  );
  identity.validate();
  return identity;
}

AppContext runtimeAppContext({
  required AppIdentity identity,
  String sessionId = 'local-debug',
}) {
  final context = AppContext(
    identity: identity,
    environment: runtimeAppEnvironment(),
    appVersion: appVersionDefine,
    sessionId: sessionId,
  );
  context.validate();
  return context;
}

final class AppIdentity {
  const AppIdentity({
    required this.stableId,
    required this.canonicalName,
    required this.publicTitle,
    required this.subtitle,
  });

  final String stableId;
  final String canonicalName;
  final String publicTitle;
  final String subtitle;

  String saveNamespaceFor(AppEnvironment environment) {
    return 'games.$stableId.${environment.name}';
  }

  String telemetryNamespaceFor(AppEnvironment environment) {
    return 'game.$stableId.${environment.name}';
  }

  void validate() {
    final validId = RegExp(r'^[a-z][a-z0-9_]{2,31}$').hasMatch(stableId);
    if (!validId) {
      throw StateError('Invalid app stable ID: $stableId');
    }
    if (canonicalName.trim().isEmpty ||
        publicTitle.trim().isEmpty ||
        subtitle.trim().isEmpty) {
      throw StateError('App names and subtitle must not be empty');
    }
  }
}

final class AppContext {
  const AppContext({
    required this.identity,
    required this.environment,
    required this.appVersion,
    required this.sessionId,
  });

  final AppIdentity identity;
  final AppEnvironment environment;
  final String appVersion;
  final String sessionId;

  void validate() {
    identity.validate();
    final validVersion = RegExp(
      r'^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$',
    ).hasMatch(appVersion);
    if (!validVersion) {
      throw StateError('App version must be a semantic version');
    }
    if (sessionId.trim().isEmpty) {
      throw StateError('Session ID is required');
    }
  }
}
