import { describe, expect, it } from "vitest";
import { type CollisionImpulse, HitDetector, missionConstants } from "../../src/index";

const CAR = 7;

function impulse(tick: number, impulseNs: number, a = CAR, b = 99): CollisionImpulse {
  return { tick, colliderA: a, colliderB: b, force: impulseNs * 60, impulse: impulseNs };
}

describe("HitDetector", () => {
  const big = missionConstants.HIT_IMPULSE_NS;

  it("counts an impulse at the threshold and ignores one below it", () => {
    const d = new HitDetector(CAR);
    expect(d.update([impulse(1, big - 1)])).toBe(0);
    expect(d.update([impulse(2, big)])).toBe(1);
  });

  it("matches the car as either collider", () => {
    const d = new HitDetector(CAR);
    expect(d.update([impulse(1, big * 2, 99, CAR)])).toBe(1);
  });

  it("ignores contacts between other bodies", () => {
    const d = new HitDetector(CAR);
    expect(d.update([impulse(1, big * 5, 1, 2)])).toBe(0);
  });

  it("merges the contacts of one crash during the cooldown", () => {
    const d = new HitDetector(CAR);
    expect(d.update([impulse(10, big)])).toBe(1);
    for (let t = 11; t < 10 + missionConstants.HIT_COOLDOWN_TICKS; t++) {
      expect(d.update([impulse(t, big * 3)])).toBe(0);
    }
    expect(d.update([impulse(10 + missionConstants.HIT_COOLDOWN_TICKS, big)])).toBe(1);
  });

  it("counts two separate crashes reported on one step", () => {
    const d = new HitDetector(CAR);
    expect(d.update([impulse(5, big), impulse(5, big)])).toBe(1);
  });

  it("forgets the cooldown on reset", () => {
    const d = new HitDetector(CAR);
    d.update([impulse(10, big)]);
    d.reset();
    expect(d.update([impulse(11, big)])).toBe(1);
  });
});
