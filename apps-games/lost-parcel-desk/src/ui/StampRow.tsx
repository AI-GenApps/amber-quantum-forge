import { MAX_STAMPS } from "@web-games/lost-parcel-desk-core";
import { useEffect, useRef } from "preact/hooks";
import { useMotion } from "../motion/useMotion";
import { t } from "../strings";

export interface StampRowProps {
  earned: number;
  total?: number;
  size?: number;
  /** Earned stamps appear one after another, 140 ms apart. */
  reveal?: boolean;
}

export function StampRow({ earned, total = MAX_STAMPS, size = 22, reveal = false }: StampRowProps) {
  const count = Math.max(0, Math.min(total, Math.floor(earned)));
  const motion = useMotion();
  const row = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!reveal || !row.current) return;
    const icons = Array.from(row.current.querySelectorAll<SVGElement>(".lp-stampicon--on"));
    void motion.stampReveal(icons);
  }, [reveal, motion]);
  return (
    <span
      class="lp-stamps"
      role="img"
      aria-label={t("stampsOf", { earned: count, total })}
      ref={row}
    >
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
