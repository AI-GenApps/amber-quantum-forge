import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const APP_DIR = join(import.meta.dirname, "../..");
export const ANDROID_DIR = join(APP_DIR, "android");
export const IOS_DIR = join(APP_DIR, "ios");
export const ANDROID_RES = join(ANDROID_DIR, "app/src/main/res");
export const IOS_APP = join(IOS_DIR, "App/App");

export const read = (...parts: string[]): string => readFileSync(join(...parts), "utf8");

export const sha256 = (path: string): string =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

export interface PngInfo {
  width: number;
  height: number;
  bitDepth: number;
  /** 0 grey, 2 RGB, 3 palette, 4 grey+alpha, 6 RGBA */
  colourType: number;
  bytes: number;
  hasTransparencyChunk: boolean;
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function pngInfo(path: string): PngInfo {
  const data = readFileSync(path);
  if (!data.subarray(0, 8).equals(SIGNATURE)) throw new Error(`${path} is not a PNG`);
  let hasTransparencyChunk = false;
  let offset = 8;
  while (offset + 8 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    if (type === "tRNS") hasTransparencyChunk = true;
    if (type === "IDAT") break;
    offset += 12 + length;
  }
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    bitDepth: data.readUInt8(24),
    colourType: data.readUInt8(25),
    bytes: data.length,
    hasTransparencyChunk,
  };
}

export const hasAlpha = (info: PngInfo): boolean =>
  info.colourType === 4 || info.colourType === 6 || info.hasTransparencyChunk;

/** Tracked and untracked-but-not-ignored files below a platform folder, as git would commit them. */
export function committedFiles(folder: "android" | "ios"): string[] {
  const out = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--", folder],
    { cwd: APP_DIR, encoding: "utf8" },
  );
  return out.split("\n").filter((line) => line !== "");
}
