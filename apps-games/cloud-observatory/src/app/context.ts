import type { Motion, Settings } from "@web-games/kit";
import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { OnboardingApi } from "../onboarding/useOnboarding";
import type { GameSession } from "../session/game-session";
import type { SessionSnapshot } from "../session/types";
import type { Feedback } from "../ui/feedback";
import type { FrameScheduler } from "./game-loop";
import type { AppRouter, TabId } from "./routes";

export interface AppContextValue {
  readonly session: GameSession;
  readonly router: AppRouter;
  readonly feedback: Feedback;
  readonly motion: Motion;
  readonly uiFrames: FrameScheduler;
  readonly onboarding: OnboardingApi;
  readonly snapshot: SessionSnapshot;
  readonly settings: Readonly<Settings>;
  /** Player setting or the system preference. */
  readonly reducedMotion: boolean;
  readonly tab: TabId;
  now(): number;
  setTab(tab: TabId): void;
  openEntry(id: string): void;
  notify(message: string, tone?: "info" | "success" | "danger"): void;
  playEclipse(shards: number, eclipses: number): void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (value === null) throw new Error("useApp must be used inside the app provider");
  return value;
}
