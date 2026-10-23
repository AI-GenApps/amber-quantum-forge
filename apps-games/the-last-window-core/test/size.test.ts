import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = [join(import.meta.dirname, "..", "src"), join(import.meta.dirname)];
const MAX_LINES = 800;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return full.endsWith(".ts") ? [full] : [];
  });
}

describe("file size", () => {
  for (const root of ROOTS) {
    it(`no file under ${root.split("/").slice(-2).join("/")} exceeds ${MAX_LINES} lines`, () => {
      const tooLong = files(root).filter(
        (file) => readFileSync(file, "utf8").split("\n").length > MAX_LINES,
      );
      expect(tooLong).toEqual([]);
    });
  }

  it("the source never uses any", () => {
    for (const file of files(ROOTS[0] as string)) {
      expect(readFileSync(file, "utf8")).not.toMatch(/:\s*any\b|\bas any\b|<any>/);
    }
  });
});
