import { fallbackFor, GrainDefs } from "./fallbacks";
import { ART_MANIFEST, hasArt } from "./manifest";
import { type SlotId, slotUrl } from "./slots";

export interface SpriteProps {
  slot: SlotId;
  /** Display width in CSS px; the height follows the slot's aspect ratio. */
  size?: number;
  label?: string;
  manifest?: readonly SlotId[];
  class?: string;
}

/** Renders the designer image when the manifest lists the slot, otherwise the code-drawn fallback. */
export function Sprite({
  slot,
  size = 64,
  label,
  manifest = ART_MANIFEST,
  class: className,
}: SpriteProps) {
  const fallback = fallbackFor(slot);
  const name = label ?? fallback.label;
  const height = Math.round((size * fallback.height) / fallback.width);
  const cls = className ? `lp-sprite ${className}` : "lp-sprite";
  if (hasArt(slot, manifest)) {
    return (
      <img
        class={cls}
        data-slot={slot}
        data-art="image"
        src={slotUrl(slot)}
        width={size}
        height={height}
        alt={name}
      />
    );
  }
  return (
    <svg
      class={cls}
      data-slot={slot}
      data-art="fallback"
      viewBox={`0 0 ${fallback.width} ${fallback.height}`}
      width={size}
      height={height}
      role="img"
      aria-label={name}
    >
      <GrainDefs />
      {fallback.nodes}
    </svg>
  );
}
