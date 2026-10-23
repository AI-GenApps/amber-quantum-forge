import { Capacitor } from "@capacitor/core";
import type { StorageAdapter } from "../types";
import { createLocalStorageAdapter, isLocalStorageUsable } from "./local-storage";
import { createMemoryAdapter } from "./memory";
import { createPreferencesAdapter } from "./preferences";

export interface DefaultAdapterEnv {
  isNative(): boolean;
  localStorageUsable(): boolean;
}

const realEnv: DefaultAdapterEnv = {
  isNative: () => Capacitor.isNativePlatform(),
  localStorageUsable: () => isLocalStorageUsable(),
};

/** Preferences on device, `localStorage` on the web, memory if the browser blocks storage. */
export function createDefaultAdapter(env: DefaultAdapterEnv = realEnv): StorageAdapter {
  if (env.isNative()) return createPreferencesAdapter();
  if (env.localStorageUsable()) return createLocalStorageAdapter();
  return createMemoryAdapter();
}
