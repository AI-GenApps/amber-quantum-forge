/** Lets something run at most `hz` times per second, given a clock reading in milliseconds. */
export class RateLimiter {
  private readonly intervalMs: number;
  private last = Number.NEGATIVE_INFINITY;

  constructor(hz: number) {
    if (!(hz > 0)) throw new Error(`RateLimiter: hz must be positive, got ${hz}`);
    this.intervalMs = 1000 / hz;
  }

  /** True (and the window restarts) when enough time has passed since the last true. */
  due(nowMs: number): boolean {
    if (nowMs - this.last < this.intervalMs) return false;
    this.last = nowMs;
    return true;
  }

  reset(): void {
    this.last = Number.NEGATIVE_INFINITY;
  }
}

/** The minimap redraws at this rate. */
export const MINIMAP_HZ = 10;
