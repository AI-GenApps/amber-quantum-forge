import type { ArtKind, ArtSlotDef } from "@web-games/the-last-window-core";
import sharp from "sharp";

/** Opaque pixels are those with alpha at or above this value. */
export const OPAQUE_ALPHA = 128;
/** Identity proxy: bounding boxes agree within this fraction of the frame. */
export const IDENTITY_TOLERANCE = 0.04;

const KIB = 1024;

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Analysis {
  width: number;
  height: number;
  bytes: number;
  hasAlpha: boolean;
  pages: number;
  hasExif: boolean;
  fullyOpaque: boolean;
  /** Alpha of the four corner pixels: top-left, top-right, bottom-left, bottom-right. */
  corners: readonly [number, number, number, number];
  /** Share of the frame covered by opaque pixels, 0 to 1. */
  coverage: number;
  /** Bounding box of the opaque pixels as fractions of the frame (right and bottom exclusive). */
  box: Box;
}

export type Stage = "runtime" | "master";

/** Per-file byte limits for runtime images. */
export const BYTE_LIMITS: Readonly<Record<ArtKind, number>> = {
  icon: Number.POSITIVE_INFINITY,
  feature: Number.POSITIVE_INFINITY,
  "key-art": 400 * KIB,
  interior: 400 * KIB,
  bust: 120 * KIB,
  item: 60 * KIB,
  decor: 60 * KIB,
};

export const BUST_COVERAGE = { min: 0.35, max: 0.85 } as const;
/** Longest side of an object's opaque box as a share of the frame ("about 80 percent"). */
export const OBJECT_EXTENT = { min: 0.5, max: 0.9 } as const;
export const OBJECT_MIN_COVERAGE = 0.1;
/** Objects keep at least this margin on every side. */
export const OBJECT_MARGIN = 0.03;

export async function analyse(buffer: Buffer): Promise<Analysis> {
  const meta = await sharp(buffer).metadata();
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  let opaque = 0;
  let solid = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3] ?? 0;
      if (alpha === 255) solid += 1;
      if (alpha < OPAQUE_ALPHA) continue;
      opaque += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const at = (x: number, y: number): number => data[(y * width + x) * 4 + 3] ?? 0;
  return {
    width,
    height,
    bytes: buffer.length,
    hasAlpha: meta.hasAlpha === true,
    pages: meta.pages ?? 1,
    hasExif: meta.exif !== undefined,
    fullyOpaque: solid === width * height,
    corners: [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)],
    coverage: opaque / (width * height),
    box:
      maxX < 0
        ? { left: 0, top: 0, right: 0, bottom: 0 }
        : {
            left: minX / width,
            top: minY / height,
            right: (maxX + 1) / width,
            bottom: (maxY + 1) / height,
          },
  };
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)} percent`;
}

function isTransparentKind(kind: ArtKind): boolean {
  return kind === "bust" || kind === "item" || kind === "decor";
}

/** Returns one message per violated check for a slot; an empty list means the image passes. */
export function checkSlot(def: ArtSlotDef, found: Analysis, stage: Stage): string[] {
  const problems: string[] = [];
  const target = stage === "runtime" ? def.runtime : null;
  const ratio = (target ?? def.master).width / (target ?? def.master).height;
  if (target && (found.width !== target.width || found.height !== target.height)) {
    problems.push(`size ${found.width}x${found.height} should be ${target.width}x${target.height}`);
  }
  const exact = ratio * found.height;
  if (Math.abs(exact - found.width) > 1e-6 * found.width) {
    problems.push(`aspect ${found.width}x${found.height} is not exactly ${ratio.toFixed(4)}`);
  }
  if (found.pages !== 1) problems.push(`animated (${found.pages} frames)`);
  if (found.hasExif) problems.push("carries EXIF metadata");
  const limit = BYTE_LIMITS[def.kind];
  if (stage === "runtime" && found.bytes > limit) {
    problems.push(`${found.bytes} bytes exceeds the ${limit} byte limit`);
  }
  if (isTransparentKind(def.kind)) {
    problems.push(...checkTransparent(def.kind, found));
  } else if (!found.fullyOpaque) {
    problems.push("must be fully opaque");
  }
  return problems;
}

function checkTransparent(kind: ArtKind, found: Analysis): string[] {
  const problems: string[] = [];
  if (!found.hasAlpha) problems.push("has no alpha channel");
  if (found.corners.some((alpha) => alpha !== 0)) {
    problems.push(`corner pixels are not fully transparent (${found.corners.join(", ")})`);
  }
  const { box } = found;
  if (kind === "bust") {
    if (found.coverage < BUST_COVERAGE.min || found.coverage > BUST_COVERAGE.max) {
      problems.push(
        `opaque coverage ${pct(found.coverage)} outside ${pct(BUST_COVERAGE.min)} to ${pct(BUST_COVERAGE.max)}`,
      );
    }
    return problems;
  }
  const extent = Math.max(box.right - box.left, box.bottom - box.top);
  if (extent < OBJECT_EXTENT.min || extent > OBJECT_EXTENT.max) {
    problems.push(
      `object extent ${pct(extent)} outside ${pct(OBJECT_EXTENT.min)} to ${pct(OBJECT_EXTENT.max)}`,
    );
  }
  if (found.coverage < OBJECT_MIN_COVERAGE) {
    problems.push(`opaque coverage ${pct(found.coverage)} is below ${pct(OBJECT_MIN_COVERAGE)}`);
  }
  const margin = Math.min(box.left, box.top, 1 - box.right, 1 - box.bottom);
  if (margin < OBJECT_MARGIN) {
    problems.push(`object box leaves a ${pct(margin)} margin, needs ${pct(OBJECT_MARGIN)}`);
  }
  return problems;
}

const FACES = ["neutral", "happy", "sad"] as const;

function spread(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values) - Math.min(...values);
}

/** Identity proxy over all busts: shared framing per customer and one shared bottom edge. */
export function checkIdentity(busts: ReadonlyMap<string, Analysis>): string[] {
  const problems: string[] = [];
  for (let regular = 1; regular <= 8; regular += 1) {
    const boxes = FACES.map((face) => busts.get(`customer-${regular}-${face}`)?.box).filter(
      (box): box is Box => box !== undefined,
    );
    for (const edge of ["left", "top", "right", "bottom"] as const) {
      const gap = spread(boxes.map((box) => box[edge]));
      if (gap > IDENTITY_TOLERANCE) {
        problems.push(
          `customer-${regular}: ${edge} edge differs by ${pct(gap)} across expressions`,
        );
      }
    }
  }
  const bottoms = [...busts.values()].map((found) => found.box.bottom);
  const gap = spread(bottoms);
  if (gap > IDENTITY_TOLERANCE) {
    problems.push(`busts: bottom edge differs by ${pct(gap)} across the set`);
  }
  return problems;
}
