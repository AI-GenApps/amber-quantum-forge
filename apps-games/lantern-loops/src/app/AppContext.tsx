import type { Lifecycle, Motion, Router, ShareContent, ShareResult } from "@web-games/kit";
import { createContext } from "preact";
import { useContext, useEffect, useRef } from "preact/hooks";
import type { Services } from "../services";
import type { Routes } from "./routes";

export interface AppEnv {
  services: Services;
  router: Router<Routes>;
  motion: Motion;
  lifecycle: Pick<Lifecycle, "onPause" | "onResume" | "onBack">;
  share(content: ShareContent): Promise<ShareResult>;
  /** Fonts, theme, images and saves; reports a 0 to 1 fraction. */
  boot(onProgress: (fraction: number) => void): Promise<void>;
  exitApp(): void;
}

export const AppContext = createContext<AppEnv | null>(null);

export function useApp(): AppEnv {
  const env = useContext(AppContext);
  if (env === null) throw new Error("AppContext is missing");
  return env;
}

/**
 * Closes the open sheet when the Android back button is pressed. The callback is kept in a ref so
 * the interceptor keeps its place in the stack when the parent re-renders.
 */
export function useSheetBack(open: boolean, onClose: () => void): void {
  const { router } = useApp();
  const latest = useRef(onClose);
  latest.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    return router.pushBackInterceptor(() => {
      latest.current();
      return true;
    });
  }, [router, open]);
}
