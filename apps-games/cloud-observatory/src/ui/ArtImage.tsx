import { useState } from "preact/hooks";
import { ART_MANIFEST, type ArtManifest, CRITICAL_SLOTS } from "./art-manifest";
import { type ArtSlot, slotSpec } from "./art-slots";
import { cx } from "./cx";
import { placeholderFor } from "./placeholders";

export interface ArtImageProps {
  slot: ArtSlot;
  class?: string;
  /** Test seam; the app always uses the shipped manifest. */
  manifest?: ArtManifest;
  /** Overrides the slot's default description and makes the image informative. */
  alt?: string;
}

/**
 * One named art slot. Draws the accepted image from the manifest when there is one, and a
 * code-drawn placeholder otherwise (or when the file fails to load), so nothing ever looks broken.
 * The image is sized to the slot's display size (the file is 2x) and painted on its mean colour
 * while it decodes, so a slow disk never shows a blank box.
 */
export function ArtImage({ slot, class: className, manifest = ART_MANIFEST, alt }: ArtImageProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const spec = slotSpec(slot);
  const entry = manifest[slot];
  const decorative = spec.decorative && alt === undefined;
  const description = alt ?? spec.label;
  const classes = cx("co-art", `co-art--${slot}`, className);

  if (entry && failed !== entry.src) {
    return (
      <img
        class={classes}
        src={entry.src}
        width={spec.width}
        height={spec.height}
        decoding="async"
        loading={CRITICAL_SLOTS.includes(slot) ? "eager" : "lazy"}
        style={
          entry.background === "transparent" ? undefined : { backgroundColor: entry.background }
        }
        alt={decorative ? "" : description}
        aria-hidden={decorative ? "true" : undefined}
        data-art-slot={slot}
        data-art="image"
        onError={() => setFailed(entry.src)}
      />
    );
  }

  const drawing = placeholderFor(slot);
  return (
    <svg
      class={cx(classes, "co-art--placeholder")}
      viewBox={drawing.viewBox}
      preserveAspectRatio={drawing.aspect}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : description}
      aria-hidden={decorative ? "true" : undefined}
      data-art-slot={slot}
      data-art="placeholder"
    >
      {drawing.body}
    </svg>
  );
}
