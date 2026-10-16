import { describe, expect, it } from "vitest";
import {
  FAST_P90_MS,
  type GovernorChange,
  PROBATION_MS,
  percentile90,
  QualityGovernor,
  RECOVER_MS,
  SLOW_P90_MS,
  STALL_MS,
  WINDOW_MS,
} from "../../src/perf/governor";
import { hardwareScalingLevel, QUALITY_TIERS, tierRange } from "../../src/perf/tiers";

const TIERS = QUALITY_TIERS.length;

/** Deterministic jitter in [-1, 1). */
function jitter(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

interface Trace {
  changes: (GovernorChange & { atMs: number })[];
  finalTier: number;
}

/** Runs `seconds` of frames where each frame costs `costMs(tier)` plus 10% jitter. */
function simulate(governor: QualityGovernor, seconds: number, costMs: (tier: number) => number) {
  const noise = jitter(7);
  const trace: Trace = { changes: [], finalTier: governor.tier };
  let now = 0;
  while (now < seconds * 1000) {
    const frame = costMs(governor.tier) * (1 + 0.1 * noise());
    now += frame;
    const change = governor.record(frame);
    if (change) trace.changes.push({ ...change, atMs: now });
  }
  trace.finalTier = governor.tier;
  return trace;
}

const make = (start = 0, ceiling = 0) => new QualityGovernor({ tiers: TIERS, start, ceiling });

describe("percentile90", () => {
  it("uses the nearest rank and ignores order", () => {
    const frames = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile90(frames)).toBe(90);
    expect(percentile90([...frames].reverse())).toBe(90);
    expect(percentile90([5])).toBe(5);
    expect(percentile90([])).toBe(0);
  });
});

describe("QualityGovernor stepping", () => {
  it("does nothing while frames are fast at the best tier", () => {
    const governor = make();
    const trace = simulate(governor, 120, () => 12);
    expect(trace.changes).toEqual([]);
    expect(governor.tier).toBe(0);
  });

  it("steps one tier down per slow 2 s window, down to the last tier, then stays", () => {
    const governor = make();
    const trace = simulate(governor, 60, () => 50);
    expect(trace.changes.map((c) => [c.from, c.to])).toEqual(
      Array.from({ length: TIERS - 1 }, (_, i) => [i, i + 1]),
    );
    for (const [i, change] of trace.changes.entries()) {
      expect(change.reason).toBe("slow");
      expect(change.atMs).toBeGreaterThanOrEqual((i + 1) * WINDOW_MS);
      expect(change.atMs).toBeLessThan((i + 1) * (WINDOW_MS + 60));
    }
    expect(governor.tier).toBe(TIERS - 1);
  });

  it("the ladder lowers resolution first, then view distance, then traffic", () => {
    const scaling = QUALITY_TIERS.map((t) => t.scaling);
    expect(scaling.slice(0, 4)).toEqual([1, 1.25, 1.5, 2]);
    const firstViewCut = QUALITY_TIERS.findIndex((t) => t.view < 1);
    const firstTrafficCut = QUALITY_TIERS.findIndex((t) => t.traffic < 1);
    expect(firstViewCut).toBeGreaterThan(3);
    expect(firstTrafficCut).toBeGreaterThan(firstViewCut);
    for (const [i, tier] of QUALITY_TIERS.entries()) {
      const next = QUALITY_TIERS[i + 1];
      if (!next) continue;
      expect(next.scaling).toBeGreaterThanOrEqual(tier.scaling);
      expect(next.view).toBeLessThanOrEqual(tier.view);
      expect(next.traffic).toBeLessThanOrEqual(tier.traffic);
    }
  });

  it("settles at the first tier that is cheap enough and never moves again", () => {
    const governor = make();
    const cost = (tier: number) => 60 / (QUALITY_TIERS[tier]?.scaling ?? 1) ** 2;
    const trace = simulate(governor, 300, cost);
    const settled = trace.finalTier;
    expect(cost(settled)).toBeLessThanOrEqual(SLOW_P90_MS);
    expect(cost(settled - 1)).toBeGreaterThan(SLOW_P90_MS * 0.9);
    const last = trace.changes[trace.changes.length - 1];
    expect(last?.atMs ?? 0).toBeLessThan(40_000);
    expect(trace.changes.every((c) => c.reason === "slow")).toBe(true);
  });

  it("ignores a lone hitch inside an otherwise smooth window", () => {
    const governor = make();
    let changes = 0;
    for (let w = 0; w < 20; w++) {
      for (let i = 0; i < 120; i++) {
        if (governor.record(i === 60 ? 200 : 16)) changes++;
      }
    }
    expect(changes).toBe(0);
  });

  it("ignores stalls (tab switches, district loads) entirely", () => {
    const governor = make();
    for (let i = 0; i < 100; i++) expect(governor.record(STALL_MS + 1)).toBeUndefined();
    for (let i = 0; i < 100; i++) expect(governor.record(0)).toBeUndefined();
    for (let i = 0; i < 100; i++) expect(governor.record(Number.NaN)).toBeUndefined();
    expect(governor.tier).toBe(0);
  });

  it("restartWindow drops the partial window and the fast streak", () => {
    const governor = make(3, 0);
    for (let i = 0; i < 60; i++) governor.record(30);
    governor.restartWindow();
    let change: GovernorChange | undefined;
    for (let i = 0; i < 60; i++) change ||= governor.record(30);
    expect(change).toBeUndefined();
  });
});

