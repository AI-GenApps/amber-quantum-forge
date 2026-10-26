import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite";
import { beforeAll, describe, expect, it } from "vitest";
import { CUES, MUSIC_FILE } from "../../src/audio/cues";
import { ART_ENTRIES } from "../../src/ui/art-entries";
import { FONT_FACES } from "../../src/ui/fonts";
import { APP, BUNDLE_DIR, readText, sizeOf, walk } from "./paths";

const JS_BUDGET_BYTES = 300 * 1024;
const HTML_BUDGET_BYTES = 5 * 1024;
/**
 * Vite's modulepreload polyfill (same-origin script URLs), the kit audio loader (bundled MP3
 * files) and Capacitor core's built-in web HTTP plugin, which the game never calls (the source
 * audit in no-network.test.ts forbids CapacitorHttp and every other network API in src).
 */
const KNOWN_FETCH_SITES = 3;
const BASE_ASSET_PATTERN = /^\//;

interface JsFile {
  readonly name: string;
  readonly raw: number;
  readonly gzip: number;
}

let jsFiles: JsFile[] = [];
let allFiles: string[] = [];

beforeAll(async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    await runBuild();
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
  allFiles = walk(BUNDLE_DIR);
  jsFiles = allFiles
    .filter((file) => file.endsWith(".js"))
    .map((file) => ({
      name: file.slice(BUNDLE_DIR.length + 1),
      raw: sizeOf(file),
      gzip: gzipSync(readText(file), { level: 9 }).length,
    }));
}, 120_000);

async function runBuild(): Promise<void> {
  await build({
    root: APP,
    logLevel: "silent",
    mode: "production",
    build: { outDir: BUNDLE_DIR, emptyOutDir: true, sourcemap: false, reportCompressedSize: false },
  });
}

const inOutput = (url: string) => existsSync(join(BUNDLE_DIR, url.replace(BASE_ASSET_PATTERN, "")));

describe("release bundle", () => {
  it("keeps the JavaScript at most 300 KB gzip, art excluded", () => {
    const total = jsFiles.reduce((sum, file) => sum + file.gzip, 0);
    const rawTotal = jsFiles.reduce((sum, file) => sum + file.raw, 0);
    for (const file of jsFiles) {
      console.info(`bundle ${file.name}: ${file.raw} bytes raw, ${file.gzip} bytes gzip`);
    }
    console.info(
      `bundle total: ${jsFiles.length} files, ${rawTotal} bytes raw, ${total} bytes gzip (budget ${JS_BUDGET_BYTES})`,
    );
    expect(jsFiles.length).toBeGreaterThan(0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(JS_BUDGET_BYTES);
  });

  it("emits every font, audio file and art image the code refers to", () => {
    for (const face of FONT_FACES) expect(inOutput(face.src), face.src).toBe(true);
    for (const cue of Object.values(CUES))
      expect(inOutput(`audio/${cue.file}`), cue.file).toBe(true);
    expect(inOutput(`audio/${MUSIC_FILE}`)).toBe(true);
    for (const entry of Object.values(ART_ENTRIES))
      expect(inOutput(entry.src), entry.src).toBe(true);
  });

  it("emits no source maps", () => {
    expect(allFiles.filter((file) => file.endsWith(".map"))).toEqual([]);
    for (const file of jsFiles) {
      expect(readText(join(BUNDLE_DIR, file.name)), file.name).not.toMatch(/sourceMappingURL/);
    }
  });

  it("keeps the first-load HTML under 5 KB and pointing at emitted scripts", () => {
    const htmlPath = join(BUNDLE_DIR, "index.html");
    expect(sizeOf(htmlPath)).toBeLessThan(HTML_BUDGET_BYTES);
    const html = readText(htmlPath);
    const scripts = Array.from(html.matchAll(/<script[^>]+src="([^"]+)"/g), (m) => m[1] ?? "");
    expect(scripts.length).toBeGreaterThan(0);
    for (const src of scripts) expect(inOutput(src), src).toBe(true);
    expect(html).not.toMatch(/https?:\/\//);
  });

  it("emits only the bundled folders next to the scripts", () => {
    const top = readdirSync(BUNDLE_DIR).sort();
    expect(top).toEqual(["art", "assets", "audio", "fonts", "index.html"]);
  });

  it("ships no remote URL and no network API beyond three known fetch sites", () => {
    const namespaces = new Set([
      "http://www.w3.org/1998/Math/MathML",
      "http://www.w3.org/1999/xhtml",
      "http://www.w3.org/2000/svg",
    ]);
    for (const file of jsFiles) {
      const source = readText(join(BUNDLE_DIR, file.name));
      for (const url of source.match(/https?:\/\/[A-Za-z0-9./_#-]*/g) ?? []) {
        expect(namespaces.has(url), `${file.name}: ${url}`).toBe(true);
      }
      expect(source, file.name).not.toMatch(
        /XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts/,
      );
      const fetches = (source.match(/\bfetch\(/g) ?? []).length;
      expect(fetches, `${file.name} fetch calls`).toBeLessThanOrEqual(KNOWN_FETCH_SITES);
    }
  });
});
