import type { CarState, Quat, Vec3 } from "@city-drive/core";

interface WheelPose {
  steering: number;
  /** Spin angle in radians. */
  rotation: number;
  suspensionLength: number;
}

/** The car as it is drawn: the blend of the last two simulated states. */
export interface CarPose {
  position: Vec3;
  rotation: Quat;
  speedKmh: number;
  wheels: WheelPose[];
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function nlerp(a: Quat, b: Quat, t: number): Quat {
  // Take the short way round: q and -q are the same rotation.
  const sign = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w < 0 ? -1 : 1;
  const x = lerp(a.x, sign * b.x, t);
  const y = lerp(a.y, sign * b.y, t);
  const z = lerp(a.z, sign * b.z, t);
  const w = lerp(a.w, sign * b.w, t);
  const len = Math.sqrt(x * x + y * y + z * z + w * w) || 1;
  return { x: x / len, y: y / len, z: z / len, w: w / len };
}

/** Blend two simulated states. alpha 0 gives `prev`, 1 gives `curr`. */
export function interpolateCar(prev: CarState, curr: CarState, alpha: number): CarPose {
  const t = Math.min(Math.max(alpha, 0), 1);
  return {
    position: {
      x: lerp(prev.position.x, curr.position.x, t),
      y: lerp(prev.position.y, curr.position.y, t),
      z: lerp(prev.position.z, curr.position.z, t),
    },
    rotation: nlerp(prev.rotation, curr.rotation, t),
    speedKmh: lerp(prev.speedKmh, curr.speedKmh, t),
    wheels: curr.wheels.map((w, i) => {
      const p = prev.wheels[i] ?? w;
      return {
        steering: lerp(p.steering, w.steering, t),
        rotation: lerp(p.rotation, w.rotation, t),
        suspensionLength: lerp(p.suspensionLength, w.suspensionLength, t),
      };
    }),
  };
}
