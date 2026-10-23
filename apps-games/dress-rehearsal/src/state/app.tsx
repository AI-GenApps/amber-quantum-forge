import type { Profile } from "@web-games/dress-rehearsal-core";
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
import type { ExportEnv } from "../export/share";
import type { AppRouter } from "../nav";
import { type GameState, type GameStore, useGame } from "./game";

export interface AppContextValue {
  router: AppRouter;
  game: GameStore;
  settings: SettingsStore;
  clock: () => Date;
  share: (content: ShareContent) => Promise<ShareResult>;
  lifecycle?: Pick<Lifecycle, "onBack">;
  exitApp?: () => void;
  artManifest?: readonly SlotId[];
  /** Decoded designer art by slot id, drawn into the export canvas when present. */
  images?: Readonly<Record<string, unknown>>;
  exportEnv?: ExportEnv;
  prefersReducedMotion?: () => boolean;
  /** Boot waits for this before leaving the loading screen (fonts and listed art). */
  preload?: (onProgress: (fraction: number) => void) => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp needs an AppContext provider");
  return value;
}

export function useGameState(): GameState {
  return useGame(useApp().game);
}

export function useProfile(): Profile {
  return useGameState().profile;
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
