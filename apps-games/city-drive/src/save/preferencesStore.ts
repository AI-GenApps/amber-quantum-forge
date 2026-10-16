import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { SaveStore } from "@city-drive/core";

interface PreferencesLike {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoreDeps {
  isNative(): boolean;
  preferences: PreferencesLike;
  /** Browser storage. May throw or return undefined when the browser blocks it. */
  storage(): StorageLike | undefined;
}

const defaultStoreDeps: StoreDeps = {
  isNative: () => Capacitor.isNativePlatform(),
  preferences: Preferences,
  storage: () => globalThis.localStorage,
};

/**
 * Save storage for the app: Capacitor Preferences on a device, browser local storage on the web.
 * The choice is made once, at construction. Every failure rejects with a descriptive error, which
 * the save manager turns into a non-blocking notice.
 */
export class PreferencesSaveStore implements SaveStore {
  private readonly native: boolean;

  constructor(private readonly deps: StoreDeps = defaultStoreDeps) {
    this.native = deps.isNative();
  }

  get backend(): "preferences" | "localStorage" {
    return this.native ? "preferences" : "localStorage";
  }

  async get(key: string): Promise<string | null> {
    if (this.native) return (await this.deps.preferences.get({ key })).value;
    return this.browser("read", () => this.web().getItem(key));
  }

  async set(key: string, value: string): Promise<void> {
    if (this.native) return this.deps.preferences.set({ key, value });
    this.browser("write", () => this.web().setItem(key, value));
  }

  async remove(key: string): Promise<void> {
    if (this.native) return this.deps.preferences.remove({ key });
    this.browser("remove", () => this.web().removeItem(key));
  }

  private web(): StorageLike {
    const storage = this.deps.storage();
    if (!storage) throw new Error("browser storage is not available");
    return storage;
  }

  private browser<T>(action: string, run: () => T): T {
    try {
      return run();
    } catch (error) {
      throw new Error(`could not ${action} saved progress in browser storage: ${String(error)}`);
    }
  }
}
