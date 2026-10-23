import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return entry.name === "node_modules" || entry.name === "dist" ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("repository rules", () => {
  it("keeps every code file under 800 lines", () => {
    const files = [...sourceFiles(join(ROOT, "src")), ...sourceFiles(join(ROOT, "test"))];
    const long = files
      .map((file) => ({ file, lines: readFileSync(file, "utf8").split("\n").length }))
      .filter((entry) => entry.lines > 800);
    expect(long).toEqual([]);
  });

  it("uses no any type in application code", () => {
    const offenders = sourceFiles(join(ROOT, "src")).filter((file) =>
      /:\s*any\b|\bas any\b|<any>/.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
