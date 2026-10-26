import { describe, expect, it } from "vitest";
import { createPrng, hashString } from "../src/prng";

describe("hashString (FNV-1a 32)", () => {
  it("matches published FNV-1a values", () => {
    expect(hashString("")).toBe(2166136261);
    expect(hashString("a")).toBe(3826002220);
    expect(hashString("dress-rehearsal")).toBe(3206772662);
  });
});

describe("createPrng (sfc32)", () => {
  it("produces a stable sequence for a fixed seed", () => {
    const prng = createPrng(12345);
    expect([prng.next(), prng.next(), prng.next()]).toEqual([
      0.8925862293690443, 0.9007775660138577, 0.42608315497636795,
    ]);
  });

  it("pins the first value for the edge seeds 0 and 2^32 - 1", () => {
    expect(createPrng(0).next()).toBe(0.011128023499622941);
    expect(createPrng(4294967295).next()).toBe(0.15907111740671098);
  });

  it("keeps int(n) stable", () => {
    const prng = createPrng(7);
    expect(Array.from({ length: 8 }, () => prng.int(10))).toEqual([0, 8, 3, 3, 2, 8, 1, 1]);
  });

  it("keeps shuffle and pick stable", () => {
    expect(createPrng(42).shuffle([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([5, 1, 3, 4, 8, 2, 7, 6]);
    expect(createPrng(42).pick(["a", "b", "c", "d"])).toBe("c");
  });

  it("is deterministic and keeps next() inside [0, 1)", () => {
    const a = createPrng(2026);
    const b = createPrng(2026);
    for (let i = 0; i < 500; i += 1) {
      const value = a.next();
      expect(value).toBe(b.next());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("treats seeds modulo 2^32", () => {
    expect(createPrng(5 + 4294967296).next()).toBe(createPrng(5).next());
    expect(createPrng(5).seed).toBe(5);
  });

  it("keeps int(n) in range and covers every value", () => {
    const prng = createPrng(1);
    const seen = new Set<number>();
    for (let i = 0; i < 400; i += 1) seen.add(prng.int(6));
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("rejects bad arguments", () => {
    const prng = createPrng(1);
    expect(() => prng.int(0)).toThrow(RangeError);
    expect(() => prng.int(1.5)).toThrow(RangeError);
    expect(() => prng.pick([])).toThrow(RangeError);
  });

  it("shuffle returns a permutation and never mutates the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = createPrng(9).shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort()).toEqual(input);
    expect(createPrng(9).shuffle([])).toEqual([]);
  });

  it("forks are stable, label dependent and independent of parent draws", () => {
    const parent = createPrng(99);
    const before = parent.fork("daily");
    parent.next();
    parent.next();
    const after = parent.fork("daily");
    const draw = (p: ReturnType<typeof createPrng>) => Array.from({ length: 4 }, () => p.int(1000));
    expect(draw(before)).toEqual([91, 343, 178, 778]);
    expect(draw(after)).toEqual([91, 343, 178, 778]);
    expect(draw(parent.fork("other"))).not.toEqual([91, 343, 178, 778]);
    expect(createPrng(100).fork("daily").next()).not.toBe(createPrng(99).fork("daily").next());
  });
});
