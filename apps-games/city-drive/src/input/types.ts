import type { CarInput } from "@city-drive/core";

/** What a player asks of the car for one fixed step. `reset` is true for one read per press. */
export interface PlayerInput {
  /** -1 (reverse / brake) to 1 (full throttle). */
  throttle: number;
  /** -1 (left) to 1 (right). */
  steer: number;
  handbrake: boolean;
  reset: boolean;
}

export const NO_INPUT: PlayerInput = { throttle: 0, steer: 0, handbrake: false, reset: false };

/** A device that can be polled once per fixed step. */
export interface InputSource {
  /** Current input. `dt` is the fixed step in seconds (used by sources that ramp). */
  read(dt: number): PlayerInput;
  dispose(): void;
}

/**
 * Player input to car input. The simulation is right-handed (steer +1 turns toward -X when facing
 * +Z) but Babylon draws the same numbers left-handed, where +X is on the screen's right. So the
 * player's "right" must command the simulation's negative steer to turn toward the screen's right.
 */
export function toCarInput(input: PlayerInput): CarInput {
  return { throttle: input.throttle, steer: -input.steer, handbrake: input.handbrake };
}
