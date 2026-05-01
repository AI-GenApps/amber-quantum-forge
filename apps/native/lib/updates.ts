import * as Updates from "expo-updates";

export interface UpdateInfo {
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  manifest?: Updates.Manifest;
}

export interface VersionInfo {
  appVersion: string;
  runtimeVersion: string;
  updateId: string;
  channel: string;
  isEmbeddedLaunch: boolean;
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  try {
    if (__DEV__) {
      console.log("Updates disabled in development mode");
      return { isUpdateAvailable: false, isUpdatePending: false };
    }

    const update = await Updates.checkForUpdateAsync();

    return {
      isUpdateAvailable: update.isAvailable,
      isUpdatePending: false,
      manifest: update.manifest,
    };
  } catch (error) {
    console.error("Error checking for updates:", error);
    throw error;
  }
}

export async function downloadAndApplyUpdate(forceReload: boolean = true): Promise<boolean> {
  try {
    if (__DEV__) {
      console.log("Updates disabled in development mode");
      return false;
    }

    const result = await Updates.fetchUpdateAsync();

    if (result.isNew) {
      if (forceReload) {
        await Updates.reloadAsync();
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error downloading/applying update:", error);
    throw error;
  }
}

export function getVersionInfo(): VersionInfo {
  const manifest = Updates.manifest as any;

  return {
    appVersion: manifest?.version || "1.0.0",
    runtimeVersion: Updates.runtimeVersion || "Unknown",
    updateId: Updates.updateId || "Development",
    channel: Updates.channel || "Development",
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}

export function areUpdatesEnabled(): boolean {
  return !__DEV__;
}
