import { describe, expect, it } from "vitest";
import { version } from "../src/index";

describe("lost-parcel-desk core", () => {
  it("exports a semver placeholder version", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
