import type { CarState } from "../cars/car";
import { rotateVec } from "../physics/math";

/** The player's car as the traffic sees it. */
export interface TrafficPlayer {
  x: number;
  z: number;
  /** Velocity in m/s. */
  vx: number;
  vz: number;
  /** Unit heading. */
  forwardX: number;
  forwardZ: number;
  halfLength: number;
}

export type PlayerProbe = () => TrafficPlayer;

/** True when (x, z) lies in the player's view cone, so a spawn or despawn there would be seen. */
export function inView(player: TrafficPlayer, x: number, z: number, halfCos: number): boolean {
  const dx = x - player.x;
  const dz = z - player.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 1e-6) return true;
  return (dx * player.forwardX + dz * player.forwardZ) / dist >= halfCos;
}

/** The traffic's view of a simulated car. */
export function playerFromCar(state: CarState, halfLength: number): TrafficPlayer {
  const forward = rotateVec(state.rotation, { x: 0, y: 0, z: 1 });
  const len = Math.hypot(forward.x, forward.z) || 1;
  return {
    x: state.position.x,
    z: state.position.z,
    vx: state.velocity.x,
    vz: state.velocity.z,
    forwardX: forward.x / len,
    forwardZ: forward.z / len,
    halfLength,
  };
}
