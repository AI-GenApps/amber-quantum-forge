import { describe, expect, it } from "vitest";
import {
  CANDIDATE_COUNT,
  FACETS,
  MAX_HINTS_PER_CASE,
  MAX_STAMPS,
  MIN_FITS_TO_ACCUSE,
  PEOPLE_PER_VALUE,
  VALUES_PER_FACET,
} from "../src/constants";

describe("pinned constants", () => {
  it("matches the numbers written in product.md and economy.md", () => {
    expect(MAX_STAMPS).toBe(3);
    expect(MIN_FITS_TO_ACCUSE).toBe(2);
    expect(MAX_HINTS_PER_CASE).toBe(2);
    expect(CANDIDATE_COUNT).toBe(3);
    expect([...FACETS]).toEqual(["street", "pastime", "look", "pet"]);
    expect(VALUES_PER_FACET).toBe(6);
    expect(PEOPLE_PER_VALUE).toBe(2);
  });

  it("keeps 12 townsfolk consistent with the value counts", () => {
    expect(VALUES_PER_FACET * PEOPLE_PER_VALUE).toBe(12);
  });
});
