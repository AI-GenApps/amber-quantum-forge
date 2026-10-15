// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  CHASE,
  chaseDistance,
  chaseFov,
  chaseHeight,
  damp,
  dampFactor,
  dampVec,
  desiredCameraPosition,
  lookTarget,
  normalize2,
  resolveOcclusion,
  speedFactor,
} from "../../src/render/cameraMath";

describe("damping", () => {
  it("closes no gap at dt 0 and approaches the target as dt grows", () => {
    expect(dampFactor(0, 7)).toBe(0);
    expect(dampFactor(10, 7)).toBeCloseTo(1, 9);
    expect(damp(0, 10, 7, 0.05)).toBeGreaterThan(0);
    expect(damp(0, 10, 7, 0.05)).toBeLessThan(10);
  });

  it("is frame-rate independent: two half frames equal one whole frame", () => {
    const whole = damp(0, 10, CHASE.positionRate, 1 / 30);
    const half = damp(damp(0, 10, CHASE.positionRate, 1 / 60), 10, CHASE.positionRate, 1 / 60);
    expect(half).toBeCloseTo(whole, 9);
  });

  it("never overshoots and moves monotonically", () => {
    let value = 0;
    let last = -1;
    for (let i = 0; i < 200; i++) {
      value = damp(value, 5, 12, 1 / 45);
      expect(value).toBeGreaterThanOrEqual(last);
      expect(value).toBeLessThanOrEqual(5);
      last = value;
    }
    expect(value).toBeCloseTo(5, 6);
  });

  it("does not jitter when the target is steady: constant-velocity target gives constant lag", () => {
    let pos = 0;
    const speed = 20;
    const lags: number[] = [];
    for (let i = 0; i < 600; i++) {
      pos = damp(pos, i * speed * (1 / 60) + 0, CHASE.positionRate, 1 / 60);
      lags.push(i * speed * (1 / 60) - pos);
    }
    const tail = lags.slice(-60);
    expect(Math.max(...tail) - Math.min(...tail)).toBeLessThan(1e-3);
  });

  it("dampVec moves each axis by the same fraction", () => {
    const out = dampVec({ x: 0, y: 0, z: 0 }, { x: 10, y: 20, z: -10 }, 5, 0.1);
    const f = dampFactor(0.1, 5);
    expect(out).toEqual({ x: 10 * f, y: 20 * f, z: -10 * f });
  });
});

describe("speed effects", () => {
  it("are zero at standstill, full at the reference speed, and symmetric in reverse", () => {
    expect(speedFactor(0)).toBe(0);
    expect(speedFactor(CHASE.fullSpeedKmh)).toBe(1);
    expect(speedFactor(500)).toBe(1);
    expect(speedFactor(-60)).toBe(speedFactor(60));
  });

  it("pull the camera back, up and wider as speed rises, within the limits", () => {
    expect(chaseDistance(0)).toBe(CHASE.distance);
    expect(chaseHeight(0)).toBe(CHASE.height);
    expect(chaseFov(0)).toBe(CHASE.fovBase);
    let last = [chaseDistance(0), chaseHeight(0), chaseFov(0)];
    for (let kmh = 10; kmh <= 130; kmh += 10) {
      const now = [chaseDistance(kmh), chaseHeight(kmh), chaseFov(kmh)];
      now.forEach((v, i) => {
        expect(v).toBeGreaterThanOrEqual(last[i] as number);
      });
      last = now;
    }
    expect(chaseDistance(500)).toBeCloseTo(CHASE.distance + CHASE.extraDistance, 9);
    expect(chaseFov(500)).toBeCloseTo(CHASE.fovMax, 9);
  });
});

describe("camera placement", () => {
  it("sits behind the car along the heading and above it", () => {
    const pos = desiredCameraPosition({ x: 5, y: 1, z: 5 }, { x: 0, z: 1 }, 0);
    expect(pos.x).toBe(5);
    expect(pos.z).toBe(5 - CHASE.distance);
    expect(pos.y).toBe(1 + CHASE.height);
  });

  it("looks ahead of the car", () => {
    const target = lookTarget({ x: 0, y: 1, z: 0 }, { x: 1, z: 0 });
    expect(target).toEqual({ x: CHASE.lookAhead, y: 1 + CHASE.lookHeight, z: 0 });
  });

  it("normalises headings and falls back on a zero vector", () => {
    expect(normalize2(3, 4, { x: 0, z: 1 })).toEqual({ x: 0.6, z: 0.8 });
    expect(normalize2(0, 0, { x: 0, z: 1 })).toEqual({ x: 0, z: 1 });
  });
});

describe("resolveOcclusion", () => {
  const anchor = { x: 0, y: 2, z: 0 };
  const wanted = { x: 0, y: 8, z: -8 }; // 10 m away

  it("leaves the camera alone when nothing is in the way", () => {
    expect(resolveOcclusion(anchor, wanted, undefined)).toEqual(wanted);
  });

  it("leaves it alone when the wall is behind the camera", () => {
    expect(resolveOcclusion(anchor, wanted, 25)).toEqual(wanted);
  });

  it("pulls in to the wall minus the margin along the same line", () => {
    const out = resolveOcclusion(anchor, wanted, 6);
    const d = Math.hypot(out.x - anchor.x, out.y - anchor.y, out.z - anchor.z);
    expect(d).toBeCloseTo(6 - CHASE.wallMargin, 9);
    expect(out.y - anchor.y).toBeCloseTo(((6 - CHASE.wallMargin) / 10) * 6, 9);
    expect(out.z / (out.y - anchor.y)).toBeCloseTo(wanted.z / (wanted.y - anchor.y), 9);
  });

  it("never comes closer than the minimum distance, and never goes under the minimum height", () => {
    const out = resolveOcclusion(anchor, wanted, 0.1);
    const d = Math.hypot(out.x - anchor.x, out.y - anchor.y, out.z - anchor.z);
    expect(d).toBeCloseTo(CHASE.minDistance, 9);
    const low = resolveOcclusion({ x: 0, y: 0, z: 0 }, { x: 0, y: -3, z: -2 }, undefined);
    expect(low.y).toBe(CHASE.minHeight);
  });
});
