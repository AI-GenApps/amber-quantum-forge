import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = join(import.meta.dirname, "..", "src");
const FORBIDDEN_TOKENS = [
  "window",
  "document",
  "Date.now",
  "performance.now",
  "Math.random",
  "localStorage",
];

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return full.endsWith(".ts") || full.endsWith(".tsx") ? [full] : [];
  });
}

describe("core purity", () => {
  const files = listSourceFiles(SRC_DIR);

  it("finds source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const token of FORBIDDEN_TOKENS) {
    it(`src never references ${token}`, () => {
      const offenders = files.filter((file) => readFileSync(file, "utf8").includes(token));
      expect(offenders).toEqual([]);
    });
  }

  it("src imports only relative modules (no kit, DOM framework or plugin)", () => {
    const offenders = files.filter((file) => /from\s+["'](?!\.)/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("package.json has no runtime dependencies", () => {
    const manifest = JSON.parse(
      readFileSync(join(SRC_DIR, "..", "package.json"), "utf8"),
    ) as Record<string, unknown>;
    expect(manifest.dependencies).toBeUndefined();
  });
});
