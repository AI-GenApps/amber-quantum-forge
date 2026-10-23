import {
  inletRate,
  type MapDef,
  type SeasonEvent,
  tideLevel,
} from "@web-games/floodplain-dispatch-core";
import { t } from "../strings";
import { PALETTE } from "../theme/tokens";

export interface ForecastProps {
  def: MapDef;
  week: number | null;
}

const COLUMN = 12;
const HEIGHT = 30;

export function describeEvent(event: SeasonEvent): string {
  const from = event.week + 1;
  const to = event.week + event.weeks;
  const params = { delta: event.delta, from, to };
  if (event.type === "surge") return t("forecastSurge", params);
  if (event.type === "drought") return t("forecastDrought", params);
  return t("forecastStorm", params);
}

export function forecastLines(def: MapDef): string[] {
  const lines = def.events.map(describeEvent);
  if (def.tide) lines.push(t("forecastTide", { period: def.tide.period, amp: def.tide.amp }));
  if (lines.length === 0) lines.push(t("forecastNone"));
  return lines;
}

function weekFill(def: MapDef, week: number): string {
  const active = def.events.filter((e) => week >= e.week && week < e.week + e.weeks);
  if (active.some((e) => e.type === "storm-tide")) return PALETTE.clay;
  if (active.some((e) => e.type === "surge")) return PALETTE.waterDeep;
  if (active.some((e) => e.type === "drought")) return PALETTE.ochreDeep;
  return PALETTE.water;
}

export function Forecast({ def, week }: ForecastProps) {
  const peak = Math.max(1, ...Array.from({ length: def.weeks }, (_, w) => inletRate(def, 0, w)));
  const lines = forecastLines(def);
  return (
    <div class="fd-forecast" data-testid="forecast">
      <svg
        class="fd-forecast__strip"
        viewBox={`0 0 ${def.weeks * COLUMN} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${t("forecastLabel")}: ${lines.join(". ")}`}
      >
        {Array.from({ length: def.weeks }, (_, w) => {
          const rate = inletRate(def, 0, w);
          const h = Math.max(3, (rate / peak) * (HEIGHT - 6));
          const tide = def.tide ? tideLevel(def, w) : 0;
          return (
            <g key={w}>
              <rect
                x={w * COLUMN + 1}
                y={HEIGHT - h}
                width={COLUMN - 2}
                height={h}
                fill={weekFill(def, w)}
              />
              {tide > 0 ? (
                <rect
                  x={w * COLUMN + 1}
                  y={HEIGHT - 3}
                  width={COLUMN - 2}
                  height={3}
                  fill={PALETTE.paper}
                />
              ) : null}
            </g>
          );
        })}
        {week !== null ? (
          <rect
            x={Math.min(week, def.weeks - 1) * COLUMN}
            y={0}
            width={COLUMN}
            height={HEIGHT}
            fill="none"
            stroke={PALETTE.paper}
            stroke-width={2}
          />
        ) : null}
      </svg>
      <ul class="fd-forecast__list">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
