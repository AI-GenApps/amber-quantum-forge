import { type CarState, type CollisionImpulse, rotateVec } from "@city-drive/core";
import type { PlayerInput } from "../input";

/** What one fixed step tells the audio, haptics and onboarding. Plain data. */
export interface StepReport {
  input: PlayerInput;
  speedKmh: number;
  /** Sideways speed of the car relative to the way it points, in m/s (0 = rolling straight). */
  slipMps: number;
  /** The hardest contact involving the player's car this step, in N*s (0 = none). */
  impactNs: number;
  topSpeedKmh: number;
}

/** Speed across the car's own heading: the part of the velocity along its right axis. */
export function lateralSlipMps(state: Pick<CarState, "velocity" | "rotation">): number {
  const right = rotateVec(state.rotation, { x: 1, y: 0, z: 0 });
  return Math.abs(state.velocity.x * right.x + state.velocity.z * right.z);
}

/** The largest impulse among the contacts that involve the car's collider. */
export function playerImpactNs(impulses: readonly CollisionImpulse[], carCollider: number): number {
  let max = 0;
  for (const hit of impulses) {
    if (hit.colliderA !== carCollider && hit.colliderB !== carCollider) continue;
    if (hit.impulse > max) max = hit.impulse;
  }
  return max;
}

export function makeStepReport(
  input: PlayerInput,
  state: CarState,
  impactNs: number,
  topSpeedKmh: number,
): StepReport {
  return {
    input,
    speedKmh: state.speedKmh,
    slipMps: lateralSlipMps(state),
    impactNs,
    topSpeedKmh,
  };
}
