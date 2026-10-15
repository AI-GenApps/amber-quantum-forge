import type { Vec3 } from "../physics/math";

export interface WheelSpec {
  /** Connection point on the chassis, in chassis-local space (y up, z forward). */
  position: Vec3;
  steered: boolean;
  driven: boolean;
  /** Handbrake locks this wheel and lowers its grip. */
  handbrake: boolean;
}

/** Everything that defines how a car drives. Plain data, safe to serialise. */
export interface CarSpec {
  id: string;
  /** Chassis mass in kg. */
  mass: number;
  /** Half extents of the chassis collider in metres. */
  chassisHalfExtents: Vec3;
  /** Centre-of-mass offset below the chassis centre (positive = lower, more stable). */
  comDrop: number;
  wheelRadius: number;
  wheels: readonly WheelSpec[];
  suspension: {
    restLength: number;
    maxTravel: number;
    stiffness: number;
    compression: number;
    relaxation: number;
    maxForce: number;
  };
  /** Total engine force in N at standstill, split over the driven wheels. */
  engineForce: number;
  /** Speed (km/h) where engine force fades to zero. */
  topSpeedKmh: number;
  /** Engine force fraction available in reverse. */
  reverseFactor: number;
  /** Reverse speed limit in km/h. */
  maxReverseKmh: number;
  /** Total brake force in N, split over all wheels. */
  brakeForce: number;
  /** Light brake applied when no throttle is held, as a fraction of brakeForce. */
  coastBrakeFactor: number;
  /** Handbrake force per handbrake wheel as a fraction of brakeForce. */
  handbrakeFactor: number;
  /** Max steering angle (rad) at standstill. */
  maxSteerAngle: number;
  /** Steering angle floor (rad) at high speed, so the car always answers the wheel. */
  highSpeedSteerAngle: number;
  /** Lateral acceleration (in g) the speed-dependent steering limit aims for. */
  maxLateralG: number;
  /** Steering rate limit (rad/s), so input smoothing is part of the car. */
  steerRate: number;
  frictionSlip: number;
  sideFrictionStiffness: number;
  /** Multiplier on friction slip for handbrake wheels while the handbrake is held. */
  handbrakeGripFactor: number;
  linearDamping: number;
  angularDamping: number;
  /** Contact force (N) above which a collision impulse is reported. */
  collisionForceThreshold: number;
}

const FRONT_Z = 1.3;
const REAR_Z = -1.2;
const HALF_TRACK = 0.8;
const WHEEL_Y = -0.25;

function wheel(
  x: number,
  z: number,
  steered: boolean,
  driven: boolean,
  handbrake: boolean,
): WheelSpec {
  return { position: { x, y: WHEEL_Y, z }, steered, driven, handbrake };
}

/** Baseline arcade hatchback. Task 12 adds the roster. Values are in the decision log. */
export const BASELINE_CAR: CarSpec = {
  id: "baseline",
  mass: 1200,
  chassisHalfExtents: { x: 0.85, y: 0.45, z: 2.1 },
  comDrop: 0.35,
  wheelRadius: 0.35,
  wheels: [
    wheel(HALF_TRACK, FRONT_Z, true, false, false),
    wheel(-HALF_TRACK, FRONT_Z, true, false, false),
    wheel(HALF_TRACK, REAR_Z, false, true, true),
    wheel(-HALF_TRACK, REAR_Z, false, true, true),
  ],
  suspension: {
    restLength: 0.35,
    maxTravel: 0.3,
    stiffness: 30,
    compression: 0.83,
    relaxation: 0.88,
    maxForce: 60000,
  },
  engineForce: 6000,
  topSpeedKmh: 115,
  reverseFactor: 0.6,
  maxReverseKmh: 30,
  brakeForce: 12000,
  coastBrakeFactor: 0.04,
  handbrakeFactor: 1,
  maxSteerAngle: 0.5,
  highSpeedSteerAngle: 0.05,
  maxLateralG: 1.4,
  steerRate: 3.5,
  frictionSlip: 2.6,
  sideFrictionStiffness: 1,
  handbrakeGripFactor: 0.35,
  linearDamping: 0.02,
  angularDamping: 0.6,
  collisionForceThreshold: 8000,
};
