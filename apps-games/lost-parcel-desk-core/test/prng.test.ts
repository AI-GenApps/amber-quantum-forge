import { describe, expect, it } from "vitest";
import { createPrng, hashString } from "../src/prng";

function raw(seed: number, count: number): number[] {
  const rng = createPrng(seed);
  return Array.from({ length: count }, () => Math.round(rng.next() * 4294967296));
}

describe("hashString (FNV-1a 32 bit)", () => {
  it("matches the published FNV-1a vectors", () => {
    expect(hashString("")).toBe(2166136261);
    expect(hashString("a")).toBe(3826002220);
    expect(hashString("lost-parcel-desk")).toBe(3742323259);
  });
});

describe("createPrng (sfc32)", () => {
  it("produces the pinned sequence for seed 1", () => {
    expect(raw(1, 5)).toEqual([24724473, 838574162, 2522700496, 473542192, 3964317691]);
  });

  it("produces the pinned sequence for seed 12345", () => {
    expect(raw(12345, 5)).toEqual([773969981, 665824088, 2206032052, 3833628664, 3868810187]);
  });

  it("produces the pinned sequence for seed 0", () => {
    expect(raw(0, 3)).toEqual([1699431568, 3485434084, 3266533278]);
  });

  it("returns floats in [0, 1)", () => {
    const rng = createPrng(99);
    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("int(n) matches the pinned draws and stays in range", () => {
    const rng = createPrng(12345);
    expect(Array.from({ length: 8 }, () => rng.int(10))).toEqual([1, 1, 5, 8, 9, 4, 6, 8]);
    for (let i = 0; i < 500; i++) expect(rng.int(3)).toBeLessThan(3);
  });

  it("int rejects n below 1 and non integers", () => {
    const rng = createPrng(1);
    expect(() => rng.int(0)).toThrow(RangeError);
    expect(() => rng.int(1.5)).toThrow(RangeError);
  });

  it("shuffle matches the pinned permutation and keeps every item", () => {
    const rng = createPrng(7);
    expect(rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7])).toEqual([1, 2, 4, 5, 0, 3, 6, 7]);
  });

  it("shuffle returns a copy and never mutates its input", () => {
    const input = Object.freeze([1, 2, 3, 4]);
    const out = createPrng(3).shuffle(input);
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual([1, 2, 3, 4]);
  });

  it("pick returns an item and rejects an empty list", () => {
    const rng = createPrng(5);
    expect(["a", "b", "c"]).toContain(rng.pick(["a", "b", "c"]));
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it("fork is independent of how many draws the parent made", () => {
    const fresh = createPrng(12345).fork("alpha");
    const used = createPrng(12345);
    used.next();
    used.next();
    const forked = used.fork("alpha");
    expect(fresh.seed).toBe(2918815234);
    expect(forked.seed).toBe(fresh.seed);
    expect(Array.from({ length: 3 }, () => Math.round(fresh.next() * 4294967296))).toEqual([
      848944499, 2432582881, 1585967880,
    ]);
    expect(forked.next()).toBe(createPrng(2918815234).next());
  });

  it("different labels fork different streams", () => {
    const base = createPrng(1);
    expect(base.fork("a").seed).not.toBe(base.fork("b").seed);
  });
});
