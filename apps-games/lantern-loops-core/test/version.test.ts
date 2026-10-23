import { describe, expect, it } from "vitest";
import { version } from "../src/index";

describe("lantern-loops core", () => {
  it("exports the semver version of the rules engine", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(version).toBe("0.1.0");
  });
});
