import type RAPIER from "@dimforge/rapier3d-compat";
import { IDENTITY_QUAT, type Pose, type Quat, type Vec3 } from "./math";
import type { PhysicsWorld } from "./world";

export interface KinematicBoxOptions {
  /** Report contact-force events for this collider, so a dynamic body hitting it is seen. */
  contactEvents?: boolean;
  /** Contact force (N) above which a collision impulse is reported. */
  forceThreshold?: number;
}

/**
 * A box moved by the game, not by physics (a kinematic, position-based Rapier body). Dynamic
 * bodies collide with it and are pushed away; it is never pushed back. Kinematic bodies make no
 * contacts with other kinematic or fixed bodies, so they cannot hit each other or the buildings.
 */
export class KinematicBox {
  private body: RAPIER.RigidBody;
  private collider: RAPIER.Collider;

  constructor(
    private readonly physics: PhysicsWorld,
    halfExtents: Vec3,
    pose: Pose,
    options: KinematicBoxOptions = {},
  ) {
    const { rapier, world } = physics;
    const p = pose.position;
    const r = pose.rotation ?? IDENTITY_QUAT;
    this.body = world.createRigidBody(
      rapier.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(p.x, p.y, p.z)
        .setRotation(r)
        .setCcdEnabled(true),
    );
    const desc = rapier.ColliderDesc.cuboid(
      halfExtents.x,
      halfExtents.y,
      halfExtents.z,
    ).setFriction(0.2);
    if (options.contactEvents) {
      desc
        .setActiveEvents(rapier.ActiveEvents.CONTACT_FORCE_EVENTS)
        .setContactForceEventThreshold(options.forceThreshold ?? 0);
    }
    this.collider = world.createCollider(desc, this.body);
  }

  get bodyHandle(): number {
    return this.body.handle;
  }

  get colliderHandle(): number {
    return this.collider.handle;
  }

  /** Where the body will be after the next world step. */
  setNext(position: Vec3, rotation: Quat): void {
    this.body.setNextKinematicTranslation(position);
    this.body.setNextKinematicRotation(rotation);
  }

  /** Jump straight to a pose (no motion is implied). */
  teleport(position: Vec3, rotation: Quat): void {
    this.body.setTranslation(position, true);
    this.body.setRotation(rotation, true);
    this.body.setNextKinematicTranslation(position);
    this.body.setNextKinematicRotation(rotation);
  }

  position(): Vec3 {
    const t = this.body.translation();
    return { x: t.x, y: t.y, z: t.z };
  }

  /** Re-fetch the Rapier handles after PhysicsWorld.restoreSnapshot swapped the world. */
  rebind(world: RAPIER.World): void {
    this.body = world.getRigidBody(this.body.handle);
    this.collider = world.getCollider(this.collider.handle);
  }

  dispose(): void {
    this.physics.world.removeRigidBody(this.body);
  }
}
