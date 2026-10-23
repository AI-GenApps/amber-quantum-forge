import sharp from "sharp";
import { runtimeSize, type SlotId, slotDef } from "../src/art/slots";

export type ImageRole = "runtime" | "master";

export interface ImageStats {
  format: string | undefined;
  width: number;
  height: number;
  hasAlpha: boolean;
  pages: number;
  hasExif: boolean;
  /** Alpha of the four corner pixels. */
  corners: readonly number[];
  /** Largest alpha inside the outer border band (3 percent of each side). */
  borderMaxAlpha: number;
  minAlpha: number;
  /** Fraction of pixels with alpha of at least 128. */
  coverage: number;
  /** Bounding box of pixels with alpha of at least VISIBLE_ALPHA, as fractions of the frame. */
  bbox: { width: number; height: number } | null;
}

export const SPRITE_MAX_BYTES = 250_000 as const;
export const PORTRAIT_MAX_BYTES = 400_000 as const;
export const TOTAL_RUNTIME_BYTES = 8_000_000 as const;
export const COVERAGE_MIN = 0.25 as const;
export const COVERAGE_MAX = 0.9 as const;
export const SAFE_AREA = 0.85 as const;
export const BORDER_BAND = 0.03 as const;
/** Faint resampling fringe below this alpha does not count towards the bounding box. */
export const VISIBLE_ALPHA = 16 as const;

/** Narrow or low silhouettes cannot reach a quarter of the frame; each override has a stated reason. */
export const COVERAGE_MIN_OVERRIDES: Readonly<
  Partial<Record<SlotId, { min: number; why: string }>>
> = {
  "tree-poplar": {
    min: 0.1,
    why: "tall narrow flame silhouette: bbox is about 31 percent of the frame wide",
  },
  "sandbag-barrier": {
    min: 0.24,
    why: "lowest sprite: bbox is about 46 percent of the frame tall",
  },
};

export function maxBytesFor(slot: SlotId): number | null {
  const kind = slotDef(slot).kind;
  if (kind === "sprite") return SPRITE_MAX_BYTES;
  if (kind === "portrait") return PORTRAIT_MAX_BYTES;
  return null;
}

export async function analyze(input: Buffer | string): Promise<ImageStats> {
  const image = sharp(input, { animated: true });
  const meta = await image.metadata();
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const band = Math.ceil(Math.min(width, height) * BORDER_BAND);
  let minAlpha = 255;
  let borderMaxAlpha = 0;
  let solid = 0;
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3] as number;
      if (alpha < minAlpha) minAlpha = alpha;
      if (alpha >= 128) solid++;
      if (alpha >= VISIBLE_ALPHA) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const inBand = x < band || y < band || x >= width - band || y >= height - band;
      if (inBand && alpha > borderMaxAlpha) borderMaxAlpha = alpha;
    }
  }
  const at = (x: number, y: number): number => data[(y * width + x) * 4 + 3] as number;
  return {
    format: meta.format,
    width,
    height,
    hasAlpha: meta.hasAlpha === true,
    pages: meta.pages ?? 1,
    hasExif: meta.exif !== undefined,
    corners: [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)],
    borderMaxAlpha,
    minAlpha,
    coverage: solid / (width * height),
    bbox:
      maxX < 0 ? null : { width: (maxX - minX + 1) / width, height: (maxY - minY + 1) / height },
  };
}

function aspectOf(kind: ReturnType<typeof slotDef>["kind"]): [number, number] {
  if (kind === "portrait") return [2, 3];
  if (kind === "landscape") return [3, 2];
  return [1, 1];
}

/** Every rule from task 06; an empty list means the image passes. Messages start with the slot id. */
export function violationsFor(
  slot: SlotId,
  stats: ImageStats,
  bytes: number,
  role: ImageRole,
): string[] {
  const def = slotDef(slot);
  const out: string[] = [];
  const fail = (message: string): void => {
    out.push(`${slot} (${role}): ${message}`);
  };
  if (stats.format !== "webp") fail(`format is ${stats.format}, expected webp`);
  if (stats.pages > 1) fail(`animated (${stats.pages} frames)`);
  if (stats.hasExif) fail("carries EXIF metadata");
  const [aw, ah] = aspectOf(def.kind);
  if (stats.width * ah !== stats.height * aw) {
    fail(`aspect ${stats.width}x${stats.height} is not ${aw}:${ah}`);
  }
  const size = runtimeSize(slot);
  if (role === "runtime") {
    if (!size) fail("store-only slot must not ship in the bundle");
    else if (stats.width !== size.width || stats.height !== size.height) {
      fail(`size ${stats.width}x${stats.height}, expected ${size.width}x${size.height}`);
    }
    const limit = maxBytesFor(slot);
    if (limit !== null && bytes > limit) fail(`${bytes} bytes exceeds ${limit}`);
  } else if (stats.width < (size?.width ?? 512) || stats.height < (size?.height ?? 512)) {
    fail(`master ${stats.width}x${stats.height} is smaller than the runtime size`);
  }
  if (def.kind === "sprite") {
    if (!stats.hasAlpha) fail("sprite has no alpha channel");
    if (stats.corners.some((alpha) => alpha !== 0)) fail(`corner alpha ${stats.corners.join(",")}`);
    if (stats.borderMaxAlpha !== 0)
      fail(`outer 3 percent border has alpha ${stats.borderMaxAlpha}`);
    const min = COVERAGE_MIN_OVERRIDES[slot]?.min ?? COVERAGE_MIN;
    if (stats.coverage < min || stats.coverage > COVERAGE_MAX) {
      fail(
        `opaque coverage ${(stats.coverage * 100).toFixed(1)}% outside ${min * 100}-${COVERAGE_MAX * 100}%`,
      );
    }
    if (!stats.bbox) fail("fully transparent");
    else if (stats.bbox.width > SAFE_AREA || stats.bbox.height > SAFE_AREA) {
      fail(
        `bounding box ${(stats.bbox.width * 100).toFixed(1)}x${(stats.bbox.height * 100).toFixed(1)}% exceeds the ${SAFE_AREA * 100}% safe area`,
      );
    }
  } else if (stats.minAlpha !== 255) {
    fail(`opaque slot has alpha as low as ${stats.minAlpha}`);
  }
  return out;
}
