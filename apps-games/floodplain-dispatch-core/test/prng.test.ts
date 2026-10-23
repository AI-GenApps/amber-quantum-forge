import { describe, expect, it } from "vitest";
import { createPrng, hashString } from "../src/prng";

describe("hashString (FNV-1a 32)", () => {
  it("matches published vectors", () => {
    expect(hashString("")).toBe(0x811c9dc5);
    expect(hashString("a")).toBe(0xe40c292c);
    expect(hashString("foobar")).toBe(0xbf9cf968);
  });
});

describe("createPrng", () => {
  it("is stable against hard-coded values", () => {
    const rng = createPrng(12345);
    expect(Array.from({ length: 6 }, () => rng.int(1000))).toEqual([892, 900, 426, 674, 828, 788]);
    expect(createPrng(12345).next()).toBe(0.8925862293690443);
    expect([0, 1, 0xffffffff].map((seed) => createPrng(seed).int(100))).toEqual([1, 11, 15]);
  });

  it("repeats for the same seed and differs between seeds", () => {
    const a = createPrng(5);
    const b = createPrng(5);
    const c = createPrng(6);
    const seqA = Array.from({ length: 20 }, () => a.next());
    expect(Array.from({ length: 20 }, () => b.next())).toEqual(seqA);
    expect(Array.from({ length: 20 }, () => c.next())).not.toEqual(seqA);
  });

  it("keeps next() in [0, 1) and int(n) in [0, n)", () => {
    const rng = createPrng(77);
    let sum = 0;
    for (let i = 0; i < 5000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / 5000).toBeGreaterThan(0.45);
    expect(sum / 5000).toBeLessThan(0.55);
    for (let i = 0; i < 500; i++) expect(rng.int(7)).toBeLessThan(7);
    expect(rng.int(1)).toBe(0);
  });

  it("rejects bad int bounds and empty picks", () => {
    const rng = createPrng(1);
    expect(() => rng.int(0)).toThrow(RangeError);
    expect(() => rng.int(1.5)).toThrow(RangeError);
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it("shuffles into a stable permutation without touching the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = createPrng(7).shuffle(input);
    expect(out).toEqual([5, 4, 3, 8, 7, 2, 6, 1]);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(createPrng(7).pick(["a", "b", "c", "d"])).toBe("a");
  });

  it("forks independently of consumed state, by label and seed", () => {
    expect(createPrng(7).fork("daily").int(1000)).toBe(683);
    expect(createPrng(7).fork("other").int(1000)).toBe(529);
    expect(createPrng(8).fork("daily").int(1000)).toBe(556);
    const used = createPrng(7);
    used.next();
    used.next();
    expect(used.fork("daily").int(1000)).toBe(683);
  });
});
