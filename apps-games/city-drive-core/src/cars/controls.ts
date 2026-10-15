import { clamp, GRAVITY, MS_TO_KMH } from "../physics/math";
import type { CarSpec } from "./specs";

export interface CarInput {
  /** -1 (reverse / brake) to 1 (full throttle). */
  throttle: number;
  /** -1 (full left) to 1 (full right). */
  steer: number;
  handbrake: boolean;
}

export const NEUTRAL_INPUT: CarInput = { throttle: 0, steer: 0, handbrake: false };

/** Forward speed (m/s) below which a reverse request becomes reverse gear rather than braking. */
const STANDSTILL_SPEED = 0.6;

export interface WheelCommand {
  engine: number;
  brake: number;
  steer: number;
  frictionSlip: number;
}

export function sanitizeInput(input: CarInput): CarInput {
  if (!Number.isFinite(input.throttle) || !Number.isFinite(input.steer)) {
    throw new Error(`CarInput must be finite, got throttle=${input.throttle} steer=${input.steer}`);
  }
  return {
    throttle: clamp(input.throttle, -1, 1),
    steer: clamp(input.steer, -1, 1),
    handbrake: input.handbrake,
  };
}

/** Distance between the front and rear axles in metres. */
export function wheelbase(spec: CarSpec): number {
  const zs = spec.wheels.map((w) => w.position.z);
  return Math.max(...zs) - Math.min(...zs);
}

/**
 * Maximum steering angle (rad) at a given forward speed. Limited so the
 * commanded lateral acceleration (v^2 * tan(angle) / wheelbase) stays near
 * `maxLateralG`, with a small floor so the car still answers at top speed.
 */
export function steerLimit(spec: CarSpec, speedMs: number): number {
  const v2 = speedMs * speedMs;
  if (v2 < 1e-6) return spec.maxSteerAngle;
  const grip = (wheelbase(spec) * spec.maxLateralG * GRAVITY) / v2;
  return clamp(grip, spec.highSpeedSteerAngle, spec.maxSteerAngle);
}

/** Move `current` toward `target` by at most `maxDelta`. */
export function approach(current: number, target: number, maxDelta: number): number {
  const d = target - current;
  return Math.abs(d) <= maxDelta ? target : current + Math.sign(d) * maxDelta;
}

/**
 * Turn driver input into one total engine force and one total brake force.
 * `speedMs` is the signed forward speed. Pure and trig-free.
 */
export function driveForces(
  spec: CarSpec,
  input: CarInput,
  speedMs: number,
): { engine: number; brake: number } {
  const kmh = speedMs * MS_TO_KMH;
  const wantsForward = input.throttle > 0;
  const wantsReverse = input.throttle < 0;
  if (wantsForward && speedMs >= -STANDSTILL_SPEED) {
    const t = clamp(kmh / spec.topSpeedKmh, 0, 1);
    return { engine: input.throttle * spec.engineForce * (1 - t * t * t), brake: 0 };
  }
  if (wantsReverse && speedMs <= STANDSTILL_SPEED) {
    const room = clamp(1 - -kmh / spec.maxReverseKmh, 0, 1);
    return { engine: input.throttle * spec.engineForce * spec.reverseFactor * room, brake: 0 };
  }
  if (wantsForward || wantsReverse) {
    // Throttle opposes motion: brake instead of driving through zero.
    return { engine: 0, brake: Math.abs(input.throttle) * spec.brakeForce };
  }
  return { engine: 0, brake: spec.coastBrakeFactor * spec.brakeForce };
}
