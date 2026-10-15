import { describe, expect, it } from "vitest";
import { createPhysicsWorld, KinematicBox } from "../../src/index";

const IDENTITY = { x: 0, y: 0, z: 0, w: 1 };
const HALF = { x: 0.85, y: 0.45, z: 2.1 };

describe("KinematicBox", () => {
  it("moves exactly to the pose it is told to take on the next step", async () => {
    const world = await createPhysicsWorld();
    const box = new KinematicBox(world, HALF, { position: { x: 0, y: 1, z: 0 } }, {});
    box.setNext({ x: 0.3, y: 1, z: -0.2 }, IDENTITY);
    world.step();
    const p = box.position();
    expect(p.x).toBeCloseTo(0.3, 5);
    expect(p.z).toBeCloseTo(-0.2, 5);
    box.teleport({ x: 40, y: 1, z: 40 }, IDENTITY);
    expect(box.position().x).toBeCloseTo(40, 5);
  });

  it("pushes a dynamic body and reports a contact-force event with its collider", async () => {
    const world = await createPhysicsWorld();
    world.addGround();
    const box = new KinematicBox(
      world,
      HALF,
      { position: { x: 0, y: 0.9, z: 0 } },
      { contactEvents: true },
    );
    const crate = world.addDynamicBox({ x: 0, y: 0.9, z: 4 }, { x: 0.8, y: 0.45, z: 0.8 });
    const impulses = [];
    for (let i = 0; i < 120; i++) {
      box.setNext({ x: 0, y: 0.9, z: (i + 1) * 0.06 }, IDENTITY);
      world.step();
      impulses.push(...world.drainCollisionImpulses());
    }
    expect(crate.translation().z).toBeGreaterThan(4.5);
    expect(impulses.length).toBeGreaterThan(0);
    expect(
      impulses.every(
        (e) => e.colliderA === box.colliderHandle || e.colliderB === box.colliderHandle,
      ),
    ).toBe(true);
    expect(impulses[0]?.force).toBeGreaterThan(0);
  });

  it("makes no contacts with other kinematic bodies or with static boxes", async () => {
    const world = await createPhysicsWorld();
    world.addGround();
    world.addStaticBox({ x: 0, y: 1.5, z: 3 }, { x: 5, y: 1.5, z: 0.2 });
    const a = new KinematicBox(
      world,
      HALF,
      { position: { x: 0, y: 0.9, z: 0 } },
      { contactEvents: true },
    );
    const b = new KinematicBox(
      world,
      HALF,
      { position: { x: 0, y: 0.9, z: 2 } },
      { contactEvents: true },
    );
    const impulses = [];
    for (let i = 0; i < 90; i++) {
      a.setNext({ x: 0, y: 0.9, z: i * 0.05 }, IDENTITY);
      b.setNext({ x: 0, y: 0.9, z: 2 + i * 0.01 }, IDENTITY);
      world.step();
      impulses.push(...world.drainCollisionImpulses());
    }
    expect(impulses).toEqual([]);
    expect(a.position().z).toBeGreaterThan(4);
  });

  it("is still addressable after a snapshot restore", async () => {
    const world = await createPhysicsWorld();
    const box = new KinematicBox(world, HALF, { position: { x: 1, y: 1, z: 2 } }, {});
    const snapshot = world.takeSnapshot();
    box.teleport({ x: 9, y: 1, z: 9 }, IDENTITY);
    world.restoreSnapshot(snapshot);
    box.rebind(world.world);
    expect(box.position().x).toBeCloseTo(1, 5);
    box.dispose();
  });
});
