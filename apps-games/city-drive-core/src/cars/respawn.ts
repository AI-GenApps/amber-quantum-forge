import { type Quat, uprightness } from "../physics/math";

export type RespawnReason = "flipped" | "stuck";

export interface RespawnRules {
  /** Tilt from upright (degrees) beyond which the car counts as flipped. */
  flipAngleDeg: number;
  /** Seconds the car must stay flipped before an automatic respawn. */
  flipSeconds: number;
  /** Speed (km/h, absolute) below which a car held on full throttle counts as stuck. */
  stuckSpeedKmh: number;
  /** Throttle magnitude that counts as "full throttle". */
  stuckThrottle: number;
  /** Seconds of stuck before an automatic respawn. */
  stuckSeconds: number;
}

export const DEFAULT_RESPAWN_RULES: RespawnRules = {
  flipAngleDeg: 70,
  flipSeconds: 2,
  stuckSpeedKmh: 1,
  stuckThrottle: 0.95,
  stuckSeconds: 4,
};

export interface RespawnSample {
  rotation: Quat;
  speedKmh: number;
  throttle: number;
}

/** cos(deg), by a Taylor series so the detector needs no trig library call. */
function cosDeg(deg: number): number {
  const x = (deg * Math.PI) / 180;
  const x2 = x * x;
  let term = 1;
  let sum = 1;
  for (let n = 1; n <= 8; n++) {
    term *= -x2 / ((2 * n - 1) * (2 * n));
    sum += term;
  }
  return sum;
}

/**
 * Watches the car once per fixed step and reports when it has been flipped (tilt over 70 degrees
 * for 2 s) or stuck (under 1 km/h on full throttle for 4 s). Pure: no clock, only the step length.
 */
export class RespawnDetector {
  private flippedFor = 0;
  private stuckFor = 0;
  private readonly flipCos: number;

  constructor(private readonly rules: RespawnRules = DEFAULT_RESPAWN_RULES) {
    this.flipCos = cosDeg(rules.flipAngleDeg);
  }

  /** Seconds the car has currently been flipped. */
  get flippedSeconds(): number {
    return this.flippedFor;
  }

  /** Seconds the car has currently been stuck. */
  get stuckSeconds(): number {
    return this.stuckFor;
  }

  reset(): void {
    this.flippedFor = 0;
    this.stuckFor = 0;
  }

  /** Advance by one step of `dt` seconds. Returns a reason once a timer expires, else undefined. */
  update(dt: number, sample: RespawnSample): RespawnReason | undefined {
    const flipped = uprightness(sample.rotation) < this.flipCos;
    this.flippedFor = flipped ? this.flippedFor + dt : 0;
    const stuck =
      Math.abs(sample.speedKmh) < this.rules.stuckSpeedKmh &&
      Math.abs(sample.throttle) >= this.rules.stuckThrottle;
    this.stuckFor = stuck ? this.stuckFor + dt : 0;
    if (this.flippedFor >= this.rules.flipSeconds) return "flipped";
    if (this.stuckFor >= this.rules.stuckSeconds) return "stuck";
    return undefined;
  }
}
