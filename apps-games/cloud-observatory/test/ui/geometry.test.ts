import { CONSTELLATIONS } from "@web-games/cloud-observatory-core";
import { describe, expect, it } from "vitest";
import {
  backdropStars,
  clientToMap,
  figureBox,
  hitRadiusUnits,
  mapScale,
  pathFor,
} from "../../src/sky/geometry";

describe("sky geometry", () => {
  it("maps a client tap into map units for an exact fit", () => {
    const rect = { left: 10, top: 20, width: 360, height: 504 };
    expect(mapScale(rect)).toBeCloseTo(0.36, 6);
    const point = clientToMap(rect, 10 + 180, 20 + 252);
    expect(point.x).toBeCloseTo(500, 4);
    expect(point.y).toBeCloseTo(700, 4);
  });

  it("honours the letterbox of a meet fit when the box is wider than the map", () => {
    const rect = { left: 0, top: 0, width: 600, height: 350 };
    expect(mapScale(rect)).toBeCloseTo(0.25, 6);
    const centre = clientToMap(rect, 300, 175);
    expect(centre.x).toBeCloseTo(500, 4);
    expect(centre.y).toBeCloseTo(700, 4);
    expect(clientToMap(rect, 175, 0).x).toBeCloseTo(0, 4);
  });

  it("falls back to a 360px wide phone when the box has no size", () => {
    expect(mapScale({ left: 0, top: 0, width: 0, height: 0 })).toBeCloseTo(0.36, 6);
    expect(hitRadiusUnits(0)).toBeCloseTo(24 / 0.36, 6);
  });

  it("a 24px hit radius never overlaps the 140 unit star spacing by more than the radius", () => {
    expect(hitRadiusUnits(360)).toBeCloseTo(66.67, 1);
    expect(hitRadiusUnits(720)).toBeCloseTo(33.33, 1);
  });

  it("builds square figure boxes around the stars", () => {
    for (const def of CONSTELLATIONS) {
      const box = figureBox(def.stars);
      expect(box.width).toBe(box.height);
      for (const star of def.stars) {
        expect(star.x).toBeGreaterThanOrEqual(box.x);
        expect(star.x).toBeLessThanOrEqual(box.x + box.width);
        expect(star.y).toBeGreaterThanOrEqual(box.y);
        expect(star.y).toBeLessThanOrEqual(box.y + box.height);
      }
    }
    expect(figureBox([])).toEqual({ x: 0, y: 0, width: 1000, height: 1000 });
  });

  it("writes open and closed paths", () => {
    const stars = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
    ];
    expect(pathFor(stars, false)).toBe("M1 2 L3 4 L5 6");
    expect(pathFor(stars, true)).toBe("M1 2 L3 4 L5 6 Z");
    expect(pathFor([], true)).toBe("");
  });

  it("generates the same backdrop every time", () => {
    expect(backdropStars(10, 3)).toEqual(backdropStars(10, 3));
    expect(backdropStars(10, 3)).not.toEqual(backdropStars(10, 4));
    for (const star of backdropStars(50)) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(1000);
      expect(star.y).toBeLessThanOrEqual(1400);
    }
  });
});
