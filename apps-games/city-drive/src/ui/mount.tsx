import { render } from "preact";
import { App, type AppProps } from "./App";
import { GAME_TITLE } from "./brand";
import type { BackSource } from "./nav/back";
import "./tokens.css";
import "./controls/controls.css";
import "./screens.css";
import "./hud.css";
import "./onboarding/onboarding.css";

export interface MountedUi {
  dispose(): void;
}

/**
 * Mounts the app into `host`, sets the page title and wires the back source (Escape on the web)
 * and the Enter key. Returns a handle that tears all of it down.
 */
export function mountUi(
  host: HTMLElement,
  props: AppProps,
  back: BackSource,
  keys: Pick<Window, "addEventListener" | "removeEventListener">,
): MountedUi {
  host.ownerDocument.title = GAME_TITLE;
  render(<App {...props} />, host);
  const stopBack = back.onBack(() => props.controller.back());
  const onKey = (event: Event): void => {
    if ((event as KeyboardEvent).key !== "Enter") return;
    const target = event.target as HTMLElement | null;
    // A focused button handles Enter itself; the shortcut is for the bare page.
    if (target?.tagName === "BUTTON") return;
    props.controller.confirm();
  };
  keys.addEventListener("keydown", onKey);
  return {
    dispose() {
      stopBack();
      keys.removeEventListener("keydown", onKey);
      render(null, host);
    },
  };
}
