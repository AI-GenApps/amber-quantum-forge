import { ART_SLOTS, type SlotId, slotUrl } from "./slots";

/** Slots that have a runtime file in `public/art/`; `scripts/build-art.ts` writes this list. */
// art-manifest:start
export const ART_MANIFEST: readonly SlotId[] = [
  "key-art",
  "interior-evening",
  "customer-1-neutral",
  "interior-morning",
  "interior-rain",
  "customer-2-neutral",
  "customer-3-neutral",
  "customer-4-neutral",
  "customer-5-neutral",
  "customer-6-neutral",
  "customer-7-neutral",
  "customer-8-neutral",
  "customer-1-happy",
  "customer-1-sad",
  "customer-2-happy",
  "customer-2-sad",
  "customer-3-happy",
  "customer-3-sad",
  "customer-4-happy",
  "customer-4-sad",
  "customer-5-happy",
  "customer-5-sad",
  "customer-6-happy",
  "customer-6-sad",
  "customer-7-happy",
  "customer-7-sad",
  "customer-8-happy",
  "customer-8-sad",
  "drink-1",
  "drink-2",
  "drink-3",
  "drink-4",
  "drink-5",
  "drink-6",
  "pastry-1",
  "pastry-2",
  "pastry-3",
  "pastry-4",
  "pastry-5",
  "book-1",
  "book-2",
  "book-3",
  "book-4",
  "book-5",
  "decor-1",
  "decor-2",
  "decor-3",
  "decor-4",
  "decor-5",
  "decor-6",
  "decor-7",
  "decor-8",
];
// art-manifest:end

export function hasArt(slot: SlotId, manifest: readonly SlotId[] = ART_MANIFEST): boolean {
  return manifest.includes(slot);
}

/** URLs of manifest slots that ship inside the bundle (the icon and feature graphic do not). */
export function artUrls(manifest: readonly SlotId[] = ART_MANIFEST): string[] {
  return ART_SLOTS.filter((slot) => slot.runtime !== null && manifest.includes(slot.id)).map(
    (slot) => slotUrl(slot.id),
  );
}
