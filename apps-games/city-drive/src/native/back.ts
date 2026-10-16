import type { BackSource } from "../ui/nav/back";
import type { ExitPrompt } from "./exitPrompt";
import type { AppPlugin } from "./plugins";
import { reportNativeError } from "./plugins";

/**
 * Android's hardware back button (and gesture) as a `BackSource`. The game handles it while it
 * can go back (menus, pause, mission screens). On the home screen nothing can go back, so the
 * player is asked before the app exits; a second back press closes that question.
 */
export class CapacitorBackSource implements BackSource {
  constructor(
    private readonly app: Pick<AppPlugin, "addListener" | "exitApp">,
    private readonly prompt: ExitPrompt,
  ) {}

  onBack(handler: () => boolean): () => void {
    const handle = this.app.addListener("backButton", () => {
      if (this.prompt.isOpen) {
        this.prompt.cancel();
        return;
      }
      if (handler()) return;
      void this.confirmExit();
    });
    handle.catch((error: unknown) => reportNativeError("registering the back button", error));
    return () => {
      void handle
        .then((h) => h.remove())
        .catch((error: unknown) => reportNativeError("removing the back button listener", error));
    };
  }

  private async confirmExit(): Promise<void> {
    if (!(await this.prompt.confirm())) return;
    await this.app.exitApp().catch((error: unknown) => reportNativeError("exiting the app", error));
  }
}
