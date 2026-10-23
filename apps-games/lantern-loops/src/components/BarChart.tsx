export interface BarDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: readonly BarDatum[];
  max: number;
  /** Accessible description of the whole chart. */
  description: string;
}

const WIDTH = 320;
const HEIGHT = 140;
const TOP = 18;
const LABEL = 22;

/** Vertical bars drawn in SVG; labels use the bundled body font through CSS. */
export function BarChart({ data, max, description }: BarChartProps) {
  const safeMax = max > 0 ? max : 1;
  const slot = WIDTH / Math.max(1, data.length);
  const barWidth = Math.min(40, slot * 0.6);
  const plot = HEIGHT - TOP - LABEL;
  return (
    <svg class="ll-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={description}>
      {data.map((datum, k) => {
        const height = Math.round((Math.min(datum.value, safeMax) / safeMax) * plot);
        const x = k * slot + (slot - barWidth) / 2;
        const y = TOP + plot - height;
        return (
          <g key={datum.label} data-bar={datum.label} data-value={datum.value}>
            <rect x={x} y={TOP} width={barWidth} height={plot} rx="6" class="ll-bar-bg" />
            <rect x={x} y={y} width={barWidth} height={height} rx="6" class="ll-bar" />
            <text
              class="ll-chart-value"
              x={x + barWidth / 2}
              y={Math.max(12, y - 4)}
              text-anchor="middle"
            >
              {datum.value}
            </text>
            <text class="ll-chart-label" x={x + barWidth / 2} y={HEIGHT - 6} text-anchor="middle">
              {datum.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
