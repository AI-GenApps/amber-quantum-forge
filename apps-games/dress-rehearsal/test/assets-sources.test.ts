import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { renderFallbackIcon, renderFallbackSplash } from "../scripts/draw-fallback-icon";
import { PALETTE } from "../src/theme/tokens";

const ASSETS = join(import.meta.dirname, "../assets");

function load(name: string): Buffer {
  return readFileSync(join(ASSETS, name));
}

describe("capacitor asset sources", () => {
  it("icon-only.png is 1024 x 1024 and opaque", async () => {
    const meta = await sharp(load("icon-only.png")).metadata();
    expect([meta.width, meta.height]).toEqual([1024, 1024]);
    expect(meta.hasAlpha).toBe(false);
    const stats = await sharp(load("icon-only.png")).stats();
    expect(stats.isOpaque).toBe(true);
  });

  it("the adaptive foreground and background are 1024 x 1024", async () => {
    for (const name of ["icon-foreground.png", "icon-background.png"]) {
      const meta = await sharp(load(name)).metadata();
      expect([meta.width, meta.height], name).toEqual([1024, 1024]);
    }
  });

  it("both splash images are 2732 x 2732 on the night colour", async () => {
    for (const name of ["splash.png", "splash-dark.png"]) {
      const image = sharp(load(name));
      const meta = await image.metadata();
      expect([meta.width, meta.height], name).toEqual([2732, 2732]);
      const { data } = await image.raw().toBuffer({ resolveWithObject: true });
      const channels = meta.channels ?? 3;
      const night = PALETTE.night
        .slice(1)
        .match(/../g)
        ?.map((h) => Number.parseInt(h, 16));
      expect([...data.subarray(0, 3)], `${name} corner`).toEqual(night);
      expect(data.length / channels).toBe(2732 * 2732);
    }
  });

  it("the code-drawn fallback renders at the same sizes", async () => {
    const icon = await sharp(await renderFallbackIcon()).metadata();
    expect([icon.width, icon.height, icon.hasAlpha]).toEqual([1024, 1024, false]);
    const splash = await sharp(await renderFallbackSplash()).metadata();
    expect([splash.width, splash.height]).toEqual([2732, 2732]);
  });
});
