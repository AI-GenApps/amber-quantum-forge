import type { KeepAwakePlugin } from "./plugins";
import { reportNativeError } from "./plugins";

/** Keeps the screen on. */
export interface KeepAwakeService {
  set(awake: boolean): void;
}

/** Web and tests: the browser sleeps the screen as it likes. */
export const noopKeepAwake: KeepAwakeService = { set: () => undefined };

export function capacitorKeepAwake(plugin: KeepAwakePlugin): KeepAwakeService {
  let current = false;
  return {
    set(awake) {
      if (awake === current) return;
      current = awake;
      const call = awake ? plugin.keepAwake() : plugin.allowSleep();
      call.catch((error: unknown) => {
        current = !awake;
        reportNativeError(
          awake ? "keeping the screen awake" : "allowing the screen to sleep",
          error,
        );
      });
    },
  };
}

/** The slice of the UI controller that decides whether the player is driving. */
export interface DrivingSource {
  readonly view: { readonly screen: string; readonly loading: string | undefined };
  subscribe(listener: () => void): () => void;
}

/** The screen stays on only while the drive is running (not in menus, pause or loading). */
export function bindKeepAwake(source: DrivingSource, service: KeepAwakeService): () => void {
  const sync = (): void =>
    service.set(source.view.screen === "play" && source.view.loading === undefined);
  sync();
  return source.subscribe(sync);
}
