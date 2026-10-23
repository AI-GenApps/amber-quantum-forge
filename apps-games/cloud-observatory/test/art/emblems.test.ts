import { readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { EMBLEM_IDS } from "../../src/ui/art-slots";
import { ART_DIR, MASTERS } from "./paths";

async function cornerAlphas(file: string): Promise<{ size: [number, number]; corners: number[] }> {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (x: number, y: number): number => data[(y * info.width + x) * 4 + 3] ?? 255;
  return {
    size: [info.width, info.height],
    corners: [
      at(0, 0),
      at(info.width - 1, 0),
      at(0, info.height - 1),
      at(info.width - 1, info.height - 1),
    ],
  };
}

const emblemFiles = (dir: string): string[] =>
  readdirSync(dir)
    .filter((name) => /^emblem-.*\.webp$/.test(name))
    .sort();

describe("emblem framing", () => {
  it("only ships emblem files for the 12 emblem names", () => {
    for (const name of emblemFiles(ART_DIR)) {
      expect(EMBLEM_IDS as readonly string[]).toContain(name.replace(/^emblem-|\.webp$/g, ""));
    }
  });

  it("gives every bundled emblem the same square size with fully transparent corners", async () => {
    const files = emblemFiles(ART_DIR);
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const { size, corners } = await cornerAlphas(join(ART_DIR, name));
      expect(size, name).toEqual([288, 288]);
      expect(corners, name).toEqual([0, 0, 0, 0]);
    }
  });

  it("gives every emblem master the same square size with fully transparent corners", async () => {
    for (const name of emblemFiles(MASTERS)) {
      const { size, corners } = await cornerAlphas(join(MASTERS, name));
      expect(size, name).toEqual([1024, 1024]);
      expect(corners, name).toEqual([0, 0, 0, 0]);
    }
  });
});
