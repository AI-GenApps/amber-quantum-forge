import type { BackSource } from "../ui/nav/back";
import { CapacitorBackSource } from "./back";
import { capacitorDisplay, type DisplayService, noopDisplay } from "./display";
import type { ExitPrompt } from "./exitPrompt";
import { capacitorKeepAwake, type KeepAwakeService, noopKeepAwake } from "./keepAwake";
import { CapacitorLifecycleSource, type LifecycleSource, WebLifecycleSource } from "./lifecycle";
import { capacitorPlugins, isNativePlatform, type NativePlugins } from "./plugins";

export { DomExitPrompt, type ExitPrompt } from "./exitPrompt";
export { bindKeepAwake } from "./keepAwake";
export { bindLifecycle } from "./lifecycle";

export interface NativeServices {
  native: boolean;
  lifecycle: LifecycleSource;
  keepAwake: KeepAwakeService;
  display: DisplayService;
  /** The hardware back button on a device; undefined on the web, where Escape is the back key. */
  deviceBack: BackSource | undefined;
}

export interface NativeEnv {
  isNative(): boolean;
  plugins(): NativePlugins;
  browser: {
    document: ConstructorParameters<typeof WebLifecycleSource>[0];
    window: ConstructorParameters<typeof WebLifecycleSource>[1];
  };
  exitPrompt: ExitPrompt;
}

/**
 * Picks the device or web implementation of every native feature. On the web nothing here loads a
 * plugin, the keep-awake and display services do nothing, and lifecycle comes from page visibility.
 */
export function createNativeServices(env: NativeEnv): NativeServices {
  if (!env.isNative()) {
    return {
      native: false,
      lifecycle: new WebLifecycleSource(env.browser.document, env.browser.window),
      keepAwake: noopKeepAwake,
      display: noopDisplay,
      deviceBack: undefined,
    };
  }
  const plugins = env.plugins();
  return {
    native: true,
    lifecycle: new CapacitorLifecycleSource(plugins.app),
    keepAwake: capacitorKeepAwake(plugins.keepAwake),
    display: capacitorDisplay(plugins),
    deviceBack: new CapacitorBackSource(plugins.app, env.exitPrompt),
  };
}

export function browserNativeEnv(exitPrompt: ExitPrompt): NativeEnv {
  return {
    isNative: isNativePlatform,
    plugins: capacitorPlugins,
    browser: { document, window },
    exitPrompt,
  };
}
