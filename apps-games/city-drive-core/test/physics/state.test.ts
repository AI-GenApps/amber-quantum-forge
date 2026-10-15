import { describe, expect, it } from "vitest";
import { accelerateTo, COAST, createRig, drive, FULL_THROTTLE } from "./helpers";
import { BASELINE_CAR, detCosSinForTests } from "./state-support";

describe("Car.state() extras", () => {
  it("reports velocity consistent with speedKmh and zero slip while coasting straight", async () => {
    const rig = await createRig(BASELINE_CAR);
    accelerateTo(rig, 50);
    drive(rig, { ...COAST, throttle: 0.15 }, 1);
    const s = rig.car.state();
    expect(Math.hypot(s.velocity.x, s.velocity.z) * 3.6).toBeCloseTo(Math.abs(s.speedKmh), 0);
    expect(s.wheels).toHaveLength(4);
    for (const w of s.wheels) {
      expect(w.inContact).toBe(true);
      expect(w.slip).toBeLessThan(0.5);
    }
  });

  it("reports wheel slip near 1 for the sliding wheels in a handbrake turn", async () => {
    const rig = await createRig(BASELINE_CAR);
    accelerateTo(rig, 60);
    drive(rig, { throttle: 0.3, steer: 1, handbrake: true }, 0.5);
    expect(Math.max(...rig.car.state().wheels.map((w) => w.slip))).toBeGreaterThan(0.9);
  });

  it("reports opposite longitudinal G for acceleration and braking", async () => {
    const rig = await createRig(BASELINE_CAR);
    drive(rig, FULL_THROTTLE, 1);
    const accel = rig.car.state().longitudinalG;
    drive(rig, { ...COAST, throttle: -1 }, 0.5);
    const brake = rig.car.state().longitudinalG;
    expect(accel).toBeGreaterThan(0.2);
    expect(brake).toBeLessThan(-0.4);
  });

  it("rejects non-finite input with a descriptive error", async () => {
    const rig = await createRig(BASELINE_CAR);
    expect(() => rig.car.applyInput({ throttle: Number.NaN, steer: 0, handbrake: false })).toThrow(
      /finite/,
    );
  });

  it("deterministic sin/cos stay within 1e-9 of Math.sin/Math.cos", () => {
    expect(detCosSinForTests()).toBeLessThan(1e-9);
  });
});
