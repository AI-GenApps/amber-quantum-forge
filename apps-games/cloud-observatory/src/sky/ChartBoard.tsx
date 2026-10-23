import { hitTestStar, type Point, type TapResult } from "@web-games/cloud-observatory-core";
import { useEffect, useRef, useState } from "preact/hooks";
import { useApp } from "../app/context";
import { t } from "../strings";
import { cx } from "../ui/cx";
import { clientToMap, hitRadiusUnits, mapScale, pathFor } from "./geometry";
import { SkyMap } from "./SkyMap";

export interface ChartBoardProps {
  stars: readonly Point[];
  /** Index of the next star to tap; equal to the star count when the chart is complete. */
  next: number;
  closed: boolean;
  /** Accessible name of the whole board. */
  label: string;
  /** Applies the tap and returns what happened. */
  onTap: (index: number) => TapResult;
}

const MISS_MS = 650;

function starLabel(index: number, total: number, next: number): string {
  const n = index + 1;
  if (index < next) return t("chart.starDone", { n, total });
  if (index === next) return t("chart.starNext", { n, total });
  return t("chart.star", { n, total });
}

/** Numbered star targets on the sky map with lines drawn in tap order. */
export function ChartBoard({ stars, next, closed, label, onTap }: ChartBoardProps) {
  const { feedback, reducedMotion } = useApp();
  const svg = useRef<SVGSVGElement>(null);
  const [miss, setMiss] = useState<{ index: number; key: number } | null>(null);
  const [status, setStatus] = useState("");
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (missTimer.current !== null) clearTimeout(missTimer.current);
    },
    [],
  );

  const tap = (index: number) => {
    const result = onTap(index);
    if (result === "wrong") {
      feedback.sfx("star-miss");
      feedback.haptic("warning");
      setMiss((previous) => ({ index, key: (previous?.key ?? 0) + 1 }));
      setStatus(t("chart.miss", { n: next + 1 }));
      if (missTimer.current !== null) clearTimeout(missTimer.current);
      missTimer.current = setTimeout(() => setMiss(null), MISS_MS);
    } else if (result === "correct" || result === "complete") {
      feedback.sfx("star-ok");
      feedback.haptic("light");
      setStatus(t("chart.found", { n: index + 1 }));
    }
  };

  const onClick = (event: MouseEvent) => {
    const direct = (event.target as Element | null)?.closest?.("[data-star]");
    if (direct) {
      tap(Number(direct.getAttribute("data-star")));
      return;
    }
    const element = svg.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const point = clientToMap(rect, event.clientX, event.clientY);
    const radius = hitRadiusUnits(mapScale(rect) * 1000);
    const index = hitTestStar(stars, point, radius);
    if (index !== null) tap(index);
  };

  const complete = next >= stars.length && stars.length > 0;
  const drawn = stars.slice(0, Math.min(next, stars.length));
  return (
    <div class={cx("co-board", complete && "co-board--done")} data-board="true">
      <SkyMap reducedMotion={reducedMotion} fit="meet" svgRef={svg} label={label} onClick={onClick}>
        {drawn.length > 1 ? (
          <path class="co-line" d={pathFor(drawn, false)} data-lines="true" />
        ) : null}
        {drawn.length > 1 && !reducedMotion && !complete ? (
          <path
            key={next}
            class="co-line co-line--new"
            pathLength={1}
            d={pathFor(drawn.slice(-2), false)}
          />
        ) : null}
        {complete && closed ? (
          <path
            class="co-line co-line--close"
            d={pathFor(stars.slice(-1).concat(stars.slice(0, 1)), false)}
          />
        ) : null}
        {stars.map((star, index) => {
          const state = index < next ? "done" : index === next ? "next" : "todo";
          const missed = miss?.index === index;
          return (
            // biome-ignore lint/a11y/useSemanticElements: an SVG group cannot be a button element
            <g
              key={index}
              class={cx("co-star", `co-star--${state}`, missed && "co-star--miss")}
              data-star={index}
              data-state={state}
              role="button"
              tabindex={0}
              aria-label={starLabel(index, stars.length, next)}
              transform={`translate(${star.x} ${star.y})`}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  tap(index);
                }
              }}
            >
              <g class={cx("co-star__inner", missed && !reducedMotion && "co-shake")}>
                {state === "next" ? (
                  <circle class={cx("co-ring", !reducedMotion && "co-pulse")} r={58} />
                ) : null}
                <circle class="co-badge" r={36} />
                <text
                  class="co-badge__n"
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="40"
                >
                  {index + 1}
                </text>
              </g>
            </g>
          );
        })}
        {complete ? (
          <g class={cx("co-flourish", !reducedMotion && "co-flourish--anim")}>
            {stars.map((star, index) => (
              <circle key={index} class="co-glow" cx={star.x} cy={star.y} r={64} />
            ))}
          </g>
        ) : null}
      </SkyMap>
      <p class="co-board__status" role="status" aria-live="polite" data-status="true">
        {status}
      </p>
    </div>
  );
}
