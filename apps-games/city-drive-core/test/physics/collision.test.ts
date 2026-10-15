import { describe, expect, it } from "vitest";
import { BASELINE_CAR, createCar, createPhysicsWorld } from "../../src/index";
import { FULL_THROTTLE, STEPS_PER_SECOND } from "./helpers";

describe("collisions", () => {
  it("stops at a thin static wall at top speed without tunnelling", async () => {
    const world = await createPhysicsWorld();
    world.addGround();
    const wallZ = 450;
    const wallHalfThickness = 0.1;
    const wall = world.addStaticBox(
      { x: 0, y: 1.5, z: wallZ },
      { x: 6, y: 1.5, z: wallHalfThickness },
    );
    const car = createCar(world, BASELINE_CAR, { position: { x: 0, y: 1, z: 0 } });
    car.applyInput(FULL_THROTTLE);

    let impactSpeed = 0;
    let maxFront = -Infinity;
    const impulses = [];
    for (let i = 0; i < 40 * STEPS_PER_SECOND; i++) {
      const before = car.state();
      world.step();
      impulses.push(...world.drainCollisionImpulses());
      const s = car.state();
      maxFront = Math.max(maxFront, s.position.z + BASELINE_CAR.chassisHalfExtents.z);
      if (impulses.length === 1 && impactSpeed === 0) impactSpeed = before.speedKmh;
      if (s.position.z > wallZ + 5) throw new Error(`tunnelled through the wall at step ${i}`);
    }
    const end = car.state();
    console.log(
      `impact at ${impactSpeed.toFixed(1)} km/h, max front ${maxFront.toFixed(2)}, ${impulses.length} impulses`,
    );
    expect(impactSpeed).toBeGreaterThan(95);
    expect(maxFront).toBeLessThan(wallZ - wallHalfThickness + 0.3);
    expect(end.position.z).toBeLessThan(wallZ - wallHalfThickness);
    expect(impulses.length).toBeGreaterThan(0);
    const hit = impulses.find((e) => e.colliderA === wall.handle || e.colliderB === wall.handle);
    expect(hit?.force).toBeGreaterThan(BASELINE_CAR.collisionForceThreshold);
    expect(hit?.impulse).toBeCloseTo((hit?.force ?? 0) / STEPS_PER_SECOND, 6);
    expect(world.drainCollisionImpulses()).toEqual([]);
  });
});
