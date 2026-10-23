import {
  CATEGORIES,
  type Category,
  type ChallengeShape,
  type LivePreview,
  type Look,
  livePreview,
  openSlots,
  PIECE_BY_ID,
  type Piece,
  type Slot,
} from "@web-games/dress-rehearsal-core";
import { layoutFor, type SlotCell, type SlotLayout } from "./layout";

export interface SlotView {
  readonly slot: Slot;
  readonly cell: SlotCell;
  readonly piece: Piece | null;
}

export interface BoardView {
  readonly preview: LivePreview;
  readonly layout: SlotLayout;
  readonly slots: readonly SlotView[];
  readonly spend: number;
  readonly openCategories: readonly Category[];
}

export const SLOT_LABELS: Readonly<Record<Slot, string>> = {
  top: "Top",
  bottom: "Bottom",
  dress: "Dress",
  outer: "Outerwear",
  shoes: "Shoes",
  bag: "Bag",
  hat: "Hat",
  accessory: "Accessory",
};

export function pieceOf(id: string | undefined): Piece | null {
  return id === undefined ? null : (PIECE_BY_ID.get(id) ?? null);
}

export function spendOf(look: Look): number {
  let total = 0;
  for (const slot of CATEGORIES) total += pieceOf(look[slot])?.price ?? 0;
  return total;
}

/** View model for one board: placed pieces, layout cells, live rules and harmony. */
export function buildView(challenge: ChallengeShape, look: Look): BoardView {
  const layout = layoutFor(challenge.slotSet);
  return {
    preview: livePreview(challenge, PIECE_BY_ID, look),
    layout,
    slots: layout.cells.map((cell) => ({
      slot: cell.slot,
      cell,
      piece: pieceOf(look[cell.slot]),
    })),
    spend: spendOf(look),
    openCategories: openSlots(challenge.slotSet),
  };
}

export function trayPieces(closet: readonly Piece[], category: Category): Piece[] {
  return closet.filter((piece) => piece.category === category);
}
