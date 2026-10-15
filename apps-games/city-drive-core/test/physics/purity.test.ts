// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(import.meta.dirname, "..", "..", "src");
/** Platform trig differs across engines; simulation state must use the deterministic helpers. */
const NON_DETERMINISTIC = [
  "Math.sin",
  "Math.cos",
  "Math.tan",
  "Math.atan",
  "Math.asin",
  "Math.acos",
  "Math.exp",
  "Math.pow",
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith(".ts") ? [p] : [];
  });
}

describe("simulation determinism guard", () => {
  for (const token of NON_DETERMINISTIC) {
    it(`src never calls ${token}`, () => {
      const offenders = files(SRC).filter((f) => readFileSync(f, "utf8").includes(token));
      expect(offenders).toEqual([]);
    });
  }
});
