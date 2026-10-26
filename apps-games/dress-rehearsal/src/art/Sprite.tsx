import { PIECE_BY_ID } from "@web-games/dress-rehearsal-core";
import { useContext } from "preact/hooks";
import { AppContext } from "../state/app";
import { Fallback, RATIO } from "./fallbacks";
import { ART_MANIFEST, hasArt } from "./manifest";
import { type SlotId, slotDef, slotUrl } from "./slots";

export interface SpriteProps {
  slot: SlotId;
  size?: number;
  label?: string;
  /** Hides the art from assistive technology when the surrounding control already names it. */
  decorative?: boolean;
  manifest?: readonly SlotId[];
  class?: string;
}

export function defaultLabel(slot: SlotId): string {
  const piece = PIECE_BY_ID.get(slot);
  if (piece) return piece.name;
  const client = /^client-(\d)$/.exec(slot);
  if (client) return "Client portrait";
  if (slot.startsWith("backdrop-")) return "Board backdrop";
  if (slot === "icon") return "Dress Rehearsal icon";
  if (slot === "key-art") return "Dress Rehearsal key art";
  return "Dress Rehearsal feature graphic";
}

/**
 * Renders designer art when the manifest lists the slot, otherwise the code-drawn fallback. The
 * manifest is the prop, else the app context list, else the shipped manifest.
 */
export function Sprite({
  slot,
  size = 48,
  label,
  decorative = false,
  manifest,
  class: className,
}: SpriteProps) {
  const name = label ?? defaultLabel(slot);
  const app = useContext(AppContext);
  const listed = manifest ?? app?.artManifest ?? ART_MANIFEST;
  if (hasArt(slot, listed)) {
    return (
      <img
        class={className}
        data-art-slot={slot}
        data-art="image"
        src={slotUrl(slot)}
        width={size}
        height={Math.round(size * RATIO[slotDef(slot).kind])}
        alt={decorative ? "" : name}
        {...(decorative ? { "aria-hidden": "true" as const } : {})}
      />
    );
  }
  return (
    <Fallback slot={slot} size={size} label={name} decorative={decorative} className={className} />
  );
}
