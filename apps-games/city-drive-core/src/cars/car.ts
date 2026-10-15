import type RAPIER from "@dimforge/rapier3d-compat";
import {
  clamp,
  dot,
  GRAVITY,
  hashNumbers,
  IDENTITY_QUAT,
  MS_TO_KMH,
  type Pose,
  type Quat,
  rotateVec,
  rotateVecInverse,
  type Vec3,
} from "../physics/math";
import type { PhysicsWorld, SteppedBody } from "../physics/world";
import {
  approach,
  type CarInput,
  driveForces,
  NEUTRAL_INPUT,
  sanitizeInput,
  steerLimit,
} from "./controls";
import type { CarSpec } from "./specs";

export interface WheelState {
  inContact: boolean;
  /** Visual spin angle in radians. Excluded from state hashes. */
  rotation: number;
  /** Steering angle in radians. */
  steering: number;
  suspensionLength: number;
  /** Friction utilisation, 0 (rolling) to about 1 (at the grip limit) or above (sliding). */
  slip: number;
}

export interface CarState {
  position: Vec3;
  rotation: Quat;
  /** World-space linear velocity in m/s. */
  velocity: Vec3;
  /** Signed speed along the car's forward axis, in km/h. */
  speedKmh: number;
  /** Angular velocity around world up, rad/s. Positive turns left. */
  yawRate: number;
  /** Smoothed acceleration along the car's forward axis, in g. */
  longitudinalG: number;
  /** Smoothed acceleration along the car's right axis, in g. */
  lateralG: number;
  wheelContacts: boolean[];
  wheels: WheelState[];
}

const LOCAL_FORWARD: Vec3 = { x: 0, y: 0, z: 1 };
const LOCAL_UP: Vec3 = { x: 0, y: 1, z: 0 };
const G_SMOOTHING = 0.25;
/** Rapier's wheel axle points along local -X for a +Z-forward car. */
const AXLE: Vec3 = { x: -1, y: 0, z: 0 };
const SUSPENSION_DIR: Vec3 = { x: 0, y: -1, z: 0 };

export class Car implements SteppedBody {
  readonly spec: CarSpec;
  private readonly physics: PhysicsWorld;
  private chassis!: RAPIER.RigidBody;
  private collider!: RAPIER.Collider;
  private controller!: RAPIER.DynamicRayCastVehicleController;
  private input: CarInput = { ...NEUTRAL_INPUT };
  private steerAngle = 0;
  private lastVelocity: Vec3 = { x: 0, y: 0, z: 0 };
  private longG = 0;
  private latG = 0;

  constructor(physics: PhysicsWorld, spec: CarSpec, pose: Pose) {
    this.physics = physics;
    this.spec = spec;
    this.createChassis(pose);
    this.createController();
    physics.register(this);
  }

  get colliderHandle(): number {
    return this.collider.handle;
  }

  get bodyHandle(): number {
    return this.chassis.handle;
  }

  private createChassis(pose: Pose): void {
    const { rapier, world } = this.physics;
    const s = this.spec;
    const h = s.chassisHalfExtents;
    const p = pose.position;
    const r = pose.rotation ?? IDENTITY_QUAT;
    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(p.x, p.y, p.z)
      .setRotation(r)
      .setCcdEnabled(true)
      .setLinearDamping(s.linearDamping)
      .setAngularDamping(s.angularDamping)
      .setCanSleep(false);
    this.chassis = world.createRigidBody(bodyDesc);
    const inertia = {
      x: (s.mass / 3) * (h.y * h.y + h.z * h.z),
      y: (s.mass / 3) * (h.x * h.x + h.z * h.z),
      z: (s.mass / 3) * (h.x * h.x + h.y * h.y),
    };
    const colliderDesc = rapier.ColliderDesc.cuboid(h.x, h.y, h.z)
      .setMassProperties(s.mass, { x: 0, y: -s.comDrop, z: 0 }, inertia, IDENTITY_QUAT)
      .setFriction(0.2)
      .setActiveEvents(rapier.ActiveEvents.CONTACT_FORCE_EVENTS)
      .setContactForceEventThreshold(s.collisionForceThreshold);
    this.collider = world.createCollider(colliderDesc, this.chassis);
  }

  private createController(): void {
    const s = this.spec;
    const c = this.physics.world.createVehicleController(this.chassis);
    c.indexUpAxis = 1;
    c.setIndexForwardAxis = 2;
    s.wheels.forEach((w, i) => {
      c.addWheel(w.position, SUSPENSION_DIR, AXLE, s.suspension.restLength, s.wheelRadius);
      c.setWheelMaxSuspensionTravel(i, s.suspension.maxTravel);
      c.setWheelSuspensionStiffness(i, s.suspension.stiffness);
      c.setWheelSuspensionCompression(i, s.suspension.compression);
      c.setWheelSuspensionRelaxation(i, s.suspension.relaxation);
      c.setWheelMaxSuspensionForce(i, s.suspension.maxForce);
      c.setWheelFrictionSlip(i, s.frictionSlip);
      c.setWheelSideFrictionStiffness(i, s.sideFrictionStiffness);
    });
    this.controller = c;
  }

  /** Called after a world snapshot restore: rebuild the controller from the spec. */
  rebind(world: RAPIER.World): void {
    this.chassis = world.getRigidBody(this.chassis.handle);
    this.collider = world.getCollider(this.collider.handle);
    this.createController();
    this.applyWheelCommands(this.forwardSpeed());
  }

