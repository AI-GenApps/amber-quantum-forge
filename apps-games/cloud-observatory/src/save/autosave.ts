import type { Profile } from "@web-games/cloud-observatory-core";
import type { SaveStore } from "@web-games/kit";

export type AutosaveReason =
  | "tick"
  | "purchase"
  | "chart"
  | "eclipse"
  | "comet"
  | "resume"
  | "meta"
  | "pause";

export type Schedule = (run: () => void, delayMs: number) => () => void;

export interface AutosaveOptions {
  readonly store: Pick<SaveStore<Profile>, "save">;
  readonly getProfile: () => Profile;
  readonly schedule: Schedule;
  readonly onPause?: (listener: () => void) => () => void;
  readonly intervalSeconds?: number;
  readonly debounceMs?: number;
  readonly onError?: (error: unknown) => void;
}

export interface Autosave {
  enable(): void;
  disable(): void;
  tick(dtSeconds: number): void;
  trigger(reason: AutosaveReason): void;
  flush(): Promise<void>;
  dispose(): void;
  readonly enabled: boolean;
  readonly pending: boolean;
  readonly saves: number;
  readonly lastReason: AutosaveReason | null;
}

export const AUTOSAVE_INTERVAL_SECONDS = 10;
export const AUTOSAVE_DEBOUNCE_MS = 400;

export function createAutosave(options: AutosaveOptions): Autosave {
  const interval = options.intervalSeconds ?? AUTOSAVE_INTERVAL_SECONDS;
  const debounce = options.debounceMs ?? AUTOSAVE_DEBOUNCE_MS;
  let enabled = false;
  let elapsed = 0;
  let cancel: (() => void) | null = null;
  let saves = 0;
  let lastReason: AutosaveReason | null = null;

  const persist = async (): Promise<void> => {
    try {
      await options.store.save(options.getProfile());
      saves += 1;
    } catch (error) {
      options.onError?.(error);
    }
  };

  const request = (delayMs: number): void => {
    if (!enabled || cancel !== null) return;
    cancel = options.schedule(() => {
      cancel = null;
      void persist();
    }, delayMs);
  };

  const clearScheduled = (): void => {
    cancel?.();
    cancel = null;
  };

  const flush = async (): Promise<void> => {
    if (!enabled) return;
    clearScheduled();
    elapsed = 0;
    await persist();
  };

  const unsubscribe = options.onPause?.(() => void flush());

  return {
    enable() {
      enabled = true;
    },
    disable() {
      enabled = false;
      elapsed = 0;
      clearScheduled();
    },
    tick(dtSeconds) {
      if (!enabled || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return;
      elapsed += dtSeconds;
      if (elapsed < interval) return;
      elapsed %= interval;
      request(0);
    },
    trigger(reason) {
      lastReason = reason;
      request(debounce);
    },
    flush,
    dispose() {
      unsubscribe?.();
      clearScheduled();
      enabled = false;
    },
    get enabled() {
      return enabled;
    },
    get pending() {
      return cancel !== null;
    },
    get saves() {
      return saves;
    },
    get lastReason() {
      return lastReason;
    },
  };
}
