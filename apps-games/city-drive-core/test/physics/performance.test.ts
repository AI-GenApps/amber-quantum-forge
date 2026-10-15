import { describe, expect, it } from "vitest";
import { BASELINE_CAR, createCar, createPhysicsWorld } from "../../src/index";
import { FULL_THROTTLE } from "./helpers";

describe("performance", () => {
  it("steps 1 car + 20 dynamic boxes for 600 steps in at most 2 s", async () => {
    const world = await createPhysicsWorld();
    world.addGround();
    const car = createCar(world, BASELINE_CAR, { position: { x: 0, y: 1, z: 0 } });
    for (let i = 0; i < 20; i++) {
      const x = (i % 5) * 3 - 6;
      const z = 20 + Math.floor(i / 5) * 3;
      world.addDynamicBox({ x, y: 0.5 + (i % 3), z }, { x: 0.5, y: 0.5, z: 0.5 });
    }
    car.applyInput(FULL_THROTTLE);
    const t0 = performance.now();
    for (let i = 0; i < 600; i++) world.step();
    const ms = performance.now() - t0;
    console.log(
      `600 steps (1 car + 20 boxes): ${ms.toFixed(1)} ms (${(ms / 600).toFixed(3)} ms/step)`,
    );
    expect(ms).toBeLessThanOrEqual(2000);
    expect(car.state().position.z).toBeGreaterThan(20); // the car did drive into the boxes
  });
});
