import { describe, expect, it } from "vitest";
import { createRng, hashText, mixSeed } from "../src/gen/rng";

describe("createRng", () => {
  it("is deterministic for a seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 50 }, () => a.next32());
    const seqB = Array.from({ length: 50 }, () => b.next32());
    expect(seqA).toEqual(seqB);
  });

  it("differs between seeds", () => {
    expect(createRng(1).next32()).not.toBe(createRng(2).next32());
  });

  it("matches the mulberry32 reference stream for seed 1 (checked against an independent implementation)", () => {
    const rng = createRng(1);
    expect([rng.next32(), rng.next32(), rng.next32()]).toEqual([2693262067, 11749833, 2265367787]);
  });

  it("spreads int() evenly (chi-square sanity on 10,000 draws)", () => {
    const buckets = 10;
    const draws = 10_000;
    const rng = createRng(2026);
    const hist = new Array<number>(buckets).fill(0);
    for (let i = 0; i < draws; i++) {
      const k = rng.int(buckets);
      hist[k] = (hist[k] as number) + 1;
    }
    const expected = draws / buckets;
    const chi = hist.reduce((sum, observed) => sum + (observed - expected) ** 2 / expected, 0);
    expect(chi).toBeLessThan(27.88);
    for (const observed of hist) expect(observed).toBeGreaterThan(expected * 0.9);
  });

  it("keeps int, between, pick and chance in range", () => {
    const rng = createRng(9);
    for (let i = 0; i < 500; i++) {
      expect(rng.int(7)).toBeGreaterThanOrEqual(0);
      expect(rng.int(7)).toBeLessThan(7);
      const v = rng.between(3, 5);
      expect(v >= 3 && v <= 5).toBe(true);
      expect(["a", "b"]).toContain(rng.pick(["a", "b"]));
    }
    expect(createRng(1).chance(0)).toBe(false);
    expect(createRng(1).chance(100)).toBe(true);
    const hits = Array.from({ length: 4000 }, () => rng.chance(25)).filter(Boolean).length;
    expect(hits).toBeGreaterThan(800);
    expect(hits).toBeLessThan(1200);
  });

  it("rejects an empty range or list", () => {
    expect(() => createRng(1).int(0)).toThrow(RangeError);
    expect(() => createRng(1).pick([])).toThrow(RangeError);
  });

  it("shuffles into a permutation without touching the input", () => {
    const rng = createRng(3);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = rng.shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
    expect(createRng(3).shuffle(input)).toEqual(out);
  });
});

describe("hashText and mixSeed", () => {
  it("hashes to a stable 32-bit unsigned integer", () => {
    expect(hashText("")).toBe(0x811c9dc5);
    expect(hashText("a")).toBe(0xe40c292c);
    expect(hashText("ll-gen-1|harbor-01")).toBe(hashText("ll-gen-1|harbor-01"));
    expect(hashText("ll-gen-1|harbor-01")).not.toBe(hashText("ll-gen-1|harbor-02"));
  });

  it("mixes seed and salt into different seeds", () => {
    expect(mixSeed(5, 0)).not.toBe(mixSeed(5, 1));
    expect(mixSeed(5, 0)).toBe(mixSeed(5, 0));
  });
});
