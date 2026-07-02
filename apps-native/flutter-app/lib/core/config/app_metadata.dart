/// Dart models mirroring the `app_config` registry shapes defined in
/// `packages/api/src/types/config.ts`. These are consumed from
/// `GET /api/config/app-metadata`.
library app_metadata;

enum UpdateType {
  mandatory,
  optional;

  static UpdateType fromWire(String value) {
    return UpdateType.values.firstWhere(
      (v) => v.name == value,
      orElse: () => UpdateType.optional,
    );
  }
}

class VersionConfig {
  const VersionConfig({
    required this.latestVersion,
    required this.minVersion,
    required this.updateType,
    this.forceUpdateMessage,
    this.optionalUpdateMessage,
  });

  final String latestVersion;
  final String minVersion;
  final UpdateType updateType;
  final String? forceUpdateMessage;
  final String? optionalUpdateMessage;

  factory VersionConfig.fromJson(Map<String, dynamic> json) {
    return VersionConfig(
      latestVersion: json['latestVersion'] as String,
      minVersion: json['minVersion'] as String,
      updateType: UpdateType.fromWire(json['updateType'] as String),
      forceUpdateMessage: json['forceUpdateMessage'] as String?,
      optionalUpdateMessage: json['optionalUpdateMessage'] as String?,
    );
  }
}

/// `Record<string, boolean>` on the TS side.
typedef FeatureFlags = Map<String, bool>;

FeatureFlags featureFlagsFromJson(Map<String, dynamic> json) {
  return json.map((key, value) => MapEntry(key, value as bool));
}

class MaintenanceMode {
  const MaintenanceMode({
    required this.enabled,
    required this.message,
    this.allowedVersions,
  });

  final bool enabled;
  final String message;
  final List<String>? allowedVersions;

  factory MaintenanceMode.fromJson(Map<String, dynamic> json) {
    return MaintenanceMode(
      enabled: json['enabled'] as bool,
      message: json['message'] as String,
      allowedVersions: (json['allowedVersions'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
    );
  }
}

class StoreUrls {
  const StoreUrls({required this.ios, required this.android});

  final String ios;
  final String android;

  factory StoreUrls.fromJson(Map<String, dynamic> json) {
    return StoreUrls(
      ios: json['ios'] as String,
      android: json['android'] as String,
    );
  }
}

class SupportUrls {
  const SupportUrls({
    required this.supportEmail,
    required this.supportUrl,
    required this.termsUrl,
    required this.privacyUrl,
  });

  final String supportEmail;
  final String supportUrl;
  final String termsUrl;
  final String privacyUrl;

  factory SupportUrls.fromJson(Map<String, dynamic> json) {
    return SupportUrls(
      supportEmail: json['supportEmail'] as String,
      supportUrl: json['supportUrl'] as String,
      termsUrl: json['termsUrl'] as String,
      privacyUrl: json['privacyUrl'] as String,
    );
  }
}

/// Response shape of `GET /api/config/app-metadata`. All keys are
/// optional — an unset key means the server has no override for it.
class AppMetadata {
  const AppMetadata({
    this.versionConfig,
    this.featureFlags,
    this.maintenanceMode,
    this.storeUrls,
    this.supportUrls,
  });

  final VersionConfig? versionConfig;
  final FeatureFlags? featureFlags;
  final MaintenanceMode? maintenanceMode;
  final StoreUrls? storeUrls;
  final SupportUrls? supportUrls;

  factory AppMetadata.fromJson(Map<String, dynamic> json) {
    return AppMetadata(
      versionConfig: json['version_config'] != null
          ? VersionConfig.fromJson(json['version_config'] as Map<String, dynamic>)
          : null,
      featureFlags: json['feature_flags'] != null
          ? featureFlagsFromJson(json['feature_flags'] as Map<String, dynamic>)
          : null,
      maintenanceMode: json['maintenance_mode'] != null
          ? MaintenanceMode.fromJson(json['maintenance_mode'] as Map<String, dynamic>)
          : null,
      storeUrls: json['store_urls'] != null
          ? StoreUrls.fromJson(json['store_urls'] as Map<String, dynamic>)
          : null,
      supportUrls: json['support_urls'] != null
          ? SupportUrls.fromJson(json['support_urls'] as Map<String, dynamic>)
          : null,
    );
  }
}
