import { MAX_STAMPS } from "@web-games/lost-parcel-desk-core";
import { t } from "../strings";

export interface StampRowProps {
  earned: number;
  total?: number;
  size?: number;
}

export function StampRow({ earned, total = MAX_STAMPS, size = 22 }: StampRowProps) {
  const count = Math.max(0, Math.min(total, Math.floor(earned)));
  return (
    <span class="lp-stamps" role="img" aria-label={t("stampsOf", { earned: count, total })}>
      {Array.from({ length: total }, (_, index) => (
        <svg
          key={index}
          class={index < count ? "lp-stampicon lp-stampicon--on" : "lp-stampicon lp-stampicon--off"}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          aria-hidden="true"
        >
          <path d="M8 3 H16 V10 L20 14 V17 H4 V14 L8 10 Z M3 21 H21" />
        </svg>
      ))}
    </span>
  );
}
