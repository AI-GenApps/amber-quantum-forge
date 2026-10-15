import { describe, expect, it } from "vitest";
import type { CarSpec } from "../../src/index";
import { quatFromYaw } from "../../src/index";
import {
  accelerateTo,
  COAST,
  createRig,
  distance,
  drive,
  driveUntil,
  FULL_THROTTLE,
  uprightness,
} from "./helpers";

const COS_45 = Math.SQRT1_2;

/** Handling sanity suite, parameterised by CarSpec so task 12 can reuse it for the roster. */
export function describeHandling(spec: CarSpec): void {
  describe(`handling: ${spec.id}`, () => {
    it("accelerates 0-60 km/h in 3 to 4 seconds", async () => {
      const rig = await createRig(spec);
      const t = driveUntil(rig, FULL_THROTTLE, () => rig.car.state().speedKmh >= 60, 10);
      console.log(`[${spec.id}] 0-60 km/h: ${t.toFixed(2)} s`);
      expect(t).toBeGreaterThanOrEqual(2.8);
      expect(t).toBeLessThanOrEqual(4.2);
      expect(rig.car.state().longitudinalG).toBeGreaterThan(0);
    });

    it("reaches a top speed of about 110 km/h", async () => {
      const rig = await createRig(spec);
      drive(rig, FULL_THROTTLE, 25);
      const top = rig.car.state().speedKmh;
      console.log(`[${spec.id}] top speed after 25 s: ${top.toFixed(1)} km/h`);
      expect(top).toBeGreaterThanOrEqual(100);
      expect(top).toBeLessThanOrEqual(120);
    });

    it("brakes from 60 km/h to a stop within 10-20 m, straight", async () => {
      const rig = await createRig(spec);
      accelerateTo(rig, 60);
      const start = rig.car.state().position;
      const t = driveUntil(
        rig,
        { ...COAST, throttle: -1 },
        () => rig.car.state().speedKmh < 0.5,
        5,
      );
      const end = rig.car.state().position;
      const dist = distance(start, end);
      console.log(`[${spec.id}] brake 60->0: ${dist.toFixed(1)} m in ${t.toFixed(2)} s`);
      expect(dist).toBeGreaterThanOrEqual(10);
      expect(dist).toBeLessThanOrEqual(20);
      expect(Math.abs(end.x - start.x)).toBeLessThan(1);
      expect(rig.car.state().longitudinalG).toBeLessThan(0);
    });

    it("turns right in a circle of 4-12 m radius at about 25 km/h", async () => {
      const rig = await createRig(spec);
      accelerateTo(rig, 25);
      const input = { throttle: 0.3, steer: 1, handbrake: false };
      drive(rig, input, 2);
      const points: { x: number; z: number }[] = [];
      for (let i = 0; i < 120; i++) {
        drive(rig, input, 1 / 60);
        points.push(rig.car.state().position);
      }
      const s = rig.car.state();
      const radius = Math.abs(s.speedKmh / 3.6 / s.yawRate);
      const xs = points.map((p) => p.x);
      const zs = points.map((p) => p.z);
      const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
      console.log(
        `[${spec.id}] turning radius: ${radius.toFixed(1)} m (path span ${span.toFixed(1)} m)`,
      );
      expect(s.yawRate).toBeLessThan(0); // right turn is clockwise seen from above
      expect(s.lateralG).toBeGreaterThan(0.2);
      expect(radius).toBeGreaterThanOrEqual(4);
      expect(radius).toBeLessThanOrEqual(12);
      expect(span).toBeGreaterThan(radius * 1.2);
      expect(span).toBeLessThan(radius * 2.6);
    });

    it("steers left with a negative steer input", async () => {
      const rig = await createRig(spec);
      accelerateTo(rig, 30);
      drive(rig, { throttle: 0.3, steer: -1, handbrake: false }, 1.5);
      expect(rig.car.state().yawRate).toBeGreaterThan(0.2);
      expect(rig.car.state().lateralG).toBeLessThan(-0.2);
    });

    it("reverses from standstill", async () => {
      const rig = await createRig(spec);
      drive(rig, { ...COAST, throttle: -1 }, 3);
      const s = rig.car.state();
      console.log(`[${spec.id}] reverse after 3 s: ${s.speedKmh.toFixed(1)} km/h`);
      expect(s.speedKmh).toBeLessThan(-10);
      expect(s.speedKmh).toBeGreaterThan(-spec.maxReverseKmh - 5);
      expect(s.position.z).toBeLessThan(-4);
    });

    it("stays upright (roll < 45 deg) at full lock at top speed", async () => {
      const rig = await createRig(spec);
      drive(rig, FULL_THROTTLE, 20);
      let minUp = 1;
      for (const steer of [1, -1]) {
        rig.car.applyInput({ throttle: 1, steer, handbrake: false });
        for (let i = 0; i < 180; i++) {
          rig.world.step();
          minUp = Math.min(minUp, uprightness(rig));
        }
      }
      console.log(`[${spec.id}] min uprightness at full lock: ${minUp.toFixed(3)}`);
      expect(minUp).toBeGreaterThan(COS_45);
      expect(rig.car.state().wheelContacts.some(Boolean)).toBe(true);
    });

    it("handbrake turn produces yaw without flipping", async () => {
      const rig = await createRig(spec);
      accelerateTo(rig, 60);
      let minUp = 1;
      let peakYaw = 0;
      rig.car.applyInput({ throttle: 0.3, steer: 1, handbrake: true });
      for (let i = 0; i < 45; i++) {
        rig.world.step();
        minUp = Math.min(minUp, uprightness(rig));
        peakYaw = Math.max(peakYaw, Math.abs(rig.car.state().yawRate));
      }
      const slip = rig.car.state().wheels.map((w) => w.slip);
      console.log(
        `[${spec.id}] handbrake peak yaw ${peakYaw.toFixed(2)} rad/s, min up ${minUp.toFixed(3)}`,
      );
      expect(peakYaw).toBeGreaterThan(1.5);
      expect(minUp).toBeGreaterThan(0.9);
      expect(Math.max(...slip)).toBeGreaterThan(0.9);
    });

    it("respawn resets pose, velocity, and recovers a flipped car", async () => {
      const rig = await createRig(spec);
      accelerateTo(rig, 70);
      rig.car.applyInput({ throttle: 1, steer: 1, handbrake: false });
      const pose = { position: { x: 40, y: 1.2, z: -25 }, rotation: quatFromYaw(Math.PI / 2) };
      rig.car.respawn(pose);
      const s = rig.car.state();
      expect(s.position.x).toBeCloseTo(pose.position.x, 4);
      expect(s.position.y).toBeCloseTo(pose.position.y, 4);
      expect(s.position.z).toBeCloseTo(pose.position.z, 4);
      expect(Math.hypot(s.velocity.x, s.velocity.y, s.velocity.z)).toBe(0);
      expect(s.speedKmh).toBe(0);
      expect(s.yawRate).toBe(0);
      drive(rig, COAST, 1.5);
      const after = rig.car.state();
      expect(distance(after.position, pose.position)).toBeLessThan(0.5);
      expect(Math.abs(after.speedKmh)).toBeLessThan(1);
      expect(uprightness(rig)).toBeGreaterThan(0.99);
      expect(after.wheelContacts.every(Boolean)).toBe(true);

      rig.car.respawn({ position: { x: 0, y: 1.5, z: 0 }, rotation: { x: 0, y: 0, z: 1, w: 0 } });
      expect(uprightness(rig)).toBeLessThan(-0.99);
      rig.car.respawn({ position: { x: 0, y: 1.2, z: 0 } });
      drive(rig, COAST, 1);
      expect(uprightness(rig)).toBeGreaterThan(0.99);
    });
  });
}
