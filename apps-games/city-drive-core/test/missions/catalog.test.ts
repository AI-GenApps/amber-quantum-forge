import { describe, expect, it } from "vitest";
import { loadMissionWorld } from "./helpers";

describe("sample mission fixtures (task 10)", () => {
  it("loads and validates", () => {
    const { catalog } = loadMissionWorld();
    expect(catalog.map((m) => m.id)).toEqual(["d1-m01", "d1-m02", "d1-m03", "d1-m04"]);
  });
});
