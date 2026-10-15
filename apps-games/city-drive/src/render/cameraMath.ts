import type { Vec3 } from "@city-drive/core";
import { CHASE_DISTANCE_M, CHASE_HEIGHT_M } from "./constants";

/** Pure maths for the chase camera. No Babylon, so it is tested directly. */
export const CHASE = {
  distance: CHASE_DISTANCE_M,
  height: CHASE_HEIGHT_M,
  /** Extra distance and height at full speed. */
  extraDistance: 3,
  extraHeight: 1,
  /** Speed (km/h) at which the speed effects reach their maximum. */
  fullSpeedKmh: 110,
  fovBase: 0.85,
  fovMax: 1.05,
  /** The camera looks this far ahead of the car and this high above its centre. */
  lookAhead: 6,
  lookHeight: 1.2,
  /** Exponential follow rates in 1/s (higher = tighter). */
  positionRate: 7,
  headingRate: 3.5,
  lookRate: 10,
  fovRate: 2.5,
  /** Occlusion: stay this far in front of a wall, and never closer to the car than this. */
  wallMargin: 0.6,
  minDistance: 2.5,
  minHeight: 1.2,
} as const;

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

/**
 * Fraction of the remaining gap to close this frame for an exponential follow of `rate` per
 * second. Frame-rate independent: two 8 ms frames close the same gap as one 16 ms frame.
 */
export function dampFactor(dt: number, rate: number): number {
  return 1 - Math.exp(-rate * Math.max(dt, 0));
}

export function damp(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * dampFactor(dt, rate);
}

export function dampVec(current: Vec3, target: Vec3, rate: number, dt: number): Vec3 {
  const f = dampFactor(dt, rate);
  return {
    x: current.x + (target.x - current.x) * f,
    y: current.y + (target.y - current.y) * f,
    z: current.z + (target.z - current.z) * f,
  };
}

/** 0 at standstill to 1 at full speed, eased so low speeds barely change the camera. */
export function speedFactor(speedKmh: number): number {
  const t = clamp(Math.abs(speedKmh) / CHASE.fullSpeedKmh, 0, 1);
  return t * t * (3 - 2 * t);
}

export function chaseDistance(speedKmh: number): number {
  return CHASE.distance + CHASE.extraDistance * speedFactor(speedKmh);
}

export function chaseHeight(speedKmh: number): number {
  return CHASE.height + CHASE.extraHeight * speedFactor(speedKmh);
}

export function chaseFov(speedKmh: number): number {
  return CHASE.fovBase + (CHASE.fovMax - CHASE.fovBase) * speedFactor(speedKmh);
}

/** Unit horizontal vector (x, z), or `fallback` when the input is too short to normalise. */
export function normalize2(
  x: number,
  z: number,
  fallback: { x: number; z: number },
): { x: number; z: number } {
  const len = Math.hypot(x, z);
  return len < 1e-6 ? fallback : { x: x / len, z: z / len };
}

/** Where the camera wants to be: behind the car along `heading`, raised by the chase height. */
export function desiredCameraPosition(
  car: Vec3,
  heading: { x: number; z: number },
  speedKmh: number,
): Vec3 {
  const d = chaseDistance(speedKmh);
  return { x: car.x - heading.x * d, y: car.y + chaseHeight(speedKmh), z: car.z - heading.z * d };
}

/** The point the camera looks at: ahead of the car along `heading`, slightly above it. */
export function lookTarget(car: Vec3, heading: { x: number; z: number }): Vec3 {
  return {
    x: car.x + heading.x * CHASE.lookAhead,
    y: car.y + CHASE.lookHeight,
    z: car.z + heading.z * CHASE.lookAhead,
  };
}

/**
 * Pulls the camera toward the car when a wall stands in between. `hitDistance` is how far from the
 * anchor (the car) the ray toward the camera first meets a building, or undefined for a clear view.
 * Returns the camera position along the anchor-to-camera line. Never closer than `minDistance`
 * (unless the camera was already nearer) and never below `minHeight`.
 */
export function resolveOcclusion(
  anchor: Vec3,
  wanted: Vec3,
  hitDistance: number | undefined,
): Vec3 {
  const dx = wanted.x - anchor.x;
  const dy = wanted.y - anchor.y;
  const dz = wanted.z - anchor.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  let distance = length;
  if (hitDistance !== undefined) {
    distance = Math.min(length, Math.max(hitDistance - CHASE.wallMargin, CHASE.minDistance));
  }
  const k = length > 1e-9 ? distance / length : 0;
  return {
    x: anchor.x + dx * k,
    y: Math.max(anchor.y + dy * k, CHASE.minHeight),
    z: anchor.z + dz * k,
  };
}
