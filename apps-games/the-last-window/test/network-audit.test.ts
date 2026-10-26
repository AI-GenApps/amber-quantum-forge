// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(import.meta.dirname, "..");
const CORE = join(APP, "../the-last-window-core");

const URL_ALLOWLIST: ReadonlyArray<{ file: string; prefixes: readonly string[] }> = [
  {
    file: "src/data/credits.ts",
    prefixes: ["https://github.com/google/fonts/tree/main/ofl/"],
  },
  {
    file: "src/data/audioCredits.ts",
    prefixes: ["https://kenney.nl/assets/", "https://opengameart.org/content/"],
  },
];

const NETWORK_PATTERNS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: "fetch(", pattern: /\bfetch\s*\(/ },
  { name: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { name: "sendBeacon", pattern: /\bsendBeacon\b/ },
  { name: "WebSocket", pattern: /\bWebSocket\b/ },
  { name: "EventSource", pattern: /\bEventSource\b/ },
];

const URL_PATTERN = /https?:\/\/[^\s"'`)<>]+/g;

function sourceFiles(root: string, extensions: readonly string[]): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) found.push(...sourceFiles(path, extensions));
    else if (extensions.some((ext) => entry.name.endsWith(ext))) found.push(path);
  }
  return found.sort();
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function urlViolations(file: string, text: string): string[] {
  const rule = URL_ALLOWLIST.find((entry) => entry.file === file);
  const urls = text.match(URL_PATTERN) ?? [];
  return urls.filter((url) => !rule?.prefixes.some((prefix) => url.startsWith(prefix)));
}

const appSources = sourceFiles(join(APP, "src"), [".ts", ".tsx", ".css"]);
const coreSources = sourceFiles(join(CORE, "src"), [".ts"]);

describe("network and determinism audit", () => {
  it("scans a meaningful number of files", () => {
    expect(appSources.length).toBeGreaterThan(50);
    expect(coreSources.length).toBeGreaterThan(40);
  });

  it("the app and core source contain no network API", () => {
    const hits: string[] = [];
    for (const path of [...appSources, ...coreSources]) {
      const text = read(path);
      for (const { name, pattern } of NETWORK_PATTERNS) {
        if (pattern.test(text)) hits.push(`${relative(APP, path)}: ${name}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("the only URL literals are the licence and credits source links in the allowlist", () => {
    const hits: string[] = [];
    for (const path of [...appSources, ...coreSources]) {
      const rel = relative(APP, path);
      for (const url of urlViolations(rel, read(path))) hits.push(`${rel}: ${url}`);
    }
    expect(hits).toEqual([]);
  });

  it("every allowlisted file still carries at least one allowed link", () => {
    for (const { file, prefixes } of URL_ALLOWLIST) {
      const urls = read(join(APP, file)).match(URL_PATTERN) ?? [];
      expect(urls.length, file).toBeGreaterThan(0);
      for (const url of urls) {
        expect(
          prefixes.some((prefix) => url.startsWith(prefix)),
          `${file} ${url}`,
        ).toBe(true);
      }
    }
  });

  it("the core never reads a random source or the clock", () => {
    const hits: string[] = [];
    for (const path of coreSources) {
      const text = read(path);
      for (const needle of ["Math.random", "Date.now", "new Date(", "performance.now"]) {
        if (text.includes(needle)) hits.push(`${relative(CORE, path)}: ${needle}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("no source file logs with console.log", () => {
    const hits = [...appSources, ...coreSources]
      .filter((path) => /\bconsole\.log\b/.test(read(path)))
      .map((path) => relative(APP, path));
    expect(hits).toEqual([]);
  });

  it("the detectors catch what they are meant to catch", () => {
    expect(urlViolations("src/other.ts", 'const a = "https://example.com/x";')).toHaveLength(1);
    expect(urlViolations("src/data/credits.ts", 'x = "https://evil.test/";')).toHaveLength(1);
    expect(
      urlViolations("src/data/credits.ts", 'x = "https://github.com/google/fonts/tree/main/ofl/a"'),
    ).toHaveLength(0);
    for (const { name, pattern } of NETWORK_PATTERNS) {
      expect(pattern.test(`call ${name}`), name).toBe(true);
    }
  });
});
