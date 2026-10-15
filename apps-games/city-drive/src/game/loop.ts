import { SimClock } from "@city-drive/core";

/** Longest real frame time (s) passed on to render-side smoothing after a stall. */
export const MAX_FRAME_SECONDS = 0.1;

export interface LoopHooks {
  /** Advance the simulation by exactly one fixed step. */
  step(): void;
  /** Draw. `alpha` (0..1) is how far we are between the last two simulated states. */
  render(alpha: number, frameSeconds: number): void;
}

/**
 * Fixed-step loop. The render callback (engine.runRenderLoop) calls `frame(now)`: accumulate real
 * time, run at most 5 steps of 1/60 s (so a hitch does not spiral), then render once with
 * interpolation. Pure: it never reads a clock itself, so tests drive it with fake times.
 */
export class GameLoop {
  private readonly clock: SimClock;
  private lastMs: number | undefined;

  constructor(
    private readonly hooks: LoopHooks,
    clock: SimClock = new SimClock(),
  ) {
    this.clock = clock;
  }

  /** Interpolation fraction left over after the last frame. */
  get alpha(): number {
    return this.clock.alpha;
  }

  get ticks(): number {
    return this.clock.ticks;
  }

  /** Process one animation frame at time `nowMs`. Returns the number of fixed steps run. */
  frame(nowMs: number): number {
    const last = this.lastMs ?? nowMs;
    this.lastMs = nowMs;
    const seconds = Math.max(0, (nowMs - last) / 1000);
    const steps = this.clock.advance(seconds, () => this.hooks.step());
    this.hooks.render(this.clock.alpha, Math.min(seconds, MAX_FRAME_SECONDS));
    return steps;
  }
}
