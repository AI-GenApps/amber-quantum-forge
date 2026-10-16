import { describe, expect, it } from "vitest";
import {
  COLLISION_HEAVY_NS,
  COLLISION_MEDIUM_NS,
  COLLISION_MIN_NS,
  collisionSound,
  ENGINE_RATE_MAX,
  ENGINE_RATE_MIN,
  engineParams,
  MUSIC_DUCK_LEVEL,
  MUSIC_LEVEL,
  musicTarget,
  SKID_FULL_MPS,
  SKID_MIN_KMH,
  SKID_START_MPS,
  skidGain,
} from "../../src/audio/mapping";
import { lateralSlipMps, playerImpactNs } from "../../src/game/stepReport";

describe("engineParams", () => {
  it("idles at the lowest pitch on the idle loop", () => {
    const p = engineParams(0, 0, 115);
    expect(p.rpm).toBe(0);
    expect(p.rate).toBeCloseTo(ENGINE_RATE_MIN);
    expect(p.idleGain).toBeCloseTo(1);
    expect(p.revGain).toBeCloseTo(0);
  });

  it("is flat out on the rev loop at top speed with the throttle down", () => {
    const p = engineParams(115, 1, 115);
    expect(p.rpm).toBe(1);
    expect(p.rate).toBeCloseTo(ENGINE_RATE_MAX);
    expect(p.idleGain).toBeCloseTo(0);
    expect(p.revGain).toBeCloseTo(1);
    expect(p.volume).toBeCloseTo(1);
  });

  it("pitch rises with speed and with throttle, never falls", () => {
    let last = 0;
    for (let speed = 0; speed <= 120; speed += 5) {
      const rate = engineParams(speed, 0.5, 115).rate;
      expect(rate).toBeGreaterThanOrEqual(last);
      last = rate;
    }
    expect(engineParams(40, 1, 115).rate).toBeGreaterThan(engineParams(40, 0, 115).rate);
  });

  it("crossfades the two loops with constant power", () => {
    for (let speed = 0; speed <= 115; speed += 5) {
      const p = engineParams(speed, 0.3, 115);
      expect(p.idleGain ** 2 + p.revGain ** 2).toBeCloseTo(1, 5);
    }
  });

  it("treats reverse like forward and clamps out-of-range input", () => {
    expect(engineParams(-60, 0, 115)).toEqual(engineParams(60, 0, 115));
    const wild = engineParams(900, 7, 115);
    expect(wild.rpm).toBe(1);
    expect(engineParams(10, -5, 115).rpm).toBe(engineParams(10, 0, 115).rpm);
  });

  it("is louder with throttle than coasting at the same speed", () => {
    expect(engineParams(40, 1, 115).volume).toBeGreaterThan(engineParams(40, 0, 115).volume);
  });

  it("survives a zero top speed", () => {
    expect(Number.isFinite(engineParams(10, 0.5, 0).rate)).toBe(true);
  });
});

describe("skidGain", () => {
  it("is silent below the slip threshold and full above the top", () => {
    expect(skidGain(SKID_START_MPS - 0.1, 60)).toBe(0);
    expect(skidGain(SKID_FULL_MPS, 60)).toBeCloseTo(1);
    expect(skidGain(SKID_FULL_MPS * 3, 60)).toBe(1);
  });

  it("rises monotonically between", () => {
    let last = 0;
    for (let slip = 0; slip <= 10; slip += 0.5) {
      const g = skidGain(slip, 60);
      expect(g).toBeGreaterThanOrEqual(last);
      last = g;
    }
  });

  it("stays quiet when nearly stopped, and ignores the sign of the slip and the speed", () => {
    expect(skidGain(9, SKID_MIN_KMH - 1)).toBe(0);
    expect(skidGain(-6, -60)).toBe(skidGain(6, 60));
  });
});

describe("collisionSound", () => {
  it("is silent for taps below the minimum and for bad numbers", () => {
    expect(collisionSound(COLLISION_MIN_NS - 1)).toBeUndefined();
    expect(collisionSound(0)).toBeUndefined();
    expect(collisionSound(Number.NaN)).toBeUndefined();
  });

  it("picks light, medium and heavy by impulse", () => {
    expect(collisionSound(COLLISION_MIN_NS)?.id).toBe("collision_light");
    expect(collisionSound(COLLISION_MEDIUM_NS)?.id).toBe("collision_medium");
    expect(collisionSound(COLLISION_HEAVY_NS)?.id).toBe("collision_heavy");
  });

  it("gets louder with the impulse and never exceeds 1", () => {
    const a = collisionSound(200)?.gain ?? 0;
    const b = collisionSound(2000)?.gain ?? 0;
    const c = collisionSound(1e7)?.gain ?? 0;
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(c).toBe(1);
    expect(a).toBeGreaterThanOrEqual(0.3);
  });
});

describe("music level", () => {
  it("ducks while a mission runs", () => {
    expect(musicTarget(false)).toBe(MUSIC_LEVEL);
    expect(musicTarget(true)).toBe(MUSIC_DUCK_LEVEL);
    expect(MUSIC_DUCK_LEVEL).toBeLessThan(MUSIC_LEVEL);
  });
});

describe("step report helpers", () => {
  const identity = { x: 0, y: 0, z: 0, w: 1 };

  it("reports sideways speed relative to the car's heading", () => {
    expect(lateralSlipMps({ velocity: { x: 0, y: 0, z: 20 }, rotation: identity })).toBeCloseTo(0);
    expect(lateralSlipMps({ velocity: { x: 6, y: 0, z: 20 }, rotation: identity })).toBeCloseTo(6);
    expect(lateralSlipMps({ velocity: { x: -6, y: 0, z: 0 }, rotation: identity })).toBeCloseTo(6);
  });

  it("follows the car when it is turned", () => {
    const quarter = Math.SQRT1_2;
    const turned = { x: 0, y: quarter, z: 0, w: quarter };
    expect(lateralSlipMps({ velocity: { x: 0, y: 0, z: 10 }, rotation: turned })).toBeCloseTo(10);
    expect(lateralSlipMps({ velocity: { x: 10, y: 0, z: 0 }, rotation: turned })).toBeCloseTo(0);
  });

  it("takes the hardest contact that involves the player's car", () => {
    const hit = (a: number, b: number, impulse: number) => ({
      tick: 1,
      colliderA: a,
      colliderB: b,
      force: impulse * 60,
      impulse,
    });
    expect(playerImpactNs([], 7)).toBe(0);
    expect(playerImpactNs([hit(1, 2, 9000)], 7)).toBe(0);
    expect(playerImpactNs([hit(7, 2, 300), hit(3, 7, 900), hit(1, 2, 9000)], 7)).toBe(900);
  });
});
