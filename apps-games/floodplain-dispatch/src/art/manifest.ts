import { SLOTS, type SlotId, slotUrl } from "./slots";

/** Slots that have a runtime file in `public/art/`. Task 06 adds entries here, nothing else. */
export const ART_MANIFEST: readonly SlotId[] = [];

export function hasArt(slot: SlotId, manifest: readonly SlotId[] = ART_MANIFEST): boolean {
  return manifest.includes(slot);
}

export function artUrls(manifest: readonly SlotId[] = ART_MANIFEST): string[] {
  return SLOTS.filter((slot) => slot.inBundle && manifest.includes(slot.id)).map((slot) =>
    slotUrl(slot.id),
  );
}
