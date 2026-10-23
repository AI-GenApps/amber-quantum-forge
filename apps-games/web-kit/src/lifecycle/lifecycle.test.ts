import { Style } from "@capacitor/status-bar";
import { describe, expect, it, vi } from "vitest";
import {
  type AppLike,
  createLifecycle,
  type ListenerHandle,
  type OrientationLike,
  type StatusBarLike,
  type VisibilitySource,
} from "./lifecycle";

function fakeApp() {
  const listeners = new Map<string, (arg: never) => void>();
  const removed: string[] = [];
  const app = {
    exitApp: vi.fn(async () => undefined),
    addListener: vi.fn(async (event: string, listener: (arg: never) => void) => {
      listeners.set(event, listener);
      const handle: ListenerHandle = {
        remove: async () => {
          removed.push(event);
        },
      };
      return handle;
    }),
  };
  return {
    app: app as unknown as AppLike,
    raw: app,
    removed,
    emit: (event: string, payload: unknown) =>
      (listeners.get(event) as ((arg: unknown) => void) | undefined)?.(payload),
  };
}

function fakeStatusBar() {
  return {
    setStyle: vi.fn(async (_o: { style: Style }) => undefined),
    setBackgroundColor: vi.fn(async (_o: { color: string }) => undefined),
    setOverlaysWebView: vi.fn(async (_o: { overlay: boolean }) => undefined),
    hide: vi.fn(async () => undefined),
    show: vi.fn(async () => undefined),
  } satisfies StatusBarLike;
}

function fakeOrientation() {
  return {
    lock: vi.fn(async (_o: { orientation: "portrait" | "landscape" }) => undefined),
    unlock: vi.fn(async () => undefined),
  } satisfies OrientationLike;
}

