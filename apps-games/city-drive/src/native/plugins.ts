import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { StatusBar } from "@capacitor/status-bar";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { GAME_TITLE } from "../ui/brand";

/**
 * The slices of each Capacitor plugin the game calls. Everything in `src/native` talks to these
 * interfaces, so tests pass mocks and the web build never touches a plugin.
 */
export interface ListenerHandle {
  remove(): Promise<void>;
}

export interface AppPlugin {
  addListener(
    event: "backButton",
    listener: (state: { canGoBack: boolean }) => void,
  ): Promise<ListenerHandle>;
  addListener(event: "pause", listener: () => void): Promise<ListenerHandle>;
  addListener(event: "resume", listener: () => void): Promise<ListenerHandle>;
  exitApp(): Promise<void>;
}

export interface KeepAwakePlugin {
  keepAwake(): Promise<void>;
  allowSleep(): Promise<void>;
}

export interface StatusBarPlugin {
  hide(): Promise<void>;
  show(): Promise<void>;
}

export interface ScreenOrientationPlugin {
  lock(options: { orientation: "landscape" }): Promise<void>;
}

export interface NativePlugins {
  app: AppPlugin;
  keepAwake: KeepAwakePlugin;
  statusBar: StatusBarPlugin;
  orientation: ScreenOrientationPlugin;
}

/** The real Capacitor plugins. Only call this on a device: the web build never needs them. */
export function capacitorPlugins(): NativePlugins {
  return { app: App, keepAwake: KeepAwake, statusBar: StatusBar, orientation: ScreenOrientation };
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/** Logs a failed plugin call. Native features are best effort: a failure never stops the game. */
export function reportNativeError(what: string, error: unknown): void {
  console.error(`${GAME_TITLE}: ${what} failed`, error);
}
