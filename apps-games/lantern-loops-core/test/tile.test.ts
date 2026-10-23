import { describe, expect, it } from "vitest";
import {
  bitCount,
  CORNER_CYCLE,
  CORNER_MASKS,
  DIRS,
  E,
  isCorner,
  isLegalTile,
  isStraight,
  isTileMask,
  MIRROR_CORNERS,
  N,
  nextInCycle,
  openings,
  opposite,
  rotateCorner,
  rotateMask,
  S,
  STRAIGHT_CYCLE,
  STRAIGHT_MASKS,
  TILE_MASKS,
  W,
} from "../src/tile";

describe("tile masks", () => {
  it("defines the direction bits and the six tiles", () => {
    expect([N, E, S, W]).toEqual([1, 2, 4, 8]);
    expect([...TILE_MASKS].sort((a, b) => a - b)).toEqual([3, 5, 6, 9, 10, 12]);
    expect(STRAIGHT_MASKS).toEqual([10, 5]);
    expect(CORNER_MASKS).toEqual([3, 6, 12, 9]);
  });

  it.each([
    [10, [E, W], true, false],
    [5, [N, S], true, false],
    [3, [N, E], false, true],
    [6, [E, S], false, true],
    [12, [S, W], false, true],
    [9, [N, W], false, true],
  ])("tile %i opens %j", (mask, dirs, straight, corner) => {
    expect(openings(mask)).toEqual(dirs);
    expect(bitCount(mask)).toBe(2);
    expect(isStraight(mask)).toBe(straight);
    expect(isCorner(mask)).toBe(corner);
    expect(isTileMask(mask)).toBe(true);
    expect(isLegalTile(mask)).toBe(true);
  });

  it("rejects every illegal mask and accepts 0 only as empty", () => {
    const legal = new Set([0, 3, 5, 6, 9, 10, 12]);
    for (let mask = 0; mask <= 15; mask++) {
      expect(isLegalTile(mask)).toBe(legal.has(mask));
      expect(isTileMask(mask)).toBe(legal.has(mask) && mask !== 0);
    }
    const illegal = [1, 2, 4, 7, 8, 11, 13, 14, 15];
    expect(illegal).toHaveLength(9);
    for (const mask of illegal) {
      expect(isLegalTile(mask)).toBe(false);
      expect(isStraight(mask) || isCorner(mask)).toBe(false);
    }
    expect(isLegalTile(16)).toBe(false);
    expect(isLegalTile(-1)).toBe(false);
  });

  it("pairs opposite directions", () => {
    expect(DIRS.map(opposite)).toEqual([S, W, N, E]);
    for (const dir of DIRS) expect(opposite(opposite(dir))).toBe(dir);
  });

  it("rotates corners clockwise through the four corners", () => {
    expect([3, 6, 12, 9].map(rotateCorner)).toEqual([6, 12, 9, 3]);
    expect(rotateCorner(10)).toBe(10);
    expect(rotateMask(10)).toBe(5);
    expect(rotateMask(5)).toBe(10);
    expect(rotateMask(3, 4)).toBe(3);
    expect(rotateMask(3, -1)).toBe(9);
  });

  it("defines the tap cycles and the mirror corner sets", () => {
    expect(STRAIGHT_CYCLE).toEqual([0, 10, 5]);
    expect(CORNER_CYCLE).toEqual([0, 3, 6, 12, 9]);
    expect(nextInCycle(STRAIGHT_CYCLE, 5)).toBe(0);
    expect(nextInCycle(CORNER_CYCLE, 9)).toBe(0);
    expect(nextInCycle(CORNER_CYCLE, 10)).toBeUndefined();
    expect(MIRROR_CORNERS["/"]).toEqual([9, 6]);
    expect(MIRROR_CORNERS["\\"]).toEqual([12, 3]);
    for (const mask of [...MIRROR_CORNERS["/"], ...MIRROR_CORNERS["\\"]]) {
      expect(isCorner(mask)).toBe(true);
    }
  });
});
