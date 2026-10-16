import type { SoundId } from "./manifest";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Linear 0..1 position of `value` between `from` and `to`. */
const ramp = (value: number, from: number, to: number): number =>
  clamp((value - from) / (to - from), 0, 1);

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** How the engine voice is driven this step. Gains are 0..1; `rate` is a playback-rate multiplier. */
export interface EngineParams {
  /** 0 (idle) to 1 (flat out). */
  rpm: number;
  idleGain: number;
  revGain: number;
  rate: number;
  /** Overall engine loudness. */
  volume: number;
}

export const ENGINE_RATE_MIN = 0.8;
export const ENGINE_RATE_MAX = 1.7;

/**
 * Engine pitch and gain from speed and throttle. Two loops (idle, rev) are crossfaded with equal
 * power as the revs climb, and both are pitched together.
 */
export function engineParams(
  speedKmh: number,
  throttle: number,
  topSpeedKmh: number,
): EngineParams {
  const speedFraction = clamp(Math.abs(speedKmh) / Math.max(1, topSpeedKmh), 0, 1);
  const push = clamp(throttle, 0, 1);
  const rpm = clamp(speedFraction * 0.75 + push * 0.25, 0, 1);
  const mix = smooth(ramp(rpm, 0.15, 0.7));
  return {
    rpm,
    idleGain: Math.cos((mix * Math.PI) / 2),
    revGain: Math.sin((mix * Math.PI) / 2),
    rate: ENGINE_RATE_MIN + rpm * (ENGINE_RATE_MAX - ENGINE_RATE_MIN),
    volume: 0.35 + 0.65 * clamp(0.4 * rpm + 0.6 * push, 0, 1),
  };
}

/** Sideways speed (m/s) where tyre noise starts and where it is full. */
export const SKID_START_MPS = 2.5;
export const SKID_FULL_MPS = 8;
/** No tyre noise below this speed, so a car sliding to a stop stays quiet. */
export const SKID_MIN_KMH = 12;

/** Tyre-skid gain (0..1) from the lateral slip the simulation reports. */
export function skidGain(slipMps: number, speedKmh: number): number {
  if (Math.abs(speedKmh) < SKID_MIN_KMH) return 0;
  return smooth(ramp(Math.abs(slipMps), SKID_START_MPS, SKID_FULL_MPS));
}

/** Impulses (N*s) below `min` are silent; light/medium/heavy samples switch at the other two. */
export const COLLISION_MIN_NS = 150;
export const COLLISION_MEDIUM_NS = 800;
export const COLLISION_HEAVY_NS = 2500;

export interface CollisionSound {
  id: Extract<SoundId, "collision_light" | "collision_medium" | "collision_heavy">;
  gain: number;
}

/** Which thud to play, and how loudly, for a contact impulse. Undefined when too soft to hear. */
export function collisionSound(impulseNs: number): CollisionSound | undefined {
  if (!(impulseNs >= COLLISION_MIN_NS)) return undefined;
  const id =
    impulseNs >= COLLISION_HEAVY_NS
      ? "collision_heavy"
      : impulseNs >= COLLISION_MEDIUM_NS
        ? "collision_medium"
        : "collision_light";
  return { id, gain: clamp(0.3 + impulseNs / 6000, 0.3, 1) };
}

/** Ticks (1/60 s) between two collision sounds, so one crash is one thud. */
export const COLLISION_COOLDOWN_TICKS = 18;

/** Music loudness relative to full: quieter while a mission runs so effects stay clear. */
export const MUSIC_LEVEL = 0.5;
export const MUSIC_DUCK_LEVEL = 0.22;

export function musicTarget(ducked: boolean): number {
  return ducked ? MUSIC_DUCK_LEVEL : MUSIC_LEVEL;
}
