// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  APP_DIR,
  artFiles,
  artLimitFor,
  audioFiles,
  type BundleSize,
  fontFiles,
  LIMITS,
  measureBundle,
  sum,
} from "../scripts/budget-lib";

let bundle: BundleSize;

beforeAll(async () => {
  bundle = await measureBundle();
}, 60_000);

describe("release budgets", () => {
  it("the JS bundle is at most 300 KB gzip, excluding art, fonts and audio", () => {
    expect(bundle.files.length).toBeGreaterThan(0);
    expect(bundle.gzipBytes).toBeGreaterThan(10_000);
    expect(bundle.gzipBytes).toBeLessThanOrEqual(LIMITS.jsGzip);
  });

  it("raw JS stays under 1 MB, so no art, font or audio is inlined", () => {
    expect(bundle.rawBytes).toBeLessThan(1024 * 1024);
  });

  it("runtime art is at most 8 MB and every file is inside its per-file limit", () => {
    const art = artFiles();
    expect(art.length).toBe(52);
    expect(sum(art)).toBeLessThanOrEqual(LIMITS.art);
    const over = art.filter((file) => file.bytes > artLimitFor(file.name));
    expect(over).toEqual([]);
  });

  it("per-file art limits are 400 KB for 800 x 1200 images, 120 KB for busts and 60 KB for objects", () => {
    expect(artLimitFor("key-art.webp")).toBe(400 * 1024);
    expect(artLimitFor("interior-rain.webp")).toBe(400 * 1024);
    expect(artLimitFor("customer-3-sad.webp")).toBe(120 * 1024);
    expect(artLimitFor("drink-1.webp")).toBe(60 * 1024);
    expect(artLimitFor("decor-8.webp")).toBe(60 * 1024);
  });

  it("fonts are at most 300 KB", () => {
    const fonts = fontFiles();
    expect(fonts).toHaveLength(2);
    expect(sum(fonts)).toBeLessThanOrEqual(LIMITS.fonts);
  });

  it("audio is at most 2 MB", () => {
    const audio = audioFiles();
    expect(audio).toHaveLength(36);
    expect(sum(audio)).toBeLessThanOrEqual(LIMITS.audio);
  });

  it("the production index.html references no remote origin", () => {
    const html = readFileSync(join(APP_DIR, "index.html"), "utf8");
    expect(html).not.toMatch(/https?:\/\//);
  });
});
