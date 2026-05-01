import type React from "react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  type AppMetadata,
  fetchAppMetadata,
  getAppVersion,
  getUpdateStatus,
  type UpdateStatus,
} from "../services/appMetadata";

interface AppConfigContextType {
  appMetadata: AppMetadata | null;
  updateStatus: UpdateStatus;
  isLoading: boolean;
  error: string | null;
  featureFlags: Record<string, boolean>;
  isFeatureEnabled: (key: string) => boolean;
  dismissUpdate: () => void;
  updateDismissed: boolean;
  retry: () => void;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error("useAppConfig must be used within an AppConfigProvider");
  }
  return context;
};

interface AppConfigProviderProps {
  children: ReactNode;
}

export const AppConfigProvider: React.FC<AppConfigProviderProps> = ({ children }) => {
  const [appMetadata, setAppMetadata] = useState<AppMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scheduleRetry depends on loadMetadata; including it here would create a render loop. scheduleRetry is stable enough for this use.
  const loadMetadata = useCallback(async () => {
    try {
      const metadata = await fetchAppMetadata();
      setAppMetadata(metadata);
      setError(null);
      retryCountRef.current = 0;
    } catch (err) {
      console.error("Failed to fetch app metadata:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      scheduleRetry();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleRetry = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES) return;
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

    // Exponential backoff: 5s, 10s, 20s, 40s, 80s
    const delay = 5000 * 2 ** retryCountRef.current;
    retryCountRef.current += 1;

    retryTimeoutRef.current = setTimeout(() => {
      loadMetadata();
    }, delay);
  }, [loadMetadata]);

  // Retry when app comes back to foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active" && error) {
        retryCountRef.current = 0;
        loadMetadata();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [error, loadMetadata]);

  // Initial load
  useEffect(() => {
    loadMetadata();
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [loadMetadata]);

  const currentVersion = getAppVersion();
  const updateStatus = getUpdateStatus(currentVersion, appMetadata?.versionConfig || null);
  const featureFlags = appMetadata?.featureFlags || {};

  const isFeatureEnabled = useCallback(
    (key: string): boolean => featureFlags[key] === true,
    [featureFlags],
  );

  const dismissUpdate = useCallback(() => setUpdateDismissed(true), []);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    setIsLoading(true);
    loadMetadata();
  }, [loadMetadata]);

  return (
    <AppConfigContext.Provider
      value={{
        appMetadata,
        updateStatus,
        isLoading,
        error,
        featureFlags,
        isFeatureEnabled,
        dismissUpdate,
        updateDismissed,
        retry,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  );
};
