import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  INDIGO_RGB,
  KEY_ART_CROP,
  renderBrandSources,
  SOURCE_FILES,
  SPLASH_SIZE,
} from "../../scripts/render-brand-sources";
import { ANDROID_RES, APP_DIR, hasAlpha, IOS_APP, pngInfo, read } from "./files";

const DENSITIES = [
  ["mdpi", 48],
  ["hdpi", 72],
  ["xhdpi", 96],
  ["xxhdpi", 144],
  ["xxxhdpi", 192],
] as const;

describe("resources/ brand sources", () => {
  const sizes: Record<string, [number, number]> = {
    "icon.png": [1024, 1024],
    "icon-foreground.png": [1024, 1024],
    "icon-background.png": [1024, 1024],
    "splash.png": [2732, 2732],
    "splash-dark.png": [2732, 2732],
  };

  it("holds exactly the five source PNGs at the stated sizes", () => {
    expect(readdirSync(join(APP_DIR, "resources")).sort()).toEqual([...SOURCE_FILES].sort());
    for (const [name, [width, height]] of Object.entries(sizes)) {
      const info = pngInfo(join(APP_DIR, "resources", name));
      expect([name, info.width, info.height]).toEqual([name, width, height]);
    }
  });

  it("keeps the icon opaque, the foreground transparent and the splash opaque", () => {
    const at = (name: string) => pngInfo(join(APP_DIR, "resources", name));
    expect(hasAlpha(at("icon.png"))).toBe(false);
    expect(hasAlpha(at("icon-background.png"))).toBe(false);
    expect(hasAlpha(at("splash.png"))).toBe(false);
    expect(hasAlpha(at("splash-dark.png"))).toBe(false);
    expect(hasAlpha(at("icon-foreground.png"))).toBe(true);
  });

  it("renders both the accepted-art path and the code-drawn fallback to the same specs", async () => {
    for (const fallback of [false, true]) {
      const files = await renderBrandSources(fallback);
      expect(Object.keys(files).sort()).toEqual([...SOURCE_FILES].sort());
      for (const [name, data] of Object.entries(files)) {
        expect(data.subarray(1, 4).toString("ascii"), name).toBe("PNG");
        expect(data.readUInt32BE(16), name).toBe((sizes[name] ?? [0, 0])[0]);
      }
    }
  });
});

describe("key-art splash", () => {
  const MASTER = join(
    APP_DIR,
    "../../.agents/resources/2026-10-23/web-games/lantern-loops/art/masters/key-art.webp",
  );
  const pixel = async (
    input: string | Buffer,
    x: number,
    y: number,
  ): Promise<[number, number, number]> => {
    const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
    const at = (y * info.width + x) * info.channels;
    return [data[at] ?? -1, data[at + 1] ?? -1, data[at + 2] ?? -1];
  };
  const centre = Math.floor(SPLASH_SIZE / 2);
  // Measured on macOS: 0 against the committed splash, about 6.3 against the fallback.
  const MATCH_TOLERANCE = 2;
  const FALLBACK_MIN_DIFFERENCE = 4;

  it("builds the splash from the accepted key-art master, not the lantern sprite or the fallback", async () => {
    expect(existsSync(MASTER)).toBe(true);
    const accepted = await renderBrandSources(false);
    const fallback = await renderBrandSources(true);
    const splash = accepted["splash.png"] ?? Buffer.alloc(0);
    const committed = join(APP_DIR, "resources/splash.png");
    // sharp/libvips resampling and palette quantisation are not bit-identical across platforms,
    // so compare decoded pixels by mean absolute difference (0-255 scale) instead of a hash.
    const meanAbsDiff = async (a: string | Buffer, b: string | Buffer): Promise<number> => {
      const [left, right] = await Promise.all([
        sharp(a).raw().toBuffer({ resolveWithObject: true }),
        sharp(b).raw().toBuffer({ resolveWithObject: true }),
      ]);
      expect([left.info.width, left.info.height, left.info.channels]).toEqual([
        right.info.width,
        right.info.height,
        right.info.channels,
      ]);
      let sum = 0;
      for (let i = 0; i < left.data.length; i++) {
        sum += Math.abs((left.data[i] ?? 0) - (right.data[i] ?? 0));
      }
      return sum / left.data.length;
    };
    expect(await meanAbsDiff(splash, committed)).toBeLessThan(MATCH_TOLERANCE);
    // The code-drawn fallback (lantern sprite) renders visibly different pixels.
    expect(await meanAbsDiff(splash, fallback["splash.png"] ?? Buffer.alloc(0))).toBeGreaterThan(
      FALLBACK_MIN_DIFFERENCE,
    );
    expect(splash.length).toBeGreaterThan(1000);
    expect(splash.equals(accepted["splash-dark.png"] ?? Buffer.alloc(0))).toBe(true);
  });

  it("keeps the corners flat indigo and the centre lit (amber channel well above blue)", async () => {
    const committed = join(APP_DIR, "resources/splash.png");
    const [r, g, b] = [INDIGO_RGB.r, INDIGO_RGB.g, INDIGO_RGB.b];
    for (const [x, y] of [
      [0, 0],
      [SPLASH_SIZE - 1, 0],
      [0, SPLASH_SIZE - 1],
      [SPLASH_SIZE - 1, SPLASH_SIZE - 1],
    ] as const) {
      expect(await pixel(committed, x, y)).toEqual([r, g, b]);
    }
    const [cr, , cb] = await pixel(committed, centre, centre - 150);
    expect(cr).toBeGreaterThan(200);
    expect(cr).toBeGreaterThan(cb + 60);
  });

  it("crops only the centre lantern, so no neighbouring garland lantern enters the splash", async () => {
    const { halfW, rx } = KEY_ART_CROP;
    const NEIGHBOUR_NEAR_EDGE = 172;
    expect(rx).toBeLessThan(NEIGHBOUR_NEAR_EDGE);
    const scale = (SPLASH_SIZE * 0.44) / (halfW * 2);
    const where = centre + Math.round((NEIGHBOUR_NEAR_EDGE + 14) * scale);
    const [r, , b] = await pixel(join(APP_DIR, "resources/splash.png"), where, centre);
    expect(r).toBeLessThan(40);
    expect(Math.abs(b - INDIGO_RGB.b)).toBeLessThan(6);
  });
});

