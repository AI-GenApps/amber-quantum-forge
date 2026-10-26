import { describe, expect, it } from "vitest";
import { createPrng, hashString } from "../src";

describe("hashString (FNV-1a)", () => {
  it("returns the FNV offset basis for the empty string", () => {
    expect(hashString("")).toBe(2166136261);
  });

  it("matches the published FNV-1a vector for a", () => {
    expect(hashString("a")).toBe(0xe40c292c);
  });

  it("is stable for a game label", () => {
    expect(hashString("the-last-window")).toBe(1765284646);
  });
});

describe("createPrng", () => {
  it("repeats a hard-coded sequence for seed 12345", () => {
    const rng = createPrng(12345);
    expect([rng.int(1000), rng.int(1000), rng.int(1000), rng.int(1000), rng.int(1000)]).toEqual([
      892, 900, 426, 674, 828,
    ]);
  });

  it("forks are stable and differ by label", () => {
    const a = createPrng(12345).fork("x");
    expect([a.int(100), a.int(100), a.int(100)]).toEqual([20, 45, 36]);
    const b = createPrng(12345).fork("y");
    expect(b.int(1000000)).not.toBe(createPrng(12345).fork("x").int(1000000));
  });

  it("shuffle is a stable permutation", () => {
    expect(createPrng(7).shuffle([1, 2, 3, 4, 5, 6])).toEqual([4, 3, 6, 2, 5, 1]);
  });

  it("next stays in [0, 1) and int stays in range", () => {
    const rng = createPrng(99);
    for (let i = 0; i < 2000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(rng.int(7)).toBeLessThan(7);
    }
  });

  it("pick returns a member and rejects an empty list", () => {
    const rng = createPrng(5);
    expect(["a", "b", "c"]).toContain(rng.pick(["a", "b", "c"]));
    expect(() => rng.pick([])).toThrow(RangeError);
    expect(() => rng.int(0)).toThrow(RangeError);
  });

  it("does not mutate the shuffled input", () => {
    const input = [1, 2, 3];
    createPrng(1).shuffle(input);
    expect(input).toEqual([1, 2, 3]);
  });

  it("masks seeds to 32 bits", () => {
    expect(createPrng(2 ** 32 + 5).seed).toBe(5);
  });
});