function fakeVisibility() {
  const handlers = new Set<() => void>();
  const source: VisibilitySource & { hidden: boolean } = {
    hidden: false,
    addEventListener: (_t, l) => void handlers.add(l),
    removeEventListener: (_t, l) => void handlers.delete(l),
  };
  return {
    source,
    handlers,
    setHidden(hidden: boolean) {
      source.hidden = hidden;
      for (const h of [...handlers]) h();
    },
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("on the web", () => {
  it("makes native-only calls no-ops", async () => {
    const { app, raw } = fakeApp();
    const bar = fakeStatusBar();
    const orientation = fakeOrientation();
    const lifecycle = createLifecycle({
      isNative: () => false,
      app,
      statusBar: bar,
      orientation,
      visibility: null,
    });
    expect(lifecycle.isNative).toBe(false);
    const back = vi.fn(() => true);
    const remove = lifecycle.onBack(back);
    await lifecycle.setupDisplay({ hideStatusBar: true });
    remove();
    expect(raw.addListener).not.toHaveBeenCalled();
    expect(bar.setStyle).not.toHaveBeenCalled();
    expect(orientation.lock).not.toHaveBeenCalled();
  });

  it("pauses and resumes from page visibility, once per change", () => {
    const vis = fakeVisibility();
    const lifecycle = createLifecycle({ isNative: () => false, visibility: vis.source });
    const pause = vi.fn();
    const resume = vi.fn();
    lifecycle.onPause(pause);
    lifecycle.onResume(resume);
    vis.setHidden(true);
    vis.setHidden(true);
    expect(pause).toHaveBeenCalledTimes(1);
    vis.setHidden(false);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes listeners and disposes the visibility hook", () => {
    const vis = fakeVisibility();
    const lifecycle = createLifecycle({ isNative: () => false, visibility: vis.source });
    const pause = vi.fn();
    const off = lifecycle.onPause(pause);
    off();
    vis.setHidden(true);
    expect(pause).not.toHaveBeenCalled();
    expect(vis.handlers.size).toBe(1);
    lifecycle.dispose();
    expect(vis.handlers.size).toBe(0);
  });

  it("uses the global document by default", () => {
    const lifecycle = createLifecycle({ isNative: () => false });
    const pause = vi.fn();
    lifecycle.onPause(pause);
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    expect(pause).toHaveBeenCalledTimes(1);
    lifecycle.dispose();
  });

  it("builds with the real plugins and does nothing native", async () => {
    const lifecycle = createLifecycle();
    expect(lifecycle.isNative).toBe(false);
    await expect(lifecycle.setupDisplay()).resolves.toBeUndefined();
    lifecycle.onBack(() => true)();
  });
});

describe("on a device", () => {
  it("reports pause and resume from app state changes", async () => {
    const { app, emit } = fakeApp();
    const lifecycle = createLifecycle({ isNative: () => true, app, visibility: null });
    const pause = vi.fn();
    const resume = vi.fn();
    lifecycle.onPause(pause);
    lifecycle.onResume(resume);
    await flush();
    emit("appStateChange", { isActive: false });
    emit("appStateChange", { isActive: false });
    emit("appStateChange", { isActive: true });
    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("routes back to the handler and exits when it declines", async () => {
    const { app, raw, emit } = fakeApp();
    const lifecycle = createLifecycle({ isNative: () => true, app, visibility: null });
    let handled = true;
    lifecycle.onBack(() => handled);
    await flush();
    emit("backButton", { canGoBack: false });
    expect(raw.exitApp).not.toHaveBeenCalled();
    handled = false;
    emit("backButton", { canGoBack: false });
    expect(raw.exitApp).toHaveBeenCalledTimes(1);
  });

  it("prefers a custom exit handler", async () => {
    const { app, raw, emit } = fakeApp();
    const lifecycle = createLifecycle({ isNative: () => true, app, visibility: null });
    const onExit = vi.fn();
    lifecycle.onBack(() => false, { onExit });
    await flush();
    emit("backButton", { canGoBack: true });
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(raw.exitApp).not.toHaveBeenCalled();
  });

  it("reports an exit failure instead of throwing", async () => {
    const { app, raw, emit } = fakeApp();
    raw.exitApp.mockRejectedValueOnce(new Error("no"));
    const onError = vi.fn();
    const lifecycle = createLifecycle({ isNative: () => true, app, visibility: null, onError });
    lifecycle.onBack(() => false);
    await flush();
    emit("backButton", { canGoBack: false });
    await flush();
    expect(onError).toHaveBeenCalledWith("closing the app", expect.any(Error));
  });

  it("removes native listeners on remove and dispose, even if removal comes first", async () => {
    const { app, removed } = fakeApp();
    const lifecycle = createLifecycle({ isNative: () => true, app, visibility: null });
    const off = lifecycle.onBack(() => true);
    off();
    await flush();
    expect(removed).toEqual(["backButton"]);
    lifecycle.onBack(() => true);
    lifecycle.dispose();
    await flush();
    expect(removed).toEqual(["backButton", "backButton"]);
    const early = createLifecycle({ isNative: () => true, app, visibility: null });
    early.onBack(() => true);
    early.dispose();
    await flush();
    expect(removed).toHaveLength(3);
  });

  it("reports a missing plugin instead of throwing", async () => {
    const onError = vi.fn();
    const rejecting = {
      exitApp: async () => undefined,
      addListener: async () => {
        throw new Error("not implemented");
      },
    } as unknown as AppLike;
    const throwing = {
      exitApp: async () => undefined,
      addListener: () => {
        throw new Error("sync failure");
      },
    } as unknown as AppLike;
    const a = createLifecycle({ isNative: () => true, app: rejecting, visibility: null, onError });
    a.onBack(() => true);
    a.onPause(() => undefined);
    const b = createLifecycle({ isNative: () => true, app: throwing, visibility: null, onError });
    b.onBack(() => true);
    await flush();
    expect(onError).toHaveBeenCalledWith("registering the back button", expect.any(Error));
    expect(onError).toHaveBeenCalledWith("listening for app state", expect.any(Error));
    expect(onError.mock.calls.length).toBe(3);
  });

  it("locks portrait and configures the status bar", async () => {
    const bar = fakeStatusBar();
    const orientation = fakeOrientation();
    const lifecycle = createLifecycle({
      isNative: () => true,
      statusBar: bar,
      orientation,
      visibility: null,
    });
    await lifecycle.setupDisplay({ statusBarColor: "#101820" });
    expect(orientation.lock).toHaveBeenCalledWith({ orientation: "portrait" });
    expect(bar.setStyle).toHaveBeenCalledWith({ style: Style.Dark });
    expect(bar.setOverlaysWebView).toHaveBeenCalledWith({ overlay: false });
    expect(bar.setBackgroundColor).toHaveBeenCalledWith({ color: "#101820" });
    expect(bar.show).toHaveBeenCalled();
    expect(bar.hide).not.toHaveBeenCalled();
  });

  it("supports dark text, overlay, hidden bar and no orientation lock", async () => {
    const bar = fakeStatusBar();
    const orientation = fakeOrientation();
    const lifecycle = createLifecycle({
      isNative: () => true,
      statusBar: bar,
      orientation,
      visibility: null,
    });
    await lifecycle.setupDisplay({
      lockPortrait: false,
      statusBarStyle: "dark-text",
      overlay: true,
      hideStatusBar: true,
    });
    expect(orientation.lock).not.toHaveBeenCalled();
    expect(bar.setStyle).toHaveBeenCalledWith({ style: Style.Light });
    expect(bar.setOverlaysWebView).toHaveBeenCalledWith({ overlay: true });
    expect(bar.hide).toHaveBeenCalled();
    expect(bar.setBackgroundColor).not.toHaveBeenCalled();
  });

  it("keeps going when a display plugin fails", async () => {
    const bar = fakeStatusBar();
    bar.setStyle.mockRejectedValueOnce(new Error("no status bar"));
    const orientation = fakeOrientation();
    orientation.lock.mockRejectedValueOnce(new Error("no orientation"));
    const onError = vi.fn();
    const lifecycle = createLifecycle({
      isNative: () => true,
      statusBar: bar,
      orientation,
      visibility: null,
      onError,
    });
    await expect(lifecycle.setupDisplay()).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledTimes(2);
    expect(bar.setOverlaysWebView).toHaveBeenCalled();
  });
});
