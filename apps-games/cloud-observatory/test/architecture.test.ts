import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = join(import.meta.dirname, "..", "src");
const OUTSIDE_KIT = [
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(full) ? [full] : [];
  });
}

describe("save and session layers", () => {
  const files = sourceFiles(SRC_DIR);

  it("finds the save and session sources", () => {
    const names = files.map((file) => file.slice(SRC_DIR.length + 1));
    expect(names).toEqual(
      expect.arrayContaining([
        "save/autosave.ts",
        "save/profile-store.ts",
        "session/clock.ts",
        "session/game-session.ts",
      ]),
    );
  });

  for (const token of OUTSIDE_KIT) {
    it(`never uses ${token} outside the kit adapters`, () => {
      const offenders = files.filter((file) => readFileSync(file, "utf8").includes(token));
      expect(offenders).toEqual([]);
    });
  }

  it("keeps every source file under 800 lines", () => {
    for (const file of files) {
      expect(readFileSync(file, "utf8").split("\n").length).toBeLessThan(800);
    }
  });
});
