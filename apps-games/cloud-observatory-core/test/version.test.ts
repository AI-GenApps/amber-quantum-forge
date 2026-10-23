import { describe, expect, it } from "vitest";
import { version } from "../src/index";

describe("cloud-observatory core", () => {
  it("exports a semver placeholder version", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
