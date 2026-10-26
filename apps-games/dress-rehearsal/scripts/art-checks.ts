import { type Category, PIECE_BY_ID } from "@web-games/dress-rehearsal-core";
import sharp from "sharp";
import { runtimeSize, type SlotId, slotDef } from "../src/art/slots";

/** Fraction of the frame a garment's bounding box fills, per category (`assets-index.md`). */
export const SCALE: Readonly<Record<Category, { readonly w: number; readonly h: number }>> = {
  top: { w: 0.8, h: 0.7 },
  bottom: { w: 0.55, h: 0.88 },
  dress: { w: 0.62, h: 0.92 },
  outer: { w: 0.84, h: 0.8 },
  shoes: { w: 0.78, h: 0.62 },
  bag: { w: 0.6, h: 0.62 },
  hat: { w: 0.78, h: 0.62 },
  accessory: { w: 0.52, h: 0.52 },
};

export const SCALE_TOLERANCE = 0.12;
export const SAFE_AREA = 0.85;
export const OPAQUE_ALPHA = 128;
export const CENTRE_TOLERANCE = 0.03;
export const MARGIN_TOLERANCE = 0.01;
export const BORDER_FRACTION = 0.02;
export const MAX_BORDER_ALPHA = 8;
export const CLIENT_COVERAGE = { min: 0.25, max: 0.9 } as const;

export const BYTE_LIMITS = {
  item: 60_000,
  client: 100_000,
  large: 400_000,
  total: 8_000_000,
} as const;

export interface RawImage {
  readonly width: number;
  readonly height: number;
  readonly channels: number;
  readonly data: Buffer;
}

export interface FileFacts {
  readonly bytes: number;
  readonly format: string | undefined;
  readonly pages: number | undefined;
  readonly hasExif: boolean;
  readonly hasAlpha: boolean;
}

export async function decode(input: string | Buffer): Promise<RawImage> {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, channels: info.channels, data };
}

export async function factsOf(input: string | Buffer, bytes: number): Promise<FileFacts> {
  const meta = await sharp(input).metadata();
  return {
    bytes,
    format: meta.format,
    pages: meta.pages,
    hasExif: meta.exif !== undefined,
    hasAlpha: meta.hasAlpha === true,
  };
}

function alphaAt(image: RawImage, x: number, y: number): number {
  if (image.channels < 4) return 255;
  return image.data[(y * image.width + x) * image.channels + 3] ?? 0;
}

export interface Bounds {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly coverage: number;
  readonly borderAlpha: number;
}

export function opaqueBounds(image: RawImage): Bounds {
  const { width, height } = image;
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  let covered = 0;
  let borderAlpha = 0;
  const bx = width * BORDER_FRACTION;
  const by = height * BORDER_FRACTION;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = alphaAt(image, x, y);
      if (alpha >= OPAQUE_ALPHA) {
        covered++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      if ((x < bx || x >= width - bx || y < by || y >= height - by) && alpha > borderAlpha) {
        borderAlpha = alpha;
      }
    }
  }
  return { x0, y0, x1, y1, coverage: covered / (width * height), borderAlpha };
}

function minAlpha(image: RawImage): number {
  let min = 255;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) min = Math.min(min, alphaAt(image, x, y));
  }
  return min;
}

function cornersClear(image: RawImage): boolean {
  const xs = [0, image.width - 1];
  const ys = [0, image.height - 1];
  return xs.every((x) => ys.every((y) => alphaAt(image, x, y) === 0));
}

