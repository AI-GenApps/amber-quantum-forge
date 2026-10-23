import type { Face } from "@web-games/the-last-window-core";
import type { VNode } from "preact";
import { ART_SLOT_IDS, isSlotId, slotKind } from "../slots";
import { FeatureGraphic, IconBadge, KeyArt } from "./badge";
import { RegularBust } from "./bust";
import { Decor } from "./decor";
import { Interior } from "./interior";
import { Book, Drink, Pastry } from "./items";
import { isWalkinId, WalkinBust } from "./walkins";

export { FALLBACK_COLORS } from "./colors";
export { Interior } from "./interior";

const BUST = /^customer-(\d)-(neutral|happy|sad)$/;

export function viewBoxFor(slot: string): string {
  const kind = slotKind(slot);
  if (isWalkinId(slot)) return "0 0 300 400";
  switch (kind) {
    case "bust":
      return "0 0 300 400";
    case "interior":
    case "key-art":
      return "0 0 400 600";
    case "feature":
      return "0 0 600 400";
    default:
      return "0 0 100 100";
  }
}

export function fallbackShape(slot: string, face: Face = "neutral"): VNode | null {
  if (isWalkinId(slot)) return <WalkinBust id={slot} face={face} />;
  const match = BUST.exec(slot);
  if (match) return <RegularBust regularId={Number(match[1])} face={match[2] as Face} />;
  if (slot === "icon") return <IconBadge />;
  if (slot === "key-art") return <KeyArt />;
  if (slot === "feature-graphic") return <FeatureGraphic />;
  if (slot.startsWith("interior-")) {
    const weather = slot.slice("interior-".length);
    if (weather === "morning" || weather === "evening" || weather === "rain") {
      return <Interior weather={weather} />;
    }
    return null;
  }
  if (slot.startsWith("drink-")) return <Drink id={slot} />;
  if (slot.startsWith("pastry-")) return <Pastry id={slot} />;
  if (slot.startsWith("book-")) return <Book id={slot} />;
  if (slot.startsWith("decor-")) return <Decor id={slot} />;
  return null;
}

export interface FallbackArtProps {
  slot: string;
  face?: Face;
  label?: string;
  class?: string;
}

/** The code-drawn picture for a slot id (any of the 54 art slots or a walk-in id). */
export function FallbackArt({ slot, face = "neutral", label, class: className }: FallbackArtProps) {
  const known = isSlotId(slot) || isWalkinId(slot);
  const kind = slotKind(slot);
  const fill = kind === "interior" || kind === "key-art";
  return (
    <svg
      class={className}
      viewBox={viewBoxFor(slot)}
      preserveAspectRatio={fill ? "xMidYMid slice" : "xMidYMid meet"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      data-slot={slot}
      data-art="fallback"
      data-known={known ? "true" : "false"}
      focusable="false"
    >
      {fallbackShape(slot, face)}
    </svg>
  );
}

export function allFallbackSlots(): string[] {
  return [...ART_SLOT_IDS];
}
