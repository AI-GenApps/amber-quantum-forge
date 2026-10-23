export type ArtSlotId =
  | "icon"
  | "key-art"
  | "lantern-amber"
  | "lantern-rose"
  | "lantern-jade"
  | "lantern-azure"
  | "lantern-violet"
  | "lantern-unlit"
  | "backdrop-harbor"
  | "backdrop-garden"
  | "backdrop-bridge"
  | "backdrop-sky"
  | "daily-medallion"
  | "empty-archive"
  | "feature-graphic";

export interface ArtSpec {
  id: ArtSlotId;
  /** Pixel size of the delivered master (the generation size). */
  masterWidth: number;
  masterHeight: number;
  /** Shipped size in the web bundle (2x display size); null when the slot is never bundled. */
  shipped: { width: number; height: number } | null;
  transparent: boolean;
  /** Byte limit per shipped file; 0 when the slot is not bundled. */
  maxShippedBytes: number;
}

const lantern = (id: ArtSlotId): ArtSpec => ({
  id,
  masterWidth: 1024,
  masterHeight: 1024,
  shipped: { width: 112, height: 112 },
  transparent: true,
  maxShippedBytes: 40 * 1024,
});

const portrait = (id: ArtSlotId): ArtSpec => ({
  id,
  masterWidth: 1024,
  masterHeight: 1536,
  shipped: { width: 800, height: 1200 },
  transparent: false,
  maxShippedBytes: 400 * 1024,
});

const spot = (id: ArtSlotId, size: number): ArtSpec => ({
  id,
  masterWidth: 1024,
  masterHeight: 1024,
  shipped: { width: size, height: size },
  transparent: true,
  maxShippedBytes: 120 * 1024,
});

export const ART_SPECS: readonly ArtSpec[] = [
  {
    id: "icon",
    masterWidth: 1024,
    masterHeight: 1024,
    shipped: null,
    transparent: false,
    maxShippedBytes: 0,
  },
  portrait("key-art"),
  lantern("lantern-amber"),
  lantern("lantern-rose"),
  lantern("lantern-jade"),
  lantern("lantern-azure"),
  lantern("lantern-violet"),
  lantern("lantern-unlit"),
  portrait("backdrop-harbor"),
  portrait("backdrop-garden"),
  portrait("backdrop-bridge"),
  portrait("backdrop-sky"),
  spot("daily-medallion", 240),
  spot("empty-archive", 320),
  {
    id: "feature-graphic",
    masterWidth: 1500,
    masterHeight: 1000,
    shipped: null,
    transparent: false,
    maxShippedBytes: 0,
  },
];

export const TOTAL_SHIPPED_ART_BYTES = 8_000_000;

export function specOf(id: string): ArtSpec | undefined {
  return ART_SPECS.find((spec) => spec.id === id);
}

/**
 * Mean Sobel gradient magnitude (0 to 1) of the central 60% of an 8-bit grey image.
 * Informational: a low value means a calm centre for the board.
 */
export function centreEdgeDensity(grey: Uint8Array, width: number, height: number): number {
  const x0 = Math.floor(width * 0.2);
  const x1 = Math.ceil(width * 0.8);
  const y0 = Math.floor(height * 0.2);
  const y1 = Math.ceil(height * 0.8);
  const at = (x: number, y: number): number => grey[y * width + x] ?? 0;
  let sum = 0;
  let count = 0;
  for (let y = Math.max(1, y0); y < Math.min(height - 1, y1); y++) {
    for (let x = Math.max(1, x0); x < Math.min(width - 1, x1); x++) {
      const gx =
        at(x + 1, y - 1) +
        2 * at(x + 1, y) +
        at(x + 1, y + 1) -
        (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const gy =
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1) -
        (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      sum += Math.hypot(gx, gy);
      count++;
    }
  }
  return count === 0 ? 0 : sum / count / (255 * Math.hypot(4, 4));
}
