import { useManifest } from "./context";
import { FallbackArt } from "./fallbacks";
import { hasArt } from "./manifest";
import { slotUrl } from "./slots";

export interface ItemIconProps {
  /** `drink-1`, `pastry-3`, `book-2`, `decor-4`, ... */
  slot: string;
  label?: string;
  class?: string;
}

export function ItemIcon({ slot, label, class: className }: ItemIconProps) {
  const manifest = useManifest();
  const cls = `tlw-icon ${className ?? ""}`.trim();
  if (hasArt(slot, manifest)) {
    return (
      <img
        class={cls}
        src={slotUrl(slot)}
        alt={label ?? ""}
        width={192}
        height={192}
        data-slot={slot}
        data-art="image"
        draggable={false}
      />
    );
  }
  return <FallbackArt slot={slot} {...(label ? { label } : {})} class={cls} />;
}
