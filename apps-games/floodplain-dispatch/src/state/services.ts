import {
  type Lifecycle,
  localDateKey,
  type SettingsStore,
  type StorageAdapter,
} from "@web-games/kit";
import { createGameStore, type GameStore } from "./game";
import { createGameSettings, createProfileStore } from "./saveStores";

export interface Services {
  game: GameStore;
  settings: SettingsStore;
}

export interface ServiceOptions {
  clock?: () => Date;
  lifecycle?: Pick<Lifecycle, "onPause">;
}

export function createServices(adapter: StorageAdapter, options: ServiceOptions = {}): Services {
  const game = createGameStore({
    store: createProfileStore(adapter),
    clock: options.clock ?? (() => new Date()),
    localDateKey,
  });
  const settings = createGameSettings(adapter);
  options.lifecycle?.onPause(() => {
    void game.flush();
  });
  return { game, settings };
}

export async function loadServices(services: Services): Promise<void> {
  await Promise.all([services.game.load(), services.settings.load()]);
}
