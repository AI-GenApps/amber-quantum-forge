import type { ComponentChildren } from "preact";

function Frame({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <svg
      class="co-howto__diagram"
      viewBox="0 0 240 120"
      role="img"
      aria-label={label}
      data-diagram="true"
    >
      {children}
    </svg>
  );
}

/** Tap the sky, buy a telescope, starlight flows in. */
export function GatherDiagram({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <circle class="co-gl-fill" cx="50" cy="60" r="28" />
      <circle class="co-gl-dot" cx="50" cy="60" r="5" />
      <circle class="co-gl" cx="50" cy="60" r="40" stroke-dasharray="4 6" />
      <path class="co-gl" d="M96 60h36M124 52l8 8-8 8" />
      <rect class="co-gl-fill" x="144" y="38" width="64" height="44" rx="8" />
      <path class="co-gl" d="M156 70l30-20 6 8-30 20zM186 50l8 8" />
      <circle class="co-gl-dot" cx="216" cy="30" r="4" />
      <circle class="co-gl-dot" cx="226" cy="44" r="3" />
    </Frame>
  );
}

const POINTS: ReadonlyArray<readonly [number, number]> = [
  [30, 90],
  [70, 40],
  [120, 70],
  [170, 30],
  [210, 80],
];

/** Five numbered stars joined in order. */
export function ChartDiagram({ label }: { label: string }) {
  const path = POINTS.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join("");
  return (
    <Frame label={label}>
      <path class="co-gl" d={path} />
      {POINTS.map(([x, y], index) => (
        <g key={`${x}-${y}`}>
          <circle class="co-gl-fill" cx={x} cy={y} r="12" />
          <text
            x={x}
            y={y}
            text-anchor="middle"
            dominant-baseline="central"
            font-size="14"
            font-weight="700"
            class="co-howto__n"
          >
            {index + 1}
          </text>
        </g>
      ))}
    </Frame>
  );
}

/** A dark disc with a ring of light. */
export function EclipseDiagram({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <circle class="co-disc-ring" cx="120" cy="60" r="46" fill="none" />
      <circle class="co-disc-ring" cx="120" cy="60" r="38" fill="none" opacity="0.5" />
      <circle cx="120" cy="60" r="32" fill="var(--co-ink-950)" stroke="var(--co-gold-light)" />
      <circle class="co-gl-dot" cx="40" cy="26" r="3" />
      <circle class="co-gl-dot" cx="204" cy="94" r="3" />
    </Frame>
  );
}

/** A comet with a tail, beside an open book. */
export function CometDiagram({ label }: { label: string }) {
  return (
    <Frame label={label}>
      <circle class="co-gl-fill" cx="86" cy="40" r="11" />
      <path class="co-gl" d="M78 48L28 96M70 38L20 62M86 52L58 104" />
      <path class="co-gl-fill" d="M138 34h42a10 10 0 0 1 10 10v50h-52z" />
      <path class="co-gl-fill" d="M242 34h-42a10 10 0 0 0-10 10v50h52z" />
      <path class="co-gl" d="M190 44v50M150 54h30M150 68h30M200 54h30M200 68h30" />
    </Frame>
  );
}
