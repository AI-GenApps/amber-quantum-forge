/** Fixed simulation step in seconds. The sim never reads wall-clock time. */
export const FIXED_DT = 1 / 60;

export interface SimClockOptions {
  /** Step length in seconds. Defaults to FIXED_DT. */
  dt?: number;
  /** Upper bound on steps per advance() call, to avoid a spiral of death. */
  maxStepsPerAdvance?: number;
}

/**
 * Pure fixed-step accumulator. The render loop feeds frame times in; the
 * clock reports how many fixed steps to run and the interpolation alpha.
 */
export class SimClock {
  readonly dt: number;
  readonly maxStepsPerAdvance: number;
  private accumulator = 0;
  private stepCount = 0;

  constructor(options: SimClockOptions = {}) {
    this.dt = options.dt ?? FIXED_DT;
    this.maxStepsPerAdvance = options.maxStepsPerAdvance ?? 5;
    if (!(this.dt > 0)) throw new Error(`SimClock dt must be positive, got ${this.dt}`);
  }

  /** Total fixed steps executed through advance(). */
  get ticks(): number {
    return this.stepCount;
  }

  /** Fraction (0..1) of a step left in the accumulator, for render interpolation. */
  get alpha(): number {
    return this.accumulator / this.dt;
  }

  /** Add `frameSeconds` of real time and run `step()` once per whole fixed step. Returns steps run. */
  advance(frameSeconds: number, step: () => void): number {
    if (!(frameSeconds >= 0))
      throw new Error(`SimClock frame time must be >= 0, got ${frameSeconds}`);
    this.accumulator += frameSeconds;
    let steps = 0;
    while (this.accumulator >= this.dt && steps < this.maxStepsPerAdvance) {
      step();
      this.accumulator -= this.dt;
      this.stepCount++;
      steps++;
    }
    // Drop backlog beyond the cap so a long stall does not replay as slow motion.
    if (steps === this.maxStepsPerAdvance && this.accumulator >= this.dt) {
      this.accumulator %= this.dt;
    }
    return steps;
  }

  reset(): void {
    this.accumulator = 0;
    this.stepCount = 0;
  }
}
