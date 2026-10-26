import { ART_MANIFEST, hasArt } from "./manifest";
import { type SlotId, slotUrl } from "./slots";

/** Share of the desk colour laid over the image so text keeps its contrast. */
export const BACKDROP_SCRIM = 0.85 as const;

export type BackdropSlot = "desk-backdrop" | "key-art";

export interface BackdropProps {
  slot: BackdropSlot;
  manifest?: readonly SlotId[];
  /** High contrast hides the art behind a fully opaque scrim. */
  plain?: boolean;
}

/** Full-bleed scene art behind a screen. Without art it is empty and the screen colour shows, so the layout never moves. */
export function Backdrop({ slot, manifest = ART_MANIFEST, plain = false }: BackdropProps) {
  const art = hasArt(slot, manifest);
  return (
    <div
      class="lp-backdrop"
      aria-hidden="true"
      data-slot={slot}
      data-art={art ? "image" : "fallback"}
      style={art ? { backgroundImage: `url(${slotUrl(slot)})` } : undefined}
    >
      {art ? (
        <div class="lp-backdrop__scrim" style={{ opacity: plain ? 1 : BACKDROP_SCRIM }} />
      ) : null}
    </div>
  );
}

const ROUTE_BACKDROP: Readonly<Record<string, BackdropSlot>> = {
  boot: "key-art",
  home: "key-art",
  table: "desk-backdrop",
  viewer: "desk-backdrop",
  board: "desk-backdrop",
};

/** Which scene sits behind a route; routes not listed have none. */
export function backdropFor(route: string): BackdropSlot | null {
  return ROUTE_BACKDROP[route] ?? null;
}
