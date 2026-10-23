import type { Colour } from "@web-games/lantern-loops-core";
import { GLYPH_BY_COLOUR, LANTERN_HEX } from "../theme/palette";
import { Glyph } from "./LanternGlyph";

export interface GateGlyphProps {
  colour: Colour;
  hex?: string;
  ink?: string;
}

const ARCH = "M27 78V46A23 23 0 0 1 73 46V78";

/** Small arch in the gate colour with the matching glyph above the path. */
export function GateGlyph({ colour, hex = LANTERN_HEX[colour], ink = "#241B2F" }: GateGlyphProps) {
  return (
    <g class="ll-gate" data-clue="gate" data-colour={colour}>
      <path d={ARCH} fill="none" stroke={ink} stroke-width="14" stroke-linecap="round" />
      <path d={ARCH} fill="none" stroke={hex} stroke-width="7" stroke-linecap="round" />
      <circle cx="50" cy="30" r="12" fill={ink} />
      <Glyph kind={GLYPH_BY_COLOUR[colour]} cx={50} cy={30} r={8.5} fill={hex} />
    </g>
  );
}
