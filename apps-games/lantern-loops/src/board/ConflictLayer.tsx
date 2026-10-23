import type { LooseEnd } from "@web-games/lantern-loops-core";
import type { GameTokens } from "../theme/tokens";
import { UNIT } from "./layout";
import { edgePoint } from "./TileShape";

export interface ConflictLayerProps {
  conflict: boolean;
  ends: readonly LooseEnd[];
  game: Readonly<GameTokens>;
}

const INSET = 4;

const inset = (value: number): number =>
  value === 0 ? INSET : value === UNIT ? UNIT - INSET : value;

/**
 * Live feedback drawn over one cell: a soft rose ring for an unrepairable clue, and an open ribbon
 * end on every opening that has no matching neighbour (cream while it only faces an empty cell).
 */
export function ConflictLayer({ conflict, ends, game }: ConflictLayerProps) {
  return (
    <>
      {conflict ? (
        <rect
          class="ll-conflict"
          x="5"
          y="5"
          width="90"
          height="90"
          rx="14"
          fill="none"
          stroke={game.conflict}
          stroke-width="5"
        />
      ) : null}
      {ends.map((end) => {
        const [ex, ey] = edgePoint(end.dir);
        const bad = end.facing !== "empty";
        return (
          <circle
            key={end.dir}
            class="ll-open-end"
            data-facing={end.facing}
            cx={inset(ex)}
            cy={inset(ey)}
            r="8"
            fill="none"
            stroke={bad ? game.conflict : game.ribbon}
            stroke-width="3.5"
            stroke-opacity={bad ? 1 : 0.8}
          />
        );
      })}
    </>
  );
}
