import { describe, expect, it } from "vitest";
import { minStarDistance, starsInsideMargin } from "../../src/chart";
import { BUNDLE, cloneBundle } from "./bundle";
import { boundingBox, pathCrossings, segmentsTouch } from "./geometry";
import { EXPECTED_STAR_COUNTS, starProblems } from "./validators";

describe("constellation stars", () => {
  it("match the plan counts in atlas order", () => {
    expect(BUNDLE.catalog.constellations.map((c) => c.stars.length)).toEqual(EXPECTED_STAR_COUNTS);
    expect(BUNDLE.catalog.constellations.map((c) => c.id)).toEqual([
      "lyre",
      "crown",
      "key",
      "lantern",
      "whale",
      "harp",
      "fox",
      "archer",
      "serpent",
      "ship",
      "tower",
      "owl",
    ]);
  });

  it("pass margin, spacing, bounding box and crossing rules", () => {
    expect(starProblems(BUNDLE.catalog)).toEqual([]);
    for (const c of BUNDLE.catalog.constellations) {
      expect(starsInsideMargin(c.stars)).toBe(true);
      expect(minStarDistance(c.stars)).toBeGreaterThanOrEqual(140);
      const box = boundingBox(c.stars);
      expect(box.long).toBeGreaterThanOrEqual(500);
      expect(box.short).toBeGreaterThanOrEqual(250);
    }
  });

  it("closes the lyre, crown and lantern only, with a short closing edge", () => {
    const closed = BUNDLE.catalog.constellations.filter((c) => c.closed).map((c) => c.id);
    expect(closed).toEqual(["lyre", "crown", "lantern"]);
    for (const c of BUNDLE.catalog.constellations.filter((x) => x.closed)) {
      const first = c.stars[0];
      const last = c.stars[c.stars.length - 1];
      expect(
        Math.hypot((first?.x ?? 0) - (last?.x ?? 0), (first?.y ?? 0) - (last?.y ?? 0)),
      ).toBeLessThan(700);
    }
  });

  it("detects crossings, touching and straight runs correctly", () => {
    expect(segmentsTouch({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(
      true,
    );
    expect(segmentsTouch({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 })).toBe(
      false,
    );
    const straight = [
      { x: 100, y: 100 },
      { x: 100, y: 300 },
      { x: 100, y: 500 },
    ];
    expect(pathCrossings(straight, false)).toEqual([]);
    const bowtie = [
      { x: 100, y: 100 },
      { x: 400, y: 400 },
      { x: 400, y: 100 },
      { x: 100, y: 400 },
    ];
    expect(pathCrossings(bowtie, false)).toHaveLength(1);
  });

  it("fails when stars are moved, added or crossed", () => {
    const mutations: ((b: ReturnType<typeof cloneBundle>) => void)[] = [
      (b) => {
        const star = b.catalog.constellations[0]?.stars[0] as { x: number } | undefined;
        if (star) star.x = 20;
      },
      (b) => {
        const stars = b.catalog.constellations[1]?.stars as { x: number; y: number }[] | undefined;
        if (stars?.[1] && stars[0]) stars[1] = { x: stars[0].x + 10, y: stars[0].y };
      },
      (b) => {
        (b.catalog.constellations[2]?.stars as unknown[] | undefined)?.pop();
      },
      (b) => {
        const stars = b.catalog.constellations[8]?.stars as { x: number; y: number }[] | undefined;
        if (stars) stars.reverse().splice(0, 2, ...stars.slice(0, 2).reverse(), { x: 500, y: 700 });
      },
      (b) => {
        const stars = b.catalog.constellations[0]?.stars as { x: number; y: number }[] | undefined;
        if (stars)
          stars.splice(
            0,
            5,
            ...[100, 200, 300, 400, 500].map((x) => ({ x: 300 + x / 10, y: 400 + x })),
          );
      },
    ];
    for (const mutate of mutations) {
      const copy = cloneBundle();
      mutate(copy);
      expect(starProblems(copy.catalog).length).toBeGreaterThan(0);
    }
  });
});
