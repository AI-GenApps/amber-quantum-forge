import {
  CATEGORIES,
  type Category,
  type Piece,
  TRAY_TAB_LABELS,
} from "@web-games/dress-rehearsal-core";
import { Tabs } from "@web-games/kit";
import { useState } from "preact/hooks";
import { t } from "../strings";
import { describePiece, PieceArt, Swatch, Tags } from "../ui/PieceBits";
import { trayPieces } from "./model";

export interface TrayProps {
  closet: readonly Piece[];
  openCategories: readonly Category[];
  tab: Category;
  selectedId: string | null;
  placedIds: ReadonlySet<string>;
  hintId: string | null;
  onTab: (tab: Category) => void;
  onSelect: (piece: Piece) => void;
  onPointerDown: (event: PointerEvent, piece: Piece) => void;
  consumeClick: () => boolean;
}

/** Moves focus between the piece cards of the open tab (arrow keys, Home, End). */
export function moveFocus(root: ParentNode, delta: -1 | 1 | "first" | "last"): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".dr-piece"));
  if (cards.length === 0) return;
  const at = cards.indexOf(document.activeElement as HTMLElement);
  let next = 0;
  if (delta === "last") next = cards.length - 1;
  else if (delta === "first") next = 0;
  else next = Math.min(cards.length - 1, Math.max(0, at < 0 ? 0 : at + delta));
  const target = cards[next];
  if (target) {
    for (const card of cards) card.tabIndex = card === target ? 0 : -1;
    target.focus();
  }
}

export function Tray(props: TrayProps) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const pieces = trayPieces(props.closet, props.tab);
  const roving = pieces.some((piece) => piece.id === focusId) ? focusId : (pieces[0]?.id ?? null);
  const tabs = CATEGORIES.map((category) => ({
    id: category,
    label: TRAY_TAB_LABELS[category],
    disabled: !props.openCategories.includes(category),
  }));
  return (
    <div class="dr-tray" data-testid="tray">
      <Tabs
        tabs={tabs}
        selected={props.tab}
        label={t("trayTabs")}
        onChange={(id) => props.onTab(id as Category)}
        class="dr-tray__tabs"
      >
        <div class="dr-tray__grid" data-testid="tray-grid">
          {pieces.length === 0 ? <p class="dr-note">{t("trayEmpty")}</p> : null}
          {pieces.map((piece) => {
            const selected = props.selectedId === piece.id;
            const placed = props.placedIds.has(piece.id);
            return (
              <button
                key={piece.id}
                type="button"
                class="dr-piece"
                data-piece-id={piece.id}
                data-selected={selected ? "true" : "false"}
                data-placed={placed ? "true" : "false"}
                data-hint={props.hintId === piece.id ? "true" : "false"}
                aria-pressed={selected}
                aria-label={describePiece(piece)}
                tabIndex={roving === piece.id ? 0 : -1}
                onFocus={() => setFocusId(piece.id)}
                onPointerDown={(event) => props.onPointerDown(event, piece)}
                onClick={() => {
                  if (props.consumeClick()) return;
                  props.onSelect(piece);
                }}
              >
                <PieceArt piece={piece} size={56} />
                <span class="dr-piece__name">{piece.name}</span>
                <Swatch colour={piece.colour} />
                <Tags piece={piece} />
                {placed ? <span class="dr-piece__badge">{t("trayOnBoard")}</span> : null}
              </button>
            );
          })}
        </div>
      </Tabs>
    </div>
  );
}
