import type { InputSource, PlayerInput } from "./types";

export interface PadLike {
  axes: readonly number[];
  buttons: readonly { value: number; pressed: boolean }[];
}

const DEAD_ZONE = 0.15;
const BTN_A = 0;
const BTN_B = 1;
const BTN_Y = 3;
const BTN_RT = 7;
const BTN_LT = 6;

function dead(v: number): number {
  return Math.abs(v) < DEAD_ZONE ? 0 : v;
}

/**
 * Optional standard-mapping gamepad: left stick steers, RT/LT (or A/B) are gas and brake,
 * X (button 2) is the handbrake, Y resets. `getPads` is injected so tests need no browser.
 */
export class GamepadInput implements InputSource {
  private wasReset = false;

  constructor(private readonly getPads: () => readonly (PadLike | null)[]) {}

  read(): PlayerInput {
    const pad = this.getPads().find((p): p is PadLike => p !== null);
    if (!pad) {
      this.wasReset = false;
      return { throttle: 0, steer: 0, handbrake: false, reset: false };
    }
    const value = (i: number) => pad.buttons[i]?.value ?? 0;
    const gas = Math.max(value(BTN_RT), value(BTN_A));
    const brake = Math.max(value(BTN_LT), value(BTN_B));
    const resetDown = pad.buttons[BTN_Y]?.pressed ?? false;
    const reset = resetDown && !this.wasReset;
    this.wasReset = resetDown;
    return {
      throttle: gas - brake,
      steer: dead(pad.axes[0] ?? 0),
      handbrake: pad.buttons[2]?.pressed ?? false,
      reset,
    };
  }

  dispose(): void {}
}