describe("android launcher icons", () => {
  it("has launcher, round and adaptive foreground icons in all five densities", () => {
    for (const [density, size] of DENSITIES) {
      for (const name of ["ic_launcher", "ic_launcher_round", "ic_launcher_foreground"]) {
        const path = join(ANDROID_RES, `mipmap-${density}`, `${name}.png`);
        expect(existsSync(path), path).toBe(true);
        const info = pngInfo(path);
        expect(info.bytes, path).toBeGreaterThan(200);
        expect(info.width, path).toBe(info.height);
        if (name !== "ic_launcher_foreground") expect(info.width, path).toBe(size);
      }
    }
  });

  it("declares adaptive icons for the launcher and the round launcher", () => {
    for (const name of ["ic_launcher", "ic_launcher_round"]) {
      const xml = read(ANDROID_RES, "mipmap-anydpi-v26", `${name}.xml`);
      expect(xml).toContain("<adaptive-icon");
      expect(xml).toContain("@mipmap/ic_launcher_foreground");
      expect(xml).toContain("@mipmap/ic_launcher_background");
    }
  });

  it("has portrait splash images for light and dark", () => {
    for (const dir of [
      "drawable",
      "drawable-night",
      "drawable-port-xxxhdpi",
      "drawable-port-night-xxxhdpi",
    ]) {
      const info = pngInfo(join(ANDROID_RES, dir, "splash.png"));
      expect(info.bytes, dir).toBeGreaterThan(1000);
    }
  });
});

describe("ios app icon and splash", () => {
  it("has a 1024 marketing icon without alpha", () => {
    const set = join(IOS_APP, "Assets.xcassets/AppIcon.appiconset");
    const contents = JSON.parse(read(set, "Contents.json")) as {
      images: { size: string; filename: string }[];
    };
    const marketing = contents.images.find((image) => image.size === "1024x1024");
    expect(marketing?.filename).toBeDefined();
    const info = pngInfo(join(set, marketing?.filename ?? ""));
    expect([info.width, info.height]).toEqual([1024, 1024]);
    expect(hasAlpha(info)).toBe(false);
    expect(info.bytes).toBeGreaterThan(10_000);
  });

  it("has light and dark splash images listed in the imageset", () => {
    const set = join(IOS_APP, "Assets.xcassets/Splash.imageset");
    const contents = JSON.parse(read(set, "Contents.json")) as {
      images: { filename: string; appearances?: { value: string }[] }[];
    };
    const dark = contents.images.filter((i) => i.appearances?.some((a) => a.value === "dark"));
    const light = contents.images.filter((i) => i.appearances === undefined);
    expect(dark.length).toBe(3);
    expect(light.length).toBe(3);
    for (const image of contents.images) {
      const info = pngInfo(join(set, image.filename));
      expect([image.filename, info.width, info.height]).toEqual([image.filename, 2732, 2732]);
    }
    expect(readdirSync(set).filter((name) => name.endsWith(".png")).length).toBe(6);
  });
});
