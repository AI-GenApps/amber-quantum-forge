import type { Lifecycle, SettingsStore, StorageAdapter } from "@web-games/kit";
import { localDateKey } from "@web-games/kit";
import { createGameStore, type GameStore } from "./game";
import { createGameSettings, createProfileStore } from "./saveStores";
import type { TickSource } from "./ticker";

export interface Services {
  game: GameStore;
  settings: SettingsStore;
}

export interface ServiceOptions {
  clock?: () => Date;
  tick?: TickSource;
}

export function createServices(adapter: StorageAdapter, options: ServiceOptions = {}): Services {
  const game = createGameStore({
    store: createProfileStore(adapter),
    clock: options.clock ?? (() => new Date()),
    localDateKey,
    ...(options.tick === undefined ? {} : { tick: options.tick }),
  });
  return { game, settings: createGameSettings(adapter) };
}

export async function loadServices(services: Services): Promise<void> {
  await Promise.all([services.game.load(), services.settings.load()]);
}

/** Pauses the case clock and awaits any pending save when the app goes to the background. */
export function bindGameLifecycle(
  game: GameStore,
  lifecycle: Pick<Lifecycle, "onPause" | "onResume">,
) {
  const offPause = lifecycle.onPause(() => {
    game.setVisible(false);
    void game.flush();
  });
  const offResume = lifecycle.onResume(() => game.setVisible(true));
  return () => {
    offPause();
    offResume();
  };
}
