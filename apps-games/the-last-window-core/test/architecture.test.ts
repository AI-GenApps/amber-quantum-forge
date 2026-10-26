import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = join(import.meta.dirname, "..", "src");
const CONTENT_DIR = join(SRC_DIR, "content");
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
  const files = listSourceFiles(SRC_DIR).filter((file) => !file.startsWith(CONTENT_DIR));

  it("finds source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const token of FORBIDDEN_TOKENS) {
    it(`src never references ${token}`, () => {
      const offenders = files.filter((file) => readFileSync(file, "utf8").includes(token));
      expect(offenders).toEqual([]);
    });
  }
});

describe("content purity", () => {
  const files = listSourceFiles(CONTENT_DIR);
  const codeTokens = FORBIDDEN_TOKENS.filter((token) => token !== "window" && token !== "document");

  it("finds content files to scan", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  for (const token of codeTokens) {
    it(`content never references ${token}`, () => {
      const offenders = files.filter((file) => readFileSync(file, "utf8").includes(token));
      expect(offenders).toEqual([]);
    });
  }

  it("content never touches the DOM API (prose may say window)", () => {
    const offenders = files.filter((file) =>
      /\b(window|document)\.[A-Za-z_]|\bglobalThis\b|\bnavigator\./.test(
        readFileSync(file, "utf8"),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
