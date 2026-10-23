import type { SaveSchema, SaveStore, StorageAdapter } from "../save";
import { createSaveStore } from "../save";

export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  /** Player override. The effective value is also true when the system asks for reduced motion. */
  reducedMotion: boolean;
  /** High-contrast and colour-blind-safe palette. Games map it to their own alternate tokens. */
  highContrast: boolean;
}

export const SETTINGS_VERSION = 1;

export const defaultSettings: Readonly<Settings> = Object.freeze({
  sound: true,
  music: true,
  haptics: true,
  reducedMotion: false,
  highContrast: false,
});

const KEYS = Object.keys(defaultSettings) as Array<keyof Settings>;

/** Keeps known boolean keys, fills the rest from defaults, drops anything else. */
export function sanitizeSettings(data: unknown): Settings | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const input = data as Record<string, unknown>;
  const out: Settings = { ...defaultSettings };
  for (const key of KEYS) {
    const value = input[key];
    if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

export function settingsSchema(gameId: string): SaveSchema<Settings> {
  return {
    key: `${gameId}.settings`,
    version: SETTINGS_VERSION,
    defaults: () => ({ ...defaultSettings }),
    parse: sanitizeSettings,
  };
}

export type SettingsListener = (
  settings: Readonly<Settings>,
  changed: Array<keyof Settings>,
) => void;

export interface SettingsStore {
  get(): Readonly<Settings>;
  /** Loads from storage (once) and notifies listeners if the values differ from the defaults. */
  load(): Promise<Readonly<Settings>>;
  set(patch: Partial<Settings>): Promise<Readonly<Settings>>;
  toggle(key: keyof Settings): Promise<Readonly<Settings>>;
  reset(): Promise<Readonly<Settings>>;
  subscribe(listener: SettingsListener): () => void;
  /** `reducedMotion` combined with the system preference. */
  effectiveReducedMotion(systemPrefers?: boolean): boolean;
}

export function createSettingsStore(
  adapter: StorageAdapter,
  gameId: string,
  store: SaveStore<Settings> = createSaveStore(adapter, settingsSchema(gameId)),
): SettingsStore {
  let current: Settings = { ...defaultSettings };
  const listeners = new Set<SettingsListener>();

  const apply = (next: Settings): Array<keyof Settings> => {
    const changed = KEYS.filter((key) => current[key] !== next[key]);
    current = next;
    if (changed.length > 0) {
      const snapshot = { ...current };
      for (const listener of [...listeners]) listener(snapshot, changed);
    }
    return changed;
  };

  const set = async (patch: Partial<Settings>): Promise<Readonly<Settings>> => {
    const merged = sanitizeSettings({ ...current, ...patch }) ?? { ...defaultSettings };
    apply(merged);
    await store.save(merged);
    return { ...current };
  };

  return {
    get: () => ({ ...current }),
    async load() {
      const { data } = await store.load();
      apply(data);
      return { ...current };
    },
    set,
    toggle: (key) => set({ [key]: !current[key] }),
    async reset() {
      apply({ ...defaultSettings });
      await store.reset();
      return { ...current };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    effectiveReducedMotion: (systemPrefers = false) => current.reducedMotion || systemPrefers,
  };
}

/** Reads the `prefers-reduced-motion` media query; false where `matchMedia` is missing. */
export function systemPrefersReducedMotion(
  matchMedia: ((query: string) => { matches: boolean }) | undefined = globalThis.matchMedia?.bind(
    globalThis,
  ),
): boolean {
  if (!matchMedia) return false;
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
