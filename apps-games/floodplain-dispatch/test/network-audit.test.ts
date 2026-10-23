import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(import.meta.dirname, "..");
const APP_SRC = join(APP, "src");
const CORE_SRC = join(APP, "../floodplain-dispatch-core/src");

/** Files that may hold URL literals: licence and credits source links shown to the player. */
const URL_ALLOWLIST: readonly string[] = ["data/credits.ts"];

const NETWORK_APIS: readonly [string, RegExp][] = [
  ["fetch(", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["sendBeacon", /\bsendBeacon\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["EventSource", /\bEventSource\b/],
];

function sources(dir: string, base = dir): { file: string; text: string }[] {
  const out: { file: string; text: string }[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sources(path, base));
    else if (/\.(ts|tsx|css)$/.test(name)) {
      out.push({ file: path.slice(base.length + 1), text: readFileSync(path, "utf8") });
    }
  }
  return out;
}

function offenders(files: { file: string; text: string }[], pattern: RegExp): string[] {
  return files.filter((entry) => pattern.test(entry.text)).map((entry) => entry.file);
}

const APP_FILES = sources(APP_SRC);
const CORE_FILES = sources(CORE_SRC);

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

  it("has no http(s) URL literal except the allowlisted credits file", () => {
    const urls = /https?:\/\//;
    expect(offenders(CORE_FILES, urls)).toEqual([]);
    const outside = offenders(APP_FILES, urls).filter((file) => !URL_ALLOWLIST.includes(file));
    expect(outside).toEqual([]);
  });

  it("allows only licence source links in the credits file", () => {
    const credits = APP_FILES.find((entry) => entry.file === "data/credits.ts");
    const urls = credits?.text.match(/https?:\/\/[^"'`\s)]+/g) ?? [];
    expect(urls.length).toBeGreaterThan(20);
    const hosts = new Set(urls.map((url) => new URL(url).host));
    expect([...hosts].sort()).toEqual(["github.com", "kenney.nl", "opengameart.org"]);
    for (const url of urls) expect(url.startsWith("https://")).toBe(true);
  });

  it("allows no URL in the allowlist beyond the credits file", () => {
    expect(URL_ALLOWLIST).toEqual(["data/credits.ts"]);
  });

  it("has no Math.random or Date.now in the core", () => {
    expect(offenders(CORE_FILES, /\bMath\.random\b/)).toEqual([]);
    expect(offenders(CORE_FILES, /\bDate\.now\b/)).toEqual([]);
  });

  it("has no Math.random in the app (daily and playback stay seeded)", () => {
    expect(offenders(APP_FILES, /\bMath\.random\b/)).toEqual([]);
  });

  it("has no console.log in the app or the core", () => {
    expect(offenders(APP_FILES, /\bconsole\.log\b/)).toEqual([]);
    expect(offenders(CORE_FILES, /\bconsole\.log\b/)).toEqual([]);
  });
});
