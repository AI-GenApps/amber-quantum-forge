import type { MissionPhase } from "@city-drive/core";
import type { ScreenId } from "./screenStack";

/** What the back button, Escape key or Android back gesture should do right now. */
export type BackAction =
  /** Close the top menu screen. */
  | "pop"
  /** Open the pause menu over the drive. */
  | "pause"
  /** Close the pause menu and keep driving. */
  | "resume"
  /** Decline the mission briefing that is showing. */
  | "decline"
  /** Leave the end screens and return to free roam. */
  | "continue"
  /** Nothing in the game can go back: the host may exit or minimise the app. */
  | "exit";

export function backAction(screen: ScreenId, phase: MissionPhase): BackAction {
  switch (screen) {
    case "map":
    case "garage":
    case "settings":
      return "pop";
    case "pause":
      return "resume";
    case "play":
      if (phase === "briefing") return "decline";
      if (phase === "success" || phase === "fail" || phase === "results") return "continue";
      return "pause";
    case "home":
      return "exit";
  }
}

/**
 * Where back requests come from. The web build uses the Escape key; the Capacitor build (task 17)
 * implements this with `@capacitor/app`'s `backButton` event. The handler returns true when the
 * game used the request, false when nothing could go back.
 */
export interface BackSource {
  onBack(handler: () => boolean): () => void;
}

/** Escape key on a window (or any key event target). */
export class EscapeBackSource implements BackSource {
  constructor(private readonly target: Pick<Window, "addEventListener" | "removeEventListener">) {}

  onBack(handler: () => boolean): () => void {
    const listener = (event: Event): void => {
      if ((event as KeyboardEvent).key !== "Escape") return;
      if (handler()) event.preventDefault();
    };
    this.target.addEventListener("keydown", listener);
    return () => this.target.removeEventListener("keydown", listener);
  }
}
