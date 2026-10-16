// @vitest-environment happy-dom
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const APP = join(import.meta.dirname, "../..");
const read = (path: string): string => readFileSync(join(APP, path), "utf8");
const TOKENS = read("src/ui/tokens.css");

const FONTS = [
  { slug: "russo-one", family: "Russo One", file: "RussoOne-Regular.ttf" },
  { slug: "saira", family: "Saira", file: "Saira.ttf" },
] as const;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("bundled fonts", () => {
  for (const font of FONTS) {
    it(`${font.family}: font file, OFL.txt and licence record exist and agree`, () => {
      const file = join(APP, "public/fonts", font.slug, font.file);
      const ofl = join(APP, "public/fonts", font.slug, "OFL.txt");
      expect(statSync(file).size).toBeGreaterThan(10_000);
      expect(read(`public/fonts/${font.slug}/OFL.txt`)).toContain("SIL Open Font License");
      const record = read(`assets-src/LICENSES/fonts-${font.slug}.txt`);
      expect(record).toContain("github.com/google/fonts/tree/main/ofl/");
      expect(record).toMatch(/Download date: \d{4}-\d{2}-\d{2}/);
      const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
      expect(record).toContain(`File SHA-256: ${sha(file)}`);
      expect(record).toContain(`OFL.txt SHA-256: ${sha(ofl)}`);
    });

    it(`${font.family}: @font-face is truetype, font-display block, and points at a real file`, () => {
      const block = TOKENS.match(
        new RegExp(`@font-face\\s*{[^}]*font-family:\\s*"${font.family}"[^}]*}`),
      )?.[0];
      expect(block, `@font-face for ${font.family}`).toBeDefined();
      expect(block).toContain('format("truetype")');
      expect(block).toContain("font-display: block");
      const url = block?.match(/url\("([^"]+)"\)/)?.[1] ?? "";
      expect(existsSync(join(APP, "public", url)), url).toBe(true);
    });
  }

  it("index.html preloads both font files", () => {
    const html = read("index.html");
    for (const font of FONTS) {
      const href = `/fonts/${font.slug}/${font.file}`;
      expect(html).toContain(`href="${href}"`);
      expect(html).toMatch(/rel="preload"[^>]*as="font"|as="font"[^>]*rel="preload"/s);
      expect(existsSync(join(APP, "public", href))).toBe(true);
    }
  });
});

describe("computed font families", () => {
  function load(): void {
    const style = document.createElement("style");
    style.textContent = TOKENS;
    document.head.appendChild(style);
  }

  it("the root and body use Saira", () => {
    load();
    expect(getComputedStyle(document.documentElement).fontFamily).toMatch(/^"?Saira"?/);
    expect(getComputedStyle(document.body).fontFamily).toMatch(/^"?Saira"?/);
  });

  it("headings use Russo One", () => {
    load();
    for (const tag of ["h1", "h2", "h3", "h4"]) {
      const heading = document.createElement(tag);
      document.body.appendChild(heading);
      expect(getComputedStyle(heading).fontFamily, tag).toMatch(/^"?Russo One"?/);
    }
  });

  it("buttons and form controls use Saira, not the platform control font", () => {
    load();
    for (const tag of ["button", "input", "select"]) {
      const el = document.createElement(tag);
      document.body.appendChild(el);
      expect(getComputedStyle(el).fontFamily, tag).toMatch(/^"?Saira"?/);
    }
  });
});

describe("no system font stack first", () => {
  const cssFiles = walk(join(APP, "src")).filter((f) => f.endsWith(".css"));
  const customFirst = /^(var\(--font-(display|body)\)|"Russo One"|"Saira")/;

  it("finds the stylesheets", () => {
    expect(cssFiles.map((f) => relative(APP, f))).toEqual(
      expect.arrayContaining(["src/ui/tokens.css", "src/ui/controls/controls.css"]),
    );
  });

  it("every font-family declaration in the stylesheets starts with a bundled family", () => {
    for (const file of cssFiles) {
      const css = readFileSync(file, "utf8").replace(/@font-face\s*{[^}]*}/g, "");
      for (const match of css.matchAll(/font-family:\s*([^;]+);/g)) {
        expect(match[1]?.trim(), `${relative(APP, file)}: ${match[0]}`).toMatch(customFirst);
      }
    }
  });

  it("no source file names a system font stack", () => {
    const sources = walk(join(APP, "src")).filter((f) => /\.(css|ts|tsx)$/.test(f));
    for (const file of sources) {
      // The ?fps overlay is a developer tool and keeps its monospace readout.
      if (file.endsWith("fpsOverlay.ts")) continue;
      expect(readFileSync(file, "utf8"), relative(APP, file)).not.toMatch(
        /system-ui|-apple-system|BlinkMacSystemFont|Roboto|Helvetica|Arial/,
      );
    }
  });
});
