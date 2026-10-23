import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(import.meta.dirname, "..");
const APP_SRC = join(APP, "src");
const CORE_SRC = join(APP, "../lost-parcel-desk-core/src");
const URL_ALLOWLIST = ["data/credits.ts"];

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
    else if (/\.(ts|tsx|css)$/.test(name))
      out.push({ file: path.slice(base.length + 1), text: readFileSync(path, "utf8") });
  }
  return out;
}

const APP_FILES = sources(APP_SRC);
const CORE_FILES = sources(CORE_SRC);
const offenders = (files: Source[], pattern: RegExp): string[] =>
  files.filter((entry) => pattern.test(entry.text)).map((entry) => entry.file);

describe("network audit", () => {
  it("scans real source trees", () => {
    expect(APP_FILES.length).toBeGreaterThan(70);
    expect(CORE_FILES.length).toBeGreaterThan(30);
  });

  for (const [label, pattern] of NETWORK_APIS) {
    it(`has no ${label} in src/`, () => {
      expect(offenders(APP_FILES, pattern)).toEqual([]);
      expect(offenders(CORE_FILES, pattern)).toEqual([]);
    });
  }

  it("has no http(s) URL literal in code except the credits file", () => {
    expect(offenders(CORE_FILES, /https?:\/\//)).toEqual([]);
    const outside = offenders(APP_FILES, /https?:\/\//).filter(
      (file) => !URL_ALLOWLIST.includes(file),
    );
    expect(outside).toEqual([]);
  });

  it("loads no remote stylesheet, font or image", () => {
    expect(
      offenders(
        APP_FILES.filter((entry) => entry.file.endsWith(".css")),
        /url\(\s*["']?(https?:)?\/\//,
      ),
    ).toEqual([]);
    expect(readFileSync(join(APP, "index.html"), "utf8")).not.toMatch(/(src|href)="https?:/);
  });
});

describe("code rules", () => {
  it("keeps every source file under 800 lines", () => {
    const long = [...APP_FILES, ...CORE_FILES]
      .map((entry) => ({ file: entry.file, lines: entry.text.split("\n").length }))
      .filter((entry) => entry.lines >= 800);
    expect(long).toEqual([]);
  });

  it("uses no any type", () => {
    expect(
      offenders(
        APP_FILES.filter((entry) => /\.tsx?$/.test(entry.file)),
        /(:\s*any\b|\bas any\b|<any>)/,
      ),
    ).toEqual([]);
  });

  it("registers no service worker, analytics or tracking script", () => {
    expect(offenders(APP_FILES, /\bserviceWorker\b|gtag\(|analytics/i)).toEqual([]);
  });
});
