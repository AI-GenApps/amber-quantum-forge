import { PALETTE } from "../theme/tokens";

const HANGER =
  "M 50 36 Q 50 24 58 24 Q 66 24 66 32 Q 66 38 58 42 L 50 46 L 18 66 Q 12 70 18 74 L 82 74 Q 88 70 82 66 L 50 46";

function ariaOf(label: string) {
  return label === ""
    ? { "aria-hidden": "true" as const }
    : { role: "img" as const, "aria-label": label };
}

export interface DrawingProps {
  size: number;
  label: string;
  accent: string;
  slot: string;
}

export function IconDrawing({ size, label, accent, slot }: DrawingProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: named through aria-label, or hidden when the control around it has the name
    <svg
      data-art="fallback"
      data-art-slot={slot}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      {...ariaOf(label)}
    >
      <rect width="100" height="100" rx="18" fill={PALETTE.night} />
      <circle cx="50" cy="50" r="38" fill={PALETTE.paper} stroke={PALETTE.star} stroke-width="3" />
      <path
        d={HANGER}
        fill="none"
        stroke={PALETTE.ink}
        stroke-width="4"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <path
        d="M 40 70 L 34 90 L 44 84 L 50 92 L 52 74 Z"
        fill={accent}
        stroke={PALETTE.ink}
        stroke-width="2"
      />
      <path
        d="M 60 70 L 66 90 L 56 84 L 50 92 L 48 74 Z"
        fill={accent}
        stroke={PALETTE.ink}
        stroke-width="2"
      />
    </svg>
  );
}

export function KeyArtDrawing({ size, label, accent, slot }: DrawingProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: named through aria-label, or hidden when the control around it has the name
    <svg
      data-art="fallback"
      data-art-slot={slot}
      viewBox="0 0 100 150"
      width={size}
      height={size * 1.5}
      {...ariaOf(label)}
    >
      <defs>
        <linearGradient id="dr-keyart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={PALETTE.paper} />
          <stop offset="1" stop-color={PALETTE.blush} />
        </linearGradient>
      </defs>
      <rect width="100" height="150" fill="url(#dr-keyart)" />
      <path
        d={HANGER}
        transform="translate(0 -6)"
        fill="none"
        stroke={PALETTE.ink}
        stroke-width="3"
        stroke-linejoin="round"
      />
      <rect
        x="14"
        y="76"
        width="72"
        height="62"
        rx="4"
        fill={PALETTE.linen}
        stroke={PALETTE.ink}
        stroke-width="2"
      />
      <rect
        x="22"
        y="84"
        width="22"
        height="22"
        rx="2"
        fill="none"
        stroke={PALETTE.hairline}
        stroke-width="1.5"
      />
      <rect
        x="56"
        y="84"
        width="22"
        height="22"
        rx="2"
        fill="none"
        stroke={PALETTE.hairline}
        stroke-width="1.5"
      />
      <rect
        x="39"
        y="110"
        width="22"
        height="22"
        rx="2"
        fill={accent}
        fill-opacity="0.25"
        stroke={PALETTE.hairline}
        stroke-width="1.5"
      />
    </svg>
  );
}

function grain(seed: number): string[] {
  const lines: string[] = [];
  let state = seed;
  for (let i = 0; i < 18; i += 1) {
    state = (state * 1103515245 + 12345) % 2147483648;
    const y = 4 + ((state % 1000) / 1000) * 140;
    state = (state * 1103515245 + 12345) % 2147483648;
    const x = ((state % 1000) / 1000) * 70;
    lines.push(`M ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 18).toFixed(1)} ${y.toFixed(1)}`);
  }
  return lines;
}

export function BackdropDrawing({
  size,
  label,
  accent,
  slot,
  seed = 7,
}: DrawingProps & { seed?: number }) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: named through aria-label, or hidden when the control around it has the name
    <svg
      data-art="fallback"
      data-art-slot={slot}
      viewBox="0 0 100 150"
      preserveAspectRatio="none"
      width={size}
      height={size * 1.5}
      {...ariaOf(label)}
    >
      <rect width="100" height="150" fill={PALETTE.linen} />
      <rect width="100" height="150" fill={accent} fill-opacity="0.12" />
      <path
        d={grain(seed).join(" ")}
        stroke={PALETTE.hairline}
        stroke-opacity="0.35"
        stroke-width="0.6"
        fill="none"
      />
    </svg>
  );
}

export function FeatureDrawing({ size, label, accent, slot }: DrawingProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: named through aria-label, or hidden when the control around it has the name
    <svg
      data-art="fallback"
      data-art-slot={slot}
      viewBox="0 0 150 100"
      width={size}
      height={size * (2 / 3)}
      {...ariaOf(label)}
    >
      <rect width="150" height="100" fill={PALETTE.night} />
      <rect
        x="10"
        y="10"
        width="130"
        height="80"
        rx="6"
        fill={PALETTE.linen}
        stroke={PALETTE.star}
        stroke-width="2"
      />
      <rect x="10" y="10" width="130" height="80" rx="6" fill={accent} fill-opacity="0.15" />
      <path
        d={HANGER}
        transform="translate(25 0)"
        fill="none"
        stroke={PALETTE.ink}
        stroke-width="3"
        stroke-linejoin="round"
      />
    </svg>
  );
}
