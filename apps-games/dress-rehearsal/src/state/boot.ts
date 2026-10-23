import type { Lifecycle, StorageAdapter } from "@web-games/kit";
import { createGame, type GameStore } from "./game";

export interface BootedGame {
  readonly game: GameStore;
  dispose(): void;
}

export function bootGame(
  lifecycle: Pick<Lifecycle, "onPause">,
  adapter: StorageAdapter,
  clock?: () => Date,
): BootedGame {
  const game = createGame(clock === undefined ? { adapter } : { adapter, clock });
  const stopPause = lifecycle.onPause(() => {
    void game.flush();
  });
  return { game, dispose: stopPause };
}
