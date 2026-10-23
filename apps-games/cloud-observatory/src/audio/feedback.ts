import type { Haptics, SettingsStore } from "@web-games/kit";
import type { Feedback, HapticKind, SfxId } from "../ui/feedback";
import type { GameAudio } from "./cues";

export interface AppFeedback extends Feedback {
  /** Stops following the settings store. */
  dispose(): void;
}

/**
 * The real Feedback: sound through the game audio table, haptics through the kit wrapper. Both
 * follow the settings store, so a toggle takes effect on the next call.
 */
export function createFeedback(
  audio: Pick<GameAudio, "play" | "syncSettings">,
  haptics: Pick<Haptics, "impact" | "notify" | "syncSettings">,
  settings: Pick<SettingsStore, "get" | "subscribe">,
): AppFeedback {
  const apply = (next: { sound: boolean; music: boolean; haptics: boolean }): void => {
    audio.syncSettings({ sound: next.sound, music: next.music });
    haptics.syncSettings({ haptics: next.haptics });
  };
  apply(settings.get());
  const off = settings.subscribe((next) => apply(next));

  return {
    sfx: (id: SfxId) => void audio.play(id),
    haptic(kind: HapticKind) {
      switch (kind) {
        case "light":
          haptics.impact("light");
          break;
        case "medium":
          haptics.impact("medium");
          break;
        case "warning":
          haptics.notify("warning");
          break;
        case "success":
          haptics.notify("success");
          break;
      }
    },
    dispose: off,
  };
}
