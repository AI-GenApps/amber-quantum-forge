import type { InputSource, PlayerInput } from "./types";

export type TouchButton = "left" | "right" | "gas" | "brake" | "handbrake" | "reset";

/** Seconds for the steering to travel from centre to full lock while a button is held. */
const STEER_RAMP_UP_S = 0.25;
/** Seconds to return to centre after release (faster than the ramp up, so the car straightens). */
const STEER_RAMP_DOWN_S = 0.15;

/**
 * State behind the on-screen buttons. Each button tracks the pointer ids holding it, so two
 * fingers (steer and gas) work at once and a lifted finger only releases its own button.
 */
export class TouchInput implements InputSource {
  private readonly holders = new Map<TouchButton, Set<number>>();
  private steer = 0;
  private resetPending = false;

  press(button: TouchButton, pointerId: number): void {
    const set = this.holders.get(button) ?? new Set<number>();
    if (button === "reset" && set.size === 0) this.resetPending = true;
    set.add(pointerId);
    this.holders.set(button, set);
  }

  release(button: TouchButton, pointerId: number): void {
    this.holders.get(button)?.delete(pointerId);
  }

  /** Release whatever a pointer was holding (pointer cancel, capture loss). */
  releasePointer(pointerId: number): void {
    for (const set of this.holders.values()) set.delete(pointerId);
  }

  isHeld(button: TouchButton): boolean {
    return (this.holders.get(button)?.size ?? 0) > 0;
  }

  releaseAll(): void {
    this.holders.clear();
  }

  read(dt: number): PlayerInput {
    const target = (this.isHeld("right") ? 1 : 0) - (this.isHeld("left") ? 1 : 0);
    const rate = target === 0 ? 1 / STEER_RAMP_DOWN_S : 1 / STEER_RAMP_UP_S;
    const maxDelta = rate * dt;
    const delta = target - this.steer;
    this.steer += Math.abs(delta) <= maxDelta ? delta : Math.sign(delta) * maxDelta;
    const reset = this.resetPending;
    this.resetPending = false;
    return {
      throttle: (this.isHeld("gas") ? 1 : 0) - (this.isHeld("brake") ? 1 : 0),
      steer: this.steer,
      handbrake: this.isHeld("handbrake"),
      reset,
    };
  }

  dispose(): void {
    this.releaseAll();
  }
}
