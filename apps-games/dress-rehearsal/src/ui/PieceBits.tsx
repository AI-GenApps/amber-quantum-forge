import type { Colour, Feature, Piece } from "@web-games/dress-rehearsal-core";
import { Sprite } from "../art/Sprite";
import { pieceSlot } from "../art/slots";
import { t } from "../strings";
import { COLOUR_HEX, COLOUR_NAME } from "../theme/garment";
import { Icon, type IconName } from "./Icon";

export interface PieceArtProps {
  piece: Piece;
  size?: number;
  decorative?: boolean;
  manifest?: readonly import("../art/slots").SlotId[];
}

export function PieceArt({ piece, size = 56, decorative = true, manifest }: PieceArtProps) {
  const slot = pieceSlot(piece.id);
  if (slot === null) return null;
  return (
    <Sprite
      slot={slot}
      size={size}
      label={piece.name}
      decorative={decorative}
      {...(manifest ? { manifest } : {})}
    />
  );
}

export function Swatch({ colour }: { colour: Colour }) {
  return (
    <span class="dr-colour" data-colour={colour}>
      <span class="dr-swatch" style={{ backgroundColor: COLOUR_HEX[colour] }} aria-hidden="true" />
      <span class="dr-colour__name">{COLOUR_NAME[colour]}</span>
    </span>
  );
}

const FEATURE_ICON: Readonly<Record<Feature, IconName>> = {
  waterproof: "waterproof",
  shade: "shade",
  sparkle: "sparkle",
  sturdy: "sturdy",
};

interface TagProps {
  icon: IconName;
  value: string;
  name: string;
}

function Tag({ icon, value, name }: TagProps) {
  return (
    <span class="dr-tag" data-tag={icon}>
      <Icon name={icon} size={16} />
      <span class="dr-tag__value">{value}</span>
      <span class="dr-sr-only">{name}</span>
    </span>
  );
}

/** Tag icons for era, formality, warmth, price and features; each carries text. */
export function Tags({ piece }: { piece: Piece }) {
  return (
    <span class="dr-tags">
      <Tag icon="era" value={piece.era} name={t("tagEra")} />
      <Tag icon="formality" value={String(piece.formality)} name={t("tagFormality")} />
      <Tag icon="warmth" value={String(piece.warmth)} name={t("tagWarmth")} />
      <Tag icon="price" value={`$${piece.price}`} name={t("tagPrice")} />
      {piece.features.map((feature) => (
        <Tag key={feature} icon={FEATURE_ICON[feature]} value={feature} name={t("tagFeature")} />
      ))}
    </span>
  );
}

export function describePiece(piece: Piece): string {
  const features = piece.features.length > 0 ? `, ${piece.features.join(", ")}` : "";
  return t("pieceDescription", {
    name: piece.name,
    colour: COLOUR_NAME[piece.colour].toLowerCase(),
    era: piece.era,
    formality: piece.formality,
    warmth: piece.warmth,
    price: `$${piece.price}`,
    features,
  });
}
