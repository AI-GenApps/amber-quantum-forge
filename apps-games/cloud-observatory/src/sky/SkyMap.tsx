import type { ComponentChildren, Ref } from "preact";
import { ArtImage } from "../ui/ArtImage";
import { cx } from "../ui/cx";
import { backdropStars, MAP_HEIGHT, MAP_WIDTH } from "./geometry";

export interface SkyMapProps {
  reducedMotion: boolean;
  /** Draw the far sky, nebula and horizon layers (Observe); the chart table uses the far sky only. */
  layers?: "full" | "sky";
  /** `slice` fills a tall area (Observe); `meet` keeps the whole map visible (chart table). */
  fit?: "slice" | "meet";
  svgRef?: Ref<SVGSVGElement>;
  label?: string;
  onClick?: (event: MouseEvent) => void;
  class?: string;
  children?: ComponentChildren;
}

const BACKDROP = backdropStars(64);

/**
 * The night sky: art layers behind an SVG in map units (1000 by 1400) that holds the backdrop
 * stars and whatever the screen draws on top (chart stars and lines are code, never images).
 */
export function SkyMap({
  reducedMotion,
  layers = "sky",
  fit = "slice",
  svgRef,
  label,
  onClick,
  class: className,
  children,
}: SkyMapProps) {
  return (
    <div class={cx("co-sky", reducedMotion && "co-sky--still", className)} data-sky={layers}>
      <ArtImage slot="sky-far" class="co-sky__layer" />
      {layers === "full" ? (
        <ArtImage slot="nebula-mid" class="co-sky__layer co-sky__nebula" />
      ) : null}
      <svg
        {...(svgRef ? { ref: svgRef } : {})}
        class="co-sky__map"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio={fit === "slice" ? "xMidYMid slice" : "xMidYMid meet"}
        aria-label={label}
        aria-hidden={label ? undefined : "true"}
        onClick={onClick}
      >
        <g class="co-backdrop">
          {BACKDROP.map((star, index) => (
            <circle
              key={index}
              class={star.twinkle && !reducedMotion ? "co-dot co-twinkle" : "co-dot"}
              cx={star.x}
              cy={star.y}
              r={star.r}
              style={
                star.twinkle && !reducedMotion
                  ? { animationDelay: `${(index % 7) * 0.6}s` }
                  : undefined
              }
            />
          ))}
        </g>
        {children}
      </svg>
      {layers === "full" ? (
        <ArtImage slot="horizon-hills" class="co-sky__layer co-sky__hills" />
      ) : null}
    </div>
  );
}
