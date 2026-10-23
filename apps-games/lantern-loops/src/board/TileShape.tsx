import { type Dir, openings } from "@web-games/lantern-loops-core";
import { UNIT } from "./layout";

const EDGE: Readonly<Record<Dir, readonly [number, number]>> = {
  1: [UNIT / 2, 0],
  2: [UNIT, UNIT / 2],
  4: [UNIT / 2, UNIT],
  8: [0, UNIT / 2],
};

export const RIBBON_WIDTH = 24;

export function edgePoint(dir: Dir): readonly [number, number] {
  return EDGE[dir];
}

/** Centre-line path of a tile: from one opening through the cell centre to the other. */
export function tilePath(mask: number): string {
  const [a, b] = openings(mask);
  if (a === undefined || b === undefined) return "";
  const from = EDGE[a];
  const to = EDGE[b];
  return `M${from[0]} ${from[1]}Q${UNIT / 2} ${UNIT / 2} ${to[0]} ${to[1]}`;
}

export interface TileShapeProps {
  mask: number;
  fill: string;
  outline: string;
  outlineExtra: number;
  dim?: boolean;
  pinned?: boolean;
}

/** A layered paper ribbon with an offset shadow. Drawn in cell units, origin at the cell corner. */
export function TileShape({
  mask,
  fill,
  outline,
  outlineExtra,
  dim = false,
  pinned = false,
}: TileShapeProps) {
  const d = tilePath(mask);
  if (d === "") return null;
  return (
    <g class="ll-tile" data-mask={mask} opacity={dim ? 0.45 : 1}>
      {outlineExtra > 0 ? (
        <path d={d} fill="none" stroke={outline} stroke-width={RIBBON_WIDTH + outlineExtra} />
      ) : null}
      <path
        d={d}
        fill="none"
        stroke="#000000"
        stroke-opacity="0.35"
        stroke-width={RIBBON_WIDTH}
        transform="translate(0 3)"
      />
      <path d={d} fill="none" stroke={fill} stroke-width={RIBBON_WIDTH} />
      <path d={d} fill="none" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="6" />
      {pinned ? (
        <g class="ll-tack" data-anchor="true">
          <circle cx="50" cy="52" r="8" fill="#000000" fill-opacity="0.35" />
          <circle cx="50" cy="50" r="7" fill={outline} stroke={fill} stroke-width="1.5" />
          <circle cx="48" cy="48" r="2.2" fill="#FFFFFF" fill-opacity="0.7" />
        </g>
      ) : null}
    </g>
  );
}
