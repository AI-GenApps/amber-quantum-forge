import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  checkForUpdates,
  downloadAndApplyUpdate,
  getVersionInfo,
  areUpdatesEnabled,
} from '../lib/updates';
import type { VersionInfo } from '../lib/updates';

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

  const checkForUpdate = async () => {
    if (!areUpdatesEnabled()) return;

    try {
      setIsCheckingUpdate(true);
      const updateInfo = await checkForUpdates();
      setIsUpdateAvailable(updateInfo.isUpdateAvailable);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const applyUpdate = async () => {
    if (!areUpdatesEnabled()) return;

    try {
      await downloadAndApplyUpdate(true);
    } catch (error) {
      console.error('Failed to apply update:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkForUpdate();
  }, []);

  return (
    <UpdateContext.Provider value={{ isUpdateAvailable, isCheckingUpdate, versionInfo, checkForUpdate, applyUpdate }}>
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within UpdateProvider');
  }
  return context;
}
