import { describe, expect, it } from "vitest";
import { deriveSeed, Rng } from "../../src/index";

describe("Rng (mulberry32)", () => {
  it("gives the same stream for the same seed", () => {
    const a = new Rng(1234);
    const b = new Rng(1234);
    for (let i = 0; i < 1000; i++) expect(a.next()).toBe(b.next());
  });

  it("matches the published mulberry32 reference", () => {
    const reference = (seed: number) => {
      let a = seed;
      return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const expected = reference(1);
    const rng = new Rng(1);
    for (let i = 0; i < 100; i++) expect(rng.next()).toBe(expected());
  });

  it("has a fixed first stream for seed 1", () => {
    const rng = new Rng(1);
    expect([rng.next(), rng.next(), rng.next()].map((v) => Math.round(v * 1e9))).toEqual([
      627_073_941, 2_735_721, 527_447_040,
    ]);
  });

  it("differs between seeds", () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });

  it("keeps next() in [0, 1) and int() in range", () => {
    const rng = new Rng(7);
    for (let i = 0; i < 5000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      const n = rng.int(5);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(5);
    }
  });

  it("covers every int bucket roughly evenly", () => {
    const rng = new Rng(99);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 8000; i++) {
      const bucket = rng.int(4);
      counts[bucket] = (counts[bucket] ?? 0) + 1;
    }
    for (const c of counts) expect(Math.abs(c - 2000)).toBeLessThan(250);
  });

  it("range() stays inside its bounds", () => {
    const rng = new Rng(3);
    for (let i = 0; i < 2000; i++) {
      const v = rng.range(30, 45);
      expect(v).toBeGreaterThanOrEqual(30);
      expect(v).toBeLessThan(45);
    }
  });

  it("rejects an empty pick and a bad int bound", () => {
    expect(() => new Rng(1).pick([])).toThrow(/empty/);
    expect(() => new Rng(1).int(0)).toThrow(/n >= 1/);
  });

  it("derives distinct, stable sub-seeds", () => {
    expect(deriveSeed(5, 1)).toBe(deriveSeed(5, 1));
    expect(new Set([0, 1, 2, 3, 4, 5].map((salt) => deriveSeed(5, salt))).size).toBe(6);
    expect(deriveSeed(5, 1)).not.toBe(deriveSeed(6, 1));
  });
});
