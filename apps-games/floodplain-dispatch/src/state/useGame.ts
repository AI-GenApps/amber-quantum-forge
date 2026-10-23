import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import type { GameState, GameStore } from "./game";

export const GameContext = createContext<GameStore | null>(null);

export function useGameStore(): GameStore {
  const store = useContext(GameContext);
  if (!store) throw new Error("useGame needs a GameContext provider");
  return store;
}

export function useGame(): GameState {
  const store = useGameStore();
  const [state, setState] = useState<GameState>(store.getState());
  useEffect(() => {
    setState(store.getState());
    return store.subscribe(setState);
  }, [store]);
  return state;
}
