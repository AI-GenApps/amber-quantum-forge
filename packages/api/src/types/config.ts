// Typed registry for the freeform `app_config` table.
// Each entry below is one row in the table — `key` is the row's PK,
// the value type describes the JSONB shape stored under that key.

export type UpdateType = "mandatory" | "optional";

export interface VersionConfig {
  latestVersion: string;
  minVersion: string;
  updateType: UpdateType;
  forceUpdateMessage?: string;
  optionalUpdateMessage?: string;
}

export type FeatureFlags = Record<string, boolean>;

export interface MaintenanceMode {
  enabled: boolean;
  message: string;
  allowedVersions?: string[];
}

export interface StoreUrls {
  ios: string;
  android: string;
}

export interface SupportUrls {
  supportEmail: string;
  supportUrl: string;
  termsUrl: string;
  privacyUrl: string;
}

export interface AppMetadata {
  version_config?: VersionConfig;
  feature_flags?: FeatureFlags;
  maintenance_mode?: MaintenanceMode;
  store_urls?: StoreUrls;
  support_urls?: SupportUrls;
}

export const CONFIG_KEYS = [
  "version_config",
  "feature_flags",
  "maintenance_mode",
  "store_urls",
  "support_urls",
] as const;

export type ConfigKey = (typeof CONFIG_KEYS)[number];

export const DEFAULT_VERSION_CONFIG: VersionConfig = {
  latestVersion: "1.0.0",
  minVersion: "1.0.0",
  updateType: "optional",
};

export const DEFAULT_MAINTENANCE_MODE: MaintenanceMode = {
  enabled: false,
  message: "",
};

export const DEFAULT_STORE_URLS: StoreUrls = {
  ios: "",
  android: "",
};

export const DEFAULT_SUPPORT_URLS: SupportUrls = {
  supportEmail: "",
  supportUrl: "",
  termsUrl: "",
  privacyUrl: "",
};

const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const URL_RE = /^https?:\/\/.+/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function ensure(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

export function parseVersionConfig(input: unknown): VersionConfig {
  ensure(input && typeof input === "object", "version_config must be an object");
  const v = input as Record<string, unknown>;
  ensure(
    isString(v.latestVersion) && SEMVER_RE.test(v.latestVersion),
    "latestVersion must be semver",
  );
  ensure(isString(v.minVersion) && SEMVER_RE.test(v.minVersion), "minVersion must be semver");
  ensure(
    v.updateType === "mandatory" || v.updateType === "optional",
    "updateType must be mandatory|optional",
  );

  const out: VersionConfig = {
    latestVersion: v.latestVersion,
    minVersion: v.minVersion,
    updateType: v.updateType,
  };
  if (isString(v.forceUpdateMessage) && v.forceUpdateMessage)
    out.forceUpdateMessage = v.forceUpdateMessage;
  if (isString(v.optionalUpdateMessage) && v.optionalUpdateMessage)
    out.optionalUpdateMessage = v.optionalUpdateMessage;
  return out;
}

export function parseFeatureFlags(input: unknown): FeatureFlags {
  ensure(
    input && typeof input === "object" && !Array.isArray(input),
    "feature_flags must be an object",
  );
  const v = input as Record<string, unknown>;
  const out: FeatureFlags = {};
  for (const [k, val] of Object.entries(v)) {
    ensure(typeof val === "boolean", `feature_flags.${k} must be a boolean`);
    out[k] = val;
  }
  return out;
}

export function parseMaintenanceMode(input: unknown): MaintenanceMode {
  ensure(input && typeof input === "object", "maintenance_mode must be an object");
  const v = input as Record<string, unknown>;
  ensure(typeof v.enabled === "boolean", "enabled must be a boolean");
  ensure(isString(v.message), "message must be a string");
  const out: MaintenanceMode = { enabled: v.enabled, message: v.message };
  if (Array.isArray(v.allowedVersions)) {
    ensure(v.allowedVersions.every(isString), "allowedVersions must be string[]");
    out.allowedVersions = v.allowedVersions as string[];
  }
  return out;
}

export function parseStoreUrls(input: unknown): StoreUrls {
  ensure(input && typeof input === "object", "store_urls must be an object");
  const v = input as Record<string, unknown>;
  ensure(
    isString(v.ios) && (v.ios === "" || URL_RE.test(v.ios)),
    "ios must be empty or a valid URL",
  );
  ensure(
    isString(v.android) && (v.android === "" || URL_RE.test(v.android)),
    "android must be empty or a valid URL",
  );
  return { ios: v.ios, android: v.android };
}

export function parseSupportUrls(input: unknown): SupportUrls {
  ensure(input && typeof input === "object", "support_urls must be an object");
  const v = input as Record<string, unknown>;
  ensure(
    isString(v.supportEmail) && (v.supportEmail === "" || EMAIL_RE.test(v.supportEmail)),
    "supportEmail must be empty or a valid email",
  );
  for (const k of ["supportUrl", "termsUrl", "privacyUrl"] as const) {
    const val = v[k];
    ensure(isString(val) && (val === "" || URL_RE.test(val)), `${k} must be empty or a valid URL`);
  }
  return {
    supportEmail: v.supportEmail,
    supportUrl: v.supportUrl as string,
    termsUrl: v.termsUrl as string,
    privacyUrl: v.privacyUrl as string,
  };
}

export const CONFIG_PARSERS: Record<ConfigKey, (input: unknown) => unknown> = {
  version_config: parseVersionConfig,
  feature_flags: parseFeatureFlags,
  maintenance_mode: parseMaintenanceMode,
  store_urls: parseStoreUrls,
  support_urls: parseSupportUrls,
};
