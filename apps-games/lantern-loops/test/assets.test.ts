import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { assertAssetBudget } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { FONT_FACES, FONT_FAMILIES } from "../src/theme/fonts";

const APP = join(import.meta.dirname, "..");
const FONT_DIR = join(APP, "public/fonts");
const MAX_FONT_BYTES = 120 * 1024;

function woff2Files(): string[] {
  return readdirSync(FONT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) =>
      readdirSync(join(FONT_DIR, dir.name))
        .filter((name) => name.endsWith(".woff2"))
        .map((name) => join(FONT_DIR, dir.name, name)),
    );
}

describe("bundled fonts", () => {
  it("ships Fraunces and Nunito as woff2, each at most 120 KB", () => {
    const files = woff2Files();
    expect(files.map((f) => f.slice(f.lastIndexOf("/") + 1)).sort()).toEqual([
      "Fraunces-Variable.woff2",
      "Nunito-Variable.woff2",
    ]);
    assertAssetBudget(
      files.map((path) => ({ path, bytes: statSync(path).size })),
      { perFileBytes: MAX_FONT_BYTES, byExtension: { woff2: 2 * MAX_FONT_BYTES } },
    );
    for (const file of files) {
      expect(readFileSync(file).subarray(0, 4).toString("latin1"), file).toBe("wOF2");
    }
  });

  it("puts an OFL.txt next to every font", () => {
    for (const file of woff2Files()) {
      const licence = join(file, "..", "OFL.txt");
      expect(existsSync(licence), licence).toBe(true);
      const text = readFileSync(licence, "utf8");
      expect(text).toMatch(/SIL OPEN FONT LICENSE Version 1\.1/i);
      expect(text).toMatch(/Copyright/);
    }
  });

  it("registers exactly the bundled files", () => {
    expect(FONT_FAMILIES).toEqual(["Fraunces", "Nunito"]);
    for (const face of FONT_FACES) {
      expect(existsSync(join(APP, "public", face.src)), face.src).toBe(true);
    }
  });

  it("preloads both fonts from the page", () => {
    const html = readFileSync(join(APP, "index.html"), "utf8");
    for (const face of FONT_FACES) expect(html).toContain(`href="${face.src}"`);
    expect(html).toContain('content="#12132E"');
  });
});
