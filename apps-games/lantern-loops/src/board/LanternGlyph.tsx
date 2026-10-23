import type { Colour } from "@web-games/lantern-loops-core";
import {
  GLYPH_BY_COLOUR,
  type GlyphKind,
  glyphPath,
  LANTERN_HEX,
  UNLIT_HEX,
} from "../theme/palette";

export interface GlyphProps {
  kind: GlyphKind;
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
}

export function Glyph({ kind, cx, cy, r, fill = "none", stroke }: GlyphProps) {
  return (
    <path
      d={glyphPath(kind, cx, cy, r)}
      fill={fill}
      {...(stroke === undefined ? {} : { stroke, "stroke-width": 3, "stroke-linejoin": "round" })}
    />
  );
}

export interface LanternBodyProps {
  colour: Colour;
  lit: boolean;
  hex?: string;
  unlit?: string;
  ink?: string;
}

/** Paper lantern in cell units (0..100) with the colour glyph on its body. */
export function LanternBody({
  colour,
  lit,
  hex = LANTERN_HEX[colour],
  unlit = UNLIT_HEX,
  ink = "#241B2F",
}: LanternBodyProps) {
  const body = lit ? hex : unlit;
  return (
    <g
      class="ll-lantern"
      data-clue="lantern"
      data-colour={colour}
      data-lit={lit ? "true" : "false"}
    >
      {lit ? <circle cx="50" cy="50" r="46" fill={hex} fill-opacity="0.3" /> : null}
      <rect x="37" y="19" width="26" height="9" rx="3" fill={ink} />
      <rect x="37" y="72" width="26" height="9" rx="3" fill={ink} />
      <rect
        x="29"
        y="25"
        width="42"
        height="50"
        rx="17"
        fill={body}
        stroke={ink}
        stroke-width="3.5"
      />
      <Glyph kind={GLYPH_BY_COLOUR[colour]} cx={50} cy={50} r={12} fill={ink} />
    </g>
  );
}

export interface LanternIconProps extends Omit<LanternBodyProps, "lit"> {
  lit?: boolean;
  size?: number;
  label?: string;
  class?: string | undefined;
}

/** Standalone lantern SVG for lists, chapter cards and fallbacks. */
export function LanternIcon({
  size = 56,
  label,
  lit = true,
  class: className,
  ...rest
}: LanternIconProps) {
  return (
    <svg
      class={className}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <LanternBody {...rest} lit={lit} />
    </svg>
  );
}
