import type { ScreenOrientationPlugin, StatusBarPlugin } from "./plugins";
import { reportNativeError } from "./plugins";

/** Landscape lock and the hidden status bar. The game is an immersive landscape app on a device. */
export interface DisplayService {
  /** Locks landscape and hides the status bar. Call again after the app returns to the front. */
  enterGameDisplay(): Promise<void>;
}

export const noopDisplay: DisplayService = { enterGameDisplay: async () => undefined };

export function capacitorDisplay(plugins: {
  orientation: ScreenOrientationPlugin;
  statusBar: StatusBarPlugin;
}): DisplayService {
  return {
    async enterGameDisplay() {
      await Promise.all([
        plugins.orientation
          .lock({ orientation: "landscape" })
          .catch((error: unknown) => reportNativeError("locking landscape", error)),
        plugins.statusBar
          .hide()
          .catch((error: unknown) => reportNativeError("hiding the status bar", error)),
      ]);
    },
  };
}
