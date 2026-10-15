/** Simplified Intelligent Driver Model (Treiber et al.), in SI units. */
export interface IdmParams {
  /** Maximum acceleration, m/s^2. */
  maxAccel: number;
  /** Comfortable deceleration, m/s^2. */
  comfortBrake: number;
  /** Desired time headway, s. */
  headway: number;
  /** Minimum bumper-to-bumper gap at standstill, m. */
  minGap: number;
  /** Free-road exponent. */
  exponent: number;
  /** Hardest braking the model may ask for, m/s^2 (positive number). */
  maxBrake: number;
}

export const DEFAULT_IDM: IdmParams = {
  maxAccel: 1.6,
  comfortBrake: 3,
  headway: 1.2,
  minGap: 2,
  exponent: 4,
  maxBrake: 9,
};

export interface IdmLeader {
  /** Bumper-to-bumper distance to the obstacle ahead, m. */
  gap: number;
  /** Speed of the obstacle along our direction of travel, m/s (negative when oncoming). */
  speed: number;
}

/** Desired dynamic gap s*(v, dv) in metres. */
export function desiredGap(p: IdmParams, speed: number, closingSpeed: number): number {
  const dynamic = (speed * closingSpeed) / (2 * Math.sqrt(p.maxAccel * p.comfortBrake));
  return p.minGap + Math.max(0, speed * p.headway + dynamic);
}

/**
 * Acceleration in m/s^2 for a car at `speed` that wants to travel at `desiredSpeed`, with an
 * optional obstacle ahead. Bounded to [-maxBrake, maxAccel].
 */
export function idmAcceleration(
  p: IdmParams,
  speed: number,
  desiredSpeed: number,
  leader?: IdmLeader,
): number {
  const free = desiredSpeed > 0 ? (speed / desiredSpeed) ** p.exponent : 1;
  let interaction = 0;
  if (leader) {
    const gap = Math.max(leader.gap, 0.1);
    interaction = (desiredGap(p, speed, speed - leader.speed) / gap) ** 2;
  }
  const accel = p.maxAccel * (1 - free - interaction);
  return Math.min(p.maxAccel, Math.max(-p.maxBrake, accel));
}

/** Highest speed from which a car can still slow to `targetSpeed` over `distance` at `brake`. */
export function brakingSpeedLimit(targetSpeed: number, distance: number, brake: number): number {
  return Math.sqrt(targetSpeed * targetSpeed + 2 * brake * Math.max(distance, 0));
}
