import type { SceneryRegion } from "../board/model";
import { PALETTE } from "../theme/tokens";
import { FALLBACKS } from "./fallbacks";
import { ART_MANIFEST, hasArt } from "./manifest";
import { DEFAULT_ROLE_COLORS } from "./Sprite";
import { type SlotId, slotUrl } from "./slots";

/** Share of the screen colour laid over the backdrop so text keeps its contrast. */
export const BACKDROP_SCRIM = 0.72 as const;

const REGION_BACKDROP: Readonly<Record<SceneryRegion, SlotId>> = {
  valley: "backdrop-valley",
  delta: "backdrop-delta",
  highland: "backdrop-highland",
  estuary: "backdrop-estuary",
  daily: "backdrop-valley",
};

export function backdropSlot(region: SceneryRegion): SlotId {
  return REGION_BACKDROP[region];
}

export interface BackdropProps {
  region: SceneryRegion;
  /** The colour the theme gives the screen; it becomes the scrim. */
  scrim?: string;
  manifest?: readonly SlotId[];
  /** High contrast hides the art behind a fully opaque scrim. */
  plain?: boolean;
}

/** Region art behind a screen, or the flat palette gradient when the slot has no art. */
export function Backdrop({
  region,
  scrim = PALETTE.night,
  manifest = ART_MANIFEST,
  plain = false,
}: BackdropProps) {
  const slot = backdropSlot(region);
  const art = hasArt(slot, manifest);
  const gradient = FALLBACKS[slot].gradient ?? (["night", "night"] as const);
  const style = art
    ? { backgroundImage: `url(${slotUrl(slot)})` }
    : {
        background: `linear-gradient(${DEFAULT_ROLE_COLORS[gradient[0]]}, ${DEFAULT_ROLE_COLORS[gradient[1]]})`,
      };
  return (
    <div
      class="fd-backdrop"
      aria-hidden="true"
      data-slot={slot}
      data-art={art ? "image" : "fallback"}
      style={style}
    >
      <div
        class="fd-backdrop__scrim"
        style={{ background: scrim, opacity: plain ? 1 : BACKDROP_SCRIM }}
      />
    </div>
  );
}
