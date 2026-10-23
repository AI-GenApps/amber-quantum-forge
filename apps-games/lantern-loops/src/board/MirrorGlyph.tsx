import type { MirrorShape } from "@web-games/lantern-loops-core";

export function MirrorUnderlay() {
  return (
    <rect
      class="ll-mirror-bed"
      x="6"
      y="6"
      width="88"
      height="88"
      rx="14"
      fill="#0E5A5F"
      fill-opacity="0.6"
    />
  );
}

export interface MirrorPaneProps {
  shape: MirrorShape;
  outline: number;
}

/** Slanted silver pane drawn over the tile of a mirror cell. */
export function MirrorPane({ shape, outline }: MirrorPaneProps) {
  const [x1, y1, x2, y2] = shape === "/" ? [24, 76, 76, 24] : [24, 24, 76, 76];
  return (
    <g class="ll-mirror" data-clue="mirror" data-mirror={shape}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#241B2F"
        stroke-width={9 + outline}
        stroke-linecap="round"
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#D8E2F5"
        stroke-width="5"
        stroke-linecap="round"
      />
    </g>
  );
}