describe("QualityGovernor recovery and hysteresis", () => {
  it("steps back up only after 10 s of fast frames, one tier at a time", () => {
    const governor = make(3, 0);
    const trace = simulate(governor, 60, () => 10);
    expect(trace.changes.map((c) => [c.from, c.to])).toEqual([
      [3, 2],
      [2, 1],
      [1, 0],
    ]);
    expect(trace.changes[0]?.atMs).toBeGreaterThanOrEqual(RECOVER_MS);
    for (let i = 1; i < trace.changes.length; i++) {
      const gap = (trace.changes[i]?.atMs ?? 0) - (trace.changes[i - 1]?.atMs ?? 0);
      expect(gap).toBeGreaterThanOrEqual(RECOVER_MS - 100);
    }
    expect(trace.changes.every((c) => c.reason === "fast")).toBe(true);
  });

  it("frames between 20 and 33 ms hold the tier and reset the fast streak", () => {
    const governor = make(2, 0);
    const middle = (FAST_P90_MS + SLOW_P90_MS) / 2;
    expect(simulate(governor, 120, () => middle).changes).toEqual([]);
    let changes = 0;
    for (let round = 0; round < 6; round++) {
      for (let i = 0; i < 4 * 125; i++) if (governor.record(16)) changes++;
      for (let i = 0; i < 70; i++) if (governor.record(28)) changes++;
    }
    expect(changes).toBe(0);
    expect(governor.tier).toBe(2);
  });

  it("never climbs above the ceiling, however long the frames stay fast", () => {
    const governor = make(2, 2);
    expect(simulate(governor, 600, () => 8).changes).toEqual([]);
    const medium = make(3, 1);
    simulate(medium, 600, () => 8);
    expect(medium.tier).toBe(1);
  });

  it("a tier that is too heavy is tried once and then locked out", () => {
    const governor = make();
    const cost = (tier: number) => (tier === 0 ? 40 : 14);
    const trace = simulate(governor, 900, cost);
    expect(trace.changes.map((c) => [c.from, c.to])).toEqual([
      [0, 1],
      [1, 0],
      [0, 1],
    ]);
    expect(governor.bestAllowed).toBe(1);
    expect(governor.tier).toBe(1);
    const lastAt = trace.changes[2]?.atMs ?? 0;
    expect(lastAt).toBeLessThan(RECOVER_MS + PROBATION_MS + 2 * WINDOW_MS + 2000);
  });

  it("does not oscillate on any jittery device model over ten minutes", () => {
    for (const base of [8, 14, 19, 21, 26, 31, 33, 36, 45, 70]) {
      for (const start of [0, 2]) {
        const governor = make(start, start === 2 ? 2 : 0);
        const cost = (tier: number) => base * (1 - 0.1 * tier) + 3 * (tier === 0 ? 1 : 0);
        const trace = simulate(governor, 600, cost);
        let reversals = 0;
        for (let i = 1; i < trace.changes.length; i++) {
          const a = trace.changes[i - 1];
          const b = trace.changes[i];
          if (a && b && a.reason !== b.reason) reversals++;
        }
        expect(reversals, `base ${base} ms, start ${start}`).toBeLessThanOrEqual(2);
        const late = trace.changes.filter((c) => c.atMs > 120_000);
        expect(late, `base ${base} ms still changing after 2 min`).toEqual([]);
      }
    }
  });
});

describe("QualityGovernor construction", () => {
  it("rejects a ceiling below the start or tiers out of range", () => {
    expect(() => new QualityGovernor({ tiers: 4, start: 1, ceiling: 2 })).toThrow(/ceiling/);
    expect(() => new QualityGovernor({ tiers: 4, start: 4, ceiling: 0 })).toThrow(/start/);
    expect(() => new QualityGovernor({ tiers: 0, start: 0, ceiling: 0 })).toThrow(/tier count/);
  });
});

describe("quality settings and the pixel-ratio cap", () => {
  it("Low, Medium and High set the start and the ceiling; Auto starts at the top", () => {
    expect(tierRange("high")).toEqual({ start: 0, ceiling: 0 });
    expect(tierRange("medium")).toEqual({ start: 1, ceiling: 1 });
    expect(tierRange("low")).toEqual({ start: 2, ceiling: 2 });
    expect(tierRange("auto")).toEqual({ start: 0, ceiling: 0 });
  });

  it("renders at no more than 2x the CSS size, and tier scaling divides the pixels further", () => {
    expect(hardwareScalingLevel(1, 1)).toBe(1);
    expect(hardwareScalingLevel(1, 2)).toBe(0.5);
    expect(hardwareScalingLevel(1, 3)).toBe(0.5);
    expect(hardwareScalingLevel(1, 4.5)).toBe(0.5);
    expect(hardwareScalingLevel(2, 3)).toBe(1);
    expect(hardwareScalingLevel(1.5, 1.5)).toBe(1);
    expect(hardwareScalingLevel(1.25, 0)).toBe(1.25);
    expect(hardwareScalingLevel(1.25, Number.NaN)).toBe(1.25);
    for (const dpr of [1, 1.5, 2, 2.625, 3, 3.5]) {
      for (const tier of QUALITY_TIERS) {
        expect(1 / hardwareScalingLevel(tier.scaling, dpr)).toBeLessThanOrEqual(2);
      }
    }
  });
});
