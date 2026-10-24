import { t } from "../strings";

export type UiCue = "tap" | "back" | "toggle";

/** Buttons whose action makes its own sound (object, clue, flip, accuse, link menu) stay out of the generic tap. */
const OWN_SOUND =
  ".lp-chip, .lp-object, .lp-hotspot, .lp-pinbutton, .lp-magnifier, .lp-accuse, .lp-own-sfx";

/** Which interface sound a click on `target` makes, or null for silence. */
export function uiCueFor(target: EventTarget | null): UiCue | null {
  if (!(target instanceof Element)) return null;
  const button = target.closest("button");
  if (!button || button.disabled) return null;
  if (button.matches(OWN_SOUND)) return null;
  if (button.getAttribute("role") === "switch") return "toggle";
  if (button.getAttribute("aria-label") === t("back")) return "back";
  return "tap";
}
