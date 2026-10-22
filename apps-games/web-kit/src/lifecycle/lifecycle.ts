import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { StatusBar, Style } from "@capacitor/status-bar";

export interface ListenerHandle {
  remove(): Promise<void>;
}

export interface AppLike {
  addListener(
    event: "appStateChange",
    listener: (state: { isActive: boolean }) => void,
  ): Promise<ListenerHandle>;
  addListener(
    event: "backButton",
    listener: (event: { canGoBack: boolean }) => void,
  ): Promise<ListenerHandle>;
  exitApp(): Promise<void>;
}

export interface StatusBarLike {
  setStyle(options: { style: Style }): Promise<void>;
  setBackgroundColor(options: { color: string }): Promise<void>;
  setOverlaysWebView(options: { overlay: boolean }): Promise<void>;
  hide(): Promise<void>;
  show(): Promise<void>;
}

export interface OrientationLike {
  lock(options: { orientation: "portrait" | "landscape" }): Promise<void>;
  unlock(): Promise<void>;
}

export interface VisibilitySource {
  readonly hidden?: boolean;
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
}

export interface LifecycleOptions {
  isNative?: () => boolean;
  app?: AppLike;
  statusBar?: StatusBarLike;
  orientation?: OrientationLike;
  /** Source of `visibilitychange`; defaults to the global document, if any. */
  visibility?: VisibilitySource | null;
  /** Receives errors from plugins that are missing or refuse a call. */
  onError?: (context: string, error: unknown) => void;
}

export interface DisplayConfig {
  /** Lock to portrait (default true). */
  lockPortrait?: boolean;
  /** `"light-text"` for dark backgrounds, `"dark-text"` for light ones (default light-text). */
  statusBarStyle?: "light-text" | "dark-text";
  /** Android status bar colour, e.g. the page background. */
  statusBarColor?: string;
  /** Draw the web view under the status bar (default false). */
  overlay?: boolean;
  /** Hide the status bar entirely (default false). */
  hideStatusBar?: boolean;
}

export interface BackOptions {
  /** Called when the handler declines (returns false). Defaults to closing the app. */
  onExit?: () => void;
}

export interface Lifecycle {
  readonly isNative: boolean;
  /** Fires when the app or page goes to the background. Returns an unsubscribe function. */
  onPause(listener: () => void): () => void;
  /** Fires when the app or page returns to the foreground. */
  onResume(listener: () => void): () => void;
  /**
   * Routes the Android back button. `handler` returns true when it handled the press (closed a
   * sheet, popped a screen). On the web this does nothing and returns a no-op remover.
   */
  onBack(handler: () => boolean, options?: BackOptions): () => void;
  /** Portrait lock and status bar setup. No-op on the web. */
  setupDisplay(config?: DisplayConfig): Promise<void>;
  dispose(): void;
}

function defaultVisibility(): VisibilitySource | null {
  return (globalThis.document as VisibilitySource | undefined) ?? null;
}

export function createLifecycle(options: LifecycleOptions = {}): Lifecycle {
  const isNative = options.isNative ?? (() => Capacitor.isNativePlatform());
  const native = isNative();
  const app: AppLike = options.app ?? App;
  const statusBar: StatusBarLike = options.statusBar ?? StatusBar;
  const orientation: OrientationLike = options.orientation ?? ScreenOrientation;
  const visibility = options.visibility === undefined ? defaultVisibility() : options.visibility;
  const report = (context: string, error: unknown): void => options.onError?.(context, error);

  const pauseListeners = new Set<() => void>();
  const resumeListeners = new Set<() => void>();
  const cleanups: Array<() => void> = [];
  let active = true;
  let started = false;

  const setActive = (next: boolean): void => {
    if (next === active) return;
    active = next;
    for (const listener of [...(next ? resumeListeners : pauseListeners)]) listener();
  };

  const attachListener = (
    register: () => Promise<ListenerHandle>,
    context: string,
  ): (() => void) => {
    let handle: ListenerHandle | null = null;
    let removed = false;
    const detach = (target: ListenerHandle): void => void target.remove().catch(() => undefined);
    const onFailure = (error: unknown): void => report(context, error);
    try {
      register().then((result) => {
        if (removed) detach(result);
        else handle = result;
      }, onFailure);
    } catch (error) {
      onFailure(error);
    }
    const remove = (): void => {
      removed = true;
      if (handle) detach(handle);
    };
    cleanups.push(remove);
    return remove;
  };

  const start = (): void => {
    if (started) return;
    started = true;
    if (visibility) {
      const onVisibility = (): void => setActive(!visibility.hidden);
      visibility.addEventListener("visibilitychange", onVisibility);
      cleanups.push(() => visibility.removeEventListener("visibilitychange", onVisibility));
    }
    if (native) {
      attachListener(
        () => app.addListener("appStateChange", (state) => setActive(state.isActive)),
        "listening for app state",
      );
    }
  };

  const attempt = async (context: string, call: () => Promise<void>): Promise<void> => {
    try {
      await call();
    } catch (error) {
      report(context, error);
    }
  };

  return {
    isNative: native,
    onPause(listener) {
      start();
      pauseListeners.add(listener);
      return () => void pauseListeners.delete(listener);
    },
    onResume(listener) {
      start();
      resumeListeners.add(listener);
      return () => void resumeListeners.delete(listener);
    },
    onBack(handler, backOptions = {}) {
      if (!native) return () => undefined;
      return attachListener(
        () =>
          app.addListener("backButton", () => {
            if (handler()) return;
            if (backOptions.onExit) backOptions.onExit();
            else void attempt("closing the app", () => app.exitApp());
          }),
        "registering the back button",
      );
    },
    async setupDisplay(config = {}) {
      if (!native) return;
      const jobs: Array<Promise<void>> = [];
      if (config.lockPortrait ?? true) {
        jobs.push(attempt("locking portrait", () => orientation.lock({ orientation: "portrait" })));
      }
      jobs.push(
        attempt("setting the status bar style", () =>
          statusBar.setStyle({
            style: config.statusBarStyle === "dark-text" ? Style.Light : Style.Dark,
          }),
        ),
        attempt("setting status bar overlay", () =>
          statusBar.setOverlaysWebView({ overlay: config.overlay ?? false }),
        ),
      );
      if (config.statusBarColor) {
        const color = config.statusBarColor;
        jobs.push(
          attempt("setting the status bar colour", () => statusBar.setBackgroundColor({ color })),
        );
      }
      jobs.push(
        attempt("toggling the status bar", () =>
          config.hideStatusBar ? statusBar.hide() : statusBar.show(),
        ),
      );
      await Promise.all(jobs);
    },
    dispose() {
      for (const cleanup of cleanups.splice(0)) cleanup();
      pauseListeners.clear();
      resumeListeners.clear();
      started = false;
    },
  };
}
