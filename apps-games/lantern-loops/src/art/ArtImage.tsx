import { resolveSlot, type SlotId } from "./slots";

export interface ArtImageProps {
  slot: SlotId;
  /** Accessible name; empty for decorative art. */
  alt?: string;
  class?: string;
  /** Overrides the slot's display width in css pixels. */
  size?: number;
}

/** Shows the delivered image of a slot or its code-drawn fallback. Never throws on missing files. */
export function ArtImage({ slot, alt = "", class: className, size }: ArtImageProps) {
  const source = resolveSlot(slot);
  const width = size ?? source.slot.width;
  const height = size ?? source.slot.height;
  const sizing = width > 0 ? { width, height } : {};
  if (source.kind === "file") {
    return (
      <img
        class={className}
        src={source.url}
        alt={alt}
        decoding="async"
        draggable={false}
        {...sizing}
      />
    );
  }
  const Fallback = source.slot.Fallback;
  return (
    <span
      class={className}
      data-art={slot}
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": "true" })}
      style={
        width > 0
          ? { display: "inline-block", width: `${width}px`, height: `${height}px` }
          : undefined
      }
    >
      <Fallback class="ll-art-svg" />
    </span>
  );
}
