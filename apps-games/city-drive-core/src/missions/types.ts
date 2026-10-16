import type { Vec3 } from "../physics/math";

export const MISSION_SCHEMA_VERSION = 1;

export type MissionType = "delivery" | "taxi" | "time_trial" | "parking";
export const MISSION_TYPES: readonly MissionType[] = ["delivery", "taxi", "time_trial", "parking"];

/** A place on a lane: the edge id from the road graph and the distance along it in metres. */
export interface LanePointRef {
  edgeId: string;
  s: number;
}

/** One value per star level. */
export interface Tiers<T> {
  "1": T;
  "2": T;
  "3": T;
}

export const STAR_KEYS = ["1", "2", "3"] as const;

export interface BayDef {
  /** Lane point the bay sits beside; its axis follows the lane direction there. */
  lane_point: LanePointRef;
  /** Distance to the right of the lane centre to the bay centre, in metres. */
  lateral_offset_m: number;
  length_m: number;
  width_m: number;
  /**
   * Free space between the bay and each parked car along the lane, in metres. Forward entry needs
   * room to swing in, so smaller gaps make a harder mission. Defaults to PARKED_CAR_GAP_M.
   */
  flank_gap_m?: number;
}

export interface CheckpointDef {
  lane_point: LanePointRef;
  radius_m?: number;
}

export interface DeliveryParams {
  pickup: LanePointRef;
  drops: LanePointRef[];
  time_limit_s: number;
  /** The mission fails when damage goes above this. */
  max_damage: number;
  radius_m?: number;
}

export interface TaxiParams {
  pickup: LanePointRef;
  drop: LanePointRef;
  time_limit_s: number;
  radius_m?: number;
}

export interface TrialParams {
  checkpoints: CheckpointDef[];
  time_limit_s: number;
}

export interface ParkingParams {
  bay: BayDef;
  time_limit_s: number;
  /** The mission fails when touches go above this. */
  max_touches: number;
}

export interface DeliveryStar {
  min_time_left_s: number;
  max_damage: number;
}

export interface TaxiStar {
  min_time_left_s: number;
  min_comfort: number;
}

export interface TrialStar {
  max_time_s: number;
}

export interface ParkingStar {
  max_time_s: number;
  max_touches: number;
}

interface MissionBase {
  schema_version: number;
  /** `d{n}-m{nn}`, for example `d1-m01`. */
  id: string;
  district: string;
  title: string;
  brief: string;
  /** Where the free-roam marker sits. */
  start: { lane_point: LanePointRef };
  reward_coins: Tiers<number>;
}

export interface DeliveryMission extends MissionBase {
  type: "delivery";
  params: DeliveryParams;
  stars: Tiers<DeliveryStar>;
}

export interface TaxiMission extends MissionBase {
  type: "taxi";
  params: TaxiParams;
  stars: Tiers<TaxiStar>;
}

export interface TrialMission extends MissionBase {
  type: "time_trial";
  params: TrialParams;
  stars: Tiers<TrialStar>;
}

export interface ParkingMission extends MissionBase {
  type: "parking";
  params: ParkingParams;
  stars: Tiers<ParkingStar>;
}

export type MissionDef = DeliveryMission | TaxiMission | TrialMission | ParkingMission;

export type MissionPhase = "idle" | "briefing" | "active" | "success" | "fail" | "results";

export type FailReason = "time_out" | "damage_limit" | "comfort_zero" | "quit";

export type Stars = 0 | 1 | 2 | 3;

/** What the economy (task 12) consumes. */
export interface MissionResult {
  id: string;
  success: boolean;
  stars: Stars;
  /** Time spent in the active phase, in seconds. */
  time: number;
  damage: number;
  /** Final passenger comfort 0..100 (taxi only). */
  comfort: number | null;
  coins: number;
  failReason?: FailReason;
}

/** The player's car as a mission sees it, once per fixed step. */
export interface MissionSample {
  position: Vec3;
  speedKmh: number;
  longitudinalG: number;
  lateralG: number;
  /** Unit heading on the ground plane. */
  forward: { x: number; z: number };
  /** Collisions above the impulse threshold that began on this step. */
  hits: number;
}

/** Car footprint a mission needs for the parking test. */
export interface CarFootprint {
  halfLength: number;
  halfWidth: number;
}

export type ObjectiveKind = "pickup" | "dropoff" | "checkpoint" | "finish" | "bay";

/** The thing the player drives to next. */
export interface Objective {
  kind: ObjectiveKind;
  label: string;
  x: number;
  z: number;
  radius: number;
  lane: LanePointRef;
}

export interface MissionProgress {
  done: number;
  total: number;
}

export type EvalStep =
  | { status: "active" }
  | { status: "success" }
  | { status: "fail"; reason: FailReason };

/** One mission type's rules. Pure: it only sees samples. */
export interface Evaluator {
  step(sample: MissionSample): EvalStep;
  objective(): Objective | undefined;
  progress(): MissionProgress;
  elapsedS(): number;
  timeLeftS(): number;
  damage(): number;
  comfort(): number | null;
  /** Stars earned. Meaningful once step() reported success. */
  stars(): Stars;
}
