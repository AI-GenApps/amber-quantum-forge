import sharp from "sharp";
import { hasAlphaSlot, runtimeSize, type SlotId, slotAspect, slotDef } from "../src/art/slots";

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
export const SCENE_MAX_BYTES = 400_000 as const;
export const TOTAL_RUNTIME_BYTES = 8_000_000 as const;
export const COVERAGE_MIN = 0.25 as const;
export const COVERAGE_MAX = 0.9 as const;
export const SAFE_AREA = 0.9 as const;
export const BORDER_BAND = 0.03 as const;
/** Faint resampling fringe below this alpha does not count towards the bounding box. */
export const VISIBLE_ALPHA = 16 as const;

export interface CoverageOverride {
  min: number;
  why: string;
}

export interface SafeAreaOverride {
  max: number;
  why: string;
}

const THIN = "thin or small silhouette by design (the designer review accepted the object)";

/** Slim objects cannot reach a quarter of the frame; each override names the measured master coverage. */
export const COVERAGE_MIN_OVERRIDES: Readonly<Partial<Record<SlotId, CoverageOverride>>> = {
  "evidence-01-2": { min: 0.1, why: `scarf, 23.7 percent: ${THIN}` },
  "evidence-02-4": {
    min: 0.1,
    why: `bookmark, 18.6 percent, bounding box 51 percent wide: ${THIN}`,
  },
  "evidence-04-2": {
    min: 0.1,
    why: `signal lamp, 16.8 percent, bounding box 50 percent wide: ${THIN}`,
  },
  "evidence-06-3": {
    min: 0.1,
    why: `waxed paper twist, 16.3 percent, bounding box 34 percent tall: ${THIN}`,
  },
  "evidence-07-1": { min: 0.1, why: `tuning fork, 13.2 percent: two thin tines, ${THIN}` },
  "evidence-07-4": { min: 0.1, why: `pencil stub, 19.9 percent: ${THIN}` },
  "evidence-09-1": { min: 0.1, why: `matchbox of domes, 23.3 percent: ${THIN}` },
  "evidence-09-3": { min: 0.1, why: `door key, 18.4 percent: ${THIN}` },
  "evidence-10-1": {
    min: 0.1,
    why: `boxwood horse's head, 25.0 percent before resampling: ${THIN}`,
  },
  "evidence-12-5": { min: 0.1, why: `desk key, 20.4 percent: ${THIN}` },
};

/** The two tall cast members keep the crown at 3.9 percent of the frame by the art bible. */
export const SAFE_AREA_OVERRIDES: Readonly<Partial<Record<SlotId, SafeAreaOverride>>> = {
  "townsfolk-7": {
    max: 0.91,
    why: "tall: long neck and head high in the frame (art bible), 90.1 percent tall",
  },
  "townsfolk-12": {
    max: 0.91,
    why: "tall: long neck and head high in the frame (art bible), 90.1 percent tall",
  },
};

export function maxBytesFor(slot: SlotId): number | null {
  if (!slotDef(slot)?.inBundle) return null;
  return hasAlphaSlot(slot) ? SPRITE_MAX_BYTES : SCENE_MAX_BYTES;
}

export async function analyze(input: Buffer | string): Promise<ImageStats> {
  const meta = await sharp(input, { animated: true }).metadata();
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

function percent(value: number): string {
  return (value * 100).toFixed(1);
}

function spriteViolations(slot: SlotId, stats: ImageStats, fail: (message: string) => void): void {
  if (!stats.hasAlpha) fail("has no alpha channel");
  if (stats.corners.some((alpha) => alpha !== 0)) fail(`corner alpha ${stats.corners.join(",")}`);
  if (stats.borderMaxAlpha !== 0) fail(`outer 3 percent border has alpha ${stats.borderMaxAlpha}`);
  const min = COVERAGE_MIN_OVERRIDES[slot]?.min ?? COVERAGE_MIN;
  if (stats.coverage < min || stats.coverage > COVERAGE_MAX) {
    fail(
      `opaque coverage ${percent(stats.coverage)}% outside ${percent(min)}-${COVERAGE_MAX * 100}%`,
    );
  }
  const safe = SAFE_AREA_OVERRIDES[slot]?.max ?? SAFE_AREA;
  if (!stats.bbox) fail("fully transparent");
  else if (stats.bbox.width > safe || stats.bbox.height > safe) {
    fail(
      `bounding box ${percent(stats.bbox.width)}x${percent(stats.bbox.height)}% exceeds the ${percent(safe)}% safe area`,
    );
  }
}

/** Every rule from task 06; an empty list means the image passes. Messages start with the slot id. */
export function violationsFor(
  slot: SlotId,
  stats: ImageStats,
  bytes: number,
  role: ImageRole,
): string[] {
  const out: string[] = [];
  const fail = (message: string): void => {
    out.push(`${slot} (${role}): ${message}`);
  };
  if (stats.format !== "webp") fail(`format is ${stats.format}, expected webp`);
  if (stats.pages > 1) fail(`animated (${stats.pages} frames)`);
  if (stats.hasExif) fail("carries EXIF metadata");
  const [aw, ah] = slotAspect(slot);
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
  } else if (size && (stats.width < size.width || stats.height < size.height)) {
    fail(`master ${stats.width}x${stats.height} is smaller than the runtime size`);
  }
  if (hasAlphaSlot(slot)) spriteViolations(slot, stats, fail);
  else if (stats.minAlpha !== 255) fail(`opaque slot has alpha as low as ${stats.minAlpha}`);
  return out;
}

export type VerdictSource = "review-note" | "orchestrator-accepted-list";

export interface Verdict {
  slot: SlotId;
  verdict: "accepted" | "rejected";
  batch: string;
  round: number;
  review: string;
  evidence: string;
  /** Line (or line start) quoted from the copied review note. */
  match: string;
  /** Heading that the quoted line must sit under. */
  section?: string;
  source: VerdictSource;
  noText?: "slot" | "batch" | "none";
  reason?: string;
}

/** True when the quoted line exists in the copied review note, under its section when one is given. */
export function noteHoldsVerdict(note: string, verdict: Verdict): boolean {
  if (verdict.source === "orchestrator-accepted-list") return true;
  const lines = note.split("\n");
  let from = 0;
  let to = lines.length;
  if (verdict.section) {
    const head = lines.findIndex((line) => line.startsWith(verdict.section as string));
    if (head < 0) return false;
    from = head + 1;
    const next = lines.findIndex((line, i) => i > head && line.startsWith("#"));
    if (next >= 0) to = next;
  }
  return lines.slice(from, to).some((line) => line.startsWith(verdict.match));
}
