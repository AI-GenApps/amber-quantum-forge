import { t } from "../strings";

export type UiCue = "tap" | "back" | "toggle";

/** Which interface sound a click on `target` makes, or null for silence (Run has its own sound). */
export function uiCueFor(target: EventTarget | null): UiCue | null {
  if (!(target instanceof Element)) return null;
  const button = target.closest("button");
  if (!button || button.disabled) return null;
  if (button.classList.contains("fd-run")) return null;
  if (button.getAttribute("role") === "switch") return "toggle";
  if (button.getAttribute("aria-label") === t("back")) return "back";
  return "tap";
}
