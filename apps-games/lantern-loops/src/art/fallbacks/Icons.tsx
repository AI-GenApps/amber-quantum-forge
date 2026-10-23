import { LanternIcon } from "../../board/LanternGlyph";
import { PALETTE } from "../../theme/palette";
import type { SceneProps } from "./Backdrops";

export function LanternAmber({ class: className }: SceneProps) {
  return <LanternIcon class={className} size={56} colour="amber" />;
}

export function LanternRose({ class: className }: SceneProps) {
  return <LanternIcon class={className} size={56} colour="rose" />;
}

export function LanternJade({ class: className }: SceneProps) {
  return <LanternIcon class={className} size={56} colour="jade" />;
}

export function LanternAzure({ class: className }: SceneProps) {
  return <LanternIcon class={className} size={56} colour="azure" />;
}

export function LanternViolet({ class: className }: SceneProps) {
  return <LanternIcon class={className} size={56} colour="violet" />;
}

export function LanternUnlit({ class: className }: SceneProps) {
  return <LanternIcon class={className} size={56} colour="amber" lit={false} />;
}

export function AppIcon({ class: className }: SceneProps) {
  return (
    <svg
      class={className}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      data-fallback="icon"
    >
      <rect width="100" height="100" rx="22" fill={PALETTE.indigoDeep} />
      <g transform="translate(10 10) scale(0.8)">
        <LanternIcon colour="amber" size={100} />
      </g>
    </svg>
  );
}

export function DailyMedallion({ class: className }: SceneProps) {
  const ticks = Array.from({ length: 12 }, (_, k) => k * 30);
  return (
    <svg
      class={className}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
      data-fallback="daily-medallion"
    >
      <circle cx="60" cy="60" r="56" fill={PALETTE.indigo} stroke="#F2A33A" stroke-width="4" />
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="#F6EAD3"
        stroke-opacity="0.5"
        stroke-width="2"
      />
      {ticks.map((angle) => (
        <line
          key={angle}
          x1="60"
          y1="8"
          x2="60"
          y2="16"
          stroke="#F2A33A"
          stroke-width="3"
          stroke-linecap="round"
          transform={`rotate(${angle} 60 60)`}
        />
      ))}
      <g transform="translate(30 30) scale(0.6)">
        <LanternIcon colour="amber" size={100} />
      </g>
    </svg>
  );
}

export function EmptyArchive({ class: className }: SceneProps) {
  return (
    <svg
      class={className}
      viewBox="0 0 160 160"
      aria-hidden="true"
      focusable="false"
      data-fallback="empty-archive"
    >
      <rect
        x="14"
        y="14"
        width="132"
        height="132"
        rx="22"
        fill="none"
        stroke="#6E76A6"
        stroke-width="3"
        stroke-dasharray="9 8"
      />
      <rect
        x="64"
        y="38"
        width="32"
        height="12"
        rx="4"
        fill="none"
        stroke="#6E76A6"
        stroke-width="4"
      />
      <rect
        x="52"
        y="48"
        width="56"
        height="68"
        rx="22"
        fill="none"
        stroke="#6E76A6"
        stroke-width="4"
      />
      <rect
        x="64"
        y="114"
        width="32"
        height="12"
        rx="4"
        fill="none"
        stroke="#6E76A6"
        stroke-width="4"
      />
    </svg>
  );
}

export function KeyArt({ class: className }: SceneProps) {
  return (
    <svg
      class={className}
      viewBox="0 0 400 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-fallback="key-art"
    >
      <defs>
        <linearGradient id="key-art-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#12132E" />
          <stop offset="0.6" stop-color="#2A2D66" />
          <stop offset="1" stop-color="#0E5A5F" />
        </linearGradient>
        <radialGradient id="key-art-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#F2A33A" stop-opacity="0.55" />
          <stop offset="1" stop-color="#F2A33A" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="600" fill="url(#key-art-sky)" />
      <circle cx="200" cy="380" r="150" fill="url(#key-art-glow)" />
      <path d="M0 440 Q100 380 200 430 T400 410 V600 H0Z" fill="#0B3D45" />
      <path d="M0 500 Q120 460 240 500 T400 490 V600 H0Z" fill="#082B31" />
      <g transform="translate(150 300) scale(1)">
        <LanternIcon colour="amber" size={100} />
      </g>
      <g fill="#F2A33A" fill-opacity="0.8">
        <rect x="60" y="330" width="14" height="19" rx="5" />
        <rect x="320" y="310" width="16" height="22" rx="6" />
      </g>
      <g fill="#E9657F" fill-opacity="0.7">
        <rect x="100" y="400" width="12" height="17" rx="5" />
        <rect x="280" y="390" width="12" height="17" rx="5" />
      </g>
    </svg>
  );
}
