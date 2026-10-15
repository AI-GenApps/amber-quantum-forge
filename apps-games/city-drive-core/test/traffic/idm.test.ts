import { describe, expect, it } from "vitest";
import {
  brakingSpeedLimit,
  DEFAULT_IDM,
  desiredGap,
  type IdmLeader,
  idmAcceleration,
} from "../../src/index";

const V0 = 10;

/** Integrate the model for `seconds` at 1/60 s. */
function simulate(
  speed: number,
  leader: (t: number, v: number) => IdmLeader | undefined,
  seconds: number,
) {
  let v = speed;
  for (let i = 0; i < seconds * 60; i++) {
    const a = idmAcceleration(DEFAULT_IDM, v, V0, leader(i / 60, v));
    v = Math.max(0, v + a / 60);
  }
  return v;
}

describe("IDM car-following maths", () => {
  it("accelerates from rest on a free road at the maximum acceleration", () => {
    expect(idmAcceleration(DEFAULT_IDM, 0, V0)).toBeCloseTo(DEFAULT_IDM.maxAccel, 6);
  });

  it("has zero acceleration at the desired speed on a free road", () => {
    expect(idmAcceleration(DEFAULT_IDM, V0, V0)).toBeCloseTo(0, 6);
  });

  it("brakes when above the desired speed", () => {
    expect(idmAcceleration(DEFAULT_IDM, V0 * 1.3, V0)).toBeLessThan(0);
  });

  it("converges to the desired speed from below and never overshoots", () => {
    let v = 0;
    let peak = 0;
    for (let i = 0; i < 60 * 60; i++) {
      v += idmAcceleration(DEFAULT_IDM, v, V0) / 60;
      peak = Math.max(peak, v);
    }
    expect(v).toBeGreaterThan(V0 - 0.05);
    expect(peak).toBeLessThanOrEqual(V0 + 1e-9);
  });

  it("ignores a leader that is far away", () => {
    const free = idmAcceleration(DEFAULT_IDM, 8, V0);
    const far = idmAcceleration(DEFAULT_IDM, 8, V0, { gap: 500, speed: 8 });
    expect(far).toBeCloseTo(free, 1);
  });

  it("brakes harder the smaller the gap", () => {
    const at = (gap: number) => idmAcceleration(DEFAULT_IDM, 8, V0, { gap, speed: 8 });
    expect(at(30)).toBeGreaterThan(at(20));
    expect(at(20)).toBeGreaterThan(at(10));
    expect(at(10)).toBeGreaterThan(at(5));
  });

  it("brakes harder the faster it closes on the leader", () => {
    const at = (leaderSpeed: number) =>
      idmAcceleration(DEFAULT_IDM, 10, V0, { gap: 15, speed: leaderSpeed });
    expect(at(10)).toBeGreaterThan(at(5));
    expect(at(5)).toBeGreaterThan(at(0));
  });

  it("bounds braking at maxBrake and acceleration at maxAccel", () => {
    expect(idmAcceleration(DEFAULT_IDM, 12, V0, { gap: 0.2, speed: 0 })).toBe(
      -DEFAULT_IDM.maxBrake,
    );
    expect(idmAcceleration(DEFAULT_IDM, 0, 50)).toBeLessThanOrEqual(DEFAULT_IDM.maxAccel);
  });

  it("holds the equilibrium gap behind a leader at constant speed", () => {
    const leaderSpeed = 8;
    const equilibrium =
      desiredGap(DEFAULT_IDM, leaderSpeed, 0) / Math.sqrt(1 - (leaderSpeed / V0) ** 4);
    const a = idmAcceleration(DEFAULT_IDM, leaderSpeed, V0, {
      gap: equilibrium,
      speed: leaderSpeed,
    });
    expect(a).toBeCloseTo(0, 6);
    expect(desiredGap(DEFAULT_IDM, leaderSpeed, 0)).toBeCloseTo(
      DEFAULT_IDM.minGap + leaderSpeed * DEFAULT_IDM.headway,
      6,
    );
  });

  it("settles behind a slower leader at its speed", () => {
    let v = 10;
    let gap = 40;
    const leaderSpeed = 6;
    for (let i = 0; i < 60 * 120; i++) {
      v = Math.max(0, v + idmAcceleration(DEFAULT_IDM, v, V0, { gap, speed: leaderSpeed }) / 60);
      gap += (leaderSpeed - v) / 60;
    }
    expect(v).toBeCloseTo(leaderSpeed, 1);
    expect(gap).toBeGreaterThan(DEFAULT_IDM.minGap + leaderSpeed * DEFAULT_IDM.headway - 0.5);
  });

  it("stops short of a stopped obstacle without touching it", () => {
    let v = 10;
    let position = 0;
    const obstacleAt = 80;
    let minGap = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 60 * 30; i++) {
      const gap = obstacleAt - position;
      minGap = Math.min(minGap, gap);
      v = Math.max(0, v + idmAcceleration(DEFAULT_IDM, v, V0, { gap, speed: 0 }) / 60);
      position += v / 60;
    }
    expect(v).toBeLessThan(0.05);
    expect(minGap).toBeGreaterThan(1.5);
    expect(obstacleAt - position).toBeGreaterThan(1.5);
    expect(obstacleAt - position).toBeLessThan(DEFAULT_IDM.minGap + 1);
  });

  it("resumes when the leader pulls away", () => {
    const v = simulate(0, (t) => ({ gap: 2 + 5 * t, speed: 5 }), 20);
    expect(v).toBeGreaterThan(4);
  });

  it("brakingSpeedLimit is the speed that decelerates to the target over the distance", () => {
    expect(brakingSpeedLimit(5, 0, 2.5)).toBeCloseTo(5, 6);
    const v = brakingSpeedLimit(5, 20, 2.5);
    expect((v * v - 25) / (2 * 20)).toBeCloseTo(2.5, 6);
    expect(brakingSpeedLimit(5, -3, 2.5)).toBeCloseTo(5, 6);
  });
});
