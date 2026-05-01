import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import type { VersionInfo } from "../lib/updates";
import {
  areUpdatesEnabled,
  checkForUpdates,
  downloadAndApplyUpdate,
  getVersionInfo,
} from "../lib/updates";

type UpdateContextType = {
  isUpdateAvailable: boolean;
  isCheckingUpdate: boolean;
  versionInfo: VersionInfo;
  checkForUpdate: () => Promise<void>;
  applyUpdate: () => Promise<void>;
};

const UpdateContext = createContext<UpdateContextType | null>(null);

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const versionInfo = getVersionInfo();

  const checkAndAutoApply = async () => {
    if (!areUpdatesEnabled()) return;

    try {
      setIsCheckingUpdate(true);
      const updateInfo = await checkForUpdates();
      setIsUpdateAvailable(updateInfo.isUpdateAvailable);

      if (updateInfo.isUpdateAvailable) {
        console.log("OTA update available, downloading and applying silently...");
        await downloadAndApplyUpdate(true);
      }
    } catch (error) {
      console.error("Failed to check/apply OTA update:", error);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const checkForUpdate = async () => {
    await checkAndAutoApply();
  };

  const applyUpdate = async () => {
    if (!areUpdatesEnabled()) return;

    try {
      await downloadAndApplyUpdate(true);
    } catch (error) {
      console.error("Failed to apply update:", error);
      throw error;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount; checkAndAutoApply is recreated each render but only the initial check is needed.
  useEffect(() => {
    checkAndAutoApply();
  }, []);

  return (
    <UpdateContext.Provider
      value={{ isUpdateAvailable, isCheckingUpdate, versionInfo, checkForUpdate, applyUpdate }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error("useUpdate must be used within UpdateProvider");
  }
  return context;
}
