import type { ConstellationDef } from "@web-games/cloud-observatory-core";
import { cx } from "../ui/cx";
import { figureBox, pathFor } from "./geometry";

export interface ConstellationFigureProps {
  def: ConstellationDef;
  /** Dim figure for a constellation that is not charted yet. */
  dim?: boolean;
  class?: string;
  /** Accessible name; the figure is decorative when omitted. */
  label?: string;
}

export function ConstellationFigure({
  def,
  dim = false,
  class: className,
  label,
}: ConstellationFigureProps) {
  const box = figureBox(def.stars);
  const labelled = label !== undefined;
  return (
    <svg
      class={cx("co-figure", dim && "co-figure--dim", className)}
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      role={labelled ? "img" : undefined}
      aria-label={label}
      aria-hidden={labelled ? undefined : "true"}
      data-figure={def.id}
    >
      <path class="co-figure__line" d={pathFor(def.stars, def.closed)} />
      {def.stars.map((star, index) => (
        <circle
          key={index}
          class="co-figure__star"
          cx={star.x}
          cy={star.y}
          r={index === 0 ? 26 : 20}
        />
      ))}
    </svg>
  );
}
