import type { ArtSlot } from "./art-slots";

export interface ArtEntry {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export type ArtManifest = Readonly<Partial<Record<ArtSlot, ArtEntry>>>;

/** Task 06 fills this with the accepted designer images; empty means every slot is a placeholder. */
export const ART_MANIFEST: ArtManifest = {};

export function manifestUrls(manifest: ArtManifest = ART_MANIFEST): string[] {
  return Object.values(manifest).map((entry) => entry.src);
}
