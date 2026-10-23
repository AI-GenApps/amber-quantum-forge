import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ANDROID_RES, IOS_APP_DIR, RESOURCES_DIR } from "./paths";

async function stats(path: string) {
  const image = sharp(path);
  const meta = await image.metadata();
  const info = await image.stats();
  const alpha = info.channels[3];
  return {
    width: meta.width,
    height: meta.height,
    hasAlpha: meta.hasAlpha,
    alphaMin: alpha?.min ?? 255,
  };
}

describe("capacitor asset sources", () => {
  it("icon-only is a 1024 square and fully opaque", async () => {
    const s = await stats(join(RESOURCES_DIR, "icon-only.png"));
    expect([s.width, s.height]).toEqual([1024, 1024]);
    expect(s.alphaMin).toBe(255);
  });

  it("icon-background is a 1024 square and fully opaque", async () => {
    const s = await stats(join(RESOURCES_DIR, "icon-background.png"));
    expect([s.width, s.height]).toEqual([1024, 1024]);
    expect(s.alphaMin).toBe(255);
  });

  it("icon-foreground is a 1024 square with transparent corners and a mark in the safe zone", async () => {
    const path = join(RESOURCES_DIR, "icon-foreground.png");
    const s = await stats(path);
    expect([s.width, s.height]).toEqual([1024, 1024]);
    expect(s.hasAlpha).toBe(true);
    expect(s.alphaMin).toBe(0);
    const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
    const alphaAt = (x: number, y: number): number =>
      data[(y * info.width + x) * info.channels + 3] ?? 0;
    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(1023, 1023)).toBe(0);
    expect(alphaAt(512, 512)).toBe(255);
    const safe = Math.round(1024 * 0.66);
    const margin = (1024 - safe) / 2;
    let outside = 0;
    for (let y = 0; y < 1024; y += 4) {
      for (let x = 0; x < 1024; x += 4) {
        const inside =
          x >= margin - 2 && x <= margin + safe + 2 && y >= margin - 2 && y <= margin + safe + 2;
        if (!inside && alphaAt(x, y) > 8) outside += 1;
      }
    }
    expect(outside).toBe(0);
  });

  it.each(["splash.png", "splash-dark.png"])("%s is 2732 square and opaque", async (file) => {
    const s = await stats(join(RESOURCES_DIR, file));
    expect([s.width, s.height]).toEqual([2732, 2732]);
    expect(s.alphaMin).toBe(255);
  });
});

function pngsIn(dir: string): string[] {
  return readdirSync(dir).filter((name) => name.endsWith(".png"));
}

describe("generated launcher icons and splash", () => {
  it("has the android mipmap set for every density, non-empty", () => {
    for (const density of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
      const dir = join(ANDROID_RES, `mipmap-${density}`);
      for (const file of [
        "ic_launcher.png",
        "ic_launcher_round.png",
        "ic_launcher_foreground.png",
        "ic_launcher_background.png",
      ]) {
        const path = join(dir, file);
        expect(existsSync(path), path).toBe(true);
        expect(statSync(path).size).toBeGreaterThan(200);
      }
    }
    expect(existsSync(join(ANDROID_RES, "mipmap-anydpi-v26/ic_launcher.xml"))).toBe(true);
    expect(existsSync(join(ANDROID_RES, "mipmap-anydpi-v26/ic_launcher_round.xml"))).toBe(true);
  });

  it("has portrait splash drawables and a night variant", () => {
    expect(statSync(join(ANDROID_RES, "drawable/splash.png")).size).toBeGreaterThan(1000);
    expect(statSync(join(ANDROID_RES, "drawable-night/splash.png")).size).toBeGreaterThan(1000);
    expect(statSync(join(ANDROID_RES, "drawable-port-xxxhdpi/splash.png")).size).toBeGreaterThan(
      1000,
    );
  });

  it("has the ios app icon set with an opaque 1024 icon", async () => {
    const dir = join(IOS_APP_DIR, "Assets.xcassets/AppIcon.appiconset");
    const icons = pngsIn(dir);
    expect(icons.length).toBeGreaterThan(0);
    for (const file of icons) {
      const s = await stats(join(dir, file));
      expect([s.width, s.height]).toEqual([1024, 1024]);
      expect(s.alphaMin).toBe(255);
    }
  });

  it("has the ios splash image set", () => {
    const dir = join(IOS_APP_DIR, "Assets.xcassets/Splash.imageset");
    expect(pngsIn(dir).length).toBeGreaterThanOrEqual(6);
    expect(existsSync(join(dir, "Contents.json"))).toBe(true);
  });
});
