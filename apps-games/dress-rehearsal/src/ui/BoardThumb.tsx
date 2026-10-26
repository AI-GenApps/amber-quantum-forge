import type { Look, Slot } from "@web-games/dress-rehearsal-core";
import { layoutFromSlots } from "../board/layout";
import { pieceOf } from "../board/model";
import { PieceArt } from "./PieceBits";

export interface BoardThumbProps {
  look: Look;
  slots: readonly Slot[];
}

/** Small read-only view of a saved board using the same layout as the styling board. */
export function BoardThumb({ look, slots }: BoardThumbProps) {
  const layout = layoutFromSlots(slots);
  return (
    <div class="dr-thumb" aria-hidden="true" style={{ "--dr-rows": layout.rows }}>
      {layout.cells.map((cell) => {
        const piece = pieceOf(look[cell.slot]);
        return (
          <span
            key={cell.slot}
            class="dr-thumb__cell"
            style={{ gridColumn: `${cell.col}`, gridRow: `${cell.row} / span ${cell.rowSpan}` }}
          >
            {piece ? <PieceArt piece={piece} size={36} /> : null}
          </span>
        );
      })}
    </div>
  );
}
