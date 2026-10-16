import type { AppPlugin } from "./plugins";
import { reportNativeError } from "./plugins";

/** Where "the app went to the background" and "came back" come from. */
export interface LifecycleSource {
  /** Both handlers are called on every transition; they must be safe to call twice in a row. */
  subscribe(handlers: { onPause(): void; onResume(): void }): () => void;
}

/** Browsers: the page visibility API, plus `pagehide` for tabs that are closed. */
export class WebLifecycleSource implements LifecycleSource {
  constructor(
    private readonly doc: Pick<Document, "addEventListener" | "removeEventListener" | "hidden">,
    private readonly win: Pick<Window, "addEventListener" | "removeEventListener">,
  ) {}

  subscribe(handlers: { onPause(): void; onResume(): void }): () => void {
    const onVisibility = (): void => (this.doc.hidden ? handlers.onPause() : handlers.onResume());
    const onPageHide = (): void => handlers.onPause();
    this.doc.addEventListener("visibilitychange", onVisibility);
    this.win.addEventListener("pagehide", onPageHide);
    return () => {
      this.doc.removeEventListener("visibilitychange", onVisibility);
      this.win.removeEventListener("pagehide", onPageHide);
    };
  }
}

/** Devices: `@capacitor/app` pause and resume events. */
export class CapacitorLifecycleSource implements LifecycleSource {
  constructor(private readonly app: Pick<AppPlugin, "addListener">) {}

  subscribe(handlers: { onPause(): void; onResume(): void }): () => void {
    const handles = [
      this.app.addListener("pause", handlers.onPause),
      this.app.addListener("resume", handlers.onResume),
    ];
    for (const handle of handles) {
      handle.catch((error: unknown) =>
        reportNativeError("registering a lifecycle listener", error),
      );
    }
    return () => {
      for (const handle of handles)
        void handle
          .then((h) => h.remove())
          .catch((error: unknown) => reportNativeError("removing a lifecycle listener", error));
    };
  }
}

export interface LifecycleDeps {
  /** True while the app is in the background: the game pauses and the pause menu opens. */
  setHidden(hidden: boolean): void;
  /** Writes the save. */
  save(): Promise<void>;
  /** Silences and restores the audio context. */
  audio: { suspend(): Promise<void>; resume(): Promise<void> };
}

/**
 * Background: pause the game (the pause menu opens over a drive), write the save and silence the
 * audio. Foreground: restore the audio and leave the pause menu showing, so the player chooses
 * when to drive on.
 */
export function bindLifecycle(source: LifecycleSource, deps: LifecycleDeps): () => void {
  return source.subscribe({
    onPause() {
      deps.setHidden(true);
      void deps.save().catch((error: unknown) => reportNativeError("saving on pause", error));
      void deps.audio
        .suspend()
        .catch((error: unknown) => reportNativeError("suspending audio", error));
    },
    onResume() {
      deps.setHidden(false);
      void deps.audio
        .resume()
        .catch((error: unknown) => reportNativeError("resuming audio", error));
    },
  });
}
