import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = join(import.meta.dirname, "..", "src");

describe("source size", () => {
  for (const name of readdirSync(SRC_DIR).filter((file) => file.endsWith(".ts"))) {
    it(`${name} stays under 800 lines and has no any`, () => {
      const text = readFileSync(join(SRC_DIR, name), "utf8");
      expect(text.split("\n").length).toBeLessThanOrEqual(800);
      expect(text).not.toMatch(/:\s*any\b|\bas any\b|<any>/);
    });
  }
});
