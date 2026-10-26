import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fontFaceCss } from "@web-games/kit";
import { describe, expect, it } from "vitest";
import { FONT_CREDITS } from "../src/data/credits";
import { BODY_FAMILY, DISPLAY_FAMILY, FONT_FACES, FONT_FAMILIES } from "../src/fonts";

const APP = join(import.meta.dirname, "..");
const PUBLIC = join(APP, "public");
const FONT_DIR = join(PUBLIC, "fonts");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const woff2 = walk(FONT_DIR).filter((file) => file.endsWith(".woff2"));

describe("bundled fonts", () => {
  it("ships Courier Prime regular and bold and one IBM Plex Sans variable file", () => {
    expect(woff2.map((file) => file.slice(FONT_DIR.length + 1)).sort()).toEqual([
      "courier-prime/CourierPrime-Bold.woff2",
      "courier-prime/CourierPrime-Regular.woff2",
      "ibm-plex-sans/IBMPlexSans.woff2",
    ]);
  });

  it("holds real woff2 files within the size budgets", () => {
    let total = 0;
    for (const file of woff2) {
      const bytes = readFileSync(file);
      expect(bytes.subarray(0, 4).toString("latin1"), file).toBe("wOF2");
      expect(bytes.length, file).toBeLessThanOrEqual(120 * 1024);
      total += bytes.length;
    }
    expect(total).toBeLessThanOrEqual(300 * 1024);
    for (const file of woff2.filter((name) => name.includes("courier-prime"))) {
      expect(statSync(file).size).toBeLessThanOrEqual(60 * 1024);
    }
  });

  it("carries the OFL licence text beside each family", () => {
    for (const dir of ["courier-prime", "ibm-plex-sans"]) {
      const licence = readFileSync(join(FONT_DIR, dir, "OFL.txt"), "utf8");
      expect(licence).toContain("SIL OPEN FONT LICENSE Version 1.1");
      expect(licence).toContain("Copyright");
    }
    expect(readFileSync(join(FONT_DIR, "courier-prime/OFL.txt"), "utf8")).toContain(
      "Courier Prime",
    );
    expect(readFileSync(join(FONT_DIR, "ibm-plex-sans/OFL.txt"), "utf8")).toContain("IBM Corp.");
  });

  it("registers every shipped file as an @font-face rule with the public path", () => {
    const css = fontFaceCss(FONT_FACES);
    expect(css.match(/@font-face/g)).toHaveLength(3);
    for (const face of FONT_FACES) {
      expect(
        woff2.some((file) => file.endsWith(face.src.replace("/fonts/", "/"))),
        face.src,
      ).toBe(true);
    }
    expect(css).toContain('"Courier Prime"');
    expect(css).toContain('"IBM Plex Sans"');
    expect(css).toContain("font-weight: 100 700;");
    expect(FONT_FAMILIES).toEqual([DISPLAY_FAMILY, BODY_FAMILY]);
  });

  it("credits both families with their licence", () => {
    expect(FONT_CREDITS.map((entry) => entry.name)).toEqual([DISPLAY_FAMILY, BODY_FAMILY]);
    for (const entry of FONT_CREDITS) expect(entry.licence).toContain("Open Font License");
  });

  it("is preloaded from index.html and the theme colour is the night token", () => {
    const html = readFileSync(join(APP, "index.html"), "utf8");
    expect(html).toContain('href="/fonts/courier-prime/CourierPrime-Bold.woff2"');
    expect(html).toContain('href="/fonts/ibm-plex-sans/IBMPlexSans.woff2"');
    expect(html).toContain('name="theme-color" content="#141a22"');
  });

  it("uses no font family in the stylesheets other than the two bundled ones", () => {
    const css = ["styles.css", "screens.css", "motion.css"]
      .map((name) => readFileSync(join(APP, "src", name), "utf8"))
      .join("\n");
    const families = [...css.matchAll(/font-family:\s*([^;]+);/g)].map(
      (match) => match[1] as string,
    );
    expect(families.length).toBeGreaterThan(5);
    for (const value of families) expect(value, value).toMatch(/var\(--wg-font-(body|display)/);
  });
});
