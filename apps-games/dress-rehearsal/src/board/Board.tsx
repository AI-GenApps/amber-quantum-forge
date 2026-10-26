import { PIECE_BY_ID, type ThemeId } from "@web-games/dress-rehearsal-core";
import { Sprite } from "../art/Sprite";
import { backdropSlot, type SlotId } from "../art/slots";
import { t } from "../strings";
import { Icon } from "../ui/Icon";
import { PieceArt } from "../ui/PieceBits";
import type { DragState } from "./drag";
import type { BoardView, SlotView } from "./model";
import { SLOT_LABELS } from "./model";
import type { HintMark, Selection } from "./state";

export interface BoardProps {
  view: BoardView;
  theme: ThemeId;
  selected: Selection | null;
  hint: HintMark | null;
  drag: DragState | null;
  manifest?: readonly SlotId[];
  onTap: (slot: SlotView["slot"]) => void;
  onPointerDown: (event: PointerEvent, slot: SlotView) => void;
  consumeClick: () => boolean;
}

function overState(drag: DragState | null, slot: SlotView["slot"]): "true" | "invalid" | "false" {
  if (drag === null || drag.over !== slot) return "false";
  return PIECE_BY_ID.get(drag.source.pieceId)?.category === slot ? "true" : "invalid";
}

function slotLabel(slot: SlotView): string {
  const name = SLOT_LABELS[slot.slot];
  return slot.piece
    ? t("slotFilled", { slot: name, piece: slot.piece.name })
    : t("slotEmpty", { slot: name });
}

export function Board(props: BoardProps) {
  const { view } = props;
  const dragged = props.drag?.source;
  return (
    <section
      class="dr-board"
      data-testid="board"
      aria-label={t("boardLabel")}
      style={{ "--dr-rows": view.layout.rows }}
    >
      <div class="dr-board__backdrop" aria-hidden="true">
        <Sprite
          slot={backdropSlot(props.theme)}
          size={320}
          decorative
          {...(props.manifest ? { manifest: props.manifest } : {})}
        />
      </div>
      <div class="dr-board__grid" data-sfx="own">
        {view.slots.map((slot) => {
          const isSelected = props.selected?.kind === "slot" && props.selected.slot === slot.slot;
          const wantsPiece =
            props.selected?.kind === "piece" &&
            props.selected.pieceId.length > 0 &&
            slot.slot === pieceCategory(props.selected.pieceId);
          const lifted = dragged?.origin === "board" && dragged.slot === slot.slot;
          return (
            <button
              key={slot.slot}
              type="button"
              class="dr-slot"
              data-board-slot={slot.slot}
              data-filled={slot.piece ? "true" : "false"}
              data-selected={isSelected ? "true" : "false"}
              data-target={wantsPiece ? "true" : "false"}
              data-hint={props.hint?.slot === slot.slot ? "true" : "false"}
              data-over={overState(props.drag, slot.slot)}
              data-lifted={lifted ? "true" : "false"}
              aria-label={slotLabel(slot)}
              aria-pressed={isSelected}
              style={{
                gridColumn: `${slot.cell.col}`,
                gridRow: `${slot.cell.row} / span ${slot.cell.rowSpan}`,
              }}
              onPointerDown={(event) => props.onPointerDown(event, slot)}
              onClick={() => {
                if (props.consumeClick()) return;
                props.onTap(slot.slot);
              }}
            >
              {slot.piece ? (
                <>
                  <PieceArt piece={slot.piece} size={slot.cell.rowSpan > 1 ? 88 : 64} />
                  <span class="dr-slot__piece">{slot.piece.name}</span>
                </>
              ) : (
                <>
                  <Icon name="frame" size={22} />
                  <span class="dr-slot__label">{SLOT_LABELS[slot.slot]}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function pieceCategory(id: string): string | undefined {
  return PIECE_BY_ID.get(id)?.category;
}
