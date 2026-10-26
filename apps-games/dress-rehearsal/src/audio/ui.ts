import { t } from "../strings";

export type UiCue = "tap" | "back" | "toggle";

/** Controls that make their own sound (or none) sit inside an element with this attribute. */
export const OWN_SOUND_ATTR = "data-sfx" as const;

/** Which interface sound a click on `target` makes, or null when the control has its own cue. */
export function uiCueFor(target: EventTarget | null): UiCue | null {
  if (!(target instanceof Element)) return null;
  const button = target.closest("button");
  if (!button || button.disabled) return null;
  if (button.closest(`[${OWN_SOUND_ATTR}="own"]`)) return null;
  if (button.getAttribute("role") === "tab") return null;
  if (button.getAttribute("role") === "switch") return "toggle";
  if (button.getAttribute("aria-label") === t("back")) return "back";
  return "tap";
}
