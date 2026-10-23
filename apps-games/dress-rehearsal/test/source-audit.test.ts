import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { collectContentText, outsideFontSubset } from "@web-games/dress-rehearsal-core";
import { describe, expect, it } from "vitest";
import { strings } from "../src/strings";

const APP = join(import.meta.dirname, "..");
const APP_SRC = join(APP, "src");
const CORE_SRC = join(APP, "../dress-rehearsal-core/src");

const URL_ALLOWLIST: readonly string[] = ["data/credits.ts"];

const NETWORK_APIS: readonly [string, RegExp][] = [
  ["fetch(", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["sendBeacon", /\bsendBeacon\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["EventSource", /\bEventSource\b/],
];

interface Source {
  file: string;
  text: string;
}

function sources(dir: string, base = dir): Source[] {
  const out: Source[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sources(path, base));
    else if (/\.(ts|tsx|css)$/.test(name)) {
      out.push({ file: path.slice(base.length + 1), text: readFileSync(path, "utf8") });
    }
  }
  return out;
}

const APP_FILES = sources(APP_SRC);
const CORE_FILES = sources(CORE_SRC);

function offenders(files: Source[], pattern: RegExp): string[] {
  return files.filter((entry) => pattern.test(entry.text)).map((entry) => entry.file);
}

describe("network and determinism audit", () => {
  it("scans real source trees", () => {
    expect(APP_FILES.length).toBeGreaterThan(60);
    expect(CORE_FILES.length).toBeGreaterThan(20);
  });

  for (const [label, pattern] of NETWORK_APIS) {
    it(`has no ${label} in the app or the core`, () => {
      expect(offenders(APP_FILES, pattern)).toEqual([]);
      expect(offenders(CORE_FILES, pattern)).toEqual([]);
    });
  }

  it("has no http(s) URL literal except the credits file", () => {
    const urls = /https?:\/\//;
    expect(offenders(CORE_FILES, urls)).toEqual([]);
    const outside = offenders(APP_FILES, urls).filter((file) => !URL_ALLOWLIST.includes(file));
    expect(outside).toEqual([]);
  });

  it("allows only https font licence source links in the credits file", () => {
    const credits = APP_FILES.find((entry) => entry.file === "data/credits.ts");
    const urls = credits?.text.match(/https?:\/\/[^"'`\s)]+/g) ?? [];
    expect(urls.length).toBeGreaterThanOrEqual(2);
    expect(new Set(urls.map((url) => new URL(url).host))).toEqual(new Set(["github.com"]));
    for (const url of urls) expect(url.startsWith("https://")).toBe(true);
  });

  it("has no Math.random or Date.now in the app or the core", () => {
    expect(offenders(APP_FILES, /\bMath\.random\b/)).toEqual([]);
    expect(offenders(APP_FILES, /\bDate\.now\b/)).toEqual([]);
    expect(offenders(CORE_FILES, /\bMath\.random\b/)).toEqual([]);
  });

  it("has no console.log in the app", () => {
    expect(offenders(APP_FILES, /\bconsole\.log\b/)).toEqual([]);
  });
});

describe("source hygiene", () => {
  it("keeps every source file under 800 lines", () => {
    for (const file of [...APP_FILES, ...CORE_FILES]) {
      expect(file.text.split("\n").length, file.file).toBeLessThanOrEqual(800);
    }
  });

  it("avoids any", () => {
    for (const file of APP_FILES) {
      expect(file.text, file.file).not.toMatch(/:\s*any\b|\bas any\b|<any>/);
    }
  });

  it("uses only characters the bundled font subset covers", () => {
    for (const file of APP_FILES) {
      expect(
        outsideFontSubset(file.text).filter((char) => char !== "\n"),
        file.file,
      ).toEqual([]);
    }
    for (const entry of collectContentText()) {
      expect(outsideFontSubset(entry.text), entry.label).toEqual([]);
    }
  });

  it("has English strings with no leftover placeholders", () => {
    for (const key of strings.keys()) {
      const params = (strings.t as (k: string, p?: Record<string, string>) => string)(key, {
        name: "x",
      });
      expect(params.trim().length, key).toBeGreaterThan(0);
      expect(params, key).not.toMatch(/\b(lorem|ipsum|todo|tbd|xxx)\b/i);
    }
    expect(strings.keys().length).toBeGreaterThan(150);
  });

  it("keeps public assets other than fonts out of the tree in this task", () => {
    const publicDir = join(APP, "public");
    const names = (readdirSync(publicDir, { recursive: true }) as string[]).filter((name) =>
      statSync(join(publicDir, name)).isFile(),
    );
    expect(names.every((name) => name.startsWith("fonts/"))).toBe(true);
  });
});
