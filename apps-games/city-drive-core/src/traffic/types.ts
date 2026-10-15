import type { Quat, Vec3 } from "../physics/math";
import type { IdmParams } from "./idm";
import type { PlayerProbe } from "./player";

export interface TrafficOptions {
  seed: number;
  /** Agents alive at once. Defaults to 16. */
  maxAgents?: number | undefined;
  /** Where the player is; read once per step. */
  player: PlayerProbe;
  /** Collider handle of the player's chassis, to recognise player hits. */
  playerColliderHandle?: number;
  /** Number of visual car models agents are spread over. Defaults to 4. */
  modelCount?: number;
  idm?: Partial<IdmParams>;
}

/** An agent as drawn: the blend of its last two simulated poses. */
export interface TrafficPose {
  id: number;
  modelIndex: number;
  position: Vec3;
  rotation: Quat;
  /** Wheel spin angle in radians. */
  wheelRotation: number;
  speedKmh: number;
}

/** The player's chassis hit an agent hard enough for a contact event. */
export interface TrafficCollision {
  tick: number;
  agentId: number;
  force: number;
  impulse: number;
}

export interface TrafficStats {
  spawned: number;
  despawned: number;
  /** Times the safety clamp stopped an agent at an unreserved stop line. */
  forcedStops: number;
  collisions: number;
}
