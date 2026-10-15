import { mergeAll } from "./merge";
import type { InputSource, PlayerInput } from "./types";

export { GamepadInput } from "./gamepad";
export { KeyboardInput } from "./keyboard";
export { mergeAll, mergeInputs } from "./merge";
export { type TouchButton, TouchInput } from "./touch";
export { type InputSource, NO_INPUT, type PlayerInput, toCarInput } from "./types";

/** Reads every source each step and merges them (keyboard and touch can both be live). */
export class CombinedInput implements InputSource {
  constructor(private readonly sources: readonly InputSource[]) {}

  read(dt: number): PlayerInput {
    return mergeAll(this.sources.map((s) => s.read(dt)));
  }

  dispose(): void {
    for (const s of this.sources) s.dispose();
  }
}
