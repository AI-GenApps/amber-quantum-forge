import { describe, expect, it } from "vitest";
import { addFp, levelForFp, nextThreshold } from "../src";

describe("friendship levels", () => {
  it("steps up exactly at 1, 2, 4, 6 and 8", () => {
    const levels = Array.from({ length: 11 }, (_, fp) => levelForFp(fp));
    expect(levels).toEqual([0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5]);
  });

  it("caps friendship points at 8", () => {
    expect(addFp(0, 2)).toBe(2);
    expect(addFp(7, 2)).toBe(8);
    expect(addFp(8, 3)).toBe(8);
    expect(addFp(8, 0)).toBe(8);
  });

  it("never goes below zero", () => {
    expect(addFp(1, -5)).toBe(0);
  });

  it("names the next threshold or null at the top", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(nextThreshold)).toEqual([1, 2, 4, 4, 6, 6, 8, 8, null]);
  });
});
