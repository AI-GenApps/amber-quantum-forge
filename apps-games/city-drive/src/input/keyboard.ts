import type { InputSource, PlayerInput } from "./types";

const FORWARD = new Set(["KeyW", "ArrowUp"]);
const BACK = new Set(["KeyS", "ArrowDown"]);
const LEFT = new Set(["KeyA", "ArrowLeft"]);
const RIGHT = new Set(["KeyD", "ArrowRight"]);
const HANDBRAKE = new Set(["Space"]);
const RESET = new Set(["KeyR"]);

const HANDLED = new Set([...FORWARD, ...BACK, ...LEFT, ...RIGHT, ...HANDBRAKE, ...RESET]);

/**
 * WASD / arrow keys, Space = handbrake, R = reset. Uses `event.code`, so the layout does not
 * matter. Steering is instant here: the car limits its own steering rate.
 */
export class KeyboardInput implements InputSource {
  private readonly down = new Set<string>();
  private resetPending = false;

  constructor(private readonly target: EventTarget) {
    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
    target.addEventListener("blur", this.onBlur);
  }

  private readonly onKeyDown = (event: Event): void => {
    const { code, repeat } = event as KeyboardEvent;
    if (!HANDLED.has(code)) return;
    event.preventDefault();
    if (RESET.has(code) && !this.down.has(code) && !repeat) this.resetPending = true;
    this.down.add(code);
  };

  private readonly onKeyUp = (event: Event): void => {
    this.down.delete((event as KeyboardEvent).code);
  };

  /** Releases every key when the window loses focus, so the car does not keep driving. */
  private readonly onBlur = (): void => {
    this.down.clear();
  };

  private axis(positive: ReadonlySet<string>, negative: ReadonlySet<string>): number {
    const pos = [...positive].some((c) => this.down.has(c));
    const neg = [...negative].some((c) => this.down.has(c));
    return (pos ? 1 : 0) - (neg ? 1 : 0);
  }

  read(): PlayerInput {
    const reset = this.resetPending;
    this.resetPending = false;
    return {
      throttle: this.axis(FORWARD, BACK),
      steer: this.axis(RIGHT, LEFT),
      handbrake: [...HANDBRAKE].some((c) => this.down.has(c)),
      reset,
    };
  }

  dispose(): void {
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("blur", this.onBlur);
    this.down.clear();
  }
}
