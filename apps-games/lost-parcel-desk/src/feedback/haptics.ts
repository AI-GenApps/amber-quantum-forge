import {
  createHaptics,
  type Haptics,
  type HapticsOptions,
  type SettingsStore,
} from "@web-games/kit";
import type { HapticCue } from "../audio/events";

export interface GameHaptics {
  readonly haptics: Haptics;
  fire(cue: HapticCue | null): void;
  /** Follows the settings store at once and on every change; returns the unsubscribe function. */
  follow(settings: Pick<SettingsStore, "get" | "subscribe">): () => void;
}

export function createGameHaptics(options: HapticsOptions = {}): GameHaptics {
  const haptics = createHaptics(options);
  return {
    haptics,
    fire(cue) {
      if (!cue) return;
      if (cue.kind === "impact") haptics.impact(cue.style);
      else haptics.notify(cue.type);
    },
    follow(settings) {
      haptics.syncSettings({ haptics: settings.get().haptics });
      return settings.subscribe((next) => haptics.syncSettings({ haptics: next.haptics }));
    },
  };
}
