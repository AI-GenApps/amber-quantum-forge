import { createDefaultAdapter, type SettingsStore, type StorageAdapter } from "@web-games/kit";
import { createFlagsStore, type FlagsStore } from "../save/flags";
import { createProfileStore } from "../save/profile";
import { createRunsStore, type RunsStore } from "../save/runs";
import { type Clock, createProgression, type Progression } from "./progression";
import { createGameSettings } from "./settings";

export interface Services {
  adapter: StorageAdapter;
  now: Clock;
  settings: SettingsStore;
  runs: RunsStore;
  flags: FlagsStore;
  progression: Progression;
  /** Loads settings and the profile, then runs the weekly freeze refill. Safe to call once. */
  start(): Promise<void>;
}

export interface ServiceOptions {
  adapter?: StorageAdapter;
  now?: Clock;
}

export function createServices(options: ServiceOptions = {}): Services {
  const adapter = options.adapter ?? createDefaultAdapter();
  const now = options.now ?? (() => new Date());
  const settings = createGameSettings(adapter);
  const runs = createRunsStore(adapter);
  const flags = createFlagsStore(adapter);
  const progression = createProgression({ store: createProfileStore(adapter), now, runs });
  return {
    adapter,
    now,
    settings,
    runs,
    flags,
    progression,
    async start() {
      await settings.load();
      await progression.load();
      await progression.refreshOnOpen();
    },
  };
}

export * from "./daily";
export * from "./progression";
export * from "./progression-rules";
export * from "./settings";
