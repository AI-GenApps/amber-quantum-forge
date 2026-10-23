import {
  type Lifecycle,
  type Settings,
  type SettingsStore,
  type ShareContent,
  type ShareResult,
  systemPrefersReducedMotion,
} from "@web-games/kit";
import type { Profile } from "@web-games/lost-parcel-desk-core";
import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import type { SlotId } from "../art/slots";
import type { AppRouter } from "../nav";
import type { AccuseOutcome, GameStore } from "./game";
import { useGame } from "./useGame";

/** What the last accusation paid, kept for the reveal screen (the store keeps the closed case itself). */
export interface OutcomeBox {
  last: Extract<AccuseOutcome, { ok: true }> | null;
}

export interface AppContextValue {
  router: AppRouter;
  game: GameStore;
  settings: SettingsStore;
  clock: () => Date;
  share: (content: ShareContent) => Promise<ShareResult>;
  lifecycle?: Pick<Lifecycle, "onBack">;
  exitApp?: () => void;
  artManifest?: readonly SlotId[];
  prefersReducedMotion?: () => boolean;
  /** Boot waits for this before leaving the loading screen (fonts and art). */
  preload?: (onProgress: (fraction: number) => void) => Promise<void>;
  outcome: OutcomeBox;
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

export function useArtManifest(): readonly SlotId[] | undefined {
  return useApp().artManifest;
}
