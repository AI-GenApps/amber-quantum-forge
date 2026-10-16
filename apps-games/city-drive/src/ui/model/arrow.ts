export interface Point2 {
  x: number;
  z: number;
}

export interface ArrowState {
  /**
   * Bearing of the target from the car's heading in radians, -PI to PI. 0 is straight ahead and a
   * positive angle is to the player's right, so it is also the clockwise CSS rotation of an
   * upward-pointing arrow.
   */
  angle: number;
  distanceM: number;
  /** True when the target is outside the camera's horizontal view, so the arrow should show. */
  offscreen: boolean;
}

/** Half of the horizontal view the chase camera covers, in radians (about 35 degrees). */
export const VIEW_HALF_ANGLE = 0.6;
/** Closer than this the target is "here" and the arrow hides. */
export const ARRIVED_M = 4;

/**
 * Bearing and distance from the car to the target. `forward` is the car's unit heading on the
 * ground plane; the scene is right-handed, so the player's right is (-forward.z, forward.x).
 */
export function objectiveArrow(car: Point2, forward: Point2, target: Point2): ArrowState {
  const dx = target.x - car.x;
  const dz = target.z - car.z;
  const distanceM = Math.hypot(dx, dz);
  const ahead = dx * forward.x + dz * forward.z;
  const right = dx * -forward.z + dz * forward.x;
  const angle = distanceM < 1e-6 ? 0 : Math.atan2(right, ahead);
  return {
    angle,
    distanceM,
    offscreen: distanceM > ARRIVED_M && Math.abs(angle) > VIEW_HALF_ANGLE,
  };
}

/** Where on the screen the arrow sits, as fractions of its width and height (0 = left/top). */
export interface ArrowAnchor {
  left: number;
  top: number;
}

/** How far from the screen centre the arrow may sit, as fractions of the width and height. */
const REACH_X = 0.42;
const REACH_Y = 0.36;

/**
 * Places the arrow on the screen edge in the direction of the bearing: straight ahead is the top
 * centre, right is the right edge. The ray from the screen centre is clamped to the reach box.
 */
export function arrowAnchor(angle: number): ArrowAnchor {
  const dirX = Math.sin(angle);
  const dirY = -Math.cos(angle);
  const scale = Math.min(
    Math.abs(dirX) < 1e-9 ? Number.POSITIVE_INFINITY : REACH_X / Math.abs(dirX),
    Math.abs(dirY) < 1e-9 ? Number.POSITIVE_INFINITY : REACH_Y / Math.abs(dirY),
  );
  return { left: 0.5 + dirX * scale, top: 0.5 + dirY * scale };
}
