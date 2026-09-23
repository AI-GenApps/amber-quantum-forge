import { describe, expect, it } from "vitest";
import { requestFingerprint } from "./fingerprint";

describe("Merge Relay canonical fingerprints", () => {
  it("normalizes safe numbers, negative zero, and sorted keys", () => {
    expect(
      requestFingerprint({
        schemaVersion: 1,
        payload: { z: -0, a: 1.5, nested: { b: true, a: null } },
      }),
    ).toBe("05d3ccfdc3ca71bf26dfa9310367071e2c4946713184bf6afd9bec16f6624de0");
  });

  it("rejects unsupported canonical numbers", () => {
    expect(() => requestFingerprint({ value: Number.POSITIVE_INFINITY })).toThrow("finite");
    expect(() => requestFingerprint({ value: Number.MAX_SAFE_INTEGER + 1 })).toThrow(
      "JavaScript-safe",
    );
  });
});
