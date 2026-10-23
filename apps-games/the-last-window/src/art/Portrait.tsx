import type { Face } from "@web-games/the-last-window-core";
import { useManifest } from "./context";
import { FallbackArt } from "./fallbacks";
import { hasArt } from "./manifest";
import { bustSlot, slotUrl } from "./slots";

export interface PortraitProps {
  /** `customer-1` to `customer-8`, or a walk-in id such as `walkin-umbrella`. */
  slot: string;
  mood?: Face;
  label?: string;
  class?: string;
}

/** Customer bust: the runtime image when the manifest lists it, the code-drawn bust otherwise. */
export function Portrait({ slot, mood = "neutral", label, class: className }: PortraitProps) {
  const manifest = useManifest();
  const full = slot.startsWith("customer-") ? bustSlot(slot, mood) : slot;
  const cls = `tlw-portrait ${className ?? ""}`.trim();
  if (hasArt(full, manifest)) {
    return (
      <img
        class={cls}
        src={slotUrl(full)}
        alt={label ?? ""}
        width={480}
        height={640}
        data-slot={full}
        data-art="image"
        draggable={false}
      />
    );
  }
  return <FallbackArt slot={full} face={mood} {...(label ? { label } : {})} class={cls} />;
}
