import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  compare,
  isPalettePng,
  isSplash,
  MAX_BAND_ERROR,
  MAX_MEAN_ERROR,
  optimizeBuffer,
  walk,
} from "../scripts/optimize-native-images";

const APP_DIR = join(import.meta.dirname, "..");
const ANDROID_RES = join(APP_DIR, "android/app/src/main/res");
const IOS_ASSETS = join(APP_DIR, "ios/App/App/Assets.xcassets");
const ASSETS = join(APP_DIR, "assets");
/** 3 MB, decimal, per platform folder. The splash images are the bulk of it. */
const PLATFORM_BUDGET_BYTES = 3_000_000;

function folderBytes(dir: string): number {
  return walk(dir).reduce((sum, path) => sum + statSync(path).size, 0);
}

describe("native image size budget", () => {
  it("keeps the android res folder at 3 MB or less", () => {
    expect(folderBytes(ANDROID_RES)).toBeLessThanOrEqual(PLATFORM_BUDGET_BYTES);
  });

  it("keeps the ios Assets.xcassets folder at 3 MB or less", () => {
    expect(folderBytes(IOS_ASSETS)).toBeLessThanOrEqual(PLATFORM_BUDGET_BYTES);
  });

  it("ships every splash and the ios app icon as an optimized palette PNG", () => {
    const heavy = [...walk(ANDROID_RES), ...walk(IOS_ASSETS)]
      .filter((p) => p.endsWith(".png"))
      .filter((p) => isSplash(p) || p.includes("AppIcon.appiconset"))
      .filter((p) => !isPalettePng(readFileSync(p)));
    expect(heavy, "run `bun run native:assets` after regenerating native images").toEqual([]);
  });

  it("keeps the ios splash within the error limits of its 2732 px source", async () => {
    const dir = join(IOS_ASSETS, "Splash.imageset");
    const files = readdirSync(dir).filter((f) => f.endsWith(".png"));
    expect(files).toHaveLength(6);
    for (const file of files) {
      const source = readFileSync(
        join(ASSETS, file.includes("-dark") ? "splash-dark.png" : "splash.png"),
      );
      const shipped = readFileSync(join(dir, file));
      const meta = await sharp(shipped).metadata();
      expect([meta.width, meta.height], file).toEqual([2732, 2732]);
      const error = await compare(source, shipped);
      expect(error.meanError, file).toBeLessThan(MAX_MEAN_ERROR);
      expect(error.bandError, file).toBeLessThanOrEqual(MAX_BAND_ERROR);
    }
  });
});

describe("optimizeBuffer", () => {
  async function gradient(): Promise<Buffer> {
    const size = 512;
    const raw = Buffer.alloc(size * size * 3);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const at = (y * size + x) * 3;
        raw[at] = 20 + Math.round((x / size) * 30);
        raw[at + 1] = 40 + Math.round((y / size) * 40);
        raw[at + 2] = 90 + ((x * 7 + y * 13) % 5);
      }
    }
    return sharp(raw, { raw: { width: size, height: size, channels: 3 } })
      .png({ compressionLevel: 1 })
      .toBuffer();
  }

  it("shrinks a truecolour image, keeps its size and stays within the error limits", async () => {
    const original = await gradient();
    const out = await optimizeBuffer(original);
    expect(out.encoding).toBe("palette");
    expect(out.png.length).toBeLessThan(original.length / 2);
    expect(isPalettePng(out.png)).toBe(true);
    const meta = await sharp(out.png).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([512, 512, "png"]);
    const error = await compare(original, out.png);
    expect(error.meanError).toBeLessThan(MAX_MEAN_ERROR);
    expect(error.bandError).toBeLessThanOrEqual(MAX_BAND_ERROR);
  });

  it("leaves its own output alone, so repeated runs never re-quantise", async () => {
    const once = await optimizeBuffer(await gradient());
    const twice = await optimizeBuffer(once.png);
    expect(twice.encoding).toBe("kept");
    expect(twice.png).toBe(once.png);
  });
});
