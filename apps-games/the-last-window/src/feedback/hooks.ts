import { useEffect } from "preact/hooks";
import type { Scene } from "../audio/engine";
import { useMotion } from "../motion/useMotion";
import { useApp } from "../state/app";
import { type Feedback, noopFeedback } from "./feedback";

export function useFeedback(): Feedback {
  return useApp().feedback ?? noopFeedback;
}

/** Selects the music for the lifetime of the calling screen. */
export function useMusicScene(scene: Scene): void {
  const feedback = useFeedback();
  useEffect(() => {
    feedback.setScene(scene);
  }, [feedback, scene]);
}

/** Rain ambience while `raining`; stops when the caller unmounts. */
export function useRain(raining: boolean): void {
  const feedback = useFeedback();
  useEffect(() => {
    feedback.setRain(raining);
    return () => feedback.setRain(false);
  }, [feedback, raining]);
}

/** Plays the sheet sound and slides the newest sheet in when `open` turns true. */
export function useSheetFx(open: boolean): void {
  const feedback = useFeedback();
  const motion = useMotion();
  useEffect(() => {
    if (!open) return;
    feedback.fire({ type: "ui", ui: "sheet" });
    const sheets = document.querySelectorAll<HTMLElement>(".wg-sheet");
    const top = sheets[sheets.length - 1];
    if (top) void motion.sheetSlide(top);
  }, [open, feedback, motion]);
}

/** The screen turns in like a page when it appears. */
export function usePageTurn(screen: string): void {
  const motion = useMotion();
  // biome-ignore lint/correctness/useExhaustiveDependencies: once per screen
  useEffect(() => {
    const element = document.querySelector<HTMLElement>(`[data-screen="${screen}"]`);
    if (element) void motion.pageTurn(element);
  }, []);
}
