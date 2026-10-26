import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP, APP_FILES, CORE_FILES, offenders } from "./sources";

const URL_ALLOWLIST: readonly string[] = ["data/credits.ts"];
const ALLOWED_HOSTS = ["github.com", "kenney.nl", "opengameart.org"];
const ALL_FILES = [...APP_FILES, ...CORE_FILES];

const NETWORK_APIS: readonly [string, RegExp][] = [
  ["fetch(", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["sendBeacon", /\bsendBeacon\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["EventSource", /\bEventSource\b/],
  ["import()", /\bimport\s*\(\s*["'`]https?:/],
];

describe("network audit (the game is fully offline)", () => {
  it("scans real source trees", () => {
    expect(APP_FILES.length).toBeGreaterThan(60);
    expect(CORE_FILES.length).toBeGreaterThan(20);
  });

  for (const [label, pattern] of NETWORK_APIS) {
    it(`has no ${label} in src/ or the core`, () => {
      expect(offenders(ALL_FILES, pattern)).toEqual([]);
    });
  }

  it("has no http:// URL literal anywhere in src/ or the core", () => {
    expect(offenders(ALL_FILES, /http:\/\//)).toEqual([]);
  });

  it("has no https:// URL literal except the licence and credits source links", () => {
    const outside = offenders(ALL_FILES, /https:\/\//).filter(
      (file) => !URL_ALLOWLIST.includes(file),
    );
    expect(outside).toEqual([]);
  });

  it("allows only font and CC0 audio source hosts in the credits file", () => {
    const credits = APP_FILES.find((entry) => entry.file === "data/credits.ts");
    const urls = credits?.text.match(/https?:\/\/[^"'`\s)]+/g) ?? [];
    expect(urls.length).toBeGreaterThanOrEqual(28);
    expect(new Set(urls.map((url) => new URL(url).host))).toEqual(new Set(ALLOWED_HOSTS));
    for (const url of urls) expect(url.startsWith("https://")).toBe(true);
  });

  it("loads no remote resource from index.html", () => {
    const html = readFileSync(join(APP, "index.html"), "utf8");
    expect(html).not.toMatch(/(?:src|href)\s*=\s*["'](?:https?:)?\/\//);
  });
});

describe("determinism and logging audit", () => {
  it("has no Math.random or Date.now in src/ or the core", () => {
    expect(offenders(ALL_FILES, /\bMath\.random\b/)).toEqual([]);
    expect(offenders(ALL_FILES, /\bDate\.now\b/)).toEqual([]);
  });

  it("has no console.log in src/ or the core", () => {
    expect(offenders(ALL_FILES, /\bconsole\.log\b/)).toEqual([]);
  });
});
