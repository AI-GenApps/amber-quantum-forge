import { useEffect } from "preact/hooks";
import { boardFeedback } from "../audio/events";
import { uiCueFor } from "../audio/ui";
import { useApp, useFeedback } from "../state/app";

/** Plays the board sounds and haptics for every change of the open case, whichever screen caused it. */
export function useGameFeedback(): void {
  const { game } = useApp();
  const feedback = useFeedback();
  useEffect(() => {
    let previous = game.getState().active?.state ?? null;
    return game.subscribe((next) => {
      const current = next.active?.state ?? null;
      for (const event of boardFeedback(previous, current)) feedback.fire(event);
      previous = current;
    });
  }, [game, feedback]);
}

/** The interface sounds: taps, back, switches. Buttons with their own sound are skipped. */
export function useUiSounds(): void {
  const feedback = useFeedback();
  useEffect(() => {
    const onClick = (event: MouseEvent): void => {
      const cue = uiCueFor(event.target);
      if (cue) feedback.fire({ type: "ui", ui: cue });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [feedback]);
}
