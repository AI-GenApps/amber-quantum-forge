import type { Profile } from "@web-games/floodplain-dispatch-core";
import {
  type Lifecycle,
  type Settings,
  type SettingsStore,
  type ShareContent,
  type ShareResult,
  systemPrefersReducedMotion,
} from "@web-games/kit";
import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import type { SlotId } from "../art/slots";
import type { Draw2D } from "../board/Draw2D";
import { type Feedback, noopFeedback } from "../feedback/feedback";
import type { AppRouter } from "../nav";
import { type MapTheme, mapThemeFor } from "../theme/mapThemes";
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
  artManifest?: readonly SlotId[];
  images?: Readonly<Record<string, unknown>>;
  contextFactory?: (canvas: HTMLCanvasElement) => Draw2D | null;
  prefersReducedMotion?: () => boolean;
  /** Sound and haptics; absent in tests that do not need them. */
  feedback?: Feedback;
  /** Boot waits for this before leaving the loading screen (fonts and art). */
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

export function useFeedback(): Feedback {
  return useApp().feedback ?? noopFeedback;
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

export function useMapTheme(): MapTheme {
  return mapThemeFor(useProfile().themeSelected);
}
