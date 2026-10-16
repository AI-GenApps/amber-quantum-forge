/** Length of one sampling window of frame times. */
export const WINDOW_MS = 2000;
/** A window whose 90th-percentile frame time is above this steps the quality down. */
export const SLOW_P90_MS = 33;
/** Windows below this count towards stepping the quality back up. */
export const FAST_P90_MS = 20;
/** How long frames must stay fast before one step back up. */
export const RECOVER_MS = 10_000;
/** A step down this soon after a step up proves the upper tier too heavy for this device. */
export const PROBATION_MS = 20_000;
/** Frames longer than this are tab switches or loads, not rendering cost, and are ignored. */
export const STALL_MS = 500;

export interface GovernorOptions {
  /** Number of tiers; tier 0 is the best. */
  tiers: number;
  start: number;
  /** The best tier it may climb back to. */
  ceiling: number;
}

export interface GovernorChange {
  from: number;
  to: number;
  reason: "slow" | "fast";
  p90Ms: number;
}

/** The p90 of a list of frame times (nearest rank). */
export function percentile90(frames: readonly number[]): number {
  if (frames.length === 0) return 0;
  const sorted = [...frames].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.9) - 1)] ?? 0;
}

/**
 * Adaptive quality. Pure: it never reads a clock, it counts the time of the frames it is given.
 *
 * - A window is 2 s of frames. p90 above 33 ms steps one tier down; p90 below 20 ms for 10 s in a
 *   row steps one tier up (never above the ceiling); in between nothing happens and the fast
 *   streak starts over (hysteresis).
 * - A step up that is undone within 20 s locks that tier out for the rest of this governor's
 *   life, so a device on the edge settles instead of flipping every 12 s.
 */
export class QualityGovernor {
  private tierValue: number;
  private best: number;
  private readonly worst: number;
  private frames: number[] = [];
  private windowMs = 0;
  private fastMs = 0;
  private clockMs = 0;
  private lastUpMs = Number.NEGATIVE_INFINITY;
  private changeCount = 0;

  constructor(options: GovernorOptions) {
    const { tiers, start, ceiling } = options;
    if (!Number.isInteger(tiers) || tiers < 1) throw new Error(`governor: bad tier count ${tiers}`);
    if (ceiling < 0 || ceiling >= tiers || start < ceiling || start >= tiers) {
      throw new Error(`governor: need 0 <= ceiling (${ceiling}) <= start (${start}) < ${tiers}`);
    }
    this.tierValue = start;
    this.best = ceiling;
    this.worst = tiers - 1;
  }

  get tier(): number {
    return this.tierValue;
  }

  /** The best tier still allowed (the ceiling, or lower after a failed step up). */
  get bestAllowed(): number {
    return this.best;
  }

  get changes(): number {
    return this.changeCount;
  }

  /** Forget the window in progress, e.g. after a district load made frames long. */
  restartWindow(): void {
    this.frames = [];
    this.windowMs = 0;
    this.fastMs = 0;
  }

  /** Feed one frame time in ms. Returns the tier change this frame caused, if any. */
  record(frameMs: number): GovernorChange | undefined {
    if (!(frameMs > 0) || frameMs > STALL_MS) return undefined;
    this.frames.push(frameMs);
    this.windowMs += frameMs;
    this.clockMs += frameMs;
    if (this.windowMs < WINDOW_MS) return undefined;
    const p90Ms = percentile90(this.frames);
    const span = this.windowMs;
    this.frames = [];
    this.windowMs = 0;
    return this.judge(p90Ms, span);
  }

  private judge(p90Ms: number, spanMs: number): GovernorChange | undefined {
    if (p90Ms > SLOW_P90_MS) {
      this.fastMs = 0;
      if (this.tierValue >= this.worst) return undefined;
      const failedUpgrade = this.clockMs - this.lastUpMs <= PROBATION_MS;
      return this.move(this.tierValue + 1, "slow", p90Ms, failedUpgrade);
    }
    if (p90Ms >= FAST_P90_MS) {
      this.fastMs = 0;
      return undefined;
    }
    this.fastMs += spanMs;
    if (this.fastMs < RECOVER_MS || this.tierValue <= this.best) return undefined;
    this.fastMs = 0;
    this.lastUpMs = this.clockMs;
    return this.move(this.tierValue - 1, "fast", p90Ms, false);
  }

  private move(to: number, reason: "slow" | "fast", p90Ms: number, lockTier: boolean) {
    const from = this.tierValue;
    this.tierValue = to;
    if (lockTier) this.best = Math.max(this.best, to);
    this.changeCount++;
    return { from, to, reason, p90Ms };
  }
}
