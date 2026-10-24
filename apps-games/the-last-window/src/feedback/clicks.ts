import type { Scene } from "../audio/engine";
import type { FeedbackEvent } from "../audio/events";
import type { RouteName } from "../nav";

/** Areas whose buttons play their own, more specific sounds. */
const OWN_SOUND = ".tlw-stations, .tlw-seats, .tlw-ticket, .tlw-dialogue, [data-sfx='own']";

/** Which interface sound a click on `target` should play, if any. */
export function uiEventForClick(target: EventTarget | null): FeedbackEvent | null {
  const element = target instanceof Element ? target.closest("button") : null;
  if (!element || element.disabled || element.getAttribute("aria-disabled") === "true") return null;
  if (element.closest(OWN_SOUND)) return null;
  if (element.getAttribute("role") === "switch") return { type: "ui", ui: "toggle" };
  if (element.closest(".tlw-header__back")) return { type: "ui", ui: "back" };
  return { type: "ui", ui: "tap" };
}

export function musicSceneFor(route: RouteName): Scene {
  if (route === "shift") return "shift";
  if (route === "scene") return "story";
  return "menu";
}
