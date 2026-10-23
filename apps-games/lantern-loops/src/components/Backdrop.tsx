import type { ChapterId } from "@web-games/lantern-loops-core";
import { ArtImage } from "../art/ArtImage";
import type { SlotId } from "../art/slots";

const SLOT_BY_CHAPTER: Readonly<Record<ChapterId, SlotId>> = {
  harbor: "backdrop-harbor",
  garden: "backdrop-garden",
  bridge: "backdrop-bridge",
  sky: "backdrop-sky",
};

export interface BackdropProps {
  chapter: ChapterId | "key-art";
}

/** Full-screen decorative scene behind a screen. */
export function Backdrop({ chapter }: BackdropProps) {
  const slot: SlotId = chapter === "key-art" ? "key-art" : SLOT_BY_CHAPTER[chapter];
  return (
    <div class="ll-backdrop" aria-hidden="true">
      <ArtImage slot={slot} class="ll-backdrop-art" />
    </div>
  );
}
