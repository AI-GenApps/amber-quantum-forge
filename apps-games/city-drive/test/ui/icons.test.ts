import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_SAFE_WIDTH,
  BRAND_COLOR,
  ICON_SIZE,
  RESOURCE_FILES,
  SPLASH_SIZE,
  WEB_ICON_FILES,
} from "../../scripts/brand-art/constants";

const APP = join(import.meta.dirname, "../..");
const RES = join(APP, "android/app/src/main/res");
const IOS = join(APP, "ios/App/App/Assets.xcassets");
const DENSITY = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 } as const;

async function info(path: string) {
  expect(existsSync(path), path).toBe(true);
  return sharp(path).metadata();
}

describe("source resources for @capacitor/assets", () => {
  for (const [name, expected] of Object.entries(RESOURCE_FILES)) {
    it(`${name} is ${expected.width}x${expected.height} ${expected.alpha ? "with" : "without"} alpha`, async () => {
      const meta = await info(join(APP, "resources", name));
      expect([meta.width, meta.height]).toEqual([expected.width, expected.height]);
      expect(meta.format).toBe("png");
      expect(meta.hasAlpha).toBe(expected.alpha);
    });
  }

  it("the adaptive foreground is transparent at the corners and stays inside the safe zone", async () => {
    const { data, info: raw } = await sharp(join(APP, "resources/icon-foreground.png"))
      .raw()
      .toBuffer({ resolveWithObject: true });
    const alphaAt = (x: number, y: number) => data[(y * raw.width + x) * raw.channels + 3] ?? 0;
    for (const [x, y] of [
      [0, 0],
      [raw.width - 1, 0],
      [0, raw.height - 1],
      [raw.width - 1, raw.height - 1],
    ] as const) {
      expect(alphaAt(x, y)).toBe(0);
    }
    let minX = raw.width;
    let maxX = 0;
    let minY = raw.height;
    let maxY = 0;
    for (let y = 0; y < raw.height; y++) {
      for (let x = 0; x < raw.width; x++) {
        if (alphaAt(x, y) < 16) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    expect(maxX - minX + 1).toBeLessThanOrEqual(ADAPTIVE_SAFE_WIDTH + 2);
    expect(maxX - minX + 1).toBeGreaterThan(ADAPTIVE_SAFE_WIDTH * 0.9);
    const half = ICON_SIZE / 2;
    const farthest = Math.max(
      ...[
        [minX, minY],
        [maxX, minY],
        [minX, maxY],
        [maxX, maxY],
      ].map(([x, y]) => Math.hypot((x ?? 0) - half, (y ?? 0) - half)),
    );
    expect(farthest).toBeLessThan(half * 0.98);
  });

  it("the adaptive background is one solid brand colour", async () => {
    const stats = await sharp(join(APP, "resources/icon-background.png")).stats();
    for (const channel of stats.channels) expect(channel.min).toBe(channel.max);
    const hex = stats.channels.map((c) => c.min.toString(16).padStart(2, "0")).join("");
    expect(`#${hex}`).toBe(BRAND_COLOR);
  });
});

describe("generated iOS assets", () => {
  it("the App Store icon is 1024x1024 with no alpha channel", async () => {
    const meta = await info(join(IOS, "AppIcon.appiconset/AppIcon-512@2x.png"));
    expect([meta.width, meta.height]).toEqual([1024, 1024]);
    expect(meta.hasAlpha).toBe(false);
    expect(meta.channels).toBe(3);
  });

  it("every splash the catalogue lists exists and is square", async () => {
    const dir = join(IOS, "Splash.imageset");
    const catalogue = JSON.parse(readFileSync(join(dir, "Contents.json"), "utf8")) as {
      images: { filename?: string }[];
    };
    const names = catalogue.images.flatMap((image) => (image.filename ? [image.filename] : []));
    expect(names.length).toBeGreaterThanOrEqual(6);
    for (const name of names) {
      const meta = await info(join(dir, name));
      expect(meta.width).toBe(meta.height);
      expect(meta.width).toBeGreaterThanOrEqual(1024);
    }
  });
});

describe("generated Android assets", () => {
  it("has launcher, round, foreground and background icons at every density", async () => {
    for (const [density, scale] of Object.entries(DENSITY)) {
      for (const name of [
        "ic_launcher",
        "ic_launcher_round",
        "ic_launcher_foreground",
        "ic_launcher_background",
      ]) {
        const meta = await info(join(RES, `mipmap-${density}`, `${name}.png`));
        expect([meta.width, meta.height], `${density}/${name}`).toEqual([48 * scale, 48 * scale]);
      }
    }
  });

  it("points the adaptive icon at the foreground and background pair", () => {
    for (const file of ["ic_launcher.xml", "ic_launcher_round.xml"]) {
      const xml = readFileSync(join(RES, "mipmap-anydpi-v26", file), "utf8");
      expect(xml).toContain("@mipmap/ic_launcher_foreground");
      expect(xml).toContain("@mipmap/ic_launcher_background");
    }
    expect(readFileSync(join(RES, "values/ic_launcher_background.xml"), "utf8")).toContain(
      BRAND_COLOR.toUpperCase(),
    );
  });

  it("has light and dark splash screens in portrait and landscape", async () => {
    for (const dir of [
      "drawable",
      "drawable-night",
      "drawable-land-xxhdpi",
      "drawable-port-night-xxhdpi",
    ]) {
      expect(existsSync(join(RES, dir, "splash.png")), dir).toBe(true);
    }
    const land = await info(join(RES, "drawable-land-xxhdpi/splash.png"));
    expect((land.width ?? 0) > (land.height ?? 0)).toBe(true);
  });
});

describe("web favicon and PWA icons", () => {
  for (const [name, size] of Object.entries(WEB_ICON_FILES)) {
    it(`${name} is ${size}x${size} without alpha`, async () => {
      const meta = await info(join(APP, "public", name));
      expect([meta.width, meta.height]).toEqual([size, size]);
      expect(meta.hasAlpha).toBe(false);
    });
  }

  it("the manifest names the game and lists the 192, 512 and maskable icons that exist", () => {
    const manifest = JSON.parse(readFileSync(join(APP, "public/manifest.webmanifest"), "utf8")) as {
      name: string;
      theme_color: string;
      icons: { src: string; sizes: string; purpose: string }[];
    };
    expect(manifest.name).toBe("Street Royale");
    expect(manifest.theme_color).toBe(BRAND_COLOR);
    expect(manifest.icons.map((i) => `${i.sizes}:${i.purpose}`)).toEqual([
      "192x192:any",
      "512x512:any",
      "512x512:maskable",
    ]);
    for (const icon of manifest.icons) {
      expect(existsSync(join(APP, "public", icon.src)), icon.src).toBe(true);
    }
  });

  it("index.html links the favicon, touch icon and manifest", () => {
    const html = readFileSync(join(APP, "index.html"), "utf8");
    expect(html).toContain('href="/favicon.png"');
    expect(html).toContain('href="/apple-touch-icon.png"');
    expect(html).toContain('href="/manifest.webmanifest"');
  });
});

describe("splash art", () => {
  it("is square at the generator size", () => {
    expect(SPLASH_SIZE).toBe(2732);
  });
});
