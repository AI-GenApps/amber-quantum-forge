import { NO_INPUT, type PlayerInput } from "./types";

/** The value with the larger magnitude wins; ties go to `a`. */
function larger(a: number, b: number): number {
  return Math.abs(b) > Math.abs(a) ? b : a;
}

/** Keyboard, touch and gamepad can all be live at once: the larger absolute axis wins. */
export function mergeInputs(a: PlayerInput, b: PlayerInput): PlayerInput {
  return {
    throttle: larger(a.throttle, b.throttle),
    steer: larger(a.steer, b.steer),
    handbrake: a.handbrake || b.handbrake,
    reset: a.reset || b.reset,
  };
}

export function mergeAll(inputs: readonly PlayerInput[]): PlayerInput {
  return inputs.reduce(mergeInputs, NO_INPUT);
}
