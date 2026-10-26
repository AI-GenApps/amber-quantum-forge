import { describe, expect, it } from "vitest";
import { BUNDLE, cloneBundle } from "./bundle";
import { countProblems } from "./validators";

describe("content counts", () => {
  it("match the contract", () => {
    expect(countProblems(BUNDLE)).toEqual([]);
    expect(BUNDLE.catalog.constellations).toHaveLength(12);
    expect(BUNDLE.catalog.constellations.flatMap((c) => c.stars)).toHaveLength(86);
    expect(BUNDLE.catalog.instruments).toHaveLength(8);
    expect(BUNDLE.catalog.upgrades).toHaveLength(24);
    expect(BUNDLE.catalog.boons).toHaveLength(10);
    expect(BUNDLE.catalog.boons.reduce((sum, b) => sum + b.cost, 0)).toBe(105);
    expect(BUNDLE.lore).toHaveLength(30);
    expect(BUNDLE.chapters).toHaveLength(6);
    expect(BUNDLE.achievements).toHaveLength(20);
  });

  it("fails when any single count is changed", () => {
    const mutations: ((bundle: ReturnType<typeof cloneBundle>) => unknown)[] = [
      (b) => (b.catalog.constellations as unknown[]).pop(),
      (b) => (b.catalog.constellations[0] as unknown as { stars: unknown[] }).stars.pop(),
      (b) => (b.catalog.instruments as unknown[]).pop(),
      (b) => (b.catalog.upgrades as unknown[]).pop(),
      (b) => (b.catalog.boons as unknown[]).pop(),
      (b) => (b.lore as unknown[]).pop(),
      (b) => (b.chapters as unknown[]).pop(),
      (b) => (b.achievements as unknown[]).pop(),
      (b) => {
        const first = b.lore[0];
        if (first) (first as { chapter: number }).chapter = 2;
      },
    ];
    for (const mutate of mutations) {
      const copy = cloneBundle();
      mutate(copy);
      expect(countProblems(copy).length).toBeGreaterThan(0);
    }
  });
});
