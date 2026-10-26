import { useMemo } from "preact/hooks";
import { useReducedMotion } from "../state/app";
import { createGameMotion, type GameMotion } from "./game";

export function useMotion(): GameMotion {
  const reduced = useReducedMotion();
  return useMemo(() => createGameMotion(reduced), [reduced]);
}
