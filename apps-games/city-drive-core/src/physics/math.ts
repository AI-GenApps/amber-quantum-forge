/** Plain vector/quaternion types and tiny deterministic math helpers. */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Pose {
  position: Vec3;
  /** Orientation quaternion. Defaults to identity (car faces +Z). */
  rotation?: Quat;
}

export const GRAVITY = 9.81;
export const MS_TO_KMH = 3.6;
export const IDENTITY_QUAT: Quat = { x: 0, y: 0, z: 0, w: 1 };

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Rotate a vector by a unit quaternion (v' = q * v * q^-1). */
export function rotateVec(q: Quat, v: Vec3): Vec3 {
  const tx = 2 * (q.y * v.z - q.z * v.y);
  const ty = 2 * (q.z * v.x - q.x * v.z);
  const tz = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

/** Rotate a vector by the inverse of a unit quaternion (world to local). */
export function rotateVecInverse(q: Quat, v: Vec3): Vec3 {
  return rotateVec({ x: -q.x, y: -q.y, z: -q.z, w: q.w }, v);
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

const PI = Math.PI;
const TWO_PI = 2 * PI;

/** Reduce an angle into [-PI, PI] using only arithmetic. */
function wrapAngle(a: number): number {
  return a - TWO_PI * Math.round(a / TWO_PI);
}

/**
 * Deterministic sine: a Taylor series (degree 21) after range reduction.
 * Uses only + - * / so results are identical on every JS engine.
 */
export function detSin(angle: number): number {
  const a = wrapAngle(angle);
  const a2 = a * a;
  let term = a;
  let sum = a;
  for (let n = 1; n <= 10; n++) {
    term *= -a2 / (2 * n * (2 * n + 1));
    sum += term;
  }
  return sum;
}

export function detCos(angle: number): number {
  return detSin(angle + PI / 2);
}

/** Quaternion for a rotation of `yaw` radians around +Y (counter-clockwise from above). */
export function quatFromYaw(yaw: number): Quat {
  const half = yaw / 2;
  return { x: 0, y: detSin(half), z: 0, w: detCos(half) };
}

/** Stable 32-bit FNV-1a hash over a list of numbers, each rounded to 1e-4. */
export function hashNumbers(values: readonly number[]): string {
  let h = 0x811c9dc5;
  for (const v of values) {
    // Round to 1e-4 and fold -0 into 0 so the hash is sign-of-zero stable.
    const q = Math.round(v * 1e4) + 0;
    const lo = q | 0;
    const hi = Math.floor(q / 4294967296) | 0;
    for (const word of [lo, hi]) {
      for (let shift = 0; shift < 32; shift += 8) {
        h ^= (word >>> shift) & 0xff;
        h = Math.imul(h, 0x01000193);
      }
    }
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Quaternion about +Y that turns the car's local +Z onto the horizontal direction (dx, dz).
 * Uses only + - * / and sqrt (all exactly rounded), so it is bit-identical on every engine.
 */
export function quatFromForward(dx: number, dz: number): Quat {
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 1e-9) return { x: 0, y: 0, z: 0, w: 1 };
  const sinYaw = dx / len;
  const cosYaw = dz / len;
  const w = Math.sqrt(Math.max(0, (1 + cosYaw) / 2));
  const y = Math.sqrt(Math.max(0, (1 - cosYaw) / 2)) * (sinYaw < 0 ? -1 : 1);
  return { x: 0, y, z: 0, w };
}

/** World-space Y component of a unit quaternion's up axis: 1 upright, 0 on its side, -1 upside down. */
export function uprightness(q: Quat): number {
  return 1 - 2 * (q.x * q.x + q.z * q.z);
}
