import {
  type Lifecycle,
  type Settings,
  type SettingsStore,
  type ShareContent,
  type ShareResult,
  systemPrefersReducedMotion,
} from "@web-games/kit";
import type { Profile } from "@web-games/the-last-window-core";
import { createContext } from "preact";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import type { AppRouter } from "../nav";
import type { VisibilitySource } from "../shift/Runner";
import type { Scheduler } from "../shift/scheduler";
import type { GameStore } from "./game";
import { useGame } from "./useGame";

export interface AppContextValue {
  router: AppRouter;
  game: GameStore;
  settings: SettingsStore;
  clock: () => Date;
  share: (content: ShareContent) => Promise<ShareResult>;
  lifecycle?: Pick<Lifecycle, "onBack">;
  exitApp?: () => void;
  /** Slots that have a runtime image; empty means every picture is code-drawn. */
  artManifest?: readonly string[];
  scheduler: Scheduler;
  visibility?: VisibilitySource | null;
  prefersReducedMotion?: () => boolean;
  /** Title waits for this before offering "Tap to begin" (fonts and art). */
  preload?: (onProgress: (fraction: number) => void) => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp needs an AppContext provider");
  return value;
}

export function useSettings(): Readonly<Settings> {
  const { settings } = useApp();
  const [current, setCurrent] = useState<Readonly<Settings>>(settings.get());
  useEffect(() => {
    setCurrent(settings.get());
    return settings.subscribe((next) => setCurrent(next));
  }, [settings]);
  return current;
}

export function useReducedMotion(): boolean {
  const app = useApp();
  const settings = useSettings();
  const system = (app.prefersReducedMotion ?? systemPrefersReducedMotion)();
  return app.settings.effectiveReducedMotion(system) || settings.reducedMotion;
}

export function useProfile(): Profile {
  return useGame().profile;
}

/** Registers a back interceptor while `active`; the handler may change without re-registering. */
export function useBack(router: AppRouter, active: boolean, handler: () => boolean): void {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (!active) return undefined;
    return router.pushBackInterceptor(() => latest.current());
  }, [router, active]);
}
