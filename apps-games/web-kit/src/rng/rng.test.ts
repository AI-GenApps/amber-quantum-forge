import { describe, expect, it } from "vitest";
import { createRng, createRngFromState, hashString, toSeed } from "./rng";

describe("hashString", () => {
  it("is stable and distinguishes inputs", () => {
    expect(hashString("lantern")).toBe(hashString("lantern"));
    expect(hashString("lantern")).not.toBe(hashString("lantern "));
    expect(hashString("")).toBe(0x811c9dc5);
    expect(hashString("a")).toBe(0xe40c292c);
  });

  it("returns unsigned 32-bit integers", () => {
    for (const s of ["x", "2026-10-23", "long string ".repeat(50)]) {
      const h = hashString(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
    }
  });
});

describe("toSeed", () => {
  it("hashes strings, truncates numbers and tolerates non-finite input", () => {
    expect(toSeed("abc")).toBe(hashString("abc"));
    expect(toSeed(7.9)).toBe(7);
    expect(toSeed(-1)).toBe(0xffffffff);
    expect(toSeed(Number.NaN)).toBe(0);
    expect(toSeed(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("createRng", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = createRng("seed");
    const b = createRng("seed");
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(
      Array.from({ length: 20 }, () => b.next()),
    );
  });

  it("matches a golden sequence so drift between versions is caught", () => {
    const rng = createRng(12345);
    expect(Array.from({ length: 5 }, () => rng.int(1000))).toEqual([716, 650, 488, 743, 70]);
  });

  it("differs between seeds", () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
    expect(createRng("a").next()).not.toBe(createRng("b").next());
  });

  it("keeps next() inside [0, 1) and roughly uniform", () => {
    const rng = createRng("uniform");
    let sum = 0;
    const n = 5000;
    for (let i = 0; i < n; i += 1) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / n).toBeGreaterThan(0.47);
    expect(sum / n).toBeLessThan(0.53);
  });

  it("int, range and float respect their bounds", () => {
    const rng = createRng("bounds");
    const seen = new Set<number>();
    for (let i = 0; i < 400; i += 1) {
      seen.add(rng.range(3, 6));
      const f = rng.float(-2, 2);
      expect(f).toBeGreaterThanOrEqual(-2);
      expect(f).toBeLessThan(2);
      expect(rng.int(5)).toBeLessThan(5);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it("rejects invalid bounds", () => {
    const rng = createRng(1);
    expect(() => rng.int(0)).toThrow(RangeError);
    expect(() => rng.int(1.5)).toThrow(RangeError);
    expect(() => rng.range(5, 4)).toThrow(RangeError);
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it("chance handles the extremes", () => {
    const rng = createRng("chance");
    for (let i = 0; i < 50; i += 1) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });

  it("pick returns members and covers the list", () => {
    const rng = createRng("pick");
    const seen = new Set<string>();
    for (let i = 0; i < 100; i += 1) seen.add(rng.pick(["a", "b", "c"]));
    expect([...seen].sort()).toEqual(["a", "b", "c"]);
  });

  it("weighted follows the weights and validates input", () => {
    const rng = createRng("weighted");
    const counts = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 3000; i += 1)
      counts[rng.weighted(["a", "b", "c"] as const, [1, 0, 3])] += 1;
    expect(counts.b).toBe(0);
    expect(counts.c).toBeGreaterThan(counts.a * 2);
    expect(() => rng.weighted(["a"], [1, 2])).toThrow(RangeError);
    expect(() => rng.weighted(["a"], [0])).toThrow(RangeError);
    expect(() => rng.weighted(["a"], [-1])).toThrow(RangeError);
    expect(() => rng.weighted([], [])).toThrow(RangeError);
  });

  it("shuffle returns a permutation without touching the input", () => {
    const rng = createRng("shuffle");
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const copy = input.slice();
    const out = rng.shuffle(input);
    expect(input).toEqual(copy);
    expect(out.slice().sort((x, y) => x - y)).toEqual(copy);
    expect(out).not.toEqual(copy);
    expect(createRng("shuffle").shuffle(input)).toEqual(out);
  });

  it("shuffleInPlace mutates and returns the same array", () => {
    const rng = createRng("inplace");
    const arr = [1, 2, 3, 4, 5];
    expect(rng.shuffleInPlace(arr)).toBe(arr);
    expect(arr.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("restores from a state snapshot", () => {
    const rng = createRng("state");
    rng.next();
    rng.next();
    const restored = createRngFromState(rng.state());
    expect(Array.from({ length: 5 }, () => restored.next())).toEqual(
      Array.from({ length: 5 }, () => rng.next()),
    );
  });

  it("fork gives independent, repeatable children without advancing the parent", () => {
    const rng = createRng("fork");
    const a = rng.fork("a");
    const a2 = createRng("fork").fork("a");
    const b = rng.fork("b");
    expect(a.next()).toBe(a2.next());
    expect(a.next()).not.toBe(b.next());
    const before = rng.state();
    rng.fork("c");
    expect(rng.state()).toEqual(before);
  });
});
