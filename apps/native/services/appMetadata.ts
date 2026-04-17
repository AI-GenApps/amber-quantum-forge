import { getApiUrl } from '../firebase.config';
import Constants from 'expo-constants';

export interface VersionConfig {
  latestVersion: string;
  minVersion: string;
  updateType: 'mandatory' | 'optional';
}

export interface AppMetadata {
  versionConfig: VersionConfig | null;
  featureFlags: Record<string, boolean>;
}

export type UpdateStatus = 'up_to_date' | 'update_available' | 'update_required';

export function getAppVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

/**
 * Compare two semver strings. Returns:
 *  -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

export function getUpdateStatus(
  currentVersion: string,
  versionConfig: VersionConfig | null
): UpdateStatus {
  if (!versionConfig) return 'up_to_date';

  const { latestVersion, minVersion, updateType } = versionConfig;

  // Below minimum version — always required
  if (compareSemver(currentVersion, minVersion) < 0) {
    return 'update_required';
  }

  // Below latest version
  if (compareSemver(currentVersion, latestVersion) < 0) {
    return updateType === 'mandatory' ? 'update_required' : 'update_available';
  }

  return 'up_to_date';
}

export async function fetchAppMetadata(): Promise<AppMetadata> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/config/app-metadata`);

  if (!response.ok) {
    throw new Error(`Failed to fetch app metadata: ${response.status}`);
  }

  const data = await response.json();

  return {
    versionConfig: (data.version_config as VersionConfig) || null,
    featureFlags: (data.feature_flags as Record<string, boolean>) || {},
  };
}