  applyInput(input: CarInput): void {
    this.input = sanitizeInput(input);
  }

  private forwardSpeed(): number {
    const v = this.chassis.linvel();
    return dot(v, rotateVec(this.chassis.rotation(), LOCAL_FORWARD));
  }

  preStep(dt: number): void {
    this.updateGForces(dt);
    this.applyWheelCommands(this.forwardSpeed(), dt);
    this.controller.updateVehicle(dt);
  }

  private updateGForces(dt: number): void {
    const v = this.chassis.linvel();
    const accel = {
      x: (v.x - this.lastVelocity.x) / dt,
      y: 0,
      z: (v.z - this.lastVelocity.z) / dt,
    };
    this.lastVelocity = { x: v.x, y: v.y, z: v.z };
    const local = rotateVecInverse(this.chassis.rotation(), accel);
    this.longG += (local.z / GRAVITY - this.longG) * G_SMOOTHING;
    // Right axis is local -X for a +Z-forward car in a right-handed frame.
    this.latG += (-local.x / GRAVITY - this.latG) * G_SMOOTHING;
  }

  private applyWheelCommands(speedMs: number, dt = this.physics.dt): void {
    const s = this.spec;
    const { engine, brake } = driveForces(s, this.input, speedMs);
    const driven = s.wheels.filter((w) => w.driven).length || 1;
    const target = this.input.steer * steerLimit(s, speedMs);
    this.steerAngle = approach(this.steerAngle, target, s.steerRate * dt);
    s.wheels.forEach((w, i) => {
      // Positive engine force accelerates the car along local +Z (verified by test).
      this.controller.setWheelEngineForce(i, w.driven ? engine / driven : 0);
      let wheelBrake = brake / s.wheels.length;
      if (this.input.handbrake && w.handbrake) wheelBrake = s.brakeForce * s.handbrakeFactor;
      // Rapier's wheel brake is an impulse limit per step, so scale force (N) by dt.
      this.controller.setWheelBrake(i, wheelBrake * dt);
      this.controller.setWheelSteering(i, w.steered ? -this.steerAngle : 0);
      const grip = this.input.handbrake && w.handbrake ? s.handbrakeGripFactor : 1;
      this.controller.setWheelFrictionSlip(i, s.frictionSlip * grip);
    });
  }

  state(): CarState {
    const q = this.chassis.rotation();
    const p = this.chassis.translation();
    const v = this.chassis.linvel();
    const w = this.chassis.angvel();
    const n = this.spec.wheels.length;
    const wheels: WheelState[] = [];
    for (let i = 0; i < n; i++) {
      const suspForce = this.controller.wheelSuspensionForce(i) ?? 0;
      const limit = this.spec.frictionSlip * suspForce * this.physics.dt;
      const fwd = this.controller.wheelForwardImpulse(i) ?? 0;
      const side = this.controller.wheelSideImpulse(i) ?? 0;
      const inContact = this.controller.wheelIsInContact(i);
      wheels.push({
        inContact,
        rotation: this.controller.wheelRotation(i) ?? 0,
        steering: this.controller.wheelSteering(i) ?? 0,
        suspensionLength: this.controller.wheelSuspensionLength(i) ?? 0,
        slip: inContact && limit > 1e-6 ? clamp(Math.hypot(fwd, side) / limit, 0, 2) : 0,
      });
    }
    return {
      position: { x: p.x, y: p.y, z: p.z },
      rotation: { x: q.x, y: q.y, z: q.z, w: q.w },
      velocity: { x: v.x, y: v.y, z: v.z },
      speedKmh: dot(v, rotateVec(q, LOCAL_FORWARD)) * MS_TO_KMH,
      yawRate: dot(w, rotateVec(q, LOCAL_UP)),
      longitudinalG: this.longG,
      lateralG: this.latG,
      wheelContacts: wheels.map((x) => x.inContact),
      wheels,
    };
  }

  /** Stable hash of position, rotation and velocity (1e-4). Excludes visual wheel spin. */
  hash(): string {
    const s = this.state();
    const { position: p, rotation: r, velocity: v } = s;
    return hashNumbers([p.x, p.y, p.z, r.x, r.y, r.z, r.w, v.x, v.y, v.z]);
  }

  /** Put the car back on its wheels at `pose` with zero velocity. */
  respawn(pose: Pose): void {
    const r = pose.rotation ?? IDENTITY_QUAT;
    this.chassis.setTranslation(pose.position, true);
    this.chassis.setRotation(r, true);
    this.chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.chassis.resetForces(true);
    this.chassis.resetTorques(true);
    this.input = { ...NEUTRAL_INPUT };
    this.steerAngle = 0;
    this.lastVelocity = { x: 0, y: 0, z: 0 };
    this.longG = 0;
    this.latG = 0;
    // Wheel raycast state is stale after a teleport; rebuild the controller.
    this.physics.world.removeVehicleController(this.controller);
    this.createController();
    this.applyWheelCommands(0);
  }

  dispose(): void {
    this.physics.unregister(this);
    this.physics.world.removeVehicleController(this.controller);
    this.physics.world.removeRigidBody(this.chassis);
  }
}

export function createCar(world: PhysicsWorld, spec: CarSpec, pose: Pose): Car {
  return new Car(world, spec, pose);
}
