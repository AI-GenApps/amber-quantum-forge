import { ART_SLOTS, type SlotId, slotUrl } from "./slots";

/** Slots that have a runtime file in `public/art/`. Task 06 adds an entry per accepted image. */
export const ART_MANIFEST: readonly SlotId[] = [];

export function hasArt(slot: SlotId, manifest: readonly SlotId[] = ART_MANIFEST): boolean {
  return manifest.includes(slot);
}

/** URLs of manifest slots that ship inside the bundle (the icon and feature graphic do not). */
export function artUrls(manifest: readonly SlotId[] = ART_MANIFEST): string[] {
  return ART_SLOTS.filter((slot) => slot.runtime !== null && manifest.includes(slot.id)).map(
    (slot) => slotUrl(slot.id),
  );
}
