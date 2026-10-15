import RAPIER from "@dimforge/rapier3d-compat";
import { FIXED_DT } from "./clock";
import { GRAVITY, type Vec3 } from "./math";

export type RapierModule = typeof RAPIER;

let rapierReady: Promise<RapierModule> | undefined;

/** Initialise the Rapier wasm once per process. The compat build inlines the wasm. */
export function loadRapier(): Promise<RapierModule> {
  rapierReady ??= RAPIER.init().then(() => RAPIER);
  return rapierReady;
}

/** A collision reported by the contact-force event queue. */
export interface CollisionImpulse {
  /** Physics tick the contact was reported on. */
  tick: number;
  colliderA: number;
  colliderB: number;
  /** Total contact force in N. */
  force: number;
  /** Force times the step length, in N*s. */
  impulse: number;
}

/** Something stepped by the world: a car, later traffic. */
export interface SteppedBody {
  /** Runs before world.step(): apply inputs, update the vehicle controller. */
  preStep(dt: number): void;
  /** Called after restoreSnapshot() swapped the underlying Rapier world. */
  rebind(world: RAPIER.World): void;
}

export interface WorldSnapshot {
  bytes: Uint8Array;
  tick: number;
}

export class PhysicsWorld {
  readonly rapier: RapierModule;
  readonly dt = FIXED_DT;
  world: RAPIER.World;
  private readonly events: RAPIER.EventQueue;
  private readonly bodies: SteppedBody[] = [];
  private pending: CollisionImpulse[] = [];
  private tickCount = 0;

  constructor(rapier: RapierModule) {
    this.rapier = rapier;
    this.world = PhysicsWorld.configure(new rapier.World({ x: 0, y: -GRAVITY, z: 0 }));
    this.events = new rapier.EventQueue(true);
  }

  private static configure(world: RAPIER.World): RAPIER.World {
    world.timestep = FIXED_DT;
    return world;
  }

  get tick(): number {
    return this.tickCount;
  }

  register(body: SteppedBody): void {
    this.bodies.push(body);
  }

  unregister(body: SteppedBody): void {
    const i = this.bodies.indexOf(body);
    if (i >= 0) this.bodies.splice(i, 1);
  }

  /** Advance the simulation by exactly one fixed step. */
  step(): void {
    for (const body of this.bodies) body.preStep(this.dt);
    this.world.step(this.events);
    this.tickCount++;
    this.events.drainContactForceEvents((event) => {
      const force = event.totalForceMagnitude();
      this.pending.push({
        tick: this.tickCount,
        colliderA: event.collider1(),
        colliderB: event.collider2(),
        force,
        impulse: force * this.dt,
      });
    });
  }

  /** Return and clear the collision impulses reported since the last drain. */
  drainCollisionImpulses(): CollisionImpulse[] {
    const out = this.pending;
    this.pending = [];
    return out;
  }

  /** Flat ground whose top surface is at y = 0. */
  addGround(halfSize = 3000, friction = 1): RAPIER.Collider {
    const desc = this.rapier.ColliderDesc.cuboid(halfSize, 0.5, halfSize)
      .setTranslation(0, -0.5, 0)
      .setFriction(friction);
    return this.world.createCollider(desc);
  }

  /** Static box centred at `center` with the given half extents. */
  addStaticBox(center: Vec3, halfExtents: Vec3, friction = 1): RAPIER.Collider {
    const desc = this.rapier.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z)
      .setTranslation(center.x, center.y, center.z)
      .setFriction(friction);
    return this.world.createCollider(desc);
  }

  /** Dynamic box, used for props and the performance test. */
  addDynamicBox(center: Vec3, halfExtents: Vec3, density = 200): RAPIER.RigidBody {
    const body = this.world.createRigidBody(
      this.rapier.RigidBodyDesc.dynamic().setTranslation(center.x, center.y, center.z),
    );
    this.world.createCollider(
      this.rapier.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z).setDensity(
        density,
      ),
      body,
    );
    return body;
  }

  /** Snapshot the Rapier world. Vehicle controllers are JS-side and are not included. */
  takeSnapshot(): WorldSnapshot {
    return { bytes: this.world.takeSnapshot(), tick: this.tickCount };
  }

  /** Restore a snapshot, then ask every registered body to rebuild its controller. */
  restoreSnapshot(snapshot: WorldSnapshot): void {
    this.world.free();
    this.world = PhysicsWorld.configure(this.rapier.World.restoreSnapshot(snapshot.bytes));
    this.tickCount = snapshot.tick;
    this.pending = [];
    this.events.clear();
    for (const body of this.bodies) body.rebind(this.world);
  }

  dispose(): void {
    this.events.free();
    this.world.free();
  }
}

export async function createPhysicsWorld(): Promise<PhysicsWorld> {
  return new PhysicsWorld(await loadRapier());
}
