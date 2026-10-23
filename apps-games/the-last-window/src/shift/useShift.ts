import type { ShiftEvent, ShiftState } from "@web-games/the-last-window-core";
import { useEffect, useState } from "preact/hooks";
import type { Runner } from "./Runner";

/** Re-renders with the newest engine state after every tick or action. */
export function useShift(runner: Runner): ShiftState {
  const [state, setState] = useState<ShiftState>(runner.state);
  useEffect(() => {
    setState(runner.state);
    return runner.onState(setState);
  }, [runner]);
  return state;
}

/** Calls `handler` with each batch of engine events. */
export function useShiftEvents(
  runner: Runner,
  handler: (events: ShiftEvent[], state: ShiftState) => void,
): void {
  useEffect(() => runner.onEvents(handler), [runner, handler]);
}