function checkPiece(slot: SlotId, image: RawImage, bounds: Bounds, out: string[]): void {
  const category = PIECE_BY_ID.get(slot)?.category;
  if (category === undefined) {
    out.push(`${slot}: no closet piece for this item slot`);
    return;
  }
  const scale = SCALE[category];
  const w = (bounds.x1 - bounds.x0 + 1) / image.width;
  const h = (bounds.y1 - bounds.y0 + 1) / image.height;
  if (w > scale.w + SCALE_TOLERANCE || h > scale.h + SCALE_TOLERANCE) {
    out.push(
      `${slot}: ${category} bounding box ${w.toFixed(2)} x ${h.toFixed(2)} exceeds scale ${scale.w} x ${scale.h} by more than ${SCALE_TOLERANCE}`,
    );
  }
  if (w < scale.w - SCALE_TOLERANCE && h < scale.h - SCALE_TOLERANCE) {
    out.push(
      `${slot}: ${category} bounding box ${w.toFixed(2)} x ${h.toFixed(2)} touches neither scale axis ${scale.w} x ${scale.h}`,
    );
  }
  const limitW = Math.max(SAFE_AREA, scale.w + 0.02);
  const limitH = Math.max(SAFE_AREA, scale.h + 0.02);
  const marginW = (1 - limitW) / 2 - MARGIN_TOLERANCE;
  const marginH = (1 - limitH) / 2 - MARGIN_TOLERANCE;
  const left = bounds.x0 / image.width;
  const right = 1 - (bounds.x1 + 1) / image.width;
  const top = bounds.y0 / image.height;
  const bottom = 1 - (bounds.y1 + 1) / image.height;
  if (left < marginW || right < marginW || top < marginH || bottom < marginH) {
    out.push(
      `${slot}: bounding box leaves the safe area (margins ${[left, right, top, bottom].map((n) => n.toFixed(3)).join(", ")})`,
    );
  }
  if (Math.abs((left + (1 - right)) / 2 - 0.5) > CENTRE_TOLERANCE) {
    out.push(`${slot}: bounding box is off centre horizontally`);
  }
  if (Math.abs((top + (1 - bottom)) / 2 - 0.5) > CENTRE_TOLERANCE) {
    out.push(`${slot}: bounding box is off centre vertically`);
  }
}

function checkClient(slot: SlotId, image: RawImage, bounds: Bounds, out: string[]): void {
  if (bounds.coverage < CLIENT_COVERAGE.min || bounds.coverage > CLIENT_COVERAGE.max) {
    out.push(`${slot}: opaque coverage ${bounds.coverage.toFixed(2)} outside 0.25 to 0.90`);
  }
  const left = bounds.x0 / image.width;
  const right = 1 - (bounds.x1 + 1) / image.width;
  if (left < 0.05 || right < 0.05 || Math.abs((left + (1 - right)) / 2 - 0.5) > CENTRE_TOLERANCE) {
    out.push(`${slot}: portrait is not centred inside the safe width`);
  }
  if (bounds.y0 / image.height < 0.04) out.push(`${slot}: portrait touches the top edge`);
}

function byteLimit(slot: SlotId): number {
  const kind = slotDef(slot).kind;
  if (kind === "item") return BYTE_LIMITS.item;
  if (kind === "client") return BYTE_LIMITS.client;
  return BYTE_LIMITS.large;
}

/** Automated stand-in for visual QA on one runtime WebP; returns every violation with the slot id. */
export function checkRuntime(slot: SlotId, image: RawImage, facts: FileFacts): string[] {
  const out: string[] = [];
  const def = slotDef(slot);
  const size = runtimeSize(slot);
  if (size === null) return [`${slot}: store slot has no runtime file`];
  if (image.width !== size.width || image.height !== size.height) {
    out.push(
      `${slot}: size ${image.width} x ${image.height}, expected ${size.width} x ${size.height}`,
    );
  }
  if (facts.format !== "webp") out.push(`${slot}: format ${facts.format}, expected webp`);
  if (facts.pages !== undefined && facts.pages > 1)
    out.push(`${slot}: animated (${facts.pages} frames)`);
  if (facts.hasExif) out.push(`${slot}: carries EXIF metadata`);
  if (facts.bytes > byteLimit(slot)) {
    out.push(`${slot}: ${facts.bytes} bytes exceeds ${byteLimit(slot)}`);
  }
  const transparent = def.kind === "item" || def.kind === "client";
  if (transparent) {
    if (!facts.hasAlpha || image.channels < 4) {
      out.push(`${slot}: missing alpha channel`);
      return out;
    }
    if (!cornersClear(image)) out.push(`${slot}: corner pixels are not fully transparent`);
    const bounds = opaqueBounds(image);
    if (bounds.x1 < 0) {
      out.push(`${slot}: no opaque pixels`);
      return out;
    }
    if (bounds.borderAlpha > MAX_BORDER_ALPHA) {
      out.push(`${slot}: outer 2 percent border has alpha ${bounds.borderAlpha}`);
    }
    if (def.kind === "item") checkPiece(slot, image, bounds, out);
    else checkClient(slot, image, bounds, out);
  } else if (facts.hasAlpha && minAlpha(image) < 255) {
    out.push(`${slot}: expected a fully opaque image`);
  }
  return out;
}
