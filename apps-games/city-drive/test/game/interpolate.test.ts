// @vitest-environment node
import type { CarState } from "@city-drive/core";
import { describe, expect, it } from "vitest";
import { interpolateCar } from "../../src/game/interpolate";

function state(x: number, qz: number, qw: number, spin: number): CarState {
  return {
    position: { x, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: qz, w: qw },
    velocity: { x: 0, y: 0, z: 0 },
    speedKmh: x,
    yawRate: 0,
    longitudinalG: 0,
    lateralG: 0,
    wheelContacts: [true],
    wheels: [
      { inContact: true, rotation: spin, steering: spin / 10, suspensionLength: 0.3, slip: 0 },
    ],
  };
}

describe("interpolateCar", () => {
  const a = state(0, 0, 1, 0);
  const b = state(10, 0, 1, 2);

  it("returns prev at alpha 0 and curr at alpha 1", () => {
    expect(interpolateCar(a, b, 0).position.x).toBe(0);
    expect(interpolateCar(a, b, 1).position.x).toBe(10);
  });

  it("blends position, speed and wheel angles linearly", () => {
    const mid = interpolateCar(a, b, 0.25);
    expect(mid.position.x).toBeCloseTo(2.5, 9);
    expect(mid.speedKmh).toBeCloseTo(2.5, 9);
    expect(mid.wheels[0]?.rotation).toBeCloseTo(0.5, 9);
    expect(mid.wheels[0]?.steering).toBeCloseTo(0.05, 9);
  });

  it("clamps alpha outside 0..1", () => {
    expect(interpolateCar(a, b, -3).position.x).toBe(0);
    expect(interpolateCar(a, b, 7).position.x).toBe(10);
  });

  it("keeps the rotation a unit quaternion and takes the short way round", () => {
    const half = 0.3;
    const p = state(0, Math.sin(half), Math.cos(half), 0);
    const q = state(0, -Math.sin(half), -Math.cos(half), 0); // same rotation as p, opposite sign
    const mid = interpolateCar(p, q, 0.5).rotation;
    expect(Math.hypot(mid.x, mid.y, mid.z, mid.w)).toBeCloseTo(1, 9);
    expect(Math.abs(mid.w)).toBeCloseTo(Math.cos(half), 6);
  });
});
