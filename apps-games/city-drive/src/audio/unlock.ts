import { GAME_TITLE } from "../ui/brand";

/** Browsers start audio contexts suspended; the first real gesture is what lets them run. */
const GESTURES = ["pointerdown", "touchend", "keydown", "mousedown"] as const;

export interface Unlockable {
  unlock(): Promise<void>;
}

/**
 * Calls `target.unlock()` on the first user gesture, then stops listening. If unlocking fails the
 * error is logged and listening resumes, so a later gesture can try again.
 */
export function unlockOnFirstGesture(
  events: Pick<EventTarget, "addEventListener" | "removeEventListener">,
  target: Unlockable,
): () => void {
  const remove = (): void => {
    for (const name of GESTURES) events.removeEventListener(name, onGesture, true);
  };
  const onGesture = (): void => {
    remove();
    target.unlock().catch((error: unknown) => {
      console.warn(`${GAME_TITLE}: audio could not start; it will retry on the next tap`, error);
      add();
    });
  };
  const add = (): void => {
    for (const name of GESTURES) events.addEventListener(name, onGesture, true);
  };
  add();
  return remove;
}
