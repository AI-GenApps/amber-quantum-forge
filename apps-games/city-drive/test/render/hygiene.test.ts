// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appDir } from "../assets/helpers";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("src hygiene", () => {
  const files = sourceFiles(join(appDir, "src"));

  it("never imports the bare @babylonjs/core barrel", () => {
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/from\s+["']@babylonjs\/core["']/);
      expect(text, file).not.toMatch(/import\s+["']@babylonjs\/core["']/);
    }
  });

  it("references no CDN or remote URL", () => {
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/https?:\/\//);
    }
  });
});
