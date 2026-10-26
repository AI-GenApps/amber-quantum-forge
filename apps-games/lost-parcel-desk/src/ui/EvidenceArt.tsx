import type { EvidenceObject } from "@web-games/lost-parcel-desk-core";
import { Sprite } from "../art/Sprite";
import { visualOf } from "../lib/board";
import { useArtManifest } from "../state/app";
import { Glyph } from "./Glyph";

export interface EvidenceArtProps {
  object: EvidenceObject;
  size?: number;
}

/** The object's designer image when it exists, otherwise its code-drawn glyph. */
export function EvidenceArt({ object, size = 96 }: EvidenceArtProps) {
  const manifest = useArtManifest();
  const { glyph, slot } = visualOf(object);
  if (slot !== null) {
    return (
      <Sprite slot={slot} size={size} label={object.name} {...(manifest ? { manifest } : {})} />
    );
  }
  return <Glyph kind={glyph} size={size} label={object.name} />;
}
