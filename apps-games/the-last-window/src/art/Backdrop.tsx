import type { DecorId, Weather } from "@web-games/the-last-window-core";
import { useManifest } from "./context";
import { FallbackArt } from "./fallbacks";
import { ItemIcon } from "./ItemIcon";
import { hasArt } from "./manifest";
import { interiorSlot, slotUrl } from "./slots";

/** Fixed spot of each decor item as left, top and width in percent of the interior. */
export const DECOR_SPOTS: Readonly<Record<DecorId, readonly [number, number, number]>> = {
  "decor-1": [2, 36, 22],
  "decor-2": [74, 72, 16],
  "decor-3": [24, 74, 14],
  "decor-4": [40, 70, 20],
  "decor-5": [1, 50, 18],
  "decor-6": [80, 12, 16],
  "decor-7": [4, 6, 14],
  "decor-8": [76, 68, 20],
};

export interface BackdropProps {
  /** `interior-morning`, `interior-evening`, `interior-rain` or `key-art`. */
  slot: string;
  owned?: readonly DecorId[];
  class?: string;
}

export function weatherBackdrop(weather: Weather): string {
  return interiorSlot(weather);
}

/** Full-bleed art behind a screen: the image when listed in the manifest, else the code-drawn scene. */
export function Backdrop({ slot, owned = [], class: className }: BackdropProps) {
  const manifest = useManifest();
  const art = hasArt(slot, manifest);
  return (
    <div
      class={`tlw-backdrop ${className ?? ""}`.trim()}
      aria-hidden="true"
      data-slot={slot}
      data-art={art ? "image" : "fallback"}
    >
      {art ? (
        <img class="tlw-backdrop__img" src={slotUrl(slot)} alt="" draggable={false} />
      ) : (
        <FallbackArt slot={slot} class="tlw-backdrop__img" />
      )}
      {owned.map((id) => {
        const spot = DECOR_SPOTS[id];
        return (
          <span
            key={id}
            class="tlw-decor"
            data-decor={id}
            style={{ left: `${spot[0]}%`, top: `${spot[1]}%`, width: `${spot[2]}%` }}
          >
            <ItemIcon slot={id} />
          </span>
        );
      })}
    </div>
  );
}
