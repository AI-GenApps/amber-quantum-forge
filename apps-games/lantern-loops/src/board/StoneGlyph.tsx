export interface StoneGlyphProps {
  count: number;
  fill: string;
  text: string;
  conflict: boolean;
  conflictColour: string;
}

/** Rounded paper pebble with a numeral (the numeral uses the display font through CSS). */
export function StoneGlyph({ count, fill, text, conflict, conflictColour }: StoneGlyphProps) {
  return (
    <g class="ll-stone" data-stone={count} data-conflict={conflict ? "true" : "false"}>
      <circle cx="50" cy="54" r="35" fill="#000000" fill-opacity="0.35" />
      <circle cx="50" cy="50" r="35" fill={fill} />
      {conflict ? (
        <circle cx="50" cy="50" r="39" fill="none" stroke={conflictColour} stroke-width="6" />
      ) : null}
      <text
        class="ll-stone-num"
        x="50"
        y="51"
        text-anchor="middle"
        dominant-baseline="central"
        font-size="44"
        fill={text}
      >
        {count}
      </text>
    </g>
  );
}
